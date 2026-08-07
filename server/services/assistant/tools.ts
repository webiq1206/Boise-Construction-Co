/**
 * Tool layer for the conversational estimating assistant.
 *
 * Every number the assistant quotes comes out of these executors, and every
 * executor calls the same shared engines the estimator, the lead emails and
 * the RE-10 flow already use. The model NEVER computes a price itself: the
 * system prompt forbids it, and these tools are the only pricing surface it
 * is given. If a figure did not come back from calculate_estimate or
 * price_re10_repairs, it does not go in a reply.
 *
 * calculate_estimate reproduces the lead route's verifyEstimate math exactly
 * (countVisibleUserRefinements / getMaxRefinementFields -> detailRatio ->
 * resolveQuotedRange), so a range quoted in chat is byte-identical to what
 * the on-page estimator and the estimate email would show for the same
 * answers.
 */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import {
  estimateRe10,
  type RepairItemInput,
  type Re10Context,
} from "@/shared/costs/re10Repairs";
import {
  EMPTY_REFINEMENTS,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getProjectSizeConfig,
  getSetRefinementKeys,
  normalizeFinishLevel,
  PROJECT_LABELS,
  type EstimateRefinements,
} from "@/shared/estimateEngine";
import {
  estimateSchema,
  finishLevelSchema,
  projectTypeSchema,
  refinementsSchema,
} from "@/shared/estimatePayload";
import { SERVICES, CITIES } from "@/shared/contentData";
import { HOW_WE_BUILD_STEPS } from "@/shared/siteContent";
import { SITE_CONFIG } from "@/shared/siteConfig";

/* ─────────────────────────────────────────────────────── input validation */

const calculateInputSchema = z.object({
  project: projectTypeSchema,
  finish: finishLevelSchema,
  sqft: z.number().int().positive(),
  refinements: refinementsSchema,
});

const re10InputSchema = z.object({
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(300),
        kind: z.string().min(1).max(60),
        quantity: z.number().int().min(1).max(50).optional(),
        location: z.string().max(120).optional(),
      }),
    )
    .min(1)
    .max(40),
  context: z
    .object({
      occupancy: z.enum(["occupied", "vacant", "unknown"]).optional(),
      access: z.enum(["standard", "limited", "difficult"]).optional(),
      daysToDeadline: z.number().int().min(0).max(365).nullable().optional(),
      hasInspectionReport: z.boolean().optional(),
    })
    .optional(),
});

const businessInfoSchema = z.object({
  topic: z.enum(["services", "service_areas", "process", "contact", "company"]),
});

const submitLeadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  zip: z.string().max(10).optional(),
  buildArea: z.string().max(160).optional(),
  notes: z.string().max(500).optional(),
  estimate: z
    .object({
      project: projectTypeSchema,
      finish: finishLevelSchema,
      sqft: z.number().int().positive(),
      refinements: refinementsSchema,
    })
    .optional(),
});

/* ────────────────────────────────────────────────────────── tool schemas */

const REFINEMENTS_JSON_SCHEMA = {
  type: "object" as const,
  description:
    "Only include keys the visitor has actually answered. Omitted keys mean 'not discussed yet' and never move the price.",
  properties: {
    planningStage: {
      type: "string",
      enum: ["have-plans", "plans-in-progress", "need-plans", "exploring"],
      description:
        "How far along their plans are. Narrows the quoted band as certainty rises.",
    },
    stories: { type: "integer", minimum: 1, maximum: 2 },
    bathroomCount: { type: "integer", minimum: 0, maximum: 12 },
    kitchenIncluded: { type: "boolean" },
    garageBays: { type: "string", enum: ["none", "two", "three", "four"] },
    garageSqft: { type: "integer", minimum: 0, maximum: 2400 },
    basementType: { type: "string", enum: ["none", "unfinished", "finished"] },
    basementSqft: { type: "integer", minimum: 0, maximum: 6000 },
    lotServices: {
      type: "string",
      enum: ["city", "well-septic", "unsure"],
      description: "City utilities vs well and septic.",
    },
    siteDifficulty: { type: "string", enum: ["simple", "moderate", "steep"] },
    utilitiesAtLot: { type: "boolean" },
    drivewayLength: { type: "integer", minimum: 0, maximum: 2000, description: "Feet of driveway." },
    coveredOutdoor: {
      type: "integer",
      minimum: 0,
      maximum: 4000,
      description: "Covered patio / outdoor living square feet.",
    },
    shopSize: { type: "integer", minimum: 0, maximum: 20000, description: "Shop square feet (shop homes)." },
    layoutChanges: { type: "string", enum: ["none", "moderate", "major"], description: "Remodels only." },
    plumbingElectrical: { type: "string", enum: ["cosmetic", "partial", "full"], description: "Remodels only." },
    cabinetTier: { type: "string", enum: ["standard", "semi-custom", "custom"], description: "Kitchen remodels." },
    fixtureCount: { type: "integer", minimum: 1, maximum: 8, description: "Bathroom remodels." },
    aduConfig: { type: "string", enum: ["detached", "attached"], description: "ADU projects only." },
  },
} as const;

export const ASSISTANT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "calculate_estimate",
    description:
      "Calculate the planning price range for a construction project using Boise Construction Co's line-item cost engine - the same engine behind the on-page estimator. Call this EVERY time you need a price, and call it again whenever the visitor changes any detail. Never state, estimate or adjust a dollar figure yourself. Works for new construction (custom-home, semi-custom-home, build-on-your-lot, shop-home) and remodels (kitchen, bathroom, whole-home, addition, adu, basement).",
    input_schema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          enum: [
            "custom-home",
            "semi-custom-home",
            "build-on-your-lot",
            "shop-home",
            "kitchen",
            "bathroom",
            "whole-home",
            "addition",
            "adu",
            "basement",
          ],
        },
        finish: {
          type: "string",
          enum: ["refresh", "mid-range", "high-end", "luxury"],
          description:
            "Finish level. 'mid-range' is the typical default when the visitor is unsure. 'refresh' is not offered for additions, ADUs or basements.",
        },
        sqft: { type: "integer", description: "Project square footage (finished living space)." },
        refinements: REFINEMENTS_JSON_SCHEMA,
      },
      required: ["project", "finish", "sqft"],
    },
  },
  {
    name: "price_re10_repairs",
    description:
      "Price an RE-10 repair list (Idaho real-estate transaction repairs) using the company's per-item repair engine. Items whose kind is not in the priced catalog are returned as 'needs review' - tell the visitor those items need a human look rather than guessing a price.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "The repair in the visitor's words." },
              kind: {
                type: "string",
                description:
                  "Closest catalog kind. Valid kinds: drywall-patch, drywall-repaint-wall, interior-paint-room, exterior-paint-spot, trim-repair, interior-door-adjust, interior-door-replace, door-hardware, cabinet-repair, handrail-repair, handrail-replace, stair-tread-repair, shelving-repair, flooring-patch, tile-repair, carpet-repair, faucet-replace, toilet-repair, supply-valve-replace, drain-leak-repair, water-heater-replace, outlet-switch-replace, gfci-install, light-fixture-replace, smoke-detector, electrical-cover-plates, siding-repair, exterior-trim-repair, caulking-weatherproofing, deck-board-repair, deck-railing-repair, fence-gate-repair, gutter-repair, window-seal-repair, roof-minor-repair, safety-correction, general-minor-repair, chimney-repair, bath-exhaust-vent, crawlspace-vapor-barrier, crawlspace-insulation, crawlspace-cleanout, hose-bib-repair, irrigation-repair. If nothing fits, pass the visitor's wording as kind and it will be flagged for review.",
              },
              quantity: { type: "integer", minimum: 1 },
              location: { type: "string" },
            },
            required: ["description", "kind"],
          },
        },
        context: {
          type: "object",
          properties: {
            occupancy: { type: "string", enum: ["occupied", "vacant", "unknown"] },
            access: { type: "string", enum: ["standard", "limited", "difficult"] },
            daysToDeadline: { type: "integer", description: "Days until the closing/repair deadline." },
            hasInspectionReport: { type: "boolean" },
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "get_business_info",
    description:
      "Look up verified facts about Boise Construction Co: services offered with planning-from prices, service areas, the build process, and contact details. Use this instead of recalling facts from memory.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["services", "service_areas", "process", "contact", "company"],
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "submit_lead",
    description:
      "Submit the visitor's contact details (and their estimate, if one was calculated in this conversation) to the Boise Construction Co team. Only call this after the visitor has explicitly agreed to be contacted AND has given you their name and email. Never invent or assume contact details.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", description: "Optional. 10-digit US phone if provided." },
        zip: { type: "string" },
        buildArea: { type: "string", description: "City or area they plan to build in." },
        notes: { type: "string", description: "Anything else the visitor asked to pass along." },
        estimate: {
          type: "object",
          description:
            "The most recent estimate calculated in this conversation, if any. Pass the exact same inputs you last gave calculate_estimate.",
          properties: {
            project: { type: "string" },
            finish: { type: "string" },
            sqft: { type: "integer" },
            refinements: REFINEMENTS_JSON_SCHEMA,
          },
          required: ["project", "finish", "sqft"],
        },
      },
      required: ["name", "email"],
    },
  },
];

/* ───────────────────────────────────────────────────────────── executors */

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * The estimator's own math, verbatim: detail ratio from the set refinement
 * keys, quoted range from the shared line-item resolver.
 */
function runSharedEstimate(
  project: z.infer<typeof projectTypeSchema>,
  finish: z.infer<typeof finishLevelSchema>,
  sqft: number,
  rawRefinements: z.infer<typeof refinementsSchema>,
): { priceLow: number; priceHigh: number; refinements: EstimateRefinements } | null {
  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(rawRefinements ?? {}),
  } as EstimateRefinements;
  const detailCount = countVisibleUserRefinements(project, getSetRefinementKeys(refinements));
  const maxFields = getMaxRefinementFields(project);
  const range = resolveQuotedRange(
    project,
    normalizeFinishLevel(project, finish),
    sqft,
    refinements,
    maxFields > 0 ? detailCount / maxFields : 0,
  );
  return range ? { ...range, refinements } : null;
}

function executeCalculateEstimate(input: unknown): string {
  const parsed = calculateInputSchema.safeParse(input);
  if (!parsed.success) {
    return JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  }
  const { project, finish, sqft, refinements } = parsed.data;

  const sizeConfig = getProjectSizeConfig(project);
  if (sqft < sizeConfig.min || sqft > sizeConfig.max) {
    return JSON.stringify({
      error: "sqft_out_of_range",
      message: `${PROJECT_LABELS[project].label} is priced between ${sizeConfig.min.toLocaleString()} and ${sizeConfig.max.toLocaleString()} sqft. Ask the visitor to confirm their size, or explain that a project outside this range needs a conversation with the team.`,
      min: sizeConfig.min,
      max: sizeConfig.max,
    });
  }

  const result = runSharedEstimate(project, finish, sqft, refinements);
  if (!result) {
    return JSON.stringify({
      error: "not_priceable",
      message:
        "This combination cannot be priced by the estimator. Offer to connect the visitor with the team instead.",
    });
  }

  const normalizedFinish = normalizeFinishLevel(project, finish);
  return JSON.stringify({
    project,
    finish: normalizedFinish,
    ...(normalizedFinish !== finish
      ? { note: `'${finish}' is not offered for this project; priced at '${normalizedFinish}'.` }
      : {}),
    sqft,
    priceLow: result.priceLow,
    priceHigh: result.priceHigh,
    formattedRange: `${usd(result.priceLow)} to ${usd(result.priceHigh)}`,
    disclaimer:
      "Planning range, not a bid. The exact number comes from a line-item budget after a consultation.",
  });
}

function executePriceRe10(input: unknown): string {
  const parsed = re10InputSchema.safeParse(input);
  if (!parsed.success) {
    return JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  }
  const items: RepairItemInput[] = parsed.data.items.map((item, i) => ({
    id: String(i + 1),
    description: item.description,
    // Free-text kinds that miss the catalog land in the estimate's review
    // list rather than being silently priced - estimateRe10's own contract.
    kind: item.kind as RepairItemInput["kind"],
    quantity: item.quantity,
    location: item.location,
  }));
  const ctx: Re10Context = {
    occupancy: parsed.data.context?.occupancy,
    access: parsed.data.context?.access,
    daysToDeadline: parsed.data.context?.daysToDeadline ?? undefined,
    hasInspectionReport: parsed.data.context?.hasInspectionReport,
  };
  const e = estimateRe10(items, ctx);
  return JSON.stringify({
    low: e.low,
    high: e.high,
    quotedPrice: e.quotedPrice,
    formattedRange: `${usd(e.low)} to ${usd(e.high)}`,
    formattedQuote: usd(e.quotedPrice),
    needsReview: e.review.map((r) => r.input.description),
    reviewNote:
      e.review.length > 0
        ? "Items under needsReview are NOT included in the price. Tell the visitor those need a quick human review before they can be quoted."
        : undefined,
  });
}

function executeGetBusinessInfo(input: unknown): string {
  const parsed = businessInfoSchema.safeParse(input);
  if (!parsed.success) return JSON.stringify({ error: "Invalid topic" });

  switch (parsed.data.topic) {
    case "services":
      return JSON.stringify({
        services: SERVICES.map((s) => ({
          name: s.name,
          planningFrom: s.planningFrom,
          description: s.shortDescription,
          page: `/services/${s.slug}`,
        })),
        note: "planningFrom figures are budget floors for a modest build of that type, not bids.",
      });
    case "service_areas":
      return JSON.stringify({
        serviceArea: SITE_CONFIG.address.serviceArea,
        cities: CITIES.map((c) => ({ name: c.name, county: c.county === "ada" ? "Ada County" : "Canyon County" })),
      });
    case "process":
      return JSON.stringify({
        steps: HOW_WE_BUILD_STEPS.map((s) => ({ step: s.number, title: s.title, description: s.desc })),
      });
    case "contact":
      return JSON.stringify({
        phone: SITE_CONFIG.phone,
        email: SITE_CONFIG.email,
        location: SITE_CONFIG.address.cityState,
        serviceArea: SITE_CONFIG.address.serviceArea,
        consultationPage: "/consultation",
        estimatorPage: "/#calculator",
      });
    case "company":
      return JSON.stringify({
        name: SITE_CONFIG.name,
        legalName: SITE_CONFIG.legalName,
        location: SITE_CONFIG.address.cityState,
        serviceArea: SITE_CONFIG.address.serviceArea,
        summary:
          "Custom home builder serving the Treasure Valley. Line-item budgets before construction, written change orders only, weekly written updates, workmanship warranty.",
      });
  }
}

async function executeSubmitLead(input: unknown, origin: string): Promise<string> {
  const parsed = submitLeadSchema.safeParse(input);
  if (!parsed.success) {
    return JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  }
  const data = parsed.data;

  /* Rebuild the estimate payload server-side from the raw inputs, through the
     same shared math, so the lead route's re-verification sees numbers that
     already match its own. */
  let estimatePayload: z.infer<typeof estimateSchema> | undefined;
  let projectTypeLabel = "General inquiry (assistant chat)";
  if (data.estimate) {
    const result = runSharedEstimate(
      data.estimate.project,
      data.estimate.finish,
      data.estimate.sqft,
      data.estimate.refinements,
    );
    if (result) {
      projectTypeLabel = PROJECT_LABELS[data.estimate.project].label;
      estimatePayload = {
        project: data.estimate.project,
        finish: normalizeFinishLevel(data.estimate.project, data.estimate.finish),
        sqft: data.estimate.sqft,
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        roi: 0,
        refinements: data.estimate.refinements ?? null,
      };
    }
  }

  /* No estimate yet is still a lead: the route stores it without one. But the
     route requires an `estimate` object, so a contact-only lead goes through
     the consultation body shape instead. */
  const endpoint = estimatePayload ? "/api/estimate-lead" : "/api/consultation";
  const body = estimatePayload
    ? {
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        projectType: projectTypeLabel,
        zip: data.zip,
        buildArea: data.buildArea,
        estimate: estimatePayload,
      }
    : {
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        projectType: projectTypeLabel,
        zip: data.zip,
        message: [
          "Submitted via assistant chat",
          data.buildArea ? `Planned build area: ${data.buildArea}` : null,
          data.notes ?? null,
        ]
          .filter(Boolean)
          .join(" | "),
      };

  try {
    const res = await fetch(`${origin}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[assistant] submit_lead ${endpoint} failed: ${res.status} ${detail.slice(0, 300)}`);
      return JSON.stringify({
        error: "submission_failed",
        message: `The submission did not go through. Apologize and give the visitor the phone number ${SITE_CONFIG.phone} or the consultation page /consultation instead.`,
      });
    }
    return JSON.stringify({
      success: true,
      message: `Lead submitted. The visitor will get a confirmation email at ${data.email}, and the team follows up within one business day.`,
    });
  } catch (err) {
    console.error("[assistant] submit_lead error:", err);
    return JSON.stringify({
      error: "submission_failed",
      message: `The submission did not go through. Apologize and give the visitor the phone number ${SITE_CONFIG.phone} or the consultation page /consultation instead.`,
    });
  }
}

export async function executeAssistantTool(
  name: string,
  input: unknown,
  origin: string,
): Promise<string> {
  switch (name) {
    case "calculate_estimate":
      return executeCalculateEstimate(input);
    case "price_re10_repairs":
      return executePriceRe10(input);
    case "get_business_info":
      return executeGetBusinessInfo(input);
    case "submit_lead":
      return executeSubmitLead(input, origin);
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

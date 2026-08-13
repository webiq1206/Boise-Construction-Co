import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_UPLOAD_FILES } from "@/shared/re10/uploads";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  htmlToPlainText,
  getAdminRecipientEmails,
  formatFromAddress,
  getReplyToAddress,
} from "@/server/services/emailLayout";
import {
  buildAdminEmailHtml,
  buildCustomerEmailHtml,
  buildAdminSubject,
  buildCustomerSubject,
  formatLeadReplyTo,
  type VerifiedEstimate,
} from "@/server/services/consultationEmail";
import {
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getProjectSizeConfig,
  getSetRefinementKeys,
  PROJECT_LABELS,
  type EstimateRefinements,
} from "@/shared/estimateEngine";
import { estimateSchema } from "@/shared/estimatePayload";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import { buildEstimateAudit } from "@/shared/plans/estimateAudit";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { readUnitCostOverrides } from "@/server/services/unitCostOverrides";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  buildCrmIntakeFields,
  buildLeadPropertyRecord,
  buildLeadEstimateRecord,
  buildLeadNotes,
  resolveBudgetRange,
  buildProjectGoals,
} from "@/server/services/leadRecord";
import { formatUsd, type PropertyEnrichment } from "@/server/services/consultationEmail";

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  /* Optional to match the gate: the estimate is delivered by email, so email
     is the required channel. A phone that IS sent must still look like one
     (10+ digits once formatting is stripped). */
  phone: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, {
      message: "Phone must be a valid 10-digit number when provided",
    }),
  budget: z.string().min(1).optional(),
  projectType: z.string().min(1),
  // Property address. Optional in the schema so an older client that predates
  // this field still submits successfully rather than 400ing, but the gate now
  // requires it, and the team needs it to confirm service area.
  address: z.string().max(300).optional(),
  // Where a non-landowner plans to build: a city or area, never a street
  // address. Sent instead of `address` when the visitor does not own land.
  buildArea: z.string().max(160).optional(),
  landOwnership: z.enum(["own", "not-yet"]).optional(),
  zip: z.string().max(10).optional(),
  propertyProfile: z
    .object({ formattedAddress: z.string(), city: z.string(), state: z.string(), zip: z.string() })
    .passthrough()
    .optional()
    .nullable(),
  estimate: estimateSchema,
});

function verifyEstimate(
  estimate: z.infer<typeof estimateSchema>
): VerifiedEstimate | null {
  const sizeConfig = getProjectSizeConfig(estimate.project);
  if (estimate.sqft < sizeConfig.min || estimate.sqft > sizeConfig.max) return null;

  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(estimate.refinements ?? {}),
  } as EstimateRefinements;

  const detailCount = countVisibleUserRefinements(estimate.project, getSetRefinementKeys(refinements));
  const guide = calculateEstimate(
    { project: estimate.project, finish: estimate.finish, sqft: estimate.sqft, refinements },
    detailCount
  );
  // The quoted range comes from the line-item cost engine, via the same shared
  // resolver the calculator uses, so the page and the email can never disagree.
  const maxFields = getMaxRefinementFields(estimate.project);
  const lineItemRange = resolveQuotedRange(
    estimate.project,
    estimate.finish,
    estimate.sqft,
    refinements,
    maxFields > 0 ? detailCount / maxFields : 0,
  );
  const recomputed = { ...guide, ...(lineItemRange ?? {}) };

  if (
    estimate.priceLow !== recomputed.priceLow ||
    estimate.priceHigh !== recomputed.priceHigh
  ) {
    console.warn(
      `[estimate-lead] Estimate mismatch (client ${estimate.priceLow}-${estimate.priceHigh}, server ${recomputed.priceLow}-${recomputed.priceHigh}); using server values`
    );
  }

  return {
    project: estimate.project,
    finish: estimate.finish,
    sqft: estimate.sqft,
    priceLow: recomputed.priceLow,
    priceHigh: recomputed.priceHigh,
    roi: recomputed.roi,
    confidence: recomputed.confidenceLabel,
    statedBudget: estimate.statedBudget ?? null,
    refinements,
    included: recomputed.included,
    layoutLabel: estimate.layoutLabel,
    upgradeLabels: estimate.upgradeLabels,
    planFiles: verifyPlanFiles(estimate.planFiles),
  };
}

/**
 * Keep plan links to URLs this application actually issued.
 *
 * The rest of verifyEstimate exists because a client-supplied estimate cannot
 * be trusted, and a list of URLs is the same class of problem one step further
 * on: these are rendered into the internal email and the lead record, so an
 * arbitrary link here puts an attacker-chosen destination in front of whoever
 * opens the lead.
 *
 * Deliberately NOT isStoredDocumentUrl from shared/re10/uploads. Despite the
 * name that function accepts any well-formed http(s) URL - it exists to stop a
 * malformed value failing the request, not to establish provenance. The two
 * shapes below are the only things lib/storage/blob.ts returns: a root-relative
 * path into our own document route, or a Vercel Blob host.
 */
function verifyPlanFiles(raw: unknown): { filename: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { filename: string; url: string }[] = [];
  for (const f of raw) {
    if (!f || typeof f !== "object") continue;
    const { filename, url } = f as { filename?: unknown; url?: unknown };
    if (typeof filename !== "string" || typeof url !== "string") continue;
    if (url.length > 2000) continue;

    const ours =
      url.startsWith("/api/documents/") ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url);
    if (!ours) continue;

    out.push({ filename: filename.slice(0, 200), url });
    if (out.length >= MAX_UPLOAD_FILES) break;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const estimate = verifyEstimate(data.estimate);

    /*
     * Sanity-check the number BEFORE it goes anywhere.
     *
     * Run on the SERVER-RECOMPUTED figures, never the client's, for the same
     * reason verifyEstimate exists at all: a payload can claim anything. The
     * audit does not price and cannot change the quote - it reads the answer
     * the engine already produced and says whether it is plausible against the
     * per-square-foot bands the site publishes.
     *
     * A "review" flag does NOT block the lead. Someone asking for a callback
     * still gets one; refusing to record a lead because our own arithmetic
     * looked odd would punish the visitor for our problem. It is logged loudly
     * and carried into the internal notes so nobody quotes from it blind.
     */
    let auditFlags: { code: string; severity: string; message: string }[] = [];
    if (estimate) {
      const audit = buildEstimateAudit({
        project: estimate.project,
        finish: estimate.finish,
        sqft: estimate.sqft,
        priceLow: estimate.priceLow,
        priceHigh: estimate.priceHigh,
        provenance: [],
      });
      auditFlags = audit.flags;
      const reviews = audit.flags.filter((f) => f.severity === "review");
      if (reviews.length > 0) {
        console.error(
          `[estimate-lead] PRICING REVIEW NEEDED for ${estimate.project} ${estimate.sqft}sf ${estimate.priceLow}-${estimate.priceHigh}: ${reviews.map((f) => `${f.code} (${f.message})`).join(" | ")}`,
        );
      }
    }

    /* What the team should read as "where": the street address when the lead
       owns land, otherwise the area they plan to build in, labelled so nobody
       mistakes it for a property we can look up. */
    const displayAddress =
      data.address ||
      (data.buildArea ? `${data.buildArea} (planned area - lot not owned yet)` : "");
    const ownershipNote =
      data.landOwnership === "own"
        ? "Owns the lot"
        : data.landOwnership === "not-yet"
          ? "Does not own land yet"
          : null;

    if (db) {
      try {
        await db.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          /* displayAddress, not data.address: for a non-landowner the lead
             record's location IS the planned build area, labelled so nobody
             mistakes it for a parcel we can look up. */
          address: displayAddress,
          city: (data.propertyProfile as { city?: string } | null)?.city || null,
          /* Omit the column entirely when there is no profile: passing a JS
             null through the neon-http driver serializes the jsonb parameter
             as an empty string, which Postgres rejects as invalid JSON and
             the whole lead insert fails. Non-owner leads never have a profile,
             so they always hit this path. */
          ...(data.propertyProfile
            ? { propertyProfile: data.propertyProfile as unknown as PropertyProfile }
            : {}),
          projectType: data.projectType,
          message: [
            "Submitted via estimate gate",
            data.budget ? `Budget: ${data.budget}` : null,
            ownershipNote,
            data.buildArea ? `Planned build area: ${data.buildArea}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
          estimateProject: estimate?.project || null,
          estimateFinish: estimate?.finish || null,
          estimateLow: estimate?.priceLow?.toString() || null,
          estimateHigh: estimate?.priceHigh?.toString() || null,
          estimateSqft: estimate?.sqft ?? null,
          estimateConfidence: estimate?.confidence || null,
        });
      } catch (dbErr) {
        console.error("[estimate-lead] DB insert failed:", dbErr);
      }
    }

    // The CRM gets exactly what the homeowner saw: every selection, the range,
    // the scope, the assumptions and the disclaimers, both as structured fields
    // and as readable notes. Built from the same helpers the emails render from,
    // so the two records cannot drift apart.
    const crmLead = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: displayAddress,
      zip: data.zip,
      projectType: data.projectType,
      budget: data.budget,
    };
    // Real unit costs entered in the admin pricing panel, applied to every
    // breakdown this request renders so the panel, emails and CRM agree.
    const unitCostOverrides = await readUnitCostOverrides();

    const crmProfile = (data.propertyProfile as PropertyEnrichment | null) ?? null;

    forwardToLeadDashboard({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      // Field names must match the dashboard's externalLeadSchema exactly; it
      // strips anything it does not recognise rather than erroring.
      propertyAddress: data.address || undefined,
      city: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.city || undefined,
      state: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.state || undefined,
      zip: data.zip || (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.zip || undefined,
      projectTypes: data.projectType ? [data.projectType] : [],
      budgetRange: resolveBudgetRange(data.budget, estimate),
      projectScope: estimate
        ? `${PROJECT_LABELS[estimate.project].label} - ${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)} (${estimate.confidence})`
        : undefined,
      projectGoals: buildProjectGoals(estimate),
      // The homeowner's own words stay in finalNotes; the estimate record goes
      // to estimateSummary, which the dashboard sizes for it (20k vs 2k).
      finalNotes:
        ownershipNote || data.buildArea
          ? [ownershipNote, data.buildArea ? `Planned build area: ${data.buildArea}` : null]
              .filter(Boolean)
              .join(". ")
          : undefined,
      estimate: estimate ? buildLeadEstimateRecord(estimate, unitCostOverrides) : undefined,
      // Zoning, lot size, assessed value, owner and occupancy as structured
      // fields, alongside the same rows the admin email renders.
      property: buildLeadPropertyRecord(crmProfile),
      // Structured intake fields the estimator can answer. See
      // buildCrmIntakeFields for why the rest stay deliberately empty.
      ...buildCrmIntakeFields(estimate),
      estimateSummary: buildLeadNotes(crmLead, estimate, crmProfile, unitCostOverrides),
      estimateLow: estimate?.priceLow,
      estimateHigh: estimate?.priceHigh,
      estimateRange: estimate
        ? `${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)}`
        : undefined,
      source: "boiseconstruction.co",
    });

    try {
      const { client, fromEmail } = await getUncachableEmailClient();
      const from = formatFromAddress(fromEmail);

      const lead = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: displayAddress,
        zip: data.zip,
        projectType: data.projectType,
        budget: data.budget,
      };

      // Pass the same overrides the CRM record and the customer email use, so
      // the admin email cannot quote different unit costs than the panel that
      // set them. Was omitted here while the sibling consultation route passed
      // them, which made the two lead paths disagree.
      const adminHtml = buildAdminEmailHtml(lead, estimate, crmProfile, unitCostOverrides, auditFlags);
      const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
      for (const adminEmail of adminEmails) {
        const adminResult = await client.emails.send({
          from,
          replyTo: formatLeadReplyTo(data.name, data.email),
          to: adminEmail,
          subject: buildAdminSubject(lead, estimate),
          html: adminHtml,
          text: htmlToPlainText(adminHtml),
        });
        if (adminResult?.error) {
          console.error(
            `[estimate-lead] Admin email to ${adminEmail} failed:`,
            JSON.stringify(adminResult.error)
          );
        }
      }

      const customerHtml = buildCustomerEmailHtml(lead, estimate, unitCostOverrides);
      const customerResult = await client.emails.send({
        from,
        replyTo: getReplyToAddress(),
        to: data.email,
        subject: buildCustomerSubject(lead, estimate),
        html: customerHtml,
        text: htmlToPlainText(customerHtml),
      });
      if (customerResult?.error) {
        console.error(
          `[estimate-lead] Customer email to ${data.email} failed:`,
          JSON.stringify(customerResult.error)
        );
      }
    } catch (emailErr) {
      console.error("[estimate-lead] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[estimate-lead] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

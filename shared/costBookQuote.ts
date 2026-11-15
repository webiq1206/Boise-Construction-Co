/**
 * Homepage calculator prices from the shared cost book.
 *
 * sharedBookRate is a direct owner-average cost. The customer low and high
 * are the range priceReviewedScope returns, so overhead, profit, contingency
 * and rounding stay in the shared engine. This file does not apply a markup.
 */
import { priceReviewedScope, type CostRule, type EstimatorConfiguration, type ScopePriceResolution } from "@/lib/p5/costBook.ts";
import { createPlanningConfiguration, PLANNING_MODEL_VERSION, type PlanningRate } from "@/lib/p5/planningBooks.ts";
import { finishTier, priceBookRates, sharedBookRate, type FinishTier } from "@/lib/p5/priceBook.ts";
import type { Service } from "@/lib/p5/pricing.ts";

export type BookFinish = "refresh" | "mid-range" | "high-end" | "luxury";

export interface BookQuoteInput {
  project: string;
  finish: BookFinish;
  sqft: number;
  garageSqft?: number;
  refinements?: {
    plumbingElectrical?: "cosmetic" | "partial" | "full" | null;
    bathroomCount?: number | null;
    kitchenIncluded?: boolean | null;
    stories?: number | null;
    aduConfig?: "detached" | "attached" | null;
    garageBays?: "none" | "two" | "three" | "four" | null;
    shopSize?: number | null;
    coveredOutdoor?: number | null;
  };
}

export interface BookQuoteLine {
  item: string;
  code: string;
  tier: FinishTier;
  remodel: boolean;
  quantity: number;
  unitAmount: number;
  direct: number;
}

export interface UnpricedCalculatorItem {
  item: string;
  proposal: string;
}

/**
 * Cards with no single approved code. The proposal is a quantity the book
 * can price. calculateEstimate does not apply it.
 */
export const UNPRICED_CALCULATOR_ITEMS: UnpricedCalculatorItem[] = [
  {
    item: "Shop area when no shop size is given",
    proposal: "1,200 SF of 90-50-13, the shop size in the published example. Not applied.",
  },
  {
    item: "Layout change",
    proposal: "No book line is a layout change. A quantity would be a new scope, so none is proposed.",
  },
  {
    item: "Cabinet tier separate from the finish level",
    proposal: "No added line. The finish level already selects the book column.",
  },
  {
    item: "Bathroom fixture count",
    proposal: "Each fixture past the two in a hall bath would be its own EA line. The assembly already includes a typical set, so none is added.",
  },
  {
    item: "Partial upgrade chips",
    proposal: "No book line is a fraction of a room assembly. Not applied.",
  },
  {
    item: "Whole-home bathroom count and kitchen yes or no",
    proposal: "90-40-01 does not state a bath or kitchen count. Not applied.",
  },
  {
    item: "Bathroom count on an addition, ADU or basement",
    proposal: "One extra bath would be 1 EA of 90-30-02, which is a hall bath remodel, not a new bath. Not applied.",
  },
  {
    item: "Well and septic",
    proposal: "1 EA of 33-10-03 (complete well system) plus 1 EA of 33-30-02 (conventional septic). Not applied.",
  },
  {
    item: "Site difficulty and city utilities",
    proposal: "No book line is a site-difficulty factor. Not applied.",
  },
];

const IMPORTED = "2026-11-15T00:00:00.000Z";
const NOW = new Date("2026-11-15T12:00:00.000Z");
const REQUIRED = ["03-17-01-M", "03-17-01-L", "03-15-02-M", "03-15-02-L", "03-16-01-M", "03-16-01-L", "03-14-01-M", "03-14-01-L", "03-04-01", "03-04-02", "03-04-03", "03-05-02-M", "03-05-02-L", "REF-GENERAL-HOUR", "REF-PLUMBING-HOUR", "REF-ELECTRICAL-HOUR"];

const configs = new Map<string, EstimatorConfiguration>();

function pricingService(project: string): Service {
  switch (project) {
    case "kitchen":
      return "kitchen";
    case "bathroom":
      return "bathroom";
    case "whole-home":
    case "basement":
      return "whole-home";
    case "addition":
      return "addition";
    case "adu":
      return "adu";
    default:
      return "new-construction";
  }
}

function configFor(service: Service, finish: string): EstimatorConfiguration {
  const key = `${service}|${finish}`;
  const cached = configs.get(key);
  if (cached) return cached;
  const config = createPlanningConfiguration(
    {
      version: PLANNING_MODEL_VERSION,
      source: "owner price book",
      authorizedBy: "owner",
      importedAt: IMPORTED,
      rates: [
        ...REQUIRED.map((code) => ({
          code,
          description: "Synthetic",
          type: "Labor" as const,
          unit: code.includes("HOUR") ? "HR" : "SF",
          amount: 1,
          source: "Synthetic",
          basis: "owner-average-cost" as const,
        })),
        ...priceBookRates({ service, finish }),
      ],
    },
    [service],
  );
  configs.set(key, config);
  return config;
}

function category(type: PlanningRate["type"]): CostRule["category"] {
  if (type === "Material") return "materials";
  if (type === "Labor") return "field-labor";
  if (type === "Equipment") return "equipment-rentals";
  if (type === "Subcontractor") return "subcontractors";
  return "other-direct";
}

function catalogRule(config: EstimatorConfiguration, code: string, quantity: number): CostRule {
  const rate = config.planningCatalog?.rates.find((item) => item.code === `PB-${code}`);
  if (!rate) throw new Error(`The cost book catalog has no ${code}`);
  const validUntil = new Date(Date.parse(IMPORTED) + 92 * 86400000).toISOString();
  return {
    id: `extra-${code}`,
    description: rate.description,
    category: category(rate.type),
    unit: rate.unit === "HR" ? "hour" : rate.unit,
    unitCost: rate.amount,
    priceBasis: "direct-cost",
    estimatingBasis: rate.basis,
    quantity: { fixed: quantity, factor: 1 },
    evidence: {
      basis: "owner-estimating-schedule",
      reference: `${rate.source}; ${rate.code}; ${rate.basis}.`,
      verifiedAt: IMPORTED,
      validUntil,
    },
  };
}

/** True when a shown refinement has a cost book line and changes the total. */
export function refinementChangesPrice(project: string, key: string): boolean {
  if (key === "plumbingElectrical" && project === "kitchen") return true;
  if (key === "stories" && project === "addition") return true;
  if (key === "aduConfig" && project === "adu") return true;
  if (key === "kitchenIncluded" && (project === "addition" || project === "basement")) return true;
  if (key === "bathroomCount" && project === "bathroom") return true;
  if (key === "shopSize" && project === "shop-home") return true;
  if (key === "garageBays" && (project === "custom-home" || project === "semi-custom-home" || project === "build-on-your-lot" || project === "shop-home")) return true;
  if (key === "coveredOutdoor") return true;
  return false;
}

function pushLine(lines: BookQuoteLine[], item: string, code: string, tier: FinishTier, remodel: boolean, quantity: number) {
  if (!(quantity > 0)) return;
  const rate = sharedBookRate(code, tier, remodel);
  if (!rate) throw new Error(`Cost book has no unit price for ${code}`);
  lines.push({
    item,
    code,
    tier,
    remodel,
    quantity,
    unitAmount: rate.amount,
    direct: Math.round(rate.amount * quantity * 100) / 100,
  });
}

/** Direct book lines. These amounts are not a customer price. */
export function bookQuoteLines(input: BookQuoteInput): BookQuoteLine[] {
  const tier = finishTier(input.finish);
  const sqft = input.sqft;
  const ref = input.refinements ?? {};
  const lines: BookQuoteLine[] = [];
  const garage = input.garageSqft && ref.garageBays && ref.garageBays !== "none" ? input.garageSqft : 0;
  switch (input.project) {
    case "custom-home":
    case "semi-custom-home":
    case "build-on-your-lot":
      pushLine(lines, input.project, "90-10-01", tier, false, sqft);
      pushLine(lines, "Garage area", "90-10-03", tier, false, garage);
      break;
    case "shop-home":
      pushLine(lines, "Shop home living area", "90-10-01", tier, false, sqft);
      pushLine(lines, "Shop area", "90-50-13", tier, false, ref.shopSize ?? 0);
      break;
    case "kitchen":
      pushLine(lines, "Kitchen", "90-20-02", tier, true, sqft);
      if (ref.plumbingElectrical === "partial" || ref.plumbingElectrical === "full") {
        pushLine(lines, "Kitchen plumbing relocation", "90-20-05", tier, true, 1);
      }
      if (ref.plumbingElectrical === "full") {
        pushLine(lines, "Kitchen electrical update", "90-20-04", tier, true, 1);
      }
      break;
    case "bathroom":
      pushLine(lines, "Hall bath", "90-30-02", tier, true, Math.max(1, ref.bathroomCount ?? 1));
      break;
    case "whole-home":
      pushLine(lines, "Whole-home renovation", "90-40-01", tier, true, sqft);
      break;
    case "addition":
      if (ref.stories != null && ref.stories > 1) pushLine(lines, "Second-story addition", "90-50-06", tier, false, 1);
      else pushLine(lines, "Room addition", "90-50-01", tier, false, sqft);
      if (ref.kitchenIncluded) pushLine(lines, "Kitchen in the addition", "90-20-01", tier, true, 1);
      break;
    case "adu":
      if (ref.aduConfig === "attached") pushLine(lines, "Attached ADU", "90-50-11", tier, false, 1);
      else pushLine(lines, "Detached ADU", "90-50-10", tier, false, sqft / 600);
      break;
    case "basement":
      pushLine(lines, "Basement finishing", "90-40-02", tier, true, sqft);
      if (ref.kitchenIncluded) pushLine(lines, "Basement wet bar", "90-20-10", tier, true, 1);
      break;
    default:
      throw new Error(`No cost book assembly for ${input.project}`);
  }
  if ((ref.coveredOutdoor ?? 0) > 0) pushLine(lines, "Covered patio", "06-15-05", tier, false, ref.coveredOutdoor ?? 0);
  return lines;
}

function scopeFor(input: BookQuoteInput): { service: Service; text: string; answers: Record<string, string>; replaceBase: boolean; extras: { code: string; quantity: number }[]; removeLineIds: string[] } {
  const ref = input.refinements ?? {};
  const service = pricingService(input.project);
  const sqft = String(input.sqft);
  const finish = input.finish;
  const extras: { code: string; quantity: number }[] = [];
  const covered = ref.coveredOutdoor ?? 0;
  if (covered > 0) extras.push({ code: "06-15-05", quantity: covered });
  if (input.project === "shop-home" && (ref.shopSize ?? 0) > 0) extras.push({ code: "90-50-13", quantity: ref.shopSize ?? 0 });
  if (input.project === "kitchen" && (ref.plumbingElectrical === "partial" || ref.plumbingElectrical === "full")) extras.push({ code: "90-20-05", quantity: 1 });
  if (input.project === "kitchen" && ref.plumbingElectrical === "full") extras.push({ code: "90-20-04", quantity: 1 });
  if (input.project === "addition" && ref.kitchenIncluded) extras.push({ code: "90-20-01", quantity: 1 });
  if (input.project === "basement" && ref.kitchenIncluded) extras.push({ code: "90-20-10", quantity: 1 });

  const garage = input.garageSqft && ref.garageBays && ref.garageBays !== "none" ? String(input.garageSqft) : "";
  const twoStory = input.project === "addition" && ref.stories != null && ref.stories > 1;
  const basement = input.project === "basement";
  if (twoStory) extras.unshift({ code: "90-50-06", quantity: 1 });
  if (basement) extras.unshift({ code: "90-40-02", quantity: input.sqft });

  const answers: Record<string, string> = { service, finish, sqft };
  if (garage) {
    answers.garageIncluded = "yes";
    answers.garageSqft = garage;
  }
  if (input.project === "bathroom") answers.bathrooms = String(Math.max(1, ref.bathroomCount ?? 1));
  let text = "Complete project";
  if (input.project === "adu") text = ref.aduConfig === "attached" ? "Attached ADU" : "Detached ADU";
  if (input.project === "bathroom") text = "Full hall bath remodel";
  if (input.project === "kitchen") text = "Complete kitchen remodel";
  return { service, text, answers, replaceBase: twoStory || basement, extras, removeLineIds: [] };
}

function runEngine(input: BookQuoteInput, minimumBalance = 0): { priceLow: number; priceHigh: number; direct: number } {
  const planned = scopeFor(input);
  const config = configFor(planned.service, input.finish);
  const rules = [
    ...planned.extras.map((extra) => catalogRule(config, extra.code, extra.quantity)),
  ];
  if (minimumBalance > 0) rules.push(catalogRule(config, "01-01-07", minimumBalance));
  const resolution: ScopePriceResolution | undefined = rules.length || planned.replaceBase
    ? { rules, assumptions: [], issues: [], replaceBase: planned.replaceBase, removeLineIds: planned.removeLineIds }
    : undefined;
  const priced = priceReviewedScope(
    { text: planned.text, answers: planned.answers, extraction: null, uploads: [], reviewedAt: "2026-11-15", corrections: [] } as never,
    config,
    NOW,
    resolution,
  );
  const range = priced.customer.range;
  const direct = (priced.internal as { directCost?: number }).directCost;
  if (!range || direct == null) {
    throw new Error(`The shared estimator did not return a customer range for ${input.project}`);
  }
  return { priceLow: range.low, priceHigh: range.high, direct };
}

export function bookQuote(input: BookQuoteInput): {
  priceLow: number;
  priceHigh: number;
  direct: number;
  lines: BookQuoteLine[];
} {
  const lines = bookQuoteLines(input);
  let priced = runEngine(input);
  const minimum = sharedBookRate("01-01-07", "mid", false);
  // The guided estimator tops a short job up to the book minimum, then the
  // shared engine prices that direct cost. Rush (01-01-15) and emergency
  // (01-01-09) are percentage lines. This calculator does not ask urgency,
  // so those lines are not added.
  if (minimum && priced.direct < minimum.amount) {
    const balance = Math.ceil(((minimum.amount - priced.direct) / minimum.amount) * 100) / 100;
    priced = runEngine(input, balance);
  }
  return { ...priced, lines };
}

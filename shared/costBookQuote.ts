/**
 * Homepage and guide calculator prices, taken only from the shared cost book.
 *
 * Dollar amounts come from sharedBookRate. The customer range uses the same
 * selling policy as priceReviewedScope (overhead, profit, contingency, risk
 * band). Quantities are the visitor's answers. A line with no cost book code,
 * or a code whose quantity the visitor did not give, is not priced.
 */
import { SERVICE_MATRIX, STANDARD_OVERHEAD_RATE, priceFromRiskAdjustedCost, type Service } from "@/lib/p5/pricing.ts";
import { finishTier, sharedBookRate, type FinishTier } from "@/lib/p5/priceBook.ts";

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
  };
}

export interface BookQuoteLine {
  /** What the old calculator was pricing. */
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
  reason: string;
}

/** Items the old calculator priced from its own table and the book does not. */
export const UNPRICED_CALCULATOR_ITEMS: UnpricedCalculatorItem[] = [
  {
    item: "Shop area when no shop size is given",
    reason: "90-50-13 prices a detached shop per square foot. No shop size is assumed.",
  },
  {
    item: "Layout change",
    reason: "The book has no line for a layout change by itself.",
  },
  {
    item: "Cabinet tier separate from the finish level",
    reason: "The finish level already selects the book column. A second cabinet price would be invented.",
  },
  {
    item: "Bathroom fixture count",
    reason: "90-30-02 is one hall bath. The book has no per-fixture adder on that assembly.",
  },
  {
    item: "Partial upgrade chips",
    reason: "Room assemblies are complete. The old chip weights were a separate table.",
  },
  {
    item: "Whole-home bathroom count and kitchen yes or no",
    reason: "90-40-01 does not state how many baths or kitchens are inside the per-square-foot rate.",
  },
  {
    item: "Bathroom count on an addition, ADU or basement",
    reason: "90-30-02 is a hall bath remodel, not a new bath in those projects. No cleaner code states the quantity.",
  },
  {
    item: "Lot services, site difficulty, utilities and covered outdoor area",
    reason: "The homepage calculator does not collect a quantity the book can price for those.",
  },
];

const CONTINGENCY = 0.1;

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

/** True when a shown refinement has a cost book line and changes the total. */
export function refinementChangesPrice(project: string, key: string): boolean {
  if (key === "plumbingElectrical" && project === "kitchen") return true;
  if (key === "stories" && project === "addition") return true;
  if (key === "aduConfig" && project === "adu") return true;
  if (key === "kitchenIncluded" && (project === "addition" || project === "basement")) return true;
  if (key === "bathroomCount" && project === "bathroom") return true;
  if (key === "shopSize" && project === "shop-home") return true;
  if (key === "garageBays" && (project === "custom-home" || project === "semi-custom-home" || project === "build-on-your-lot" || project === "shop-home")) return true;
  return false;
}

function pushLine(
  lines: BookQuoteLine[],
  item: string,
  code: string,
  tier: FinishTier,
  remodel: boolean,
  quantity: number,
) {
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
      if (ref.stories !== null && ref.stories !== undefined && ref.stories > 1) {
        pushLine(lines, "Second-story addition", "90-50-06", tier, false, 1);
      } else {
        pushLine(lines, "Room addition", "90-50-01", tier, false, sqft);
      }
      if (ref.kitchenIncluded) pushLine(lines, "Kitchen in the addition", "90-20-01", tier, true, 1);
      break;
    case "adu":
      if (ref.aduConfig === "attached") {
        pushLine(lines, "Attached ADU", "90-50-11", tier, false, 1);
      } else {
        // The book prices a detached ADU at 600 SF. A stated size scales it.
        pushLine(lines, "Detached ADU", "90-50-10", tier, false, sqft / 600);
      }
      break;
    case "basement":
      pushLine(lines, "Basement finishing", "90-40-02", tier, true, sqft);
      if (ref.kitchenIncluded) pushLine(lines, "Basement wet bar", "90-20-10", tier, true, 1);
      break;
    default:
      throw new Error(`No cost book assembly for ${input.project}`);
  }
  return lines;
}

/**
 * Customer low and high for a book direct cost, matching calculateP5Estimate
 * when the address, utilities and site are still unknown.
 */
export function customerRangeFromDirect(direct: number, service: Service): { priceLow: number; priceHigh: number } {
  const matrix = SERVICE_MATRIX[service];
  let riskCount = 1;
  if (service === "new-construction" || service === "addition" || service === "adu") riskCount += 2;
  const margin = Math.min(matrix.stretch, matrix.target + Math.min(4, riskCount) * 0.01);
  const riskAdjusted = direct * (1 + CONTINGENCY);
  const contract = priceFromRiskAdjustedCost(riskAdjusted, STANDARD_OVERHEAD_RATE, margin);
  const width = Math.min(0.08, 0.05 + riskCount * 0.01);
  const step = contract >= 100000 ? 1000 : contract >= 10000 ? 100 : contract >= 1000 ? 25 : 5;
  const lowFloor = priceFromRiskAdjustedCost(riskAdjusted, STANDARD_OVERHEAD_RATE, Math.min(matrix.floor, margin));
  const priceLow = Math.ceil(Math.max(lowFloor, contract * (1 - width)) / step) * step;
  const priceHigh = Math.max(
    Math.ceil((contract * (1 + width)) / step) * step,
    Math.ceil(contract / step) * step,
  );
  return { priceLow, priceHigh };
}

export function bookQuote(input: BookQuoteInput): {
  priceLow: number;
  priceHigh: number;
  direct: number;
  lines: BookQuoteLine[];
} {
  const lines = bookQuoteLines(input);
  const direct = Math.round(lines.reduce((sum, line) => sum + line.direct, 0) * 100) / 100;
  const range = customerRangeFromDirect(direct, pricingService(input.project));
  return { ...range, direct, lines };
}

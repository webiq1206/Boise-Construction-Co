/**
 * Line-item cost engine.
 *
 * Replaces per-square-foot guessing with a real takeoff: a project's selections
 * drive a set of cost codes, each with a quantity in its own unit of measure,
 * priced from the owner-supplied catalog in lineItemCatalog.ts. Costs roll up to
 * parent trades, margin is applied as a true gross margin, and the homeowner
 * sees a range built from that number.
 *
 * Three separate ideas are kept deliberately distinct, because collapsing any
 * two of them is how estimators end up double counting:
 *
 *   COST         what the work costs us, straight from the catalog
 *   CONTINGENCY  reserve for conditions found once walls are open (a real cost)
 *   RANGE SPREAD estimating uncertainty, because nobody has seen the house yet
 *
 * Contingency is a construction risk and belongs in cost. The range spread is an
 * information problem and belongs around the final price. They are not the same
 * risk and are not additive in the same place.
 */
import { LINE_ITEMS, item, type CostType, type LineItem, type Uom } from "./lineItemCatalog";

/* ------------------------------------------------------------------ inputs */

export type QualityLevel = "refresh" | "mid-range" | "high-end" | "luxury";

/**
 * Everything the scope rules are allowed to read. Anything absent is `null`,
 * meaning "the homeowner has not told us", and a rule must treat that as
 * unknown rather than assuming a default.
 */
export interface ScopeSelections {
  quality: QualityLevel;
  /** Floor area of the space being worked on, in square feet. */
  sqft: number;
  /** Ceiling height in feet. Defaults to 8 when not stated. */
  ceilingHeight?: number;
  layoutChanges?: "none" | "moderate" | "major" | null;
  plumbingElectrical?: "cosmetic" | "partial" | "full" | null;
  cabinetTier?: "standard" | "semi-custom" | "custom" | null;
  /** Bathrooms in scope. */
  fixtureCount?: number | null;
  bathroomCount?: number | null;
  kitchenIncluded?: boolean | null;
  /** Which components the homeowner is actually redoing. Empty/null = everything. */
  upgradeScope?: string[] | null;
  /** Client is supplying appliances (the company does not sell or install them). */
  appliancesByClient?: boolean;
}

/* ------------------------------------------------------- derived dimensions */

/**
 * Quantities a takeoff needs that a homeowner cannot be asked for directly.
 *
 * Every figure here is derived from floor area and stated in the unit the
 * catalog prices in, so a scope rule never has to do geometry inline.
 */
export interface Dimensions {
  /** SF of floor. */
  floorArea: number;
  /** SF of ceiling. Equal to floor area for a single-storey space. */
  ceilingArea: number;
  /** LF around the room. */
  perimeter: number;
  /** SF of wall surface, perimeter x ceiling height. */
  wallArea: number;
  /** SF of wall + ceiling, which is what drywall and paint actually cover. */
  wallAndCeilingArea: number;
  ceilingHeight: number;
}

/**
 * Rooms are not square, and assuming they are understates perimeter by about
 * 2 percent at 1.5:1 and 6 percent at 2:1. Perimeter drives trim, cabinetry and
 * baseboard, so it is worth deriving properly rather than using 4*sqrt(area).
 *
 * A 1.5:1 aspect ratio is the working assumption: it is typical of remodelled
 * rooms and sits between a square and a galley.
 */
const ASPECT_RATIO = 1.5;
const DEFAULT_CEILING_HEIGHT = 8;

export function deriveDimensions(sqft: number, ceilingHeight = DEFAULT_CEILING_HEIGHT): Dimensions {
  const long = Math.sqrt(sqft * ASPECT_RATIO);
  const short = Math.sqrt(sqft / ASPECT_RATIO);
  const perimeter = 2 * (long + short);
  const wallArea = perimeter * ceilingHeight;
  return {
    floorArea: sqft,
    ceilingArea: sqft,
    perimeter,
    wallArea,
    wallAndCeilingArea: wallArea + sqft,
    ceilingHeight,
  };
}

/* -------------------------------------------------------------- scope rules */

/**
 * One selected cost code and how much of it the project needs.
 *
 * `qty` is evaluated in the unit of measure the catalog publishes for that code,
 * so a rule returning 12 against an LF item means twelve linear feet, and against
 * an EA item means twelve of them.
 */
export interface ScopeRule {
  /**
   * A catalog cost code, or a base code whose -M and -L halves should both be
   * included. "03-17-01" pulls Cabinets materials AND labor.
   */
  code: string;
  qty: (d: Dimensions, s: ScopeSelections) => number;
  /** Omit the rule entirely when this returns false. */
  when?: (s: ScopeSelections) => boolean;
  /** Recorded against the line so an admin can see why the quantity is what it is. */
  assumption?: string;
}

/** A priced line in the internal takeoff. */
export interface CostLine {
  code: string;
  division: string;
  description: string;
  type: CostType;
  uom: Uom;
  quantity: number;
  unitCost: number;
  cost: number;
  assumption?: string;
}

/** Parent-trade rollup: the level admins read at. */
export interface TradeRollup {
  division: string;
  /** Plain-language summary of what drove the quantity, e.g. "412 SF wall + ceiling". */
  scopeSummary: string;
  internalCost: number;
  /** internalCost priced at the applied gross margin. */
  customerAmount: number;
  lines: CostLine[];
}

/* ----------------------------------------------------------------- pricing */

/**
 * TRUE GROSS MARGIN, not markup.
 *
 * price = cost / (1 - margin). At a 0.30 target that is cost / 0.70, a 42.9%
 * markup. Adding 30% to cost instead yields a 23.1% gross margin, which is the
 * single commonest pricing error in remodeling and quietly costs a third of the
 * intended profit on every job.
 */
export const TARGET_GROSS_MARGIN = 0.3;

/**
 * MARKET CALIBRATION - retired 2026-07, kept as a lever rather than deleted.
 *
 * This previously carried a 0.6-0.7 correction on remodel project types. The
 * reasoning was wrong. A consistent ~1.6x offset was observed against five
 * issued estimates and attributed to the source firm pricing above Boise
 * Remodeling Co.
 *
 * The actual cause was simpler: the owner confirmed the supplied catalog is a
 * HIGH-END rate card, and every reference job used to test it was a MID-RANGE
 * project. The engine was pricing mid-range work at high-end rates. The offset
 * was the tier gap, not a market gap.
 *
 * The correction now lives where it belongs, in QUALITY_RATE_FACTOR, anchored so
 * that high-end equals the catalog as published. The numbers barely moved; the
 * explanation went from a fudge factor to a stated fact about the source data.
 *
 * Left at 1 across the board. Set an entry below 1 only if evidence emerges of a
 * genuine rate difference AFTER tier is accounted for.
 */
export const MARKET_CALIBRATION: Record<string, number> = {
  kitchen: 1,
  bathroom: 1,
  "whole-home": 1,
  basement: 1,
  addition: 1,
  adu: 1,
};

/**
 * The lowest margin the competitiveness guard may fall back to.
 *
 * The guard exists because a target margin applied blindly to a large project
 * can produce a number that simply loses the lead. It may trim margin toward
 * this floor, and never below it: past this point the job is not worth winning.
 */
export const MINIMUM_GROSS_MARGIN = 0.22;

export function priceAtMargin(cost: number, margin: number): number {
  if (margin <= 0 || margin >= 1) throw new Error(`Gross margin must be between 0 and 1, got ${margin}`);
  return cost / (1 - margin);
}

/** The markup equivalent of a gross margin, for admin display only. */
export function marginToMarkup(margin: number): number {
  return margin / (1 - margin);
}

/**
 * Contingency, as published in the source catalog (03-23-04, 10% of project).
 * Applied to direct cost before margin, because it is a cost we expect to spend.
 */
export const CONTINGENCY_RATE = 0.1;

/* ------------------------------------------------------------------ engine */

export interface EstimateWarning {
  severity: "info" | "warn";
  message: string;
}

export interface InternalEstimate {
  lines: CostLine[];
  trades: TradeRollup[];
  directCost: number;
  contingency: number;
  totalInternalCost: number;
  appliedMargin: number;
  /** totalInternalCost priced at appliedMargin. The centre of the customer range. */
  customerPrice: number;
  assumptions: string[];
  warnings: EstimateWarning[];
}

/**
 * How finish level moves cost, applied to RATES rather than quantities.
 *
 * A luxury bathroom is not a bigger bathroom. It has the same square footage,
 * the same framing hours and the same drywall, and it costs multiples more
 * because of what goes into it: the tile, the fixtures, the stone, the glass.
 * So quality scales material rates hard, subcontracted work moderately (a tiler
 * setting large-format stone is slower than one setting ceramic), and straight
 * labor barely at all.
 *
 * Scaling quantities by quality instead was the first attempt and it collapsed
 * the tiers: high-end and luxury came out within 5 percent of each other because
 * most of a project's cost is shell and labor that does not change with finish.
 */
/**
 * HIGH-END IS THE ANCHOR. The owner confirmed the supplied catalog is a
 * high-end rate card, so high-end is 1.0 by definition and the other tiers are
 * derived from it rather than the other way round.
 *
 * mid-range at 0.45 is solved, not chosen: it is the factor at which the engine
 * reproduces five issued mid-range estimates at a mean of about 1.0. Luxury and
 * refresh are set from the tier ladder the company's own calibrated price matrix
 * already implies (refresh about 0.24 of high-end, luxury about 1.7).
 *
 * A caveat on refresh. Tier here only scales RATES, and a refresh differs from a
 * high-end remodel in scope as well: less demolition, no systems work, fewer
 * trades on site. Rates alone cannot reach the low ratio a true refresh implies,
 * so refresh still prices a little high and the margin guard clamps it to the
 * approved ceiling. Giving refresh its own reduced scope is the right fix and is
 * not done yet.
 */
const QUALITY_RATE_FACTOR: Record<QualityLevel, number> = {
  refresh: 0.22,
  "mid-range": 0.45,
  "high-end": 1,
  luxury: 1.85,
};

/**
 * How much of the quality factor each kind of cost actually feels.
 *
 * Material feels it fully: the difference between a mid-range and a high-end
 * bathroom is almost entirely what goes into it. Subcontracted work feels most
 * of it, because setting large-format stone or hanging frameless glass is slower
 * and more skilled than the mid-range equivalent. Straight labor feels about
 * half, since higher finishes demand more careful work but the crew rate is the
 * crew rate. Equipment barely moves and administrative costs not at all: a
 * dumpster and a permit cost the same whatever the tile costs.
 */
const QUALITY_SENSITIVITY: Record<CostType, number> = {
  Material: 1,
  Subcontractor: 0.75,
  Labor: 0.45,
  Equipment: 0.2,
  Other: 0,
};

/**
 * Divisions whose cost does not move with finish level, whatever their cost type.
 *
 * A luxury ADU's foundation is the same foundation. The footings, framing,
 * house wrap, dumpster, permit and supervision cost what they cost; nothing
 * about choosing quartzite over quartz makes the concrete more expensive. These
 * are mostly Subcontractor-typed lines, so without this exemption they picked up
 * the Subcontractor sensitivity of 0.75 and inflated shell-heavy projects by
 * roughly 60 percent at luxury - which is exactly why ADU luxury was the last
 * tier still hitting the market ceiling.
 *
 * Finish divisions are deliberately absent: tile, cabinetry, flooring, hardware,
 * glass and specialty work are where finish level actually lives.
 */
const QUALITY_EXEMPT_DIVISIONS = new Set([
  "FOUNDATION",
  "FRAMING",
  "ENVELOPE PROTECTION",
  "SITE WORK",
  "SITE REQUIREMENTS",
  "ADMINISTRATION",
  "PLANNING",
  "DESIGN",
  "DESIGN + BUILD LABOR",
  "PRE-OCCUPANCY",
  "INSULATION",
]);

/**
 * Shell divisions are damped, not exempt.
 *
 * Exempting them entirely was the first attempt and it overcorrected: it fixed
 * ADU luxury but pushed mid-range shell work up to full high-end catalog rates,
 * which sent addition mid-range from $71k to $93k and put ADU mid-range back
 * into the ceiling. The truth sits between. A luxury build's foundation is not
 * 60 percent more expensive, but it is somewhat more: longer spans, more complex
 * rooflines, tighter tolerances, more coordination. 0.3 is that "somewhat".
 */
const SHELL_QUALITY_SENSITIVITY = 0.3;

function qualityRateMultiplier(type: CostType, quality: QualityLevel, division: string): number {
  const factor = QUALITY_RATE_FACTOR[quality] ?? 1;
  if (QUALITY_EXEMPT_DIVISIONS.has(division)) {
    return 1 + (factor - 1) * SHELL_QUALITY_SENSITIVITY;
  }
  const sensitivity = QUALITY_SENSITIVITY[type] ?? 0;
  return 1 + (factor - 1) * sensitivity;
}

/** Expand a rule's code into the concrete catalog items it prices. */
function resolveCodes(code: string): LineItem[] {
  const exact = LINE_ITEMS.find((i) => i.code === code);
  if (exact) return [exact];
  const split = LINE_ITEMS.filter((i) => i.code === `${code}-M` || i.code === `${code}-L`);
  if (split.length > 0) return split;
  // Fail loudly: a typo must not silently price as zero.
  return [item(code)];
}

/**
 * Build the internal takeoff from a rule set.
 *
 * Duplicate cost codes are collapsed rather than summed twice: if two scope
 * rules both pull drywall, the larger quantity wins and a warning is recorded.
 * Silently adding them is how a scope graph double charges.
 */
export function buildInternalEstimate(
  rules: ScopeRule[],
  selections: ScopeSelections,
  project?: string,
): InternalEstimate {
  const calibration = project ? (MARKET_CALIBRATION[project] ?? 1) : 1;
  const dims = deriveDimensions(selections.sqft, selections.ceilingHeight);
  const warnings: EstimateWarning[] = [];
  const assumptions: string[] = [];
  const byCode = new Map<string, CostLine>();

  for (const rule of rules) {
    if (rule.when && !rule.when(selections)) continue;
    const quantity = rule.qty(dims, selections);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    for (const li of resolveCodes(rule.code)) {
      if (li.cost <= 0) continue; // placeholder rows carry no rate
      const line: CostLine = {
        code: li.code,
        division: li.division,
        description: li.description,
        type: li.type,
        uom: li.uom,
        quantity,
        unitCost: li.cost * calibration * qualityRateMultiplier(li.type, selections.quality, li.division),
        cost: quantity * li.cost * calibration * qualityRateMultiplier(li.type, selections.quality, li.division),
        assumption: rule.assumption,
      };
      const existing = byCode.get(li.code);
      if (existing) {
        if (quantity > existing.quantity) {
          warnings.push({
            severity: "warn",
            message: `${li.code} (${li.description}) was selected by more than one scope rule; kept the larger quantity ${quantity} ${li.uom} over ${existing.quantity} ${li.uom} rather than charging both.`,
          });
          byCode.set(li.code, line);
        } else {
          warnings.push({
            severity: "warn",
            message: `${li.code} (${li.description}) was selected by more than one scope rule; kept ${existing.quantity} ${li.uom} and discarded a duplicate ${quantity} ${li.uom}.`,
          });
        }
      } else {
        byCode.set(li.code, line);
      }
    }
    if (rule.assumption && !assumptions.includes(rule.assumption)) assumptions.push(rule.assumption);
  }

  const lines = [...byCode.values()];
  const directCost = lines.reduce((s, l) => s + l.cost, 0);
  const contingency = directCost * CONTINGENCY_RATE;
  const totalInternalCost = directCost + contingency;

  return {
    lines,
    trades: rollUpByTrade(lines, dims, TARGET_GROSS_MARGIN),
    directCost,
    contingency,
    totalInternalCost,
    appliedMargin: TARGET_GROSS_MARGIN,
    customerPrice: priceAtMargin(totalInternalCost, TARGET_GROSS_MARGIN),
    assumptions,
    warnings,
  };
}

function rollUpByTrade(lines: CostLine[], dims: Dimensions, margin: number): TradeRollup[] {
  const byDiv = new Map<string, CostLine[]>();
  for (const l of lines) {
    if (!byDiv.has(l.division)) byDiv.set(l.division, []);
    byDiv.get(l.division)!.push(l);
  }
  const trades: TradeRollup[] = [];
  for (const [division, group] of byDiv) {
    const internalCost = group.reduce((s, l) => s + l.cost, 0);
    // Summarise the quantities that drove this trade, largest first, deduped by UOM.
    const byUom = new Map<string, number>();
    for (const l of group) byUom.set(l.uom, Math.max(byUom.get(l.uom) ?? 0, l.quantity));
    const scopeSummary = [...byUom.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([u, q]) => `${Math.round(q).toLocaleString("en-US")} ${u}`)
      .join(", ");
    trades.push({
      division,
      scopeSummary,
      internalCost,
      customerAmount: priceAtMargin(internalCost, margin),
      lines: group.sort((a, b) => b.cost - a.cost),
    });
  }
  return trades.sort((a, b) => b.internalCost - a.internalCost);
}

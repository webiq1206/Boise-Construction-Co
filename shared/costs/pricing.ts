/**
 * Turning an internal cost into a number a homeowner sees.
 *
 * Two jobs, deliberately separated:
 *
 *   THE MARGIN GUARD decides what margin the job can actually carry. The target
 *   is 30 percent gross, but a target applied blindly to a large or unusual
 *   project can produce a number that simply loses the lead. The guard trims
 *   margin toward a floor, never below it, and always says that it did.
 *
 *   THE RANGE decides how wide a band to quote around that price, because an
 *   online form cannot see the house. Width shrinks as the homeowner tells us
 *   more, and never collapses to a false single number.
 *
 * These are different questions and are answered in that order: price first,
 * then uncertainty about the price. Folding them together is how an estimator
 * ends up widening a range to hide a margin decision.
 */
import {
  MINIMUM_GROSS_MARGIN,
  TARGET_GROSS_MARGIN,
  priceAtMargin,
  type EstimateWarning,
  type InternalEstimate,
  type QualityLevel,
} from "./engine";
import {
  calculateEstimate,
  normalizeFinishLevel,
  PLANNING_STAGE_BAND,
  type FinishLevel,
  type PlanningStage,
  type ProjectType,
} from "../estimateEngine";
import { EMPTY_REFINEMENTS } from "../estimateEngine";
import { CONTINGENCY_RATE } from "./engine";
import { ACCESSORY_DIVISION } from "./accessoryStructures";

/* ------------------------------------------------------------ market guard */

/**
 * What the Boise market bears for this project, size and finish level.
 *
 * Deliberately sourced from the shipping PRICE_MATRIX rather than a new table.
 * Those figures are already calibrated against the same closed jobs this engine
 * back-tests on, and the owner has signed off on them as the numbers the
 * business is willing to quote. Reusing them means the line-item engine can
 * never quietly drift above a price the company already decided was its
 * ceiling, and it gives a continuous transition between the two engines.
 *
 * Returns null when the combination is not priced (for example a "refresh"
 * addition, which does not exist), in which case the guard does not fire.
 */
export function marketCeiling(
  project: ProjectType,
  quality: QualityLevel,
  sqft: number,
): number | null {
  try {
    const finish = normalizeFinishLevel(project, quality as FinishLevel);
    const r = calculateEstimate({ project, finish, sqft, refinements: EMPTY_REFINEMENTS });
    return r.priceHigh;
  } catch {
    return null;
  }
}

export interface MarginDecision {
  appliedMargin: number;
  price: number;
  trimmed: boolean;
  warnings: EstimateWarning[];
}

/**
 * Price the job, trimming margin only as far as the market ceiling requires.
 *
 * The guard never trims below MINIMUM_GROSS_MARGIN. If the job is still above
 * the ceiling at the floor margin, it is quoted at the floor and flagged: that
 * is a real signal that the scope is genuinely expensive, and burying it by
 * cutting margin further would mean bidding work at a loss to win a lead.
 */
export function decideMargin(
  internalCost: number,
  project: ProjectType,
  quality: QualityLevel,
  sqft: number,
): MarginDecision {
  const warnings: EstimateWarning[] = [];
  const atTarget = priceAtMargin(internalCost, TARGET_GROSS_MARGIN);
  const ceiling = marketCeiling(project, quality, sqft);

  if (ceiling === null || atTarget <= ceiling) {
    return { appliedMargin: TARGET_GROSS_MARGIN, price: atTarget, trimmed: false, warnings };
  }

  // Solve for the margin that lands exactly on the ceiling: m = 1 - cost/ceiling.
  const needed = 1 - internalCost / ceiling;

  if (needed < MINIMUM_GROSS_MARGIN) {
    const floorPrice = priceAtMargin(internalCost, MINIMUM_GROSS_MARGIN);
    warnings.push({
      severity: "warn",
      message:
        `Scope prices above the market ceiling even at the ${Math.round(MINIMUM_GROSS_MARGIN * 100)}% margin floor ` +
        `($${Math.round(floorPrice).toLocaleString("en-US")} vs ceiling $${Math.round(ceiling).toLocaleString("en-US")}). ` +
        `Quoted at the floor. Review the scope before sending: either the selections are genuinely premium, or a quantity is wrong.`,
    });
    return { appliedMargin: MINIMUM_GROSS_MARGIN, price: floorPrice, trimmed: true, warnings };
  }

  warnings.push({
    severity: "info",
    message:
      `Margin trimmed from ${Math.round(TARGET_GROSS_MARGIN * 100)}% to ${Math.round(needed * 100)}% to stay at or below ` +
      `the market ceiling of $${Math.round(ceiling).toLocaleString("en-US")} for this project and finish level.`,
  });
  return { appliedMargin: needed, price: priceAtMargin(internalCost, needed), trimmed: true, warnings };
}

/* ------------------------------------------------------------------ range */

/**
 * Half-width of the quoted band, as a fraction of the centre price.
 *
 * The band answers a question the line items cannot: what has the homeowner not
 * told us? Existing conditions behind walls, access, final selections, hidden
 * damage, engineering, permit conditions and labour availability all move a real
 * number and none of them are visible through a web form.
 *
 * It is NOT the same thing as contingency, which is already carried inside cost
 * for conditions found once the walls are open. Contingency is money we expect
 * to spend; the band is our uncertainty about the estimate itself.
 */
const BASE_BAND = 0.15;

/**
 * The band never closes past this, however much detail is supplied.
 *
 * Owner decision (2026-07): quote 0.85x to 1.15x. The reasoning is to protect
 * margin while keeping the top of the range from causing sticker shock, and it
 * is sound here in a way it would not have been before, because the centre is
 * now derived from a back-tested line-item takeoff rather than a per-square-foot
 * guess. A tight band around a trustworthy centre is defensible.
 *
 * THE RISK THIS ACCEPTS, recorded so it is not rediscovered the hard way. The
 * back-test ratios against issued estimates were 0.96, 1.25, 1.00, 1.01 and
 * 0.99. One of five sat 25 percent above the engine, which is outside a 15
 * percent ceiling. So roughly one job in five should be expected to finish above
 * the top of the quoted range. That is tolerable only because every range is
 * explicitly a planning figure requiring an on-site visit, and because the
 * margin guard stops the centre drifting high in the first place.
 *
 * Deliberately equal to BASE_BAND: the band does not tighten below 15 percent
 * however much detail a homeowner supplies. Tightening further would raise the
 * chance of finishing above the ceiling with no offsetting benefit.
 */
const MIN_BAND = 0.15;

/** How much of the band detail can remove. Zero while MIN_BAND equals BASE_BAND. */
const BAND_TIGHTENING = 0.5;

/**
 * Band width when the client's planning stage is known.
 *
 * This SUPERSEDES the flat BASE_BAND/MIN_BAND pair above for new construction,
 * and the reason is that those two constants were set equal, which pinned every
 * range at plus or minus 15 percent no matter what was known. That was
 * defensible for remodels, where the unknowns are behind walls we have not
 * opened and no amount of client detail resolves them. It is not defensible for
 * a new build, where the single largest unknown is simply whether the house has
 * been drawn yet.
 *
 * Quoting a client with stamped drawings the same +/-15% as someone who has not
 * decided to build understates one and overstates the other. See
 * PLANNING_STAGE_BAND in estimateEngine.ts for the per-stage figures and why
 * the tightest floor is 10 percent rather than lower.
 */
function bandForStage(stage: PlanningStage | null | undefined, detailRatio: number): number {
  if (!stage) return Math.max(MIN_BAND, BASE_BAND * (1 - BAND_TIGHTENING * detailRatio));
  const { start, floor } = PLANNING_STAGE_BAND[stage];
  return Math.max(floor, start - (start - floor) * detailRatio);
}

/**
 * The accessory-structure share of the internal cost, including its slice of
 * the contingency reserve.
 *
 * Read back off the priced lines rather than passed in, so it cannot drift out
 * of step with what the takeoff actually contains.
 */
function accessoryInternalCost(estimate: InternalEstimate): number {
  const direct = estimate.lines
    .filter((l) => l.division === ACCESSORY_DIVISION)
    .reduce((s, l) => s + l.cost, 0);
  return direct * (1 + CONTINGENCY_RATE);
}

export interface PlanningRange {
  low: number;
  high: number;
  centre: number;
  /** Half-width actually used, as a fraction. */
  band: number;
  appliedMargin: number;
  marginTrimmed: boolean;
  /**
   * The share of `centre` attributable to accessory structures, at the applied
   * margin. Zero when there are none. Carried so an admin can see how much of a
   * large number is house and how much is shop, which is the first question
   * asked of any six-figure jump.
   */
  accessoryCustomerAmount: number;
  /** The stage the band was derived from; null falls back to the flat band. */
  planningStage: PlanningStage | null;
  warnings: EstimateWarning[];
}

/**
 * Rounding resolution for a range, chosen ONCE from its centre.
 *
 * Deriving the step per value let a single range straddle two resolutions: a
 * centre just over $25,000 rounded its high end to the nearest $1,000 and its
 * low end, still under the threshold, to the nearest $500. The homeowner then
 * read "$23,500 to $32,000" - two different precisions in one sentence, which
 * reads like a mistake even though both numbers were correct.
 *
 * One step per range keeps the two ends speaking with the same confidence.
 */
function stepFor(centre: number): number {
  return centre >= 100000 ? 5000 : centre >= 25000 ? 1000 : 500;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Build the customer-facing planning range.
 *
 * `detailRatio` is 0 when the homeowner gave only the minimum and 1 when every
 * question that affects price has been answered. More detail tightens the band;
 * it never widens it, and it never moves the centre.
 */
export function buildPlanningRange(
  estimate: InternalEstimate,
  project: ProjectType,
  quality: QualityLevel,
  sqft: number,
  detailRatio = 0,
  planningStage: PlanningStage | null = null,
): PlanningRange {
  /*
   * THE CEILING IS A HOUSE CEILING, so only the house is measured against it.
   *
   * marketCeiling() asks the guide matrix what a home of this type, size and
   * finish is worth. It knows nothing about a 2,400 SF shop, so sending it a
   * total that includes one guarantees the guard fires: it reads a normal house
   * plus a barn as a wildly overpriced house, trims margin to the 22 percent
   * floor and attaches a warning telling the owner to go re-check quantities
   * that were never wrong.
   *
   * So the house is priced against the ceiling on its own, and the accessory
   * structures are priced separately at whatever margin that decision landed
   * on. They stay subject to the same margin, just not to a ceiling that was
   * never drawn to cover them.
   */
  const accessoryCost = accessoryInternalCost(estimate);
  const houseCost = Math.max(0, estimate.totalInternalCost - accessoryCost);

  const decision = decideMargin(houseCost, project, quality, sqft);
  const clamped = Math.min(1, Math.max(0, detailRatio));
  const band = bandForStage(planningStage, clamped);

  const centre =
    accessoryCost > 0
      ? decision.price + priceAtMargin(accessoryCost, decision.appliedMargin)
      : decision.price;
  const step = stepFor(centre);
  return {
    centre,
    low: roundTo(centre * (1 - band), step),
    high: roundTo(centre * (1 + band), step),
    band,
    appliedMargin: decision.appliedMargin,
    marginTrimmed: decision.trimmed,
    accessoryCustomerAmount:
      accessoryCost > 0 ? priceAtMargin(accessoryCost, decision.appliedMargin) : 0,
    planningStage,
    warnings: [...estimate.warnings, ...decision.warnings],
  };
}

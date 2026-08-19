/**
 * Pricing a millwork takeoff against the owner's own rate card.
 *
 * NOTHING HERE INVENTS A RATE. Every number comes from lineItemCatalog, which
 * is the company's published cost book, priced at the same TARGET_GROSS_MARGIN
 * the main engine uses. A second, hand-tuned "millwork rate card" living in
 * this file would drift from the real one within a quarter and nobody would
 * notice until a bid was wrong.
 *
 * THE HARD PART IS NOT ARITHMETIC, IT IS WHAT TO REFUSE TO PRICE. A takeoff
 * read off drawings contains three very different kinds of number: quantities
 * written in a schedule, quantities measured off a plan, and items that are
 * plainly there with no quantity at all. Multiplying all three by a unit rate
 * produces one confident total and hides the fact that a third of it was
 * guessed. So items are SEGREGATED BY BASIS: scheduled and dimensioned figures
 * price normally, scaled figures price into a deliberately wider band, and
 * items with no determinable quantity are not priced at all - they are returned
 * as named, unpriced scope so the number is visibly incomplete rather than
 * invisibly wrong.
 *
 * THE RATE CARD IS RESIDENTIAL. That is a real limitation and it is surfaced
 * rather than papered over. Commercial casework - bar dies, back bars, banquette
 * runs, reception joinery - is built to different standards by different shops
 * and generally prices above a residential cabinet rate. This module does NOT
 * apply an invented commercial multiplier to compensate, because a made-up
 * factor is indistinguishable from a real one once it is in a total. It prices
 * at the card, says plainly that the card is residential, and refuses to call
 * the result bid-ready.
 */
import { installedCost } from "@/shared/costs/lineItemCatalog";
import { TARGET_GROSS_MARGIN, priceAtMargin } from "@/shared/costs/engine";
import {
  MILLWORK_CATEGORY_LABELS,
  type MillworkCategory,
  type MillworkItem,
  type MillworkTakeoff,
  type MillworkUnit,
  type QuantityBasis,
} from "./extraction";

/**
 * Category to cost code, with the unit the card prices in.
 *
 * `specialty` is deliberately absent: its catalog row (03-17-99) is a
 * zero-cost placeholder, and isPlaceholder() exists precisely so those are
 * never auto-selected. Specialty items come back as unpriced scope with a
 * reason, which is the honest answer for "wine display, one, see A612".
 */
const CATEGORY_RATES: Record<
  Exclude<MillworkCategory, "specialty">,
  { code: string; unit: MillworkUnit }
> = {
  cabinetry: { code: "03-17-01", unit: "LF" },
  countertop: { code: "03-17-02", unit: "LF" },
  vanity: { code: "03-17-03", unit: "LF" },
  "built-in": { code: "03-17-04", unit: "LF" },
  shelving: { code: "03-17-05", unit: "LF" },
  door: { code: "03-18-01", unit: "EA" },
  trim: { code: "03-18-02", unit: "LF" },
  paneling: { code: "03-18-04", unit: "SF" },
};

/**
 * How wide a band each kind of number earns.
 *
 * A figure lifted off a schedule is a fact and gets the ordinary estimating
 * spread. A figure someone measured off a drawing carries the drawing's own
 * imprecision on top of that, so it gets a visibly wider one. The spread is
 * the honest expression of how the quantity was obtained - it is not a
 * confidence knob to be tuned until the range looks appealing.
 */
const BASIS_SPREAD: Record<QuantityBasis, number | null> = {
  scheduled: 0.15,
  dimensioned: 0.15,
  counted: 0.2,
  scaled: 0.35,
  /* Not a wider band - no band. There is no quantity to put a range around. */
  unknown: null,
};

export interface PricedMillworkLine {
  label: string;
  category: MillworkCategory;
  categoryLabel: string;
  location: string | null;
  sheetRef: string | null;
  quantity: number;
  unit: MillworkUnit;
  quantityBasis: QuantityBasis;
  /** Installed cost per unit from the catalog, before margin. */
  unitCost: number;
  /** Customer-facing midpoint for this line. */
  price: number;
  low: number;
  high: number;
}

export interface UnpricedMillworkLine {
  label: string;
  category: MillworkCategory;
  categoryLabel: string;
  location: string | null;
  sheetRef: string | null;
  /** Why it could not be priced, in language a customer can act on. */
  reason: string;
}

export interface MillworkPricing {
  priced: PricedMillworkLine[];
  unpriced: UnpricedMillworkLine[];
  /** Sum of line midpoints. */
  total: number;
  totalLow: number;
  totalHigh: number;
  /** Never true while anything is unpriced or the set is commercial. */
  bidReady: boolean;
  assumptions: string[];
  warnings: string[];
}

function round(n: number): number {
  return Math.round(n / 50) * 50;
}

/**
 * A unit that disagrees with the rate card cannot be silently converted.
 *
 * Linear feet of cabinet and square feet of cabinet are not interchangeable,
 * and the conversion depends on a run height nobody has stated. Converting on
 * an assumed 8-foot wall is exactly the sort of invisible assumption that makes
 * a total wrong in a way nobody can trace, so a mismatch becomes unpriced scope
 * with the mismatch named.
 */
function unitMatches(itemUnit: MillworkUnit | null, cardUnit: MillworkUnit): boolean {
  return itemUnit === cardUnit;
}

export function priceMillworkTakeoff(takeoff: MillworkTakeoff): MillworkPricing {
  const priced: PricedMillworkLine[] = [];
  const unpriced: UnpricedMillworkLine[] = [];

  for (const it of takeoff.items) {
    const label = MILLWORK_CATEGORY_LABELS[it.category];
    const base = {
      label: it.label,
      category: it.category,
      categoryLabel: label,
      location: it.location,
      sheetRef: it.sheetRef,
    };

    if (it.category === "specialty") {
      unpriced.push({
        ...base,
        reason:
          "Specialty joinery is quoted by the shop rather than off a rate card. We will price it once we have the detail sheet or a shop drawing.",
      });
      continue;
    }

    const rate = CATEGORY_RATES[it.category];
    const spread = BASIS_SPREAD[it.quantityBasis];

    if (it.quantity === null || !Number.isFinite(it.quantity) || it.quantity <= 0 || spread === null) {
      unpriced.push({
        ...base,
        reason:
          "The drawings show this but do not state a quantity we can stand behind. A dimensioned elevation or a casework schedule for it would let us price it.",
      });
      continue;
    }

    if (!unitMatches(it.unit, rate.unit)) {
      unpriced.push({
        ...base,
        reason: `Quantity is given in ${it.unit ?? "no unit"} but ${label.toLowerCase()} prices per ${rate.unit}. Converting would mean assuming a height or depth the sheets do not state.`,
      });
      continue;
    }

    const unitCost = installedCost(rate.code);
    const cost = unitCost * it.quantity;
    const price = priceAtMargin(cost, TARGET_GROSS_MARGIN);

    priced.push({
      ...base,
      quantity: it.quantity,
      unit: rate.unit,
      quantityBasis: it.quantityBasis,
      unitCost,
      price: round(price),
      low: round(price * (1 - spread)),
      high: round(price * (1 + spread)),
    });
  }

  const total = priced.reduce((n, l) => n + l.price, 0);
  const totalLow = priced.reduce((n, l) => n + l.low, 0);
  const totalHigh = priced.reduce((n, l) => n + l.high, 0);

  /* ------------------------------------------------- assumptions + warnings */

  const assumptions: string[] = [
    `Priced against our published rate card at a ${Math.round(TARGET_GROSS_MARGIN * 100)}% gross margin, installed.`,
  ];

  const scaledCount = priced.filter((l) => l.quantityBasis === "scaled").length;
  if (scaledCount > 0) {
    assumptions.push(
      `${scaledCount} line(s) were measured off the drawings rather than read from a schedule, and carry a wider range because of it.`,
    );
  }

  const warnings: string[] = [];

  if (takeoff.isCommercial) {
    warnings.push(
      "These are commercial drawings and our rate card is residential. Commercial casework is built to different standards, often by a specialist shop, and generally prices above these rates. Treat this as a planning figure, not a bid.",
    );
  }

  if (unpriced.length > 0) {
    warnings.push(
      `${unpriced.length} item(s) are named in the takeoff but not included in the total. The figure below is therefore incomplete, not conservative.`,
    );
  }

  if (takeoff.questions.length > 0) {
    warnings.push(
      `${takeoff.questions.length} question(s) need answering before this can be tightened. Cabinet construction grade and material alone can move casework by a factor of two.`,
    );
  }

  if (takeoff.confidence === "low") {
    warnings.push("The reader flagged low confidence in this set. A human should check the takeoff against the drawings.");
  }

  if (priced.length === 0) {
    warnings.push("Nothing in this set could be priced from the drawings alone.");
  }

  /* Bid-ready is a high bar on purpose. The cost of releasing a millwork number
     that turns out to be half the real one is a job taken at a loss; the cost of
     withholding it is a phone call. */
  const bidReady =
    priced.length > 0 &&
    unpriced.length === 0 &&
    !takeoff.isCommercial &&
    takeoff.questions.length === 0 &&
    takeoff.confidence === "high" &&
    scaledCount === 0;

  return { priced, unpriced, total, totalLow, totalHigh, bidReady, assumptions, warnings };
}

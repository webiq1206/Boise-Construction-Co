/**
 * Invariants for the RE-10 repair estimator.
 *
 * The point of this file is that the RE-10 engine is exposed to input nobody
 * controls: a document extractor decides what the repair list contains, and the
 * price goes to a real estate agent under a contractual deadline. Every property
 * this asserts is one that, if it broke silently, would either lose money on
 * every job or put a misleading number in front of a client.
 *
 * The margin checks are the sharp end. A 50% gross margin floor is worthless if
 * the arithmetic drifts, so these recompute profit over price from the returned
 * figures rather than trusting the engine's own `appliedMargin`.
 */
import {
  estimateRe10,
  priceRepair,
  RECIPES,
  CREW_FOR_TRADE,
  CREW_MINIMUM_COST,
  TRADE_LABELS,
  REVIEW_REASON_TEXT,
  RE10_MARGIN_FLOOR,
  RE10_MARGIN_CEILING,
  RE10_CONTINGENCY_RATE,
  COORDINATION_COST_PER_ITEM,
  MOBILISATION_COST,
  ADDITIONAL_TRADE_MOBILISATION_FACTOR,
  type RepairKind,
  type RepairItemInput,
  type Re10Context,
  type ReviewReason,
} from "../shared/costs/re10Repairs";

let checks = 0;
let failures = 0;
const fail = (msg: string) => {
  failures++;
  if (failures <= 30) console.log(`  FAIL: ${msg}`);
};
const check = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) fail(msg);
};
const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

const ALL_KINDS = Object.keys(RECIPES) as RepairKind[];

/* ------------------------------------------------- 1. catalog integrity */

for (const kind of ALL_KINDS) {
  const recipe = RECIPES[kind];
  check(recipe.components.length > 0, `${kind}: recipe has no components`);
  check(recipe.defaultQty > 0, `${kind}: defaultQty must be positive`);
  check(!!TRADE_LABELS[recipe.trade], `${kind}: unknown trade ${recipe.trade}`);
  check(!!CREW_FOR_TRADE[recipe.trade], `${kind}: trade ${recipe.trade} has no crew`);

  // Every code must resolve. priceRepair throws on an unknown code, which is the
  // behaviour we want; this turns that into a named failure instead of a stack.
  try {
    const p = priceRepair({ id: kind, kind, description: kind });
    check(p.lines.length > 0, `${kind}: priced to zero lines`);
    check(p.directCost > 0, `${kind}: priced to a zero cost`);
    for (const l of p.lines) {
      check(l.quantity > 0, `${kind}: line ${l.code} has non-positive quantity`);
      check(near(l.cost, l.unitCost * l.quantity, 0.001), `${kind}: line ${l.code} cost does not equal unit x qty`);
    }
  } catch (err) {
    fail(`${kind}: threw while pricing - ${(err as Error).message}`);
  }
}

/* ------------------------------------- 2. quantity drives cost, monotonically */

for (const kind of ALL_KINDS) {
  const small = priceRepair({ id: "s", kind, description: "", quantity: 1 });
  const large = priceRepair({ id: "l", kind, description: "", quantity: 40 });
  check(large.directCost >= small.directCost, `${kind}: 40 units cost less than 1 unit`);
  // Flat components mean it is not strictly proportional, but a 40x quantity
  // must move the number, or the quantity is being ignored.
  check(large.directCost > small.directCost, `${kind}: quantity has no effect on cost`);
}

/* ------------------------------------------ 3. assumed quantities are flagged */

for (const kind of ALL_KINDS) {
  const noQty = priceRepair({ id: "n", kind, description: "" });
  check(noQty.quantityAssumed, `${kind}: missing quantity was not flagged as assumed`);
  check(noQty.quantity === RECIPES[kind].defaultQty, `${kind}: did not fall back to defaultQty`);

  const withQty = priceRepair({ id: "w", kind, description: "", quantity: 7 });
  check(!withQty.quantityAssumed, `${kind}: supplied quantity wrongly flagged as assumed`);

  // A zero or negative quantity is bad data, not a free repair.
  for (const bad of [0, -5, Number.NaN]) {
    const p = priceRepair({ id: "b", kind, description: "", quantity: bad });
    check(p.quantityAssumed, `${kind}: quantity ${bad} was not treated as missing`);
    check(p.directCost > 0, `${kind}: quantity ${bad} produced a free repair`);
  }
}

/* --------------------------------------------------- 4. review items are safe */

const REVIEW_ONLY: ReviewReason[] = [
  "structural", "foundation", "mould-hazmat", "asbestos-lead", "electrical-service",
  "sewer-septic", "hvac-replacement", "gas", "fire-damage", "engineering", "out-of-scope",
];

for (const reason of REVIEW_ONLY) {
  const est = estimateRe10([
    { id: "1", kind: "drywall-patch", description: "patch", quantity: 10 },
    { id: "2", kind: "drywall-patch", description: "flagged", quantity: 10, needsReview: reason },
  ]);
  check(est.review.length === 1, `${reason}: flagged item was not routed to review`);
  check(est.priced.length === 1, `${reason}: flagged item leaked into the priced list`);
  check(est.review[0].text === REVIEW_REASON_TEXT[reason], `${reason}: review text missing`);
  check(
    est.priced.every((p) => p.input.id !== "2"),
    `${reason}: flagged item appears in priced output`,
  );
}

// A list that is entirely review items must produce no price at all, not a zero
// that reads as "free".
const allReview = estimateRe10([
  { id: "1", kind: "drywall-patch", description: "x", needsReview: "structural" },
  { id: "2", kind: "flooring-patch", description: "y", needsReview: "foundation" },
]);
check(allReview.sellingPrice === 0, "all-review list still produced a selling price");
check(allReview.low === 0 && allReview.high === 0, "all-review list produced a non-zero range");
check(allReview.trades.length === 0, "all-review list produced trade groups");
check(
  allReview.warnings.some((w) => /could not be priced|onsite/i.test(w.message)),
  "all-review list did not warn that nothing could be priced",
);

/* ------------------------------------------------- 5. THE MARGIN INVARIANTS */

const CONTEXTS: Re10Context[] = [
  {},
  { occupancy: "vacant", access: "standard", daysToDeadline: 45, hasInspectionReport: true },
  { occupancy: "occupied", access: "limited", daysToDeadline: 5, hasInspectionReport: true },
  { occupancy: "occupied", access: "difficult", daysToDeadline: 3, hasInspectionReport: false },
  { occupancy: "unknown", access: "difficult", daysToDeadline: 10 },
  { occupancy: "vacant", access: "standard", daysToDeadline: 0 },
];

function sampleList(n: number, seedKinds: RepairKind[]): RepairItemInput[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    kind: seedKinds[i % seedKinds.length],
    description: `item ${i}`,
    quantity: i % 3 === 0 ? undefined : (i % 17) + 1,
    hasPhoto: i % 2 === 0,
  }));
}

const KIND_POOLS: RepairKind[][] = [
  ["drywall-patch"],
  ["drywall-patch", "outlet-switch-replace"],
  ["drywall-repaint-wall", "toilet-repair", "gfci-install", "caulking-weatherproofing"],
  ["trim-repair", "interior-door-adjust", "flooring-patch", "faucet-replace", "light-fixture-replace", "siding-repair"],
  ALL_KINDS.filter((k) => !RECIPES[k].alwaysReview),
];

for (const ctx of CONTEXTS) {
  for (const pool of KIND_POOLS) {
    for (const n of [1, 2, 5, 12, 25]) {
      const est = estimateRe10(sampleList(n, pool), ctx);
      if (est.priced.length === 0) continue;

      const label = `n=${n} pool=${pool.length} ctx=${JSON.stringify(ctx)}`;

      // (a) The floor is absolute.
      check(est.appliedMargin >= RE10_MARGIN_FLOOR - 1e-9, `${label}: margin ${est.appliedMargin} below the 50% floor`);
      check(est.appliedMargin <= RE10_MARGIN_CEILING + 1e-9, `${label}: margin ${est.appliedMargin} above the ceiling`);

      // (b) TRUE GROSS MARGIN, recomputed. price = cost / (1 - m) means
      //     profit / price must equal m. This is the check that catches a
      //     markup-vs-margin regression, which is the expensive mistake.
      const realised = est.grossProfit / est.sellingPrice;
      check(near(realised, est.appliedMargin, 1e-6), `${label}: realised margin ${realised} != applied ${est.appliedMargin}`);
      check(near(est.sellingPrice - est.totalInternalCost, est.grossProfit, 0.01), `${label}: gross profit does not reconcile`);
      check(est.sellingPrice >= est.totalInternalCost * 2 - 0.01, `${label}: 50% margin must at least double cost`);

      // (c) NO DOUBLE COUNTING. The total must be exactly the sum of its parts.
      const parts = est.directCost + est.mobilisation + est.coordination + est.contingency;
      check(near(parts, est.totalInternalCost, 0.01), `${label}: cost parts ${parts} != total ${est.totalInternalCost}`);
      check(
        near(est.contingency, (est.directCost + est.mobilisation + est.coordination) * RE10_CONTINGENCY_RATE, 0.01),
        `${label}: contingency is not the stated rate on the pre-contingency cost`,
      );

      // (d) Trade rollup must reconcile to the whole, so parent and child cannot
      //     drift apart and no trade is priced independently.
      const tradeSum = est.trades.reduce((s, t) => s + t.customerAmount, 0);
      check(near(tradeSum, est.sellingPrice, 0.5), `${label}: trade amounts ${tradeSum} != selling price ${est.sellingPrice}`);
      const adjustedSum = est.trades.reduce((s, t) => s + t.adjustedCost, 0);
      check(near(adjustedSum, est.directCost, 0.01), `${label}: trade adjusted costs != direct cost`);

      // (e) Coordination is per priced item, never per review item.
      check(
        near(est.coordination, est.priced.length * COORDINATION_COST_PER_ITEM, 0.01),
        `${label}: coordination not charged per priced item`,
      );

      // (f) Mobilisation: one full, the rest reduced. Never one per repair.
      const crews = new Set(est.trades.map((t) => t.crew));
      const expectedMob =
        crews.size === 0 ? 0 : MOBILISATION_COST * (1 + (crews.size - 1) * ADDITIONAL_TRADE_MOBILISATION_FACTOR);
      check(near(est.mobilisation, expectedMob, 0.01), `${label}: mobilisation ${est.mobilisation} != expected ${expectedMob}`);
      check(est.mobilisation <= MOBILISATION_COST * crews.size + 0.01, `${label}: mobilisation exceeds one per crew`);
      if (est.priced.length > crews.size) {
        check(
          est.mobilisation < MOBILISATION_COST * est.priced.length,
          `${label}: mobilisation charged per repair rather than per crew`,
        );
      }

      // (g) The range must bracket the price and never invert.
      check(est.low <= est.sellingPrice && est.sellingPrice <= est.high, `${label}: price outside its own range`);
      check(est.low < est.high, `${label}: range did not widen`);
      check(est.low > 0, `${label}: range low fell to zero on a priced list`);

      // (h) Every priced repair belongs to exactly one trade group.
      const grouped = est.trades.reduce((s, t) => s + t.repairs.length, 0);
      check(grouped === est.priced.length, `${label}: ${grouped} grouped vs ${est.priced.length} priced`);
    }
  }
}

/* ------------------------------------- 6. crew minimums, and their absence */

for (const kind of ALL_KINDS) {
  if (RECIPES[kind].alwaysReview) continue;
  const trade = RECIPES[kind].trade;
  const crew = CREW_FOR_TRADE[trade];
  const est = estimateRe10([{ id: "1", kind, description: "single tiny item", quantity: 1 }]);
  if (est.priced.length === 0) continue;

  // One small repair must never bill under the crew minimum plus mobilisation.
  check(
    est.directCost >= CREW_MINIMUM_COST[crew] - 0.01,
    `${kind}: single-item job priced at ${est.directCost}, under the ${crew} minimum ${CREW_MINIMUM_COST[crew]}`,
  );
}

// A big single-trade list must clear its minimum on real work, so the top-up
// stops applying rather than stacking on top of genuine cost.
const bigDrywall = estimateRe10(
  Array.from({ length: 12 }, (_, i) => ({ id: String(i), kind: "drywall-repaint-wall" as const, description: "", quantity: 40 })),
);
check(bigDrywall.minimumsApplied === 0, `large single-crew list still applied a minimum top-up of ${bigDrywall.minimumsApplied}`);

/* ------------------------- 7. more information must never widen the range */

const vague: RepairItemInput[] = [
  { id: "1", kind: "drywall-patch", description: "" },
  { id: "2", kind: "trim-repair", description: "" },
  { id: "3", kind: "flooring-patch", description: "" },
];
const precise: RepairItemInput[] = vague.map((v) => ({ ...v, quantity: 12, hasPhoto: true }));

const vagueEst = estimateRe10(vague, { hasInspectionReport: false });
const preciseEst = estimateRe10(precise, { hasInspectionReport: true });
check(preciseEst.bandWidth < vagueEst.bandWidth, "supplying measurements and photos did not narrow the range");
check(vagueEst.uncertainty.length > 0, "a list with no measurements reported no uncertainty");
check(preciseEst.confidence !== "low", "a fully documented list still reported low confidence");
check(
  vagueEst.assumptions.some((a) => /no measurement|assumed/i.test(a)),
  "assumed quantities were not disclosed in the assumptions",
);

/* ------------------------------- 8. context uplifts move in the right direction */

const baseList = sampleList(6, ["drywall-patch", "toilet-repair", "gfci-install"]);
const relaxed = estimateRe10(baseList, { occupancy: "vacant", access: "standard", daysToDeadline: 60 });
const urgent = estimateRe10(baseList, { occupancy: "occupied", access: "difficult", daysToDeadline: 2 });
check(urgent.appliedMargin > relaxed.appliedMargin, "an urgent occupied job did not price above a relaxed vacant one");
check(urgent.sellingPrice > relaxed.sellingPrice, "urgency did not raise the price");
check(urgent.marginUplifts.length > relaxed.marginUplifts.length, "urgency uplifts were not explained");
check(
  relaxed.appliedMargin >= RE10_MARGIN_FLOOR,
  "the most relaxed possible job still must not price below the 50% floor",
);

/* -------------------------------------------------------------------- done */

console.log(
  failures === 0
    ? `verify:re10: OK (${checks} invariant checks across ${ALL_KINDS.length} repair kinds)`
    : `verify:re10: FAILED with ${failures} problem(s) across ${checks} checks`,
);
process.exit(failures === 0 ? 0 : 1);

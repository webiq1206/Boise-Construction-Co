/**
 * Golden-scenario regression suite for both pricing engines.
 *
 * The invariant suites prove RELATIONSHIPS (monotonicity, band sanity, margin
 * floors); verify-new-construction anchors rates to the published $/sqft
 * bands. Neither pins EXACT numbers, so a rate that drifts 10% while staying
 * inside the published band would pass everything and silently change every
 * quote. This file closes that gap: known scenarios with known expected
 * outputs, asserted to the dollar.
 *
 * A failure here means pricing CHANGED - which is either a bug (fix it) or an
 * intentional repricing (rerun with GOLDEN_RECORD=1, eyeball the new table
 * against the published anchors, and commit the updated goldens in the same
 * change that moved the rates).
 *
 *   npx tsx scripts/verify-golden-estimates.ts            # verify
 *   GOLDEN_RECORD=1 npx tsx scripts/verify-golden-estimates.ts  # print table
 */
import { resolveQuotedRange } from "../shared/costs/resolve";
import { estimateRe10, type RepairItemInput, type Re10Context } from "../shared/costs/re10Repairs";
import { EMPTY_REFINEMENTS, type EstimateRefinements } from "../shared/estimateEngine";

let checks = 0;
let failed = 0;
const record = process.env.GOLDEN_RECORD === "1";

function assertEqual(name: string, got: number, want: number) {
  checks++;
  if (got !== want) {
    failed++;
    console.error(`FAIL ${name}: got ${got}, golden ${want}`);
  }
}

/* ------------------------------------------------- new-construction goldens */

type NcScenario = {
  id: string;
  project: string;
  finish: string;
  sqft: number;
  refinements: Partial<EstimateRefinements> & { planningStage?: string };
  detailRatio?: number;
  golden: { low: number; high: number };
};

/* Goldens recorded 2026-08-07 against the catalog as shipped, after checking
   each against the published anchors in shared/seoContent.ts ($250-$400/sf
   custom band, "near $225" floor, semi-custom $225-$300/sf, shop-home
   $140-$250/sf blended). */
const NC_SCENARIOS: NcScenario[] = [
  {
    id: "custom-min-essential-exploring",
    project: "custom-home",
    finish: "essential",
    sqft: 1400,
    refinements: { planningStage: "exploring" },
    golden: { low: 410000, high: 695000 },
  },
  {
    id: "custom-baseline-mid-have-plans",
    project: "custom-home",
    finish: "mid-range",
    sqft: 2400,
    refinements: { planningStage: "have-plans", stories: 1 },
    golden: { low: 550000, high: 700000 },
  },
  {
    id: "custom-large-luxury-loaded",
    project: "custom-home",
    finish: "luxury",
    sqft: 4200,
    refinements: {
      planningStage: "have-plans",
      stories: 2,
      garageBays: 4,
      basementType: "finished",
      coveredOutdoor: 400,
      bathroomCount: 4,
    },
    detailRatio: 1,
    golden: { low: 2500000, high: 3055000 },
  },
  {
    id: "semi-custom-baseline-mid",
    project: "semi-custom-home",
    finish: "mid-range",
    sqft: 2000,
    refinements: { planningStage: "plans-in-progress" },
    golden: { low: 450000, high: 620000 },
  },
  {
    id: "shop-home-baseline-mid",
    project: "shop-home",
    finish: "mid-range",
    sqft: 1600,
    refinements: { planningStage: "need-plans" },
    golden: { low: 370000, high: 565000 },
  },
  {
    id: "byol-baseline-mid-steep-site",
    project: "build-on-your-lot",
    finish: "mid-range",
    sqft: 2400,
    refinements: { planningStage: "have-plans", siteDifficulty: "steep" },
    golden: { low: 590000, high: 755000 },
  },
];

function runNc(s: NcScenario): { low: number; high: number } {
  const refinements = { ...EMPTY_REFINEMENTS, ...s.refinements } as never;
  const range = resolveQuotedRange(
    s.project as never,
    s.finish,
    s.sqft,
    refinements,
    s.detailRatio ?? 0,
  );
  if (!range) throw new Error(`${s.id}: resolveQuotedRange returned null`);
  return { low: range.priceLow, high: range.priceHigh };
}

/* --------------------------------------------------------- RE-10 goldens */

type Re10Scenario = {
  id: string;
  items: RepairItemInput[];
  ctx: Re10Context;
  golden: { low: number; high: number; quotedPrice: number; reviewCount: number };
};

const RE10_SCENARIOS: Re10Scenario[] = [
  {
    id: "re10-single-electrical",
    items: [
      { id: "1", description: "Replace broken outlet in kitchen", kind: "outlet-switch-replace", quantity: 1 },
    ],
    ctx: { occupancy: "vacant", access: "standard", hasInspectionReport: true },
    golden: { low: 200, high: 300, quotedPrice: 300, reviewCount: 0 },
  },
  {
    id: "re10-multi-trade-typical",
    items: [
      { id: "1", description: "Patch drywall in hallway", kind: "drywall-patch", quantity: 2 },
      { id: "2", description: "Replace kitchen faucet", kind: "faucet-replace", quantity: 1 },
      { id: "3", description: "Repair toilet in hall bath", kind: "toilet-repair", quantity: 1 },
      { id: "4", description: "Replace 3 outlets", kind: "outlet-switch-replace", quantity: 3 },
      { id: "5", description: "Repair handrail at stairs", kind: "handrail-repair", quantity: 1 },
    ],
    ctx: { occupancy: "occupied", access: "standard", daysToDeadline: 21, hasInspectionReport: true },
    golden: { low: 1000, high: 1500, quotedPrice: 1300, reviewCount: 0 },
  },
  {
    id: "re10-tight-deadline-difficult-access",
    items: [
      { id: "1", description: "Replace water heater", kind: "water-heater-replace", quantity: 1 },
      { id: "2", description: "Patch drywall", kind: "drywall-patch", quantity: 1 },
    ],
    ctx: { occupancy: "occupied", access: "difficult", daysToDeadline: 5, hasInspectionReport: false },
    golden: { low: 300, high: 600, quotedPrice: 500, reviewCount: 1 },
  },
  {
    id: "re10-unpriceable-goes-to-review",
    items: [
      { id: "1", description: "Replace faucet", kind: "faucet-replace", quantity: 1 },
      // No such recipe: must land in review, never silently priced.
      { id: "2", description: "Rebuild retaining wall", kind: "not-a-real-kind" as never },
    ],
    ctx: { occupancy: "vacant", access: "standard" },
    golden: { low: 200, high: 400, quotedPrice: 300, reviewCount: 1 },
  },
];

function runRe10(s: Re10Scenario) {
  const e = estimateRe10(s.items, s.ctx);
  return { low: e.low, high: e.high, quotedPrice: e.quotedPrice, reviewCount: e.review.length };
}

/* ------------------------------------------------------------------ main */

if (record) {
  console.log("── record mode: paste these into the golden tables ──");
  for (const s of NC_SCENARIOS) {
    const r = runNc(s);
    console.log(`${s.id}: { low: ${r.low}, high: ${r.high} }`);
  }
  for (const s of RE10_SCENARIOS) {
    const r = runRe10(s);
    console.log(
      `${s.id}: { low: ${r.low}, high: ${r.high}, quotedPrice: ${r.quotedPrice}, reviewCount: ${r.reviewCount} }`,
    );
  }
  process.exit(0);
}

for (const s of NC_SCENARIOS) {
  const r = runNc(s);
  assertEqual(`${s.id}.low`, r.low, s.golden.low);
  assertEqual(`${s.id}.high`, r.high, s.golden.high);
}

for (const s of RE10_SCENARIOS) {
  const r = runRe10(s);
  assertEqual(`${s.id}.low`, r.low, s.golden.low);
  assertEqual(`${s.id}.high`, r.high, s.golden.high);
  assertEqual(`${s.id}.quotedPrice`, r.quotedPrice, s.golden.quotedPrice);
  assertEqual(`${s.id}.reviewCount`, r.reviewCount, s.golden.reviewCount);
}

/* Determinism: the same inputs twice must price identically. */
for (const s of [NC_SCENARIOS[1], NC_SCENARIOS[2]]) {
  const a = runNc(s);
  const b = runNc(s);
  assertEqual(`${s.id}.deterministic.low`, b.low, a.low);
  assertEqual(`${s.id}.deterministic.high`, b.high, a.high);
}

/* Order-independence: refinement key order and item order must not matter. */
{
  const s = NC_SCENARIOS[2];
  const shuffled = Object.fromEntries(Object.entries({ ...EMPTY_REFINEMENTS, ...s.refinements }).reverse());
  const r = resolveQuotedRange(s.project as never, s.finish, s.sqft, shuffled as never, s.detailRatio ?? 0)!;
  assertEqual(`${s.id}.key-order.low`, r.priceLow, s.golden.low);
  assertEqual(`${s.id}.key-order.high`, r.priceHigh, s.golden.high);
}
{
  const s = RE10_SCENARIOS[1];
  const e = estimateRe10([...s.items].reverse(), s.ctx);
  assertEqual(`${s.id}.item-order.low`, e.low, s.golden.low);
  assertEqual(`${s.id}.item-order.high`, e.high, s.golden.high);
  assertEqual(`${s.id}.item-order.quoted`, e.quotedPrice, s.golden.quotedPrice);
}

if (failed > 0) {
  console.error(`verify-golden-estimates: ${failed}/${checks} FAILED`);
  process.exit(1);
}
console.log(`verify-golden-estimates: OK (${checks} exact-value checks)`);

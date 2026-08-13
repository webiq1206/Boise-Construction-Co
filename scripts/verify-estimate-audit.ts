/**
 * Estimate-audit regression suite.
 *
 * THE LOAD-BEARING TEST IS THE FIRST ONE. Every anomaly flag is run against the
 * golden scenarios - real engine output, pinned to the dollar and already
 * trusted by the rest of the build. If a flag fires on those, the threshold is
 * wrong and this file is what has to change; the goldens are not adjusted to
 * make a new check look good. A plausibility check that cries wolf on known-good
 * pricing gets ignored within a week and then it is worse than nothing.
 *
 * The rest asserts the opposite direction: genuinely broken output MUST flag.
 * A checker that never fires and a checker that always fires are equally
 * useless, so both failure modes are covered.
 *
 *   npx tsx scripts/verify-estimate-audit.ts
 */
import { resolveQuotedRange } from "../shared/costs/resolve";
import { EMPTY_REFINEMENTS, type EstimateRefinements } from "../shared/estimateEngine";
import { buildEstimateAudit, PUBLISHED_PER_SF } from "../shared/plans/estimateAudit";
import type { ExtractedPlan } from "../shared/plans/extraction";
import type { ProvenanceEntry } from "../shared/plans/mergeChunks";

let checks = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  checks++;
  if (!cond) {
    failed++;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}
function eq(name: string, got: unknown, want: unknown) {
  check(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

/* ═══════════════ 1. no flag may fire on known-good engine output ═══════════ */

const GOLDEN = [
  { id: "custom-min-essential", project: "custom-home", finish: "essential", sqft: 1400, refinements: { planningStage: "exploring" } },
  { id: "custom-baseline-mid", project: "custom-home", finish: "mid-range", sqft: 2400, refinements: { planningStage: "have-plans", stories: 1 } },
  { id: "custom-large-luxury", project: "custom-home", finish: "luxury", sqft: 4200, refinements: { planningStage: "have-plans", stories: 2, garageBays: "four", basementType: "finished", coveredOutdoor: 400, bathroomCount: 4 }, detailRatio: 1 },
  { id: "semi-custom-mid", project: "semi-custom-home", finish: "mid-range", sqft: 2000, refinements: { planningStage: "plans-in-progress" } },
  { id: "shop-home-mid", project: "shop-home", finish: "mid-range", sqft: 1600, refinements: { planningStage: "need-plans" } },
  { id: "byol-steep", project: "build-on-your-lot", finish: "mid-range", sqft: 2400, refinements: { planningStage: "have-plans", siteDifficulty: "steep" } },
];

for (const g of GOLDEN) {
  const refinements = { ...EMPTY_REFINEMENTS, ...g.refinements } as EstimateRefinements;
  const range = resolveQuotedRange(
    g.project as never,
    g.finish,
    g.sqft,
    refinements as never,
    g.detailRatio ?? 0,
  );
  check(`${g.id}: engine returned a range`, Boolean(range));
  if (!range) continue;

  const audit = buildEstimateAudit({
    project: g.project,
    finish: g.finish,
    sqft: g.sqft,
    priceLow: range.priceLow,
    priceHigh: range.priceHigh,
    provenance: [],
    manualFields: ["sqft"],
  });

  const reviews = audit.flags.filter((f) => f.severity === "review");
  check(
    `${g.id}: no review flag on known-good pricing`,
    reviews.length === 0,
    reviews.map((r) => `${r.code}: ${r.message}`).join(" | "),
  );
  check(`${g.id}: marked safe to present`, audit.safeToPresent);
  check(
    `${g.id}: per-sqft computed`,
    audit.perSqftLow !== null && audit.perSqftLow > 0,
  );
}

/* Every project type with a published band must price inside a sane multiple
   of it, otherwise the public copy and the engine have drifted apart. */
for (const [project, band] of Object.entries(PUBLISHED_PER_SF)) {
  const range = resolveQuotedRange(
    project as never,
    "mid-range",
    project === "shop-home" ? 1600 : 2400,
    { ...EMPTY_REFINEMENTS } as never,
    0.5,
  );
  if (!range) continue;
  const sqft = project === "shop-home" ? 1600 : 2400;
  const perSf = range.priceLow / sqft;
  check(
    `${project}: mid-range rate is near its published band`,
    perSf >= band.low * 0.75 && perSf <= band.high * 1.5,
    `$${perSf.toFixed(0)}/sf vs published $${band.low}-$${band.high}`,
  );
}

/* ═══════════════════ 2. genuinely broken output MUST flag ═════════════════ */

const base = { project: "custom-home", finish: "mid-range", sqft: 2400, provenance: [] as ProvenanceEntry[] };

{
  const a = buildEstimateAudit({ ...base, priceLow: 700_000, priceHigh: 550_000 });
  check("inverted band flags", a.flags.some((f) => f.code === "inverted-band"));
  check("inverted band is not safe to present", !a.safeToPresent);
}
{
  const a = buildEstimateAudit({ ...base, priceLow: 0, priceHigh: 0 });
  check("zero price flags", a.flags.some((f) => f.code === "non-positive-price"));
}
{
  const a = buildEstimateAudit({ ...base, priceLow: 400_000, priceHigh: 1_400_000 });
  check("absurd spread flags", a.flags.some((f) => f.code === "band-too-wide"));
}
{
  // $100/sf on a custom home is below anything this market builds for.
  const a = buildEstimateAudit({ ...base, priceLow: 240_000, priceHigh: 300_000 });
  check("implausibly low rate flags", a.flags.some((f) => f.code === "below-plausible-rate"));
  check("implausibly low rate is not safe", !a.safeToPresent);
}
{
  // $1,000/sf.
  const a = buildEstimateAudit({ ...base, priceLow: 2_300_000, priceHigh: 2_400_000 });
  check("implausibly high rate flags", a.flags.some((f) => f.code === "above-plausible-rate"));
}
/* A SMALL custom home priced under the published "starting at" figure is NOT
   an anomaly. The golden 1,400 SF scenario quotes $410k against a published
   $525k, and that is arithmetic: the $525k is anchored to "near $225 per
   square foot", which implies ~2,300 SF. Asserted explicitly so nobody
   reintroduces a flat dollar floor. */
{
  const a = buildEstimateAudit({ ...base, sqft: 1400, priceLow: 410_000, priceHigh: 695_000 });
  check(
    "small home under the published starting figure is not flagged",
    !a.flags.some((f) => f.severity === "review"),
    a.flags.map((f) => f.code).join(","),
  );
}

/* ═══════════════════════ 3. scope classification ══════════════════════════ */

const provenance: ProvenanceEntry[] = [
  { field: "livableSqft", value: "3240", pageLabels: ["permit-set.pdf p.1"] },
  { field: "garageBays", value: "3", pageLabels: ["permit-set.pdf p.4"] },
];

const plan: ExtractedPlan = {
  isNewConstruction: true,
  livableSqft: 3240,
  garageBays: 3,
  storiesAboveGrade: null,
  basement: null,
  coveredOutdoorSqft: null,
  garageSqft: null,
  specialFeatures: ["Gas fireplace in great room"],
  accessoryStructures: [{ label: "SHOP", sqft: null }],
  confidence: "high",
  notes: [],
};

{
  const a = buildEstimateAudit({
    project: "custom-home",
    finish: "mid-range",
    sqft: 3240,
    priceLow: 810_000,
    priceHigh: 1_100_000,
    provenance,
    plan,
  });

  const area = a.scope.find((s) => s.label === "Conditioned area");
  eq("area is confirmed", area?.status, "confirmed");
  eq("area cites its sheet", area?.source, "permit-set.pdf p.1");

  const garage = a.scope.find((s) => s.label === "Garage");
  eq("garage is confirmed", garage?.status, "confirmed");
  eq("garage cites its sheet", garage?.source, "permit-set.pdf p.4");

  const basement = a.scope.find((s) => s.label === "Basement");
  eq("unstated basement is an assumption", basement?.status, "assumed");
  check("assumption explains itself", Boolean(basement?.note));

  const fireplace = a.scope.find((s) => s.label.includes("fireplace"));
  eq("unpriced feature is excluded, not hidden", fireplace?.status, "excluded");
  check("exclusion says where it goes instead", Boolean(fireplace?.note));

  const shop = a.scope.find((s) => s.label === "SHOP");
  eq("sizeless outbuilding is unresolved", shop?.status, "unresolved");
  check(
    "sizeless outbuilding raises a review flag",
    a.flags.some((f) => f.code === "structure-without-area"),
  );
  check("sizeless outbuilding blocks presentation", !a.safeToPresent);
}

/* A manual estimate must NOT sprout assumption lines about drawings that were
   never uploaded - that is exactly the generic boilerplate this avoids. */
{
  const a = buildEstimateAudit({
    project: "custom-home",
    finish: "mid-range",
    sqft: 2400,
    priceLow: 550_000,
    priceHigh: 700_000,
    provenance: [],
    manualFields: ["sqft"],
  });
  eq("manual estimate has no assumption lines", a.scope.filter((s) => s.status === "assumed").length, 0);
  eq("manual estimate reports the visitor as the source", a.scope[0].source, "you told us");
  eq("manual estimate has exactly one scope line", a.scope.length, 1);
}

/* A blocked gate lands in the scope list as unresolved. */
{
  const a = buildEstimateAudit({
    ...base,
    priceLow: 550_000,
    priceHigh: 700_000,
    gate: {
      canFinalize: false,
      blockers: [{ code: "coverage-missing", severity: "block", message: "4 sheets could not be reviewed." }],
      questions: [],
    },
  });
  check("gate blocker becomes unresolved scope", a.scope.some((s) => s.status === "unresolved"));
  check("incomplete documents flag", a.flags.some((f) => f.code === "incomplete-documents"));
  check("blocked gate is not safe to present", !a.safeToPresent);
}

if (failed > 0) {
  console.error(`verify-estimate-audit: ${failed}/${checks} FAILED`);
  process.exit(1);
}
console.log(`verify-estimate-audit: OK (${checks} checks)`);

/**
 * Gating regression suite.
 *
 * The property under test is an asymmetry: anything that leaves SCOPE UNKNOWN
 * must block, anything merely untidy must not. Both directions are tested,
 * because a gate that blocks everything is as useless as one that blocks
 * nothing - the first gets switched off within a week.
 *
 * Every blocking case must also produce a QUESTION. "We cannot price this"
 * without "here is what would let us" is a dead end, and a gate that produces
 * dead ends is the reason gates get removed.
 *
 *   npx tsx scripts/verify-plan-gating.ts
 */
import { gatePlanEstimate, type CoverageSummary } from "../shared/plans/gating";
import type { ExtractedPlan } from "../shared/plans/extraction";
import type { PlanConflict } from "../shared/plans/mergeChunks";

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

const cleanCoverage: CoverageSummary = {
  totalPages: 118,
  processed: 118,
  unreadable: 0,
  missing: 0,
  complete: true,
};

const goodPlan: ExtractedPlan = {
  isNewConstruction: true,
  livableSqft: 3240,
  storiesAboveGrade: 2,
  basement: "none",
  confidence: "high",
  notes: [],
};

function gate(
  plan: Partial<ExtractedPlan> = {},
  coverage: Partial<CoverageSummary> = {},
  conflicts: PlanConflict[] = [],
) {
  return gatePlanEstimate({
    plan: { ...goodPlan, ...plan },
    coverage: { ...cleanCoverage, ...coverage },
    conflicts,
  });
}

/* ------------------------------ a clean, fully-read set must NOT be blocked */
{
  const d = gate();
  check("clean set can finalize", d.canFinalize);
  eq("clean set has no blockers", d.blockers.filter((b) => b.severity === "block").length, 0);
}

/* ---------------------------------------- a page nobody reported on blocks */
{
  const d = gate({}, { missing: 4, processed: 114, complete: false });
  check("missing pages block", !d.canFinalize);
  check("missing pages produce a question", d.questions.some((q) => q.id === "resend-missing"));
  check(
    "missing-page message states the count",
    d.blockers.some((b) => b.code === "coverage-missing" && b.message.includes("4")),
  );
}

/* ------------------------------------------- an unreadable sheet blocks too */
{
  const d = gate({}, { unreadable: 2, processed: 116, complete: false });
  check("unreadable pages block", !d.canFinalize);
  check("unreadable pages produce a question", d.questions.some((q) => q.id === "rescan-unreadable"));
}

/* --------------------------------------------- the reader's own doubt blocks */
{
  const d = gate({ confidence: "low" });
  check("low confidence blocks", !d.canFinalize);
  check("low confidence asks to confirm figures", d.questions.some((q) => q.id === "confirm-key-figures"));
}
{
  const d = gate({ confidence: "medium" });
  check("medium confidence does NOT block", d.canFinalize);
}

/* ------------------- a contradiction on a price-scaling figure must block */
for (const field of [
  "livableSqft",
  "floorAreas",
  "storiesAboveGrade",
  "garageSqft",
  "basement",
  "isNewConstruction",
  "accessoryStructures.shop.sqft",
]) {
  const d = gate({}, {}, [
    { field, readings: [{ value: "3240", pageLabels: ["p.1"] }, { value: "4100", pageLabels: ["p.9"] }] },
  ]);
  check(`conflict on ${field} blocks`, !d.canFinalize);
  check(
    `conflict on ${field} asks which is current`,
    d.questions.some((q) => q.id === `resolve:${field}`),
  );
}

/* ------------- a contradiction that does NOT move the price must only warn */
{
  const d = gate({}, {}, [
    { field: "bedrooms", readings: [{ value: "4", pageLabels: ["p.3"] }, { value: "5", pageLabels: ["p.6"] }] },
  ]);
  check("bedroom conflict does not block", d.canFinalize);
  check(
    "bedroom conflict still surfaces as a warning",
    d.blockers.some((b) => b.code === "conflict:bedrooms" && b.severity === "warn"),
  );
}

/* ------------------ a ground-up build with no stated area cannot be priced */
{
  const d = gate({ livableSqft: null, floorAreas: [] });
  check("new build with no area blocks", !d.canFinalize);
  check("new build with no area asks for it", d.questions.some((q) => q.id === "state-area"));
}
{
  // Per-floor areas are enough to scale from even with no stated total.
  const d = gate({ livableSqft: null, floorAreas: [1800, 1440] });
  check("floor areas alone satisfy the area requirement", d.canFinalize);
}
{
  // A remodel is not required to state a whole-house area.
  const d = gate({ isNewConstruction: false, livableSqft: null, floorAreas: [] });
  check("remodel without total area does not block on area", d.canFinalize);
}

/* --------------------------------- unknown basement is a question, not a block */
{
  const d = gate({ basement: null });
  check("unknown basement does not block", d.canFinalize);
  check("unknown basement is asked about", d.questions.some((q) => q.id === "basement"));
}

/* ------------------------- an unreadable FORMAT is a warning, not a blocker */
{
  const d = gate({}, { skippedFiles: [{ filename: "addendum.docx", reason: "not machine readable" }] });
  check("skipped file format does not block", d.canFinalize);
  check(
    "skipped file format warns",
    d.blockers.some((b) => b.code === "unreadable-format" && b.severity === "warn"),
  );
}

/* --------------------------- every blocking reason must offer a way forward */
{
  const worst = gate(
    { confidence: "low", livableSqft: null, floorAreas: [] },
    { missing: 3, unreadable: 2, complete: false },
    [{ field: "livableSqft", readings: [{ value: "1", pageLabels: ["p.1"] }, { value: "2", pageLabels: ["p.2"] }] }],
  );
  check("worst case blocks", !worst.canFinalize);
  check(
    "worst case still offers questions",
    worst.questions.length >= 4,
    `only ${worst.questions.length} questions`,
  );
  check("every question explains why", worst.questions.every((q) => q.why.length > 10));
  check("every blocker has a readable message", worst.blockers.every((b) => b.message.length > 10));
}

if (failed > 0) {
  console.error(`verify-plan-gating: ${failed}/${checks} FAILED`);
  process.exit(1);
}
console.log(`verify-plan-gating: OK (${checks} checks)`);

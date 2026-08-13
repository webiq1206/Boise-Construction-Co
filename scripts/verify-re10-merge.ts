/**
 * RE-10 repair-list reconciliation regression suite.
 *
 * Two opposing failures, both expensive, and this suite exists to prove the
 * code errs in the cheaper direction:
 *
 *  - Counting one repair twice (it appears on the RE-10 and again in the cited
 *    inspection report) inflates the quote by a real line item.
 *  - Merging two genuinely different repairs because their wording overlaps
 *    deletes work from the scope, which is discovered on site.
 *
 * The second is worse, so only unambiguous repeats collapse. Anything merely
 * similar must survive in the list AND be flagged. Both halves are asserted
 * here, because a dedupe that only ever merges looks correct until the day it
 * eats a real repair.
 *
 *   npx tsx scripts/verify-re10-merge.ts
 */
import { mergeRe10Chunks, type Re10ChunkContribution } from "../shared/re10/mergeChunks";
import type { ExtractedRepair } from "../shared/re10/extraction";

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

function repair(p: Partial<ExtractedRepair> & { verbatim: string }): ExtractedRepair {
  return { kind: "drywall-patch", confidence: "high", ...p } as ExtractedRepair;
}

function chunk(repairs: ExtractedRepair[], label: string): Re10ChunkContribution {
  return { result: { repairs, unmapped: [] }, pageIds: [label], pageLabels: [label] };
}

/* --------------------------- an exact repeat across pages collapses to one */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Replace kitchen faucet", kind: "faucet-replace", location: "kitchen" })], "p.1"),
    chunk([repair({ verbatim: "Replace kitchen faucet", kind: "faucet-replace", location: "kitchen" })], "p.4"),
  ]);
  eq("exact repeat -> one row", m.result.repairs.length, 1);
  eq("exact repeat recorded", m.duplicatesRemoved.length, 1);
}

/* ------------ punctuation and number words are not meaningful differences */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Replace three outlets", kind: "outlet-switch-replace" })], "p.1"),
    chunk([repair({ verbatim: "Replace 3 outlets.", kind: "outlet-switch-replace" })], "p.2"),
  ]);
  eq("number words normalise to one row", m.result.repairs.length, 1);
}

/* ------------- THE IMPORTANT ONE: same trade, different place, both survive */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Patch drywall", location: "hallway" })], "p.1"),
    chunk([repair({ verbatim: "Patch drywall", location: "bedroom 2" })], "p.2"),
  ]);
  eq("same repair in two rooms stays two rows", m.result.repairs.length, 2);
  eq("and is not reported as a duplicate", m.duplicatesRemoved.length, 0);
}

/* ------------ different trades with similar wording are never merged */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Repair handrail", kind: "handrail-repair" })], "p.1"),
    chunk([repair({ verbatim: "Repair handrail", kind: "handrail-replace" })], "p.2"),
  ]);
  eq("different kinds stay separate", m.result.repairs.length, 2);
}

/* ---------- a restatement is KEPT (not merged) and flagged for a human */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Repair handrail", kind: "handrail-repair", location: "stairs" })], "p.1"),
    chunk(
      [repair({ verbatim: "Repair loose handrail at stairs per inspection", kind: "handrail-repair", location: "stairs" })],
      "p.6",
    ),
  ]);
  eq("restatement keeps BOTH rows", m.result.repairs.length, 2);
  eq("restatement is flagged", m.possibleDuplicates.length, 1);
  check(
    "flag explains itself",
    m.possibleDuplicates[0].reason.toLowerCase().includes("confirm"),
  );
  eq("restatement is not silently removed", m.duplicatesRemoved.length, 0);
}

/* ------------- two counts for one repair: never summed, flagged, larger kept */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Replace outlets", kind: "outlet-switch-replace", quantity: 3 })], "p.1"),
    chunk([repair({ verbatim: "Replace outlets", kind: "outlet-switch-replace", quantity: 5 })], "p.7"),
  ]);
  eq("one row survives", m.result.repairs.length, 1);
  eq("quantities are NOT summed", m.result.repairs[0].quantity, 5);
  eq("conflict is reported", m.quantityConflicts.length, 1);
  check(
    "conflict lists both counts",
    m.quantityConflicts[0].quantities.includes(3) && m.quantityConflicts[0].quantities.includes(5),
  );
}

/* --------------- a count read by only one pass is adopted, not discarded */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Replace outlets", kind: "outlet-switch-replace" })], "p.1"),
    chunk([repair({ verbatim: "Replace outlets", kind: "outlet-switch-replace", quantity: 4 })], "p.7"),
  ]);
  eq("stated quantity wins over missing", m.result.repairs[0].quantity, 4);
  eq("no false conflict", m.quantityConflicts.length, 0);
}

/* -------------------- a review flag from ANY pass sticks to the merged row */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Repair subfloor", kind: "flooring-patch" })], "p.1"),
    chunk([repair({ verbatim: "Repair subfloor", kind: "flooring-patch", needsReview: "structural" })], "p.9"),
  ]);
  eq("review flag survives the merge", m.result.repairs[0].needsReview, "structural");
}

/* --------------------------- provenance is preserved, not lost, on merge */
{
  const m = mergeRe10Chunks([
    chunk([repair({ verbatim: "Replace water heater", kind: "water-heater-replace" })], "p.1"),
    chunk([repair({ verbatim: "Replace water heater", kind: "water-heater-replace", sourceRef: "Insp. p.14" })], "p.5"),
  ]);
  eq("sourceRef is adopted", m.result.repairs[0].sourceRef, "Insp. p.14");
}

/* ------------------------------ a long repair list is additive across pages */
{
  const pages = Array.from({ length: 10 }, (_, i) =>
    chunk(
      Array.from({ length: 6 }, (_, j) =>
        repair({ verbatim: `Repair item ${i}-${j}`, location: `room ${i}-${j}` }),
      ),
      `p.${i + 1}`,
    ),
  );
  const m = mergeRe10Chunks(pages);
  eq("60 distinct repairs across 10 pages all survive", m.result.repairs.length, 60);
  eq("no false duplicates", m.duplicatesRemoved.length, 0);
}

/* ------------------------------------ unmapped text dedupes on wording */
{
  const m = mergeRe10Chunks([
    { result: { repairs: [], unmapped: [{ verbatim: "See attached", reason: "no scope" }] }, pageIds: ["1"], pageLabels: ["p.1"] },
    { result: { repairs: [], unmapped: [{ verbatim: "See attached.", reason: "no scope" }] }, pageIds: ["2"], pageLabels: ["p.2"] },
  ]);
  eq("identical unmapped text dedupes", m.result.unmapped.length, 1);
}

/* --------------------------------------------------- empty input is safe */
{
  const m = mergeRe10Chunks([]);
  eq("empty: no repairs", m.result.repairs.length, 0);
  eq("empty: no duplicates", m.duplicatesRemoved.length, 0);
}

if (failed > 0) {
  console.error(`verify-re10-merge: ${failed}/${checks} FAILED`);
  process.exit(1);
}
console.log(`verify-re10-merge: OK (${checks} checks)`);

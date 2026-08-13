/**
 * Plan-set reconciliation regression suite.
 *
 * A chunked read produces many partial descriptions of one building, and the
 * dangerous outcomes are all silent: a contradiction resolved without anyone
 * being told, a detached shop dropped because only one sheet showed it, a
 * remodel priced as a ground-up house because eleven sheets looked new.
 * Everything here is about making those loud.
 *
 *   npx tsx scripts/verify-plan-merge.ts
 */
import { mergePlanChunks, type PlanChunkContribution } from "../shared/plans/mergeChunks";

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

function chunk(
  plan: PlanChunkContribution["plan"],
  label: string,
): PlanChunkContribution {
  return { plan, pageIds: [label], pageLabels: [label] };
}

/* --------------------------------------------- the ordinary happy path */
{
  const r = mergePlanChunks([
    chunk({ isNewConstruction: true, livableSqft: 3240, confidence: "high", notes: [] }, "p.1"),
    chunk({ garageBays: 3, confidence: "high", notes: [] }, "p.4"),
    chunk({ bedrooms: 4, fullBathrooms: 3, confidence: "high", notes: [] }, "p.6"),
  ]);
  eq("happy: livableSqft", r.plan.livableSqft, 3240);
  eq("happy: garageBays", r.plan.garageBays, 3);
  eq("happy: bedrooms", r.plan.bedrooms, 4);
  eq("happy: no conflicts", r.conflicts.length, 0);
  eq("happy: confidence high", r.plan.confidence, "high");
  check(
    "happy: provenance names the sheet",
    r.provenance.find((p) => p.field === "livableSqft")?.pageLabels[0] === "p.1",
  );
}

/* ------------------------- a real contradiction must surface, not vanish */
{
  const r = mergePlanChunks([
    chunk({ livableSqft: 3240, confidence: "high", notes: [] }, "p.1"),
    chunk({ livableSqft: 4100, confidence: "high", notes: [] }, "p.9"),
  ]);
  eq("conflict: one conflict recorded", r.conflicts.length, 1);
  eq("conflict: on livableSqft", r.conflicts[0].field, "livableSqft");
  eq("conflict: both readings kept", r.conflicts[0].readings.length, 2);
  check(
    "conflict: cites both sheets",
    r.conflicts[0].readings.some((x) => x.pageLabels.includes("p.1")) &&
      r.conflicts[0].readings.some((x) => x.pageLabels.includes("p.9")),
  );
  eq("conflict: first reading still populates the value", r.plan.livableSqft, 3240);
}

/* --------------- rounding between sheets is NOT a conflict (noise control) */
{
  const r = mergePlanChunks([
    chunk({ livableSqft: 3240, confidence: "high", notes: [] }, "p.1"),
    chunk({ livableSqft: 3238, confidence: "high", notes: [] }, "p.5"),
  ]);
  eq("rounding: no conflict raised", r.conflicts.length, 0);
}

/* ----------------- one remodel indicator outweighs many new-build sheets */
{
  const r = mergePlanChunks([
    chunk({ isNewConstruction: true, confidence: "high", notes: [] }, "p.1"),
    chunk({ isNewConstruction: true, confidence: "high", notes: [] }, "p.2"),
    chunk({ isNewConstruction: false, confidence: "high", notes: [] }, "p.7"),
  ]);
  eq("remodel wins over new-build majority", r.plan.isNewConstruction, false);
  check(
    "remodel disagreement is reported",
    r.conflicts.some((c) => c.field === "isNewConstruction"),
  );
}

/* --------------------- a structure on one sheet only must not be dropped */
{
  const r = mergePlanChunks([
    chunk({ confidence: "high", notes: [], accessoryStructures: [] }, "p.1"),
    chunk(
      { confidence: "high", notes: [], accessoryStructures: [{ label: "SHOP", sqft: 1200 }] },
      "p.2",
    ),
    chunk({ confidence: "high", notes: [], accessoryStructures: [] }, "p.3"),
  ]);
  eq("lone structure survives", r.plan.accessoryStructures?.length, 1);
  eq("lone structure label", r.plan.accessoryStructures?.[0].label, "SHOP");
}

/* ------------- two different buildings are kept; one building re-read is not */
{
  const r = mergePlanChunks([
    chunk(
      {
        confidence: "high",
        notes: [],
        accessoryStructures: [
          { label: "SHOP", sqft: 1200 },
          { label: "DETACHED GARAGE", sqft: 720 },
        ],
      },
      "p.2",
    ),
    chunk(
      { confidence: "high", notes: [], accessoryStructures: [{ label: "SHOP", sqft: 1200 }] },
      "p.3",
    ),
  ]);
  eq("distinct buildings both kept", r.plan.accessoryStructures?.length, 2);
}
{
  const r = mergePlanChunks([
    chunk(
      { confidence: "high", notes: [], accessoryStructures: [{ label: "SHOP", sqft: 1200 }] },
      "p.2",
    ),
    chunk(
      { confidence: "high", notes: [], accessoryStructures: [{ label: "SHOP", sqft: 2400 }] },
      "p.9",
    ),
  ]);
  eq("same building, two areas -> one structure", r.plan.accessoryStructures?.length, 1);
  check(
    "same building, two areas -> conflict raised",
    r.conflicts.some((c) => c.field.startsWith("accessoryStructures")),
  );
}

/* ------------------------------------ floorAreas must not be concatenated */
{
  const r = mergePlanChunks([
    chunk({ confidence: "high", notes: [], floorAreas: [1800, 1440] }, "p.4"),
    chunk({ confidence: "high", notes: [], floorAreas: [1800, 1440] }, "p.5"),
  ]);
  eq("repeated floorAreas stay two storeys", r.plan.floorAreas?.length, 2);
}

/* -------------------------------------- confidence takes the worst reading */
{
  const r = mergePlanChunks([
    chunk({ confidence: "high", notes: [] }, "p.1"),
    chunk({ confidence: "low", notes: [] }, "p.2"),
    chunk({ confidence: "high", notes: [] }, "p.3"),
  ]);
  eq("worst confidence wins", r.plan.confidence, "low");
}

/* ------------------------------------------- notes are pooled and deduped */
{
  const r = mergePlanChunks([
    chunk({ confidence: "high", notes: ["Sheet A3 illegible"] }, "p.1"),
    chunk({ confidence: "high", notes: ["Sheet A3 illegible", "No door schedule"] }, "p.2"),
  ]);
  eq("notes deduped", r.plan.notes.length, 2);
}

/* ---------------------------------------------------- empty input is safe */
{
  const r = mergePlanChunks([]);
  eq("empty: isNewConstruction defaults false", r.plan.isNewConstruction, false);
  eq("empty: confidence defaults low", r.plan.confidence, "low");
  eq("empty: no conflicts", r.conflicts.length, 0);
}

if (failed > 0) {
  console.error(`verify-plan-merge: ${failed}/${checks} FAILED`);
  process.exit(1);
}
console.log(`verify-plan-merge: OK (${checks} checks)`);

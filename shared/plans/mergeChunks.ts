/**
 * Reconciling one plan set read across many passes.
 *
 * A drawing set is ONE building described across many sheets, but a chunked
 * read produces many partial descriptions of it. Merging them is not a matter
 * of taking the last answer: the cover sheet states the areas, the site plan
 * shows a detached shop nobody else mentions, and an elevation may contradict
 * the cover sheet outright. All three of those are normal, and only the third
 * is a problem - but it is a problem that must never be resolved silently,
 * because whichever number wins scales the entire budget.
 *
 * SO THE RULES ARE:
 *  - Scalars: first stated value wins, and any DIFFERENT stated value is
 *    recorded as a conflict rather than overwriting or being discarded.
 *  - Collections: union, de-duplicated. A structure seen on one sheet is real
 *    even if fifteen other sheets never show it.
 *  - isNewConstruction: a single sheet indicating remodel outweighs any number
 *    of sheets that look new-build. Pricing a remodel as a ground-up house is
 *    the most expensive misread available, so the safe direction is asymmetric.
 *  - Confidence: the WORST across passes, never the average. One illegible
 *    cover sheet makes the whole reading uncertain regardless of how crisp the
 *    other eleven sheets were.
 *
 * Provenance is recorded for every scalar so the audit trail can answer "where
 * did 3,240 SF come from" with a sheet number instead of a shrug.
 */
import type { ExtractedPlan, ExtractedStructure, PlanConfidence } from "./extraction";

/** One pass's contribution, tagged with the pages it came from. */
export interface PlanChunkContribution {
  plan: Partial<ExtractedPlan>;
  pageIds: string[];
  /** Human-facing sheet labels, e.g. "permit-set.pdf p.3". */
  pageLabels: string[];
}

export interface PlanConflict {
  field: string;
  /** Each distinct value that was stated, with where it was stated. */
  readings: { value: string; pageLabels: string[] }[];
}

export interface ProvenanceEntry {
  field: string;
  value: string;
  pageLabels: string[];
}

export interface MergedPlanResult {
  plan: ExtractedPlan;
  conflicts: PlanConflict[];
  provenance: ProvenanceEntry[];
}

/** Scalars where two different stated values is a genuine contradiction. */
const SCALAR_FIELDS = [
  "description",
  "projectAddress",
  "livableSqft",
  "storiesAboveGrade",
  "mainCeilingHeightFt",
  "garageSqft",
  "garageBays",
  "coveredOutdoorSqft",
  "bedrooms",
  "fullBathrooms",
  "halfBathrooms",
  "basement",
] as const;

type ScalarField = (typeof SCALAR_FIELDS)[number];

const CONFIDENCE_ORDER: PlanConfidence[] = ["low", "medium", "high"];

function worstConfidence(values: PlanConfidence[]): PlanConfidence {
  if (values.length === 0) return "low";
  return values.reduce((worst, c) =>
    CONFIDENCE_ORDER.indexOf(c) < CONFIDENCE_ORDER.indexOf(worst) ? c : worst,
  );
}

function isStated(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

/**
 * Numbers close enough to be the same reading. Plan sets round: a cover sheet
 * saying 3,240 SF and a floor plan totalling 3,238 SF are the same house, and
 * treating that as a contradiction would bury real conflicts in noise. One
 * percent is tight enough that a genuine discrepancy (3,240 vs 4,100) still
 * lands, and loose enough to absorb rounding.
 */
function numbersAgree(a: number, b: number): boolean {
  if (a === b) return true;
  const larger = Math.max(Math.abs(a), Math.abs(b));
  if (larger === 0) return true;
  return Math.abs(a - b) / larger <= 0.01;
}

function valuesAgree(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return numbersAgree(a, b);
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return a === b;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}

/**
 * Structures are deduped on label + area together. Two "SHOP" entries with
 * different areas are two readings of one building (a conflict to surface, not
 * two shops), while a "SHOP" and a "DETACHED GARAGE" are genuinely two
 * buildings. Deduping on label alone would silently delete the second one.
 */
function mergeStructures(all: { s: ExtractedStructure; labels: string[] }[]): {
  structures: ExtractedStructure[];
  conflicts: PlanConflict[];
} {
  const byLabel = new Map<string, { s: ExtractedStructure; labels: string[] }[]>();
  for (const entry of all) {
    const key = entry.s.label.trim().toLowerCase();
    if (!key) continue;
    byLabel.set(key, [...(byLabel.get(key) ?? []), entry]);
  }

  const structures: ExtractedStructure[] = [];
  const conflicts: PlanConflict[] = [];

  for (const [key, entries] of byLabel) {
    const withArea = entries.filter((e) => isStated(e.s.sqft));
    const distinct: { s: ExtractedStructure; labels: string[] }[] = [];
    for (const e of withArea) {
      if (!distinct.some((d) => numbersAgree(d.s.sqft as number, e.s.sqft as number))) {
        distinct.push(e);
      }
    }

    if (distinct.length > 1) {
      conflicts.push({
        field: `accessoryStructures.${key}.sqft`,
        readings: distinct.map((d) => ({
          value: String(d.s.sqft),
          pageLabels: d.labels,
        })),
      });
    }

    structures.push(withArea[0]?.s ?? entries[0].s);
  }

  return { structures, conflicts };
}

export function mergePlanChunks(contributions: PlanChunkContribution[]): MergedPlanResult {
  const conflicts: PlanConflict[] = [];
  const provenance: ProvenanceEntry[] = [];
  const merged: Partial<ExtractedPlan> = {};

  /* ------------------------------------------------------------- scalars */
  for (const field of SCALAR_FIELDS) {
    const readings: { value: unknown; labels: string[] }[] = [];

    for (const c of contributions) {
      const v = (c.plan as Record<string, unknown>)[field];
      if (!isStated(v)) continue;
      const existing = readings.find((r) => valuesAgree(r.value, v));
      if (existing) existing.labels.push(...c.pageLabels);
      else readings.push({ value: v, labels: [...c.pageLabels] });
    }

    if (readings.length === 0) continue;

    // First stated reading wins the value; every distinct reading is reported.
    (merged as Record<string, unknown>)[field] = readings[0].value;
    provenance.push({
      field,
      value: String(readings[0].value),
      pageLabels: dedupeStrings(readings[0].labels),
    });

    if (readings.length > 1) {
      conflicts.push({
        field,
        readings: readings.map((r) => ({
          value: String(r.value),
          pageLabels: dedupeStrings(r.labels),
        })),
      });
    }
  }

  /* ------------------------------------------------- isNewConstruction */
  const newBuildReadings = contributions
    .filter((c) => typeof c.plan.isNewConstruction === "boolean")
    .map((c) => ({ value: c.plan.isNewConstruction as boolean, labels: c.pageLabels }));

  const anyRemodel = newBuildReadings.find((r) => r.value === false);
  merged.isNewConstruction = newBuildReadings.length === 0 ? false : !anyRemodel;

  if (newBuildReadings.length > 0) {
    provenance.push({
      field: "isNewConstruction",
      value: String(merged.isNewConstruction),
      pageLabels: dedupeStrings(
        (anyRemodel ? [anyRemodel] : newBuildReadings).flatMap((r) => r.labels),
      ),
    });
    const saysNew = newBuildReadings.some((r) => r.value === true);
    if (anyRemodel && saysNew) {
      conflicts.push({
        field: "isNewConstruction",
        readings: [
          {
            value: "remodel/addition",
            pageLabels: dedupeStrings(
              newBuildReadings.filter((r) => !r.value).flatMap((r) => r.labels),
            ),
          },
          {
            value: "new construction",
            pageLabels: dedupeStrings(
              newBuildReadings.filter((r) => r.value).flatMap((r) => r.labels),
            ),
          },
        ],
      });
    }
  }

  /* --------------------------------------------------------- collections */
  merged.rooms = dedupeStrings(contributions.flatMap((c) => c.plan.rooms ?? []));
  merged.specialFeatures = dedupeStrings(
    contributions.flatMap((c) => c.plan.specialFeatures ?? []),
  );

  /* floorAreas: take the longest stated list rather than concatenating -
     concatenation would turn two passes both reporting [1800, 1440] into a
     four-storey house. */
  const floorLists = contributions
    .map((c) => ({ list: c.plan.floorAreas ?? [], labels: c.pageLabels }))
    .filter((f) => f.list.length > 0);
  const longest = floorLists.sort((a, b) => b.list.length - a.list.length)[0];
  merged.floorAreas = longest?.list ?? [];
  if (longest) {
    provenance.push({
      field: "floorAreas",
      value: longest.list.join(", "),
      pageLabels: dedupeStrings(longest.labels),
    });
  }
  const distinctFloorLists = floorLists.filter(
    (f) =>
      f.list.length === (longest?.list.length ?? 0) &&
      !f.list.every((n, i) => numbersAgree(n, longest!.list[i])),
  );
  if (distinctFloorLists.length > 0) {
    conflicts.push({
      field: "floorAreas",
      readings: [
        { value: longest!.list.join(", "), pageLabels: dedupeStrings(longest!.labels) },
        ...distinctFloorLists.map((f) => ({
          value: f.list.join(", "),
          pageLabels: dedupeStrings(f.labels),
        })),
      ],
    });
  }

  const structureEntries = contributions.flatMap((c) =>
    (c.plan.accessoryStructures ?? []).map((s) => ({ s, labels: c.pageLabels })),
  );
  const structureMerge = mergeStructures(structureEntries);
  merged.accessoryStructures = structureMerge.structures;
  conflicts.push(...structureMerge.conflicts);

  /* -------------------------------------------------- notes & confidence */
  merged.notes = dedupeStrings(contributions.flatMap((c) => c.plan.notes ?? []));
  merged.confidence = worstConfidence(
    contributions
      .map((c) => c.plan.confidence)
      .filter((c): c is PlanConfidence => Boolean(c)),
  );

  return {
    plan: {
      isNewConstruction: merged.isNewConstruction ?? false,
      confidence: merged.confidence ?? "low",
      notes: merged.notes ?? [],
      ...merged,
    } as ExtractedPlan,
    conflicts,
    provenance,
  };
}

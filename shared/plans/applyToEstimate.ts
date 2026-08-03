/**
 * Turning what the drawings say into what the estimator holds.
 *
 * Kept separate from both the extractor and the calculator, and pure, so the
 * mapping rules can be read and tested without a model, a network, or a
 * browser. The calculator's job is to render state; this decides what that
 * state should become.
 *
 * TWO RULES GOVERN EVERYTHING HERE.
 *
 * A null from the extractor means "the drawings do not say", and it must never
 * overwrite something the visitor set by hand. Someone who typed 3,200 sq ft
 * and then uploaded a schematic set that states no areas should still be
 * looking at 3,200 when the spinner stops.
 *
 * Every change is reported. `applied` is what the UI shows back - "Size set to
 * 2,037 sq ft from your plans" - because a form that silently rewrites six of
 * its own answers while the visitor watches is alarming even when every new
 * value is right.
 */
import {
  ACCESSORY_STRUCTURE_LABELS,
  GARAGE_BAY_SQFT,
  defaultAccessoryStructure,
  type AccessoryStructure,
  type AccessoryStructureKind,
  type BasementType,
  type GarageBays,
} from "../estimateEngine";
import type { ExtractedPlan, ExtractedStructure } from "./extraction";

export interface PlanApplication {
  sqft?: number;
  stories?: number;
  garageBays?: GarageBays;
  coveredOutdoor?: number;
  basementType?: BasementType;
  bathroomCount?: number;
  accessoryStructures?: AccessoryStructure[];
  /** Plain-language list of what changed, for display. */
  applied: string[];
  /**
   * Scope the plans revealed that the estimator does not price on its own -
   * bedroom count, named rooms, fireplaces, ceiling height, decks. Shown back to
   * the homeowner so an uploaded set visibly registers in full, not just as a
   * square-foot number. This is what "we read your whole plan" looks like; it
   * does not move the range unless it also lands in `applied`.
   */
  understood: string[];
  /** Things the drawings did not settle, worth saying out loud. */
  unresolved: string[];
}

/**
 * Nearest garage size the estimator can express.
 *
 * The estimator asks in bays because that is how buyers talk, so a drawn area
 * has to land on one. Validated against real sets: a two-car garage measured
 * 488 SF and a three-car 736 SF, against the 480 and 720 in the table.
 */
function baysForArea(sqft: number): GarageBays {
  const entries = Object.entries(GARAGE_BAY_SQFT) as [GarageBays, number][];
  let best: GarageBays = "none";
  let bestGap = Infinity;
  for (const [bay, area] of entries) {
    const gap = Math.abs(area - sqft);
    if (gap < bestGap) {
      bestGap = gap;
      best = bay;
    }
  }
  return best;
}

/**
 * A stated car-bay count mapped onto the estimator's bay enum.
 *
 * Preferred over baysForArea when the plans label the bays, because a count is
 * exact where an area has to be bucketed. The estimator has no one-car option,
 * so a single bay rounds up to the smallest garage it can express rather than
 * disappearing.
 */
function baysForCount(n: number): GarageBays {
  if (n <= 0) return "none";
  if (n <= 2) return "two";
  if (n === 3) return "three";
  return "four";
}

/**
 * Map a drawn label onto a structure the estimator prices.
 *
 * Ordered longest-phrase-first, because "DETACHED GARAGE" and "RV GARAGE" both
 * contain "GARAGE" and a naive scan would call all three a plain garage.
 * Anything unrecognised becomes "other", which prices mid-scale and is resolved
 * at consultation, rather than being dropped silently.
 */
const LABEL_RULES: [RegExp, AccessoryStructureKind][] = [
  [/\b(rv|oversized|tall)\b.*\bgarage\b|\bgarage\b.*\brv\b/i, "rv-garage"],
  [/\bdetached\b.*\bgarage\b|\bgarage\b.*\bdetached\b/i, "detached-garage"],
  [/\bpool\s*house\b|\bcabana\b/i, "pool-house"],
  [/\bguest\s*(house|cottage|quarters)\b/i, "guest-house"],
  [/\b(adu|accessory dwelling|casita|mother[- ]?in[- ]?law)\b/i, "adu"],
  [/\bbarn\b|\bstable\b|\bloafing\b/i, "barn"],
  [/\bshop\b|\bworkshop\b|\bpole\s*building\b/i, "shop"],
  [/\bgarage\b/i, "detached-garage"],
];

export function kindForLabel(label: string): AccessoryStructureKind {
  for (const [rx, kind] of LABEL_RULES) {
    if (rx.test(label)) return kind;
  }
  return "other";
}

function structureFrom(drawn: ExtractedStructure): AccessoryStructure {
  const kind = kindForLabel(drawn.label);
  const base = defaultAccessoryStructure(kind);
  return {
    ...base,
    // A stated area wins; the default stands in when the drawings are silent.
    sqft: drawn.sqft && drawn.sqft > 0 ? Math.round(drawn.sqft) : base.sqft,
    attached:
      drawn.attached != null && ACCESSORY_STRUCTURE_LABELS[kind].canAttach
        ? drawn.attached
        : base.attached,
  };
}

/**
 * Build the estimator changes a plan set implies.
 *
 * `bounds` clamps square footage to what the chosen project can express, so a
 * 9,000 SF estate set cannot push the slider past its own maximum and leave the
 * readout disagreeing with the price.
 */
export function applyPlanToEstimate(
  plan: ExtractedPlan,
  bounds: { min: number; max: number },
): PlanApplication {
  const out: PlanApplication = { applied: [], understood: [], unresolved: [] };

  /*
   * A remodel set changes nothing, checked here as well as at the call site.
   *
   * The calculator already stops before reaching this function, so this is
   * belt and braces - but it is the one guard worth duplicating. Applying a
   * remodel's areas to a new-home estimator prices a whole house where the
   * client asked for an addition, and two of the four real plan sets this was
   * built against were remodels. A second caller forgetting the check is a
   * mistake nobody would catch by reading a number that looks plausible.
   */
  if (!plan.isNewConstruction) {
    out.unresolved.push(
      "These drawings read as a remodel or addition rather than a new home, so nothing was changed.",
    );
    for (const note of plan.notes ?? []) out.unresolved.push(note);
    return out;
  }

  // Prefer the stated total; fall back to summing stated floors. The extractor
  // is told never to sum on our behalf, precisely so that this stays a decision
  // made here in readable code rather than inside a model's answer.
  let livable = plan.livableSqft ?? null;
  if (livable == null && plan.floorAreas?.length) {
    livable = plan.floorAreas.reduce((s, a) => s + a, 0);
  }

  if (livable != null && livable > 0) {
    const clamped = Math.min(bounds.max, Math.max(bounds.min, Math.round(livable)));
    out.sqft = clamped;
    out.applied.push(
      clamped === Math.round(livable)
        ? `Size set to ${clamped.toLocaleString("en-US")} sq ft`
        : `Size set to ${clamped.toLocaleString("en-US")} sq ft (your plans show ${Math.round(livable).toLocaleString("en-US")}, outside this estimator's range)`,
    );
  } else {
    out.unresolved.push("Living area is not stated on the drawings, so we kept the size you set.");
  }

  if (plan.storiesAboveGrade != null && plan.storiesAboveGrade > 0) {
    out.stories = Math.round(plan.storiesAboveGrade);
    out.applied.push(out.stories > 1 ? `${out.stories} storeys` : "Single storey");
  }

  // A stated bay count wins over an area: "3-CAR GARAGE" is exact, an area is
  // bucketed and a deep or tall bay throws the bucket off.
  if (plan.garageBays != null && plan.garageBays > 0) {
    out.garageBays = baysForCount(plan.garageBays);
    out.applied.push(
      `${plan.garageBays}-car garage${
        plan.garageSqft ? ` (${Math.round(plan.garageSqft).toLocaleString("en-US")} sq ft)` : ""
      }`,
    );
  } else if (plan.garageSqft != null && plan.garageSqft > 0) {
    out.garageBays = baysForArea(plan.garageSqft);
    out.applied.push(
      `Garage read as ${out.garageBays === "none" ? "none" : out.garageBays} (${Math.round(plan.garageSqft).toLocaleString("en-US")} sq ft drawn)`,
    );
  }

  // 0 is a real answer here and must be honoured: a cover sheet stating
  // COVERED EXT. SPACE 0 SF is a fact, and treating it as "not stated" would
  // leave a covered patio in the estimate that the drawings rule out.
  if (plan.coveredOutdoorSqft != null && plan.coveredOutdoorSqft >= 0) {
    out.coveredOutdoor = Math.round(plan.coveredOutdoorSqft);
    out.applied.push(
      out.coveredOutdoor > 0
        ? `Covered outdoor space ${out.coveredOutdoor.toLocaleString("en-US")} sq ft`
        : "No covered outdoor space",
    );
  }

  if (plan.basement) {
    out.basementType = plan.basement;
    out.applied.push(
      plan.basement === "none"
        ? "No basement"
        : plan.basement === "finished"
          ? "Finished basement"
          : "Unfinished basement",
    );
  }

  // Half baths count as half, rounded up: the estimator asks for a single
  // number, and a powder room is real plumbing that should not round to zero.
  if (plan.fullBathrooms != null || plan.halfBathrooms != null) {
    const full = plan.fullBathrooms ?? 0;
    const half = plan.halfBathrooms ?? 0;
    const count = Math.max(1, Math.round(full + half * 0.5));
    out.bathroomCount = count;
    out.applied.push(
      half > 0 ? `${full} full and ${half} half bathrooms` : `${full} bathrooms`,
    );
  }

  if (plan.accessoryStructures?.length) {
    const mapped = plan.accessoryStructures.map(structureFrom);
    // Two sheds drawn separately are two structures, but the same building
    // named twice across sheets is not, so collapse on kind and keep the larger.
    const byKind = new Map<AccessoryStructureKind, AccessoryStructure>();
    for (const s of mapped) {
      const existing = byKind.get(s.kind);
      if (!existing || s.sqft > existing.sqft) byKind.set(s.kind, s);
    }
    out.accessoryStructures = [...byKind.values()];
    out.applied.push(
      `Structures found: ${out.accessoryStructures
        .map((s) => `${ACCESSORY_STRUCTURE_LABELS[s.kind].label} (${s.sqft.toLocaleString("en-US")} sq ft)`)
        .join(", ")}`,
    );
  }

  /*
   * The rest of the scope: read and shown back, but not priced on its own.
   *
   * Bedroom count, named rooms, fireplaces, decks and ceiling height do not each
   * have an estimator input - the range scales on area, finish and the big
   * structural choices above. Listing them anyway is the point of the upload:
   * the homeowner sees their actual plan reflected back in full, which is what
   * makes "we read your plans" true rather than "we read your square footage".
   */
  if (plan.bedrooms != null && plan.bedrooms > 0) {
    out.understood.push(`${plan.bedrooms} bedroom${plan.bedrooms === 1 ? "" : "s"}`);
  }
  if (plan.mainCeilingHeightFt != null && plan.mainCeilingHeightFt > 0) {
    out.understood.push(`${plan.mainCeilingHeightFt} ft main-floor ceilings`);
  }
  for (const room of plan.rooms ?? []) {
    const r = room.trim();
    if (r) out.understood.push(r);
  }
  for (const feature of plan.specialFeatures ?? []) {
    const f = feature.trim();
    if (f) out.understood.push(f);
  }

  for (const note of plan.notes ?? []) out.unresolved.push(note);

  return out;
}

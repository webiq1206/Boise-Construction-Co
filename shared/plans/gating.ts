/**
 * Deciding whether a document-derived estimate may be treated as final.
 *
 * SCOPE, AND WHY IT IS NARROW. This gates estimates DERIVED FROM UPLOADED
 * DOCUMENTS. The ordinary estimator - where a visitor answers questions
 * directly - is untouched and must stay untouched: there is no extraction to be
 * unsure about when someone tells you their house is 2,400 square feet, and
 * bolting a confidence gate onto that path would block the common case to guard
 * against a failure that cannot happen there.
 *
 * THE ASYMMETRY THIS ENCODES. Being wrong in the two directions costs very
 * different amounts. An estimate held back for a question costs a follow-up
 * email. An estimate released on half a plan set costs either a bid we cannot
 * honour or a client discovering mid-build that the shop on sheet 12 was never
 * priced. So anything that leaves SCOPE UNKNOWN blocks, and anything that is
 * merely untidy warns.
 *
 * WHAT COUNTS AS UNKNOWN SCOPE:
 *  - a page nobody reported on (we do not know what is drawn on it)
 *  - a contradiction on a figure the whole budget scales from
 *  - no area at all on a ground-up build (there is nothing to scale)
 *  - the reader itself saying it was unsure
 *
 * Every blocker carries a QUESTION, because "we cannot price this yet" without
 * "here is what would let us" is just a dead end.
 */
import type { ExtractedPlan } from "./extraction";
import type { PlanConflict } from "./mergeChunks";

export interface CoverageSummary {
  totalPages: number;
  processed: number;
  unreadable: number;
  missing: number;
  complete: boolean;
  skippedFiles?: { filename: string; reason: string }[];
}

export type GateSeverity = "block" | "warn";

export interface EstimateBlocker {
  code: string;
  severity: GateSeverity;
  /** Plain sentence a homeowner or an estimator can both read. */
  message: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  /** Why we are asking, so it does not read as bureaucracy. */
  why: string;
}

export interface GateDecision {
  /** False when any blocker is severity "block". */
  canFinalize: boolean;
  blockers: EstimateBlocker[];
  questions: FollowUpQuestion[];
}

/**
 * Fields the quoted range actually scales on.
 *
 * Derived from what resolveQuotedRange consumes, not from what looks important:
 * area drives everything, and storeys, garage, basement and covered outdoor
 * each move the takeoff materially. A disagreement on bedroom count is worth
 * mentioning and does not move the price, so it warns rather than blocks.
 */
const PRICE_SCALING_FIELDS = new Set([
  "livableSqft",
  "floorAreas",
  "storiesAboveGrade",
  "garageSqft",
  "garageBays",
  "coveredOutdoorSqft",
  "basement",
  "isNewConstruction",
]);

function isScalingField(field: string): boolean {
  if (PRICE_SCALING_FIELDS.has(field)) return true;
  // Structure areas are scaling too: a 2,400 SF shop is six figures.
  return field.startsWith("accessoryStructures");
}

export function gatePlanEstimate(input: {
  plan: ExtractedPlan;
  coverage: CoverageSummary;
  conflicts: PlanConflict[];
}): GateDecision {
  const { plan, coverage, conflicts } = input;
  const blockers: EstimateBlocker[] = [];
  const questions: FollowUpQuestion[] = [];

  /* ------------------------------------------------ pages nobody reported on */
  if (coverage.missing > 0) {
    blockers.push({
      code: "coverage-missing",
      severity: "block",
      message: `${coverage.missing} of ${coverage.totalPages} sheets could not be reviewed, so any scope drawn on them is not in this estimate.`,
    });
    questions.push({
      id: "resend-missing",
      question: `Can you resend the ${coverage.missing} sheet(s) we could not open, or confirm they are detail sheets with no additional scope?`,
      why: "A sheet we have not read could carry a shop, a basement, or a covered patio that would change the number materially.",
    });
  }

  /* -------------------------------------------- pages seen but not readable */
  if (coverage.unreadable > 0) {
    blockers.push({
      code: "coverage-unreadable",
      severity: "block",
      message: `${coverage.unreadable} sheet(s) were too degraded to read.`,
    });
    questions.push({
      id: "rescan-unreadable",
      question: "Could you send a clearer scan or a photo of the sheets listed as unreadable?",
      why: "We would rather ask than guess at what those sheets show.",
    });
  }

  /* ------------------------------------------------------ the reader's own doubt */
  if (plan.confidence === "low") {
    blockers.push({
      code: "low-confidence",
      severity: "block",
      message: "The drawings were hard to read with confidence, so these figures need confirming before they are priced.",
    });
    questions.push({
      id: "confirm-key-figures",
      question: "Can you confirm the conditioned square footage, storey count, and garage size?",
      why: "Those four numbers drive most of the budget, and we read them with low confidence.",
    });
  }

  /* --------------------------------------------------- contradictions between sheets */
  const scalingConflicts = conflicts.filter((c) => isScalingField(c.field));
  const minorConflicts = conflicts.filter((c) => !isScalingField(c.field));

  for (const c of scalingConflicts) {
    const readings = c.readings.map((r) => r.value).join(" and ");
    blockers.push({
      code: `conflict:${c.field}`,
      severity: "block",
      message: `Sheets disagree on ${humanField(c.field)}: ${readings}.`,
    });
    questions.push({
      id: `resolve:${c.field}`,
      question: `Which is current for ${humanField(c.field)} - ${readings}?`,
      why: "This figure scales the whole budget, so we will not pick one for you.",
    });
  }

  for (const c of minorConflicts) {
    blockers.push({
      code: `conflict:${c.field}`,
      severity: "warn",
      message: `Sheets disagree on ${humanField(c.field)}: ${c.readings.map((r) => r.value).join(" and ")}. It does not change the range.`,
    });
  }

  /* ------------------------------------- nothing to scale a ground-up build from */
  const hasArea =
    typeof plan.livableSqft === "number" ||
    (Array.isArray(plan.floorAreas) && plan.floorAreas.length > 0);

  if (plan.isNewConstruction && !hasArea) {
    blockers.push({
      code: "no-area",
      severity: "block",
      message: "The drawings never state a conditioned area, which is the figure everything else scales from.",
    });
    questions.push({
      id: "state-area",
      question: "What is the conditioned (heated) square footage, excluding garage and covered patio?",
      why: "Every other number in the budget is derived from it, so we will not infer one.",
    });
  }

  /* ------------------------------------------------ notable unknowns worth asking */
  if (hasArea && plan.basement === null) {
    questions.push({
      id: "basement",
      question: "Is there a basement, and if so is it finished living space or shell only?",
      why: "A finished basement and an unfinished one price very differently, and the set does not say.",
    });
  }

  if (coverage.skippedFiles && coverage.skippedFiles.length > 0) {
    blockers.push({
      code: "unreadable-format",
      severity: "warn",
      message: `${coverage.skippedFiles.length} file(s) were stored for the team but could not be read automatically.`,
    });
  }

  return {
    canFinalize: !blockers.some((b) => b.severity === "block"),
    blockers,
    questions,
  };
}

/** Field names as a person would say them. */
function humanField(field: string): string {
  if (field.startsWith("accessoryStructures.")) {
    const label = field.split(".")[1] ?? "an outbuilding";
    return `the size of the ${label}`;
  }
  const map: Record<string, string> = {
    livableSqft: "conditioned square footage",
    floorAreas: "the per-floor areas",
    storiesAboveGrade: "the number of storeys",
    garageSqft: "garage size",
    garageBays: "the number of garage bays",
    coveredOutdoorSqft: "covered outdoor area",
    basement: "the basement",
    isNewConstruction: "whether this is a new build or a remodel",
    bedrooms: "the bedroom count",
    fullBathrooms: "the bathroom count",
    halfBathrooms: "the half-bath count",
    description: "the project description",
    projectAddress: "the project address",
    mainCeilingHeightFt: "the main ceiling height",
  };
  return map[field] ?? field;
}

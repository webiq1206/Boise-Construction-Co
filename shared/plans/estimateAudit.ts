/**
 * What went into a number, and whether the number looks wrong.
 *
 * DELIBERATELY A LAYER, NOT A REWRITE. The line-item engine is covered by tens
 * of thousands of checks and a golden suite pinned to exact dollars; changing
 * how it prices to satisfy a reporting requirement would trade proven maths for
 * a nicer-looking output. So nothing here computes a price. This reads the
 * inputs and the answer the engine already produced and says three things the
 * raw range cannot:
 *
 *  1. WHERE EACH INPUT CAME FROM. A figure read off sheet 3 and a figure the
 *     estimator assumed because nothing stated it are both "3,240" in the
 *     engine and are worlds apart to anyone deciding whether to trust the
 *     total.
 *  2. WHAT IS NOT IN THE NUMBER. A fireplace the drawings show but the range
 *     does not price is not an omission if it is stated; it is an omission if
 *     it is silent.
 *  3. WHETHER THE ANSWER IS PLAUSIBLE. Every rate here is anchored to figures
 *     the site already publishes, not to thresholds invented for this file, so
 *     a flag means "this disagrees with what we tell the public" rather than
 *     "this disagrees with a number someone once typed here".
 *
 * ON NOT BEING GENERIC. Every line this produces has to be grounded in
 * something actually read or actually answered. A boilerplate exclusions list
 * bolted onto every estimate is worse than none: it trains people to skip it,
 * and eventually it contradicts the drawings. So a scope line exists only when
 * there is a fact behind it.
 */
import type { ExtractedPlan } from "./extraction";
import type { ProvenanceEntry } from "./mergeChunks";
import type { GateDecision } from "./gating";

export type ScopeStatus =
  /** Stated in the documents or answered by the visitor. */
  | "confirmed"
  /** Not stated anywhere; the estimator applied a default. */
  | "assumed"
  /** Carried as a budget allowance rather than a measured quantity. */
  | "allowance"
  /** Known, but cannot be priced until someone answers a question. */
  | "unresolved"
  /** Real scope the range deliberately does not cover. */
  | "excluded";

export interface ScopeLine {
  label: string;
  value: string;
  status: ScopeStatus;
  /** "permit-set.pdf p.1", "you told us", "estimator default". */
  source: string;
  note?: string;
}

export interface PricingFlag {
  code: string;
  /** "review" stops it reaching a customer; "warn" is for the file. */
  severity: "review" | "warn";
  message: string;
}

export interface EstimateAudit {
  scope: ScopeLine[];
  flags: PricingFlag[];
  perSqftLow: number | null;
  perSqftHigh: number | null;
  /** True when nothing needs a human before this can be shown. */
  safeToPresent: boolean;
}

/**
 * Per-square-foot bands the site publishes, quoted from shared/seoContent.ts.
 *
 * SINGLE SOURCE OF TRUTH IS THE PUBLIC COPY, not this table. If a rate here
 * disagrees with what the service pages say, the service pages are right and
 * this is stale - which is exactly the drift these flags exist to catch. The
 * hard floor and ceiling mirror the plausibility guards already asserted in
 * scripts/verify-new-construction.ts ($180 and $900), so a flag here and a
 * build failure there mean the same thing.
 */
export const PUBLISHED_PER_SF: Record<string, { low: number; high: number }> = {
  // "most Treasure Valley custom homes plan between $250 and $400 per finished
  // square foot", with "$525,000 ... near $225 per square foot" as the floor.
  "custom-home": { low: 225, high: 400 },
  // "semi-custom homes generally plan between $225 and $300"
  "semi-custom-home": { low: 225, high: 300 },
  // "vertical construction plans between $225 and $400"; site work separate.
  "build-on-your-lot": { low: 225, high: 400 },
  // Blended living + shop square footage runs well below a finished-only rate.
  "shop-home": { low: 140, high: 250 },
};

/** Mirrors the plausibility guards in verify-new-construction.ts. */
const ABSOLUTE_FLOOR_PER_SF = 180;
const ABSOLUTE_CEILING_PER_SF = 900;

/**
 * Widest low-to-high spread that still reads as an estimate. Past this the
 * range stops informing a decision - "somewhere between 400k and 1.4m" is not
 * a planning number, it is an admission that we should have asked more
 * questions first.
 */
const MAX_BAND_RATIO = 2.5;

export interface EstimateAuditInput {
  project: string;
  finish: string;
  sqft: number;
  priceLow: number;
  priceHigh: number;
  /** Where each extracted figure came from. Empty for a manual estimate. */
  provenance: ProvenanceEntry[];
  plan?: ExtractedPlan | null;
  gate?: GateDecision | null;
  /** Inputs the visitor answered directly rather than the documents settling. */
  manualFields?: string[];
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Provenance lookup: which sheet stated this field, if any. */
function sourceFor(provenance: ProvenanceEntry[], field: string): string | null {
  const entry = provenance.find((p) => p.field === field);
  if (!entry || entry.pageLabels.length === 0) return null;
  return entry.pageLabels.join(", ");
}

export function buildEstimateAudit(input: EstimateAuditInput): EstimateAudit {
  const {
    project,
    sqft,
    priceLow,
    priceHigh,
    provenance,
    plan,
    gate,
    manualFields = [],
  } = input;

  const scope: ScopeLine[] = [];
  const flags: PricingFlag[] = [];

  /* ------------------------------------------------------ what drove the price */
  const areaSource = sourceFor(provenance, "livableSqft") ?? sourceFor(provenance, "floorAreas");
  scope.push({
    label: "Conditioned area",
    value: `${sqft.toLocaleString()} sq ft`,
    status: "confirmed",
    source: areaSource ?? (manualFields.includes("sqft") ? "you told us" : "estimator default"),
  });

  /* Each scaling input gets a line ONLY when there is something to say about
     it. A silent default and a stated figure look identical in the engine, so
     the distinction is drawn here or nowhere. */
  const scalingFields: { field: string; label: string; value: unknown }[] = [
    { field: "storiesAboveGrade", label: "Storeys", value: plan?.storiesAboveGrade },
    { field: "garageBays", label: "Garage", value: plan?.garageBays },
    { field: "garageSqft", label: "Garage area", value: plan?.garageSqft },
    { field: "basement", label: "Basement", value: plan?.basement },
    { field: "coveredOutdoorSqft", label: "Covered outdoor", value: plan?.coveredOutdoorSqft },
  ];

  for (const f of scalingFields) {
    const src = sourceFor(provenance, f.field);
    if (f.value !== null && f.value !== undefined && f.value !== "") {
      scope.push({
        label: f.label,
        value: String(f.value),
        status: "confirmed",
        source: src ?? (manualFields.includes(f.field) ? "you told us" : "estimator default"),
      });
    } else if (plan) {
      /* Only claimed as an assumption when documents were actually read. On a
         manual estimate there is nothing to have been silent about. */
      scope.push({
        label: f.label,
        value: "not stated",
        status: "assumed",
        source: "estimator default",
        note: "The drawings did not settle this, so the estimator's default applies.",
      });
    }
  }

  /* ------------------------------- scope seen in the drawings but not priced */
  for (const feature of plan?.specialFeatures ?? []) {
    scope.push({
      label: feature,
      value: "seen in the drawings",
      status: "excluded",
      source: "your plans",
      note: "Not priced in this range. It is carried into the line-item budget after a consultation.",
    });
  }

  /* An outbuilding with no stated area is real scope carrying no number - the
     most expensive kind of silence, since a shop is routinely six figures. */
  for (const s of plan?.accessoryStructures ?? []) {
    if (s.sqft === null || s.sqft === undefined) {
      scope.push({
        label: s.label,
        value: "size not stated",
        status: "unresolved",
        source: "your plans",
        note: "Drawn on the site plan without a size, so it is not in this range.",
      });
      flags.push({
        code: "structure-without-area",
        severity: "review",
        message: `"${s.label}" is drawn but has no stated size, so it is not priced. An outbuilding is routinely six figures.`,
      });
    }
  }

  /* ------------------------------------------------- anything the gate blocked */
  for (const b of gate?.blockers ?? []) {
    if (b.severity !== "block") continue;
    scope.push({
      label: "Needs confirmation",
      value: b.message,
      status: "unresolved",
      source: "document review",
    });
  }

  /* ------------------------------------------------------- plausibility checks */
  const perSqftLow = sqft > 0 ? priceLow / sqft : null;
  const perSqftHigh = sqft > 0 ? priceHigh / sqft : null;

  /* A calculation error, not a pricing opinion. If this ever fires the engine
     produced an inverted or degenerate band and nothing downstream should
     render it. */
  if (priceLow >= priceHigh) {
    flags.push({
      code: "inverted-band",
      severity: "review",
      message: `The range is not ordered: low ${fmtUsd(priceLow)} is not below high ${fmtUsd(priceHigh)}.`,
    });
  }

  if (priceLow <= 0 || priceHigh <= 0) {
    flags.push({
      code: "non-positive-price",
      severity: "review",
      message: "The engine returned a zero or negative figure.",
    });
  }

  if (priceLow > 0 && priceHigh / priceLow > MAX_BAND_RATIO) {
    flags.push({
      code: "band-too-wide",
      severity: "review",
      message: `The spread is ${(priceHigh / priceLow).toFixed(1)}x (${fmtUsd(priceLow)} to ${fmtUsd(priceHigh)}), wide enough that it does not help anyone plan. More detail is needed before quoting.`,
    });
  }

  const band = PUBLISHED_PER_SF[project];
  if (perSqftLow !== null && perSqftHigh !== null) {
    if (perSqftLow < ABSOLUTE_FLOOR_PER_SF) {
      flags.push({
        code: "below-plausible-rate",
        severity: "review",
        message: `${fmtUsd(perSqftLow)}/sq ft is below anything this market builds for. Underpricing here is worse than losing the lead.`,
      });
    }
    if (perSqftHigh > ABSOLUTE_CEILING_PER_SF) {
      flags.push({
        code: "above-plausible-rate",
        severity: "review",
        message: `${fmtUsd(perSqftHigh)}/sq ft is above anything this market builds for, which usually means a quantity is wrong.`,
      });
    }
    if (band && perSqftLow < band.low * 0.9) {
      flags.push({
        code: "below-published-band",
        severity: "warn",
        message: `${fmtUsd(perSqftLow)}/sq ft sits under the ${fmtUsd(band.low)}-${fmtUsd(band.high)} band the site publishes for this project type.`,
      });
    }
    if (band && perSqftHigh > band.high * 1.25) {
      flags.push({
        code: "above-published-band",
        severity: "warn",
        message: `${fmtUsd(perSqftHigh)}/sq ft runs above the published ${fmtUsd(band.low)}-${fmtUsd(band.high)} band. Legitimate on a steep lot or a highly detailed interior; worth a look otherwise.`,
      });
    }
  }

  /*
   * NO TOTAL-DOLLAR FLOOR CHECK, DELIBERATELY.
   *
   * The obvious check - "flag anything under the published planning-from
   * figure" - is wrong, and the golden scenarios proved it: a 1,400 SF custom
   * home prices at $410k against a published $525k "starting at". That is not
   * an underpriced estimate. The $525k figure is anchored to "the simplest
   * single-level designs ... near $225 per square foot", which implies roughly
   * 2,300 SF; a smaller house costing less is arithmetic, not a fault.
   *
   * A flat dollar floor cannot be applied to a product whose size varies by a
   * factor of four. The apples-to-apples comparison is RATE against published
   * RATE, which the per-square-foot checks above already make - and they catch
   * genuine underpricing at any size, which is the actual risk.
   */

  /* -------------------------------------- scope known to be missing from the read */
  if (gate && !gate.canFinalize) {
    flags.push({
      code: "incomplete-documents",
      severity: "review",
      message: "The documents were not fully readable, so this range may not cover everything drawn.",
    });
  }

  return {
    scope,
    flags,
    perSqftLow,
    perSqftHigh,
    safeToPresent: !flags.some((f) => f.severity === "review"),
  };
}

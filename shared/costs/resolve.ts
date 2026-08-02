/**
 * THE SINGLE SOURCE OF THE QUOTED RANGE.
 *
 * The calculator computes a range in the browser and both API routes recompute
 * it on the server and use the server's answer. If those two ever disagree the
 * homeowner sees one number on the page and a different one in their email, so
 * every caller goes through this one function rather than mapping selections to
 * scope on its own.
 *
 * DELIBERATELY NOT IN index.ts. The barrel re-exports every module in this
 * folder, and importing the resolver through it made the client bundle evaluate
 * modules in an order where RULES_BY_PROJECT was still undefined when the
 * calculator first rendered. The resolver then returned null, the calculator
 * fell back to the guide engine, and the site quietly kept quoting the old
 * numbers while every server-side test passed. Importing from the concrete
 * modules below removes the cycle entirely. Do not move this into the barrel.
 */
import { buildInternalEstimate, type QualityLevel, type ScopeSelections } from "./engine";
import { buildPlanningRange } from "./pricing";
import { buildAdminView } from "./outputs";
import { RULES_BY_PROJECT } from "./scopeRules";
import { GARAGE_BAY_SQFT, type GarageBays, type ProjectType } from "../estimateEngine";

/** The refinement shape both the calculator and the API routes hold. */
export interface ResolverRefinements {
  layoutChanges?: unknown;
  plumbingElectrical?: unknown;
  cabinetTier?: unknown;
  fixtureCount?: number | null;
  bathroomCount?: number | null;
  kitchenIncluded?: boolean | null;
  upgradeScope?: string[] | null;
  /* New construction. */
  stories?: number | null;
  garageBays?: unknown;
  basementType?: unknown;
  lotServices?: unknown;
  siteDifficulty?: unknown;
  coveredOutdoor?: number | null;
  shopSize?: number | null;
}

function toSelections(
  finish: string,
  sqft: number,
  refinements: ResolverRefinements,
): ScopeSelections {
  const basementType = refinements.basementType as "none" | "unfinished" | "finished" | null;
  /*
   * A FINISHED basement is living space, so its area belongs in finished area and
   * is priced at the full interior specification. An UNFINISHED basement is shell
   * only: concrete, framing and a rough-in, at a fraction of the cost. Folding
   * the two together would either charge shell rates for living space or living
   * rates for a bare shell.
   */
  const basementSqft =
    basementType === "unfinished" || basementType === "finished"
      ? // A basement follows the ground-floor footprint.
        sqft / Math.max(1, Math.round(refinements.stories ?? 1))
      : 0;

  return {
    quality: finish as QualityLevel,
    sqft: basementType === "finished" ? sqft + basementSqft : sqft,
    layoutChanges: (refinements.layoutChanges ?? null) as ScopeSelections["layoutChanges"],
    plumbingElectrical: (refinements.plumbingElectrical ?? null) as ScopeSelections["plumbingElectrical"],
    cabinetTier: (refinements.cabinetTier ?? null) as ScopeSelections["cabinetTier"],
    fixtureCount: refinements.fixtureCount ?? null,
    bathroomCount: refinements.bathroomCount ?? null,
    kitchenIncluded: refinements.kitchenIncluded ?? null,
    upgradeScope: refinements.upgradeScope ?? null,
    // The company does not sell or install appliances; see APPLIANCE_DISCLAIMER.

    stories: refinements.stories ?? null,
    garageSqft:
      refinements.garageBays == null
        ? null
        : (GARAGE_BAY_SQFT[refinements.garageBays as GarageBays] ?? null),
    // Only an unfinished basement is carried as basement shell area; a finished
    // one has already been added to finished area above.
    basementSqft: basementType === "unfinished" ? basementSqft : 0,
    // "unsure" is treated as city services rather than assuming the expensive
    // case: quoting a well and septic to someone who does not need one loses the
    // lead, and the consultation resolves it before anything is committed.
    wellSeptic: refinements.lotServices === "well-septic",
    siteDifficulty: (refinements.siteDifficulty ?? null) as ScopeSelections["siteDifficulty"],
    coveredOutdoorSqft: refinements.coveredOutdoor ?? null,
    shopSqft: refinements.shopSize ?? null,
  };
}

/**
 * The customer-facing range.
 *
 * Returns null for a project with no rule set, letting the caller fall back to
 * the guide engine rather than throwing at a lead.
 */
export function resolveQuotedRange(
  project: ProjectType,
  finish: string,
  sqft: number,
  refinements: ResolverRefinements,
  detailRatio = 0,
): { priceLow: number; priceHigh: number } | null {
  const rules = RULES_BY_PROJECT[project];
  if (!rules) return null;
  const selections = toSelections(finish, sqft, refinements);
  const internal = buildInternalEstimate(rules, selections, project);
  const range = buildPlanningRange(internal, project, selections.quality, sqft, detailRatio);
  return { priceLow: range.low, priceHigh: range.high };
}

/** The internal estimate and trade rollup behind a quoted number, for admin surfaces. */
export function resolveInternalEstimate(
  project: ProjectType,
  finish: string,
  sqft: number,
  refinements: ResolverRefinements,
  detailRatio = 0,
) {
  const rules = RULES_BY_PROJECT[project];
  if (!rules) return null;
  const selections = toSelections(finish, sqft, refinements);
  const internal = buildInternalEstimate(rules, selections, project);
  const range = buildPlanningRange(internal, project, selections.quality, sqft, detailRatio);
  return { internal, range, admin: buildAdminView(internal, range) };
}

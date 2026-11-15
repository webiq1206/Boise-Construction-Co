/** Public calculator controls and customer output only. No cost rates or finance policy. */
export const PLANNING_PROJECTS = {
  "custom-home": {min: 1200, max: 7000, step: 100, baselineSqft: 2400},
  "semi-custom-home": {min: 1200, max: 4500, step: 100, baselineSqft: 2200},
  "build-on-your-lot": {min: 1200, max: 6000, step: 100, baselineSqft: 2400},
  "shop-home": {min: 800, max: 3500, step: 100, baselineSqft: 1700},
} as const;

export type PlanningProject = keyof typeof PLANNING_PROJECTS;
export interface PlanningRangeInput {project: PlanningProject; sqft: number}
export interface PublicPlanningRange {priceLow: number; priceHigh: number}

export function planningRangeInput(value: unknown): PlanningRangeInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 2 || !Object.hasOwn(input, "project") || !Object.hasOwn(input, "sqft")) return null;
  if (typeof input.project !== "string" || !Object.hasOwn(PLANNING_PROJECTS, input.project)) return null;
  const project = input.project as PlanningProject;
  const size = PLANNING_PROJECTS[project];
  if (typeof input.sqft !== "number" || !Number.isInteger(input.sqft) || input.sqft < size.min || input.sqft > size.max) return null;
  return {project, sqft: input.sqft};
}

export function publicPlanningRange(value: unknown): PublicPlanningRange | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== 2 || !Object.hasOwn(result, "priceLow") || !Object.hasOwn(result, "priceHigh")) return null;
  if (typeof result.priceLow !== "number" || typeof result.priceHigh !== "number" ||
      !Number.isFinite(result.priceLow) || !Number.isFinite(result.priceHigh) || result.priceLow < 0 || result.priceHigh < result.priceLow) return null;
  return {priceLow: result.priceLow, priceHigh: result.priceHigh};
}

export type ProjectType = "kitchen" | "bathroom" | "whole-home" | "addition" | "adu" | "basement";
export type FinishLevel = "refresh" | "mid-range" | "high-end" | "luxury";
export type LayoutChanges = "none" | "moderate" | "major";
export type PlumbingElectrical = "cosmetic" | "partial" | "full";
export type CabinetTier = "standard" | "semi-custom" | "custom";
export type AduConfig = "detached" | "attached";
export type ConfidenceLevel = "starting" | "refined" | "detailed";

export type UserRefinementKey =
  | "layoutChanges"
  | "plumbingElectrical"
  | "cabinetTier"
  | "fixtureCount"
  | "roomCount"
  | "stories"
  | "aduConfig";

export interface PriceData {
  low: number;
  high: number;
  roi: number;
  included: string[];
}

export interface ProjectSizeConfig {
  min: number;
  max: number;
  step: number;
  baselineSqft: number;
}

/**
 * All refinements are nullable: null means "the user has not told us yet" and
 * never affects the price (1.0x multiplier). There are NO implicit defaults.
 */
export interface EstimateRefinements {
  layoutChanges: LayoutChanges | null;
  plumbingElectrical: PlumbingElectrical | null;
  cabinetTier: CabinetTier | null;
  fixtureCount: number | null;
  stories: number | null;
  roomCount: number | null;
  aduConfig: AduConfig | null;
}

/** A fully-specified estimate input. Required before any range is calculated. */
export interface EstimateInput {
  project: ProjectType;
  finish: FinishLevel;
  sqft: number;
  refinements: EstimateRefinements;
}

/**
 * In-progress estimator state. Nothing is selected by default; the UI works
 * with this shape and only calls `calculateEstimate` once the input is
 * complete (see `isCompleteEstimateInput`).
 */
export interface PartialEstimateInput {
  project: ProjectType | null;
  finish: FinishLevel | null;
  sqft: number | null;
  refinements: EstimateRefinements;
}

export interface EstimateResult {
  priceLow: number;
  priceHigh: number;
  roi: number;
  included: string[];
  confidence: ConfidenceLevel;
  confidenceLabel: string;
  confidencePercent: number;
  refinementsApplied: number;
}

export const INCLUDED_SCOPE_NOTE =
  "Scope reflects the selections above. Your final scope is confirmed during consultation.";

export const APPLIANCE_DISCLAIMER =
  "Appliances are client-supplied; we'll guide your selection but do not purchase or install them.";

export const PROJECT_SIZE_CONFIG: Record<ProjectType, ProjectSizeConfig> = {
  kitchen: { min: 100, max: 600, step: 25, baselineSqft: 250 },
  bathroom: { min: 40, max: 200, step: 10, baselineSqft: 80 },
  "whole-home": { min: 800, max: 8000, step: 100, baselineSqft: 1800 },
  addition: { min: 200, max: 1200, step: 50, baselineSqft: 400 },
  adu: { min: 300, max: 900, step: 50, baselineSqft: 600 },
  basement: { min: 400, max: 2000, step: 50, baselineSqft: 900 },
};

export const EMPTY_REFINEMENTS: EstimateRefinements = {
  layoutChanges: null,
  plumbingElectrical: null,
  cabinetTier: null,
  fixtureCount: null,
  stories: null,
  roomCount: null,
  aduConfig: null,
};

/** Estimator starting state: nothing selected, no implicit defaults. */
export const EMPTY_ESTIMATE_INPUT: PartialEstimateInput = {
  project: null,
  finish: null,
  sqft: null,
  refinements: { ...EMPTY_REFINEMENTS },
};

export function isCompleteEstimateInput(
  input: PartialEstimateInput,
): input is PartialEstimateInput & EstimateInput {
  return input.project !== null && input.finish !== null && input.sqft !== null;
}

export function getProjectSizeConfig(project: ProjectType): ProjectSizeConfig {
  return PROJECT_SIZE_CONFIG[project];
}

export interface SizePreset {
  id: "smaller" | "typical" | "larger";
  label: string;
  sub: string;
  sqft: number;
}

/**
 * Explicit size starting points so users make an intentional size choice
 * (no pre-positioned slider). The slider then fine-tunes from the preset.
 */
export function getSizePresets(project: ProjectType): SizePreset[] {
  const c = PROJECT_SIZE_CONFIG[project];
  const snap = (n: number) => Math.round(n / c.step) * c.step;
  return [
    {
      id: "smaller",
      label: "Smaller",
      sub: "Compact space",
      sqft: snap((c.min + c.baselineSqft) / 2),
    },
    {
      id: "typical",
      label: "Typical",
      sub: "Most common",
      sqft: c.baselineSqft,
    },
    {
      id: "larger",
      label: "Larger",
      sub: "Generous space",
      sqft: snap((c.baselineSqft + c.max) / 2),
    },
  ];
}

export interface RefinementVisibility {
  layoutChanges: boolean;
  plumbingElectrical: boolean;
  cabinetTier: boolean;
  fixtureCount: boolean;
  roomCount: boolean;
  stories: boolean;
  aduConfiguration: boolean;
}

/** Which optional detail fields appear for each project type. */
export function getRefinementVisibility(project: ProjectType): RefinementVisibility {
  return {
    layoutChanges:
      project === "kitchen" ||
      project === "bathroom" ||
      project === "whole-home" ||
      project === "basement",
    plumbingElectrical: true,
    cabinetTier: project === "kitchen",
    fixtureCount: project === "bathroom",
    roomCount: project === "whole-home",
    stories: project === "addition",
    aduConfiguration: project === "adu",
  };
}

export function getMaxRefinementFields(project: ProjectType): number {
  return Object.values(getRefinementVisibility(project)).filter(Boolean).length;
}

export function getPlumbingElectricalLabel(project: ProjectType): string {
  if (project === "addition" || project === "adu") {
    return "Utility & systems scope";
  }
  return "Plumbing and electrical scope";
}

export const PLUMBING_ELECTRICAL_OPTIONS: Record<
  "remodel" | "newConstruction",
  { value: PlumbingElectrical; label: string; sub: string }[]
> = {
  remodel: [
    { value: "cosmetic", label: "Cosmetic", sub: "Fixtures only" },
    { value: "partial", label: "Partial", sub: "Some rerouting" },
    { value: "full", label: "Full", sub: "Complete update" },
  ],
  newConstruction: [
    { value: "cosmetic", label: "Standard", sub: "Tie into existing home" },
    { value: "partial", label: "Extended", sub: "Longer runs or panel work" },
    { value: "full", label: "Full new", sub: "Separate systems throughout" },
  ],
};

export function getPlumbingElectricalOptions(project: ProjectType) {
  return project === "addition" || project === "adu"
    ? PLUMBING_ELECTRICAL_OPTIONS.newConstruction
    : PLUMBING_ELECTRICAL_OPTIONS.remodel;
}

export const PROJECT_LABELS: Record<ProjectType, { label: string; sub: string }> = {
  kitchen: { label: "Kitchen", sub: "Cabinets, counters, layout" },
  bathroom: { label: "Bathroom", sub: "Tile, fixtures, vanity" },
  "whole-home": { label: "Whole-Home", sub: "Multi-room renovation" },
  addition: { label: "Room Addition", sub: "New square footage" },
  adu: { label: "ADU / Guest House", sub: "Detached or attached unit" },
  basement: { label: "Basement Finishing", sub: "Finish your lower level" },
};

export const FINISH_LABELS: Record<FinishLevel, { label: string; sub: string }> = {
  refresh: { label: "Refresh", sub: "Cosmetic upgrades, repaint" },
  "mid-range": { label: "Mid-Range", sub: "Replace and upgrade" },
  "high-end": { label: "High-End", sub: "Premium finishes" },
  luxury: { label: "Luxury", sub: "No constraints" },
};

const ALL_FINISH_LEVELS: FinishLevel[] = ["refresh", "mid-range", "high-end", "luxury"];

/**
 * Finish levels available for a given project type. "Refresh" (cosmetic
 * upgrades / repaint) is meaningless for new construction, so additions and
 * ADUs / guest houses start at "mid-range".
 */
export function getAvailableFinishLevels(project: ProjectType): FinishLevel[] {
  if (project === "addition" || project === "adu" || project === "basement") {
    return ALL_FINISH_LEVELS.filter((level) => level !== "refresh");
  }
  return ALL_FINISH_LEVELS;
}

/**
 * Coerces a finish level to one that is valid for the given project. Guards the
 * pricing engine against disallowed combinations (e.g. "refresh" + addition)
 * regardless of how the input was produced, so the rule is not UI-only.
 */
export function normalizeFinishLevel(project: ProjectType, finish: FinishLevel): FinishLevel {
  const available = getAvailableFinishLevels(project);
  return available.includes(finish) ? finish : available[0];
}

export const PLANNING_DETAIL_LABELS: Record<ConfidenceLevel, string> = {
  starting: "Starting guidance",
  refined: "Refined guidance",
  detailed: "Detailed planning range",
};

/** @deprecated Use PLANNING_DETAIL_LABELS */
export const CONFIDENCE_LABELS = PLANNING_DETAIL_LABELS;

/**
 * Base ranges per project x finish at baseline size. Disallowed combinations
 * (refresh for new construction) are intentionally absent; always resolve
 * prices through `getPriceData`, which normalizes the finish first.
 */
const PRICE_MATRIX: Record<ProjectType, Partial<Record<FinishLevel, PriceData>>> = {
  kitchen: {
    refresh: {
      low: 15000, high: 35000, roi: 72,
      included: ["New countertops (laminate/entry quartz)", "Cabinet repaints or door replacement", "Appliance selection guidance (appliances are client-supplied)", "New plumbing fixtures", "LVP or tile flooring"],
    },
    "mid-range": {
      low: 35000, high: 75000, roi: 74,
      included: ["Semi-custom cabinetry", "Quartz or granite countertops", "Appliance selection guidance (appliances are client-supplied)", "Tile backsplash", "Updated plumbing and electrical"],
    },
    "high-end": {
      low: 75000, high: 150000, roi: 70,
      included: ["Custom or semi-custom cabinetry", "Premium stone countertops", "Appliance selection guidance (appliances are client-supplied)", "Island addition or expansion", "Custom tile work and lighting redesign"],
    },
    luxury: {
      low: 150000, high: 300000, roi: 62,
      included: ["Fully custom cabinetry", "Exotic stone countertops", "Appliance selection guidance (appliances are client-supplied)", "Structural layout changes", "Smart home integration"],
    },
  },
  bathroom: {
    refresh: {
      low: 5000, high: 15000, roi: 70,
      included: ["New vanity and mirror", "Tile shower refresh", "Updated fixtures and hardware", "New toilet if needed", "Lighting update"],
    },
    "mid-range": {
      low: 15000, high: 35000, roi: 71,
      included: ["Custom tile shower", "Semi-custom vanity", "Heated floors", "Updated plumbing", "New windows"],
    },
    "high-end": {
      low: 35000, high: 80000, roi: 65,
      included: ["Wet room or custom walk-in shower", "Freestanding soaking tub", "Radiant heated floors", "Custom built-ins", "High-end plumbing fixtures"],
    },
    luxury: {
      low: 80000, high: 160000, roi: 58,
      included: ["Steam shower system", "Spa soaking tub", "Heated floors and walls", "Full layout reconfiguration", "Designer fixtures throughout"],
    },
  },
  "whole-home": {
    refresh: {
      low: 25000, high: 60000, roi: 65,
      included: ["Kitchen and bath cosmetic refresh", "New flooring throughout", "Fresh interior paint", "Updated light fixtures"],
    },
    "mid-range": {
      low: 60000, high: 150000, roi: 68,
      included: ["Kitchen and bath mid-range renovation", "Open-concept conversion", "New flooring throughout", "Updated HVAC and windows"],
    },
    "high-end": {
      low: 150000, high: 350000, roi: 62,
      included: ["Custom kitchen and bath renovation", "Structural modifications", "New windows and doors", "High-end finishes throughout"],
    },
    luxury: {
      low: 350000, high: 700000, roi: 55,
      included: ["Full gut renovation", "Structural engineering", "Smart home system", "Premium finishes throughout", "New HVAC, electrical and plumbing"],
    },
  },
  addition: {
    "mid-range": {
      low: 80000, high: 180000, roi: 63,
      included: ["Bedroom or family room addition", "Full HVAC integration", "Updated electrical panel", "Mid-range finishes"],
    },
    "high-end": {
      low: 180000, high: 400000, roi: 58,
      included: ["400 to 600 sqft addition", "High-end finishes", "Full integration with existing layout", "Custom windows and doors"],
    },
    luxury: {
      low: 400000, high: 750000, roi: 50,
      included: ["600+ sqft addition", "Structural engineering", "Premium finishes throughout", "Custom design integration"],
    },
  },
  adu: {
    "mid-range": {
      low: 185000, high: 260000, roi: 70,
      included: ["Full design-build ADU", "Mid-range kitchen and bath finishes", "Separate HVAC system", "Permit coordination through CO"],
    },
    "high-end": {
      low: 260000, high: 350000, roi: 65,
      included: ["600+ sqft ADU or guest house", "High-end finishes throughout", "Custom kitchen and bath", "Engineered foundation and structural plans"],
    },
    luxury: {
      low: 350000, high: 550000, roi: 58,
      included: ["Large detached guest house", "Premium finishes and fixtures", "Smart home integration", "Structural engineering and custom design"],
    },
  },
  basement: {
    "mid-range": {
      low: 35000, high: 75000, roi: 68,
      included: ["Framing, insulation, and drywall", "Egress window and code compliance", "LVP or carpet flooring throughout", "Recessed lighting and updated electrical", "Optional bedroom and full bathroom"],
    },
    "high-end": {
      low: 75000, high: 140000, roi: 62,
      included: ["Full basement suite build-out", "Wet bar or kitchenette rough-in", "Premium flooring and custom tile", "Custom lighting and built-ins", "Full bathroom with tile shower"],
    },
    luxury: {
      low: 140000, high: 260000, roi: 55,
      included: ["Luxury finishes throughout", "Home theater or wine room", "Full kitchenette or bar", "Spa-style bathroom", "Smart home integration"],
    },
  },
};

/** Resolves base price data, normalizing disallowed finish levels first. */
export function getPriceData(project: ProjectType, finish: FinishLevel): PriceData {
  const normalized = normalizeFinishLevel(project, finish);
  const data = PRICE_MATRIX[project][normalized];
  if (!data) {
    // Unreachable as long as getAvailableFinishLevels matches PRICE_MATRIX keys.
    throw new Error(`No price data for ${project}/${normalized}`);
  }
  return data;
}

export function formatPlanningCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}

export function getFinishPlanningHint(project: ProjectType, finish: FinishLevel): string {
  const data = getPriceData(project, finish);
  return `${formatPlanningCurrency(data.low)} to ${formatPlanningCurrency(data.high)} at typical size`;
}

export function buildSelectionSummary(project: ProjectType, finish: FinishLevel, sqft: number): string {
  return `${PROJECT_LABELS[project].label} · ${FINISH_LABELS[finish].label} · ${sqft.toLocaleString()} sqft`;
}

function getPlanningDetail(
  count: number,
  maxFields: number,
): { level: ConfidenceLevel; percent: number } {
  if (maxFields <= 0) return { level: "starting", percent: 40 };

  const ratio = Math.min(count, maxFields) / maxFields;
  const percent = Math.round(40 + ratio * 45);

  if (count >= maxFields) return { level: "detailed", percent: 85 };
  if (count >= Math.ceil(maxFields / 2)) return { level: "refined", percent: Math.max(65, percent) };
  return { level: "starting", percent: Math.max(40, percent) };
}

export function countVisibleUserRefinements(
  project: ProjectType,
  userRefinements: Iterable<UserRefinementKey>,
): number {
  const visibility = getRefinementVisibility(project);
  let count = 0;

  for (const key of userRefinements) {
    if (key === "layoutChanges" && visibility.layoutChanges) count++;
    else if (key === "plumbingElectrical" && visibility.plumbingElectrical) count++;
    else if (key === "cabinetTier" && visibility.cabinetTier) count++;
    else if (key === "fixtureCount" && visibility.fixtureCount) count++;
    else if (key === "roomCount" && visibility.roomCount) count++;
    else if (key === "stories" && visibility.stories) count++;
    else if (key === "aduConfig" && visibility.aduConfiguration) count++;
  }

  return count;
}

/** Derives the user-set refinement keys from refinement values (null = unset). */
export function getSetRefinementKeys(refinements: EstimateRefinements): UserRefinementKey[] {
  return (Object.keys(refinements) as UserRefinementKey[]).filter(
    (key) => refinements[key] !== null,
  );
}

function getSizeMultiplier(sqft: number, project: ProjectType): number {
  const baseline = PROJECT_SIZE_CONFIG[project].baselineSqft;
  return Math.max(0.5, Math.min(2.5, sqft / baseline));
}

function getRefinementMultipliers(ref: EstimateRefinements, project: ProjectType): { low: number; high: number } {
  let low = 1;
  let high = 1;

  // Unset (null) refinements never move the price: an estimate only reflects
  // what the user actually told us.
  if (ref.layoutChanges !== null) {
    const layoutMult: Record<LayoutChanges, { low: number; high: number }> = {
      none: { low: 1, high: 1 },
      moderate: { low: 1.08, high: 1.15 },
      major: { low: 1.18, high: 1.35 },
    };
    low *= layoutMult[ref.layoutChanges].low;
    high *= layoutMult[ref.layoutChanges].high;
  }

  if (ref.plumbingElectrical !== null) {
    const peMult: Record<PlumbingElectrical, { low: number; high: number }> = {
      cosmetic: { low: 1, high: 1 },
      partial: { low: 1.05, high: 1.12 },
      full: { low: 1.12, high: 1.22 },
    };
    low *= peMult[ref.plumbingElectrical].low;
    high *= peMult[ref.plumbingElectrical].high;
  }

  if (project === "kitchen" && ref.cabinetTier) {
    const cabMult: Record<CabinetTier, { low: number; high: number }> = {
      standard: { low: 0.95, high: 0.98 },
      "semi-custom": { low: 1, high: 1 },
      custom: { low: 1.1, high: 1.2 },
    };
    low *= cabMult[ref.cabinetTier].low;
    high *= cabMult[ref.cabinetTier].high;
  }

  // Fixture / room counts only ever add cost relative to the base range
  // (floored at 1.0) so small counts never silently discount the estimate.
  if (project === "bathroom" && ref.fixtureCount !== null) {
    const fixtureFactor = Math.max(1, 1 + (ref.fixtureCount - 2) * 0.04);
    low *= fixtureFactor;
    high *= fixtureFactor;
  }

  if (project === "whole-home" && ref.roomCount !== null) {
    const roomFactor = Math.max(1, 1 + (ref.roomCount - 3) * 0.06);
    low *= roomFactor;
    high *= roomFactor;
  }

  if (project === "addition" && ref.stories !== null && ref.stories > 1) {
    low *= 1.12;
    high *= 1.2;
  }

  // Detached units carry their own foundation, envelope, and utility runs;
  // attached units share systems with the main home.
  if (project === "adu" && ref.aduConfig === "detached") {
    low *= 1.05;
    high *= 1.12;
  }

  return { low, high };
}

const LAYOUT_SCOPE: Record<LayoutChanges, string | null> = {
  none: null,
  moderate: "Non-structural wall reconfiguration",
  major: "Structural wall removal with engineering",
};

const PE_SCOPE: Record<PlumbingElectrical, string | null> = {
  cosmetic: null,
  partial: "Partial plumbing and electrical rerouting",
  full: "Full plumbing and electrical replacement",
};

const PE_SCOPE_NEW_CONSTRUCTION: Record<PlumbingElectrical, string | null> = {
  cosmetic: null,
  partial: "Extended utility runs or panel upgrades",
  full: "Full new utility systems throughout",
};

const CABINET_SCOPE: Record<CabinetTier, string> = {
  standard: "Standard stock cabinetry",
  "semi-custom": "Semi-custom cabinetry",
  custom: "Fully custom cabinetry",
};

/**
 * Builds the scope list shown in the result panel. Refinement-driven items are
 * listed first (so the visible slice reflects the user's actual choices), then
 * the base scope for the project + finish level.
 */
export function buildDynamicScope(input: EstimateInput): string[] {
  const base = getPriceData(input.project, input.finish).included;
  const r = input.refinements;
  const visibility = getRefinementVisibility(input.project);
  const extra: string[] = [];

  if (visibility.layoutChanges && r.layoutChanges !== null) {
    const layoutItem = LAYOUT_SCOPE[r.layoutChanges];
    if (layoutItem) extra.push(layoutItem);
  }

  if (visibility.plumbingElectrical && r.plumbingElectrical !== null) {
    const peScope =
      input.project === "addition" || input.project === "adu"
        ? PE_SCOPE_NEW_CONSTRUCTION
        : PE_SCOPE;
    const peItem = peScope[r.plumbingElectrical];
    if (peItem) extra.push(peItem);
  }

  if (input.project === "kitchen" && r.cabinetTier) {
    extra.push(CABINET_SCOPE[r.cabinetTier]);
  }

  if (input.project === "bathroom" && r.fixtureCount !== null) {
    extra.push(`${r.fixtureCount} plumbing ${r.fixtureCount === 1 ? "fixture" : "fixtures"}`);
  }

  if (input.project === "whole-home" && r.roomCount !== null) {
    extra.push(`${r.roomCount} ${r.roomCount === 1 ? "room" : "rooms"} renovated`);
  }

  if (input.project === "addition" && r.stories !== null) {
    extra.push(r.stories > 1 ? "Two-story addition" : "Single-story addition");
  }

  if (input.project === "adu" && r.aduConfig !== null) {
    extra.push(r.aduConfig === "attached" ? "Attached ADU" : "Detached ADU");
  }

  const seen = new Set<string>();
  return [...extra, ...base].filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

export function calculateEstimate(input: EstimateInput, userRefinementCount = 0): EstimateResult {
  const finish = normalizeFinishLevel(input.project, input.finish);
  const safeInput: EstimateInput = finish === input.finish ? input : { ...input, finish };
  const base = getPriceData(safeInput.project, safeInput.finish);
  const sizeMult = getSizeMultiplier(input.sqft, input.project);
  const refMult = getRefinementMultipliers(input.refinements, input.project);
  const maxFields = getMaxRefinementFields(input.project);
  const { level, percent } = getPlanningDetail(userRefinementCount, maxFields);

  // Price is a pure, monotonic function of the cost drivers (project, finish,
  // size, refinements). A more intensive selection always yields a higher
  // range. The planning-detail meter below is a separate confidence cue and
  // intentionally does NOT alter the dollar range, so two configurations are
  // always directly comparable.
  const priceLow = Math.round((base.low * sizeMult * refMult.low) / 1000) * 1000;
  const priceHigh = Math.round((base.high * sizeMult * refMult.high) / 1000) * 1000;

  return {
    priceLow,
    priceHigh,
    roi: base.roi,
    included: buildDynamicScope(safeInput),
    confidence: level,
    confidenceLabel: PLANNING_DETAIL_LABELS[level],
    confidencePercent: percent,
    refinementsApplied: userRefinementCount,
  };
}

export interface StoredEstimate extends EstimateInput {
  priceLow: number;
  priceHigh: number;
  roi: number;
  confidence: ConfidenceLevel;
  confidenceLabel: string;
}

export function buildStoredEstimate(input: EstimateInput, userRefinementCount = 0): StoredEstimate {
  const result = calculateEstimate(input, userRefinementCount);
  return {
    ...input,
    finish: normalizeFinishLevel(input.project, input.finish),
    priceLow: result.priceLow,
    priceHigh: result.priceHigh,
    roi: result.roi,
    confidence: result.confidence,
    confidenceLabel: result.confidenceLabel,
  };
}

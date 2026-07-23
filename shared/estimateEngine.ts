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
  | "bathroomCount"
  | "kitchenIncluded"
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
  /**
   * @deprecated Retired as a whole-home price driver. It double counted size
   * (sqft already scales the estimate) and was set silently by the layout card
   * rather than chosen. Kept on the type so estimates stored before the change
   * still parse. Whole-home now prices bathroomCount and kitchenIncluded.
   */
  roomCount: number | null;
  /** Whole-home: number of bathrooms in scope. */
  bathroomCount: number | null;
  /** Whole-home: whether the kitchen is part of the project. */
  kitchenIncluded: boolean | null;
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

/**
 * The single, unambiguous statement of what this number is. Used verbatim in
 * the estimator and in both outbound emails so a homeowner cannot come away
 * believing they were given a price.
 */
export const NOT_A_QUOTE_NOTICE =
  "This is an estimated budget range, not a quote, bid, or offer. No part of this range is a commitment to a price.";

export const ONSITE_REQUIRED_NOTICE =
  "Every home is different, and the things that move a remodel budget most (what is behind the walls, the age and condition of existing systems, access, and structural realities) cannot be assessed from a web form. A firm, itemized proposal follows an on-site consultation and assessment.";

export interface EstimateDisclosure {
  /** Work the range is intended to cover. */
  includes: string[];
  /** Work the range explicitly does NOT cover. */
  excludes: string[];
  /** Conditions the range assumes to be true. */
  assumptions: string[];
  /** What tends to push the final number above the range. */
  increases: string[];
  /** What tends to bring the final number down. */
  decreases: string[];
  /** Common selections that add cost if chosen. */
  upgrades: string[];
}

/**
 * Baseline inclusions that apply to every project, per the 2025 Boise
 * Remodeling Cost Guide. Listed ahead of the finish-specific scope so a
 * homeowner sees that permits and project management are covered rather than
 * assuming they are extras.
 */
const UNIVERSAL_INCLUDES = [
  "Design and planning",
  "Permits",
  "Demolition and disposal",
  "Labor and materials",
  "Project management",
  "Standard warranties",
];

/** Exclusions and assumptions that hold for every project type. */
const UNIVERSAL_EXCLUDES = [
  "Appliances, which are client-supplied (we guide selection but do not purchase or install)",
  "Unknown conditions discovered at demolition: rot, water damage, failed framing, or pest damage",
  "Hazardous material abatement (asbestos or lead paint), which is common in pre-1980 homes",
  "Code upgrades triggered by inspection, such as panel replacement, egress, or insulation",
  "Furniture, decor, window coverings, and art",
  "Landscaping or exterior restoration beyond the immediate work area",
  "Temporary housing, storage, or moving costs",
];

const UNIVERSAL_ASSUMPTIONS = [
  "The home is structurally sound with no active leaks, rot, or pest damage",
  "Existing systems that are not being replaced already meet code",
  "Work proceeds in one continuous phase with normal site access",
  "Standard material lead times, with no expedited or special-order surcharges",
  "Finishes are selected from the allowances set during design",
  "2025 Boise-area market conditions for labor and materials",
  "A typical project with no major structural issues",
];

const UNIVERSAL_INCREASES = [
  "Relocating plumbing, gas, or load-bearing walls",
  "Structural surprises found once walls or floors are opened",
  "Older homes with knob-and-tube wiring, galvanized supply lines, or plaster walls",
  "Custom millwork, imported stone, or specialty-order materials",
  "A compressed schedule, or living in the home during construction",
  "Difficult access: second story, tight lots, or limited staging area",
];

const UNIVERSAL_DECREASES = [
  "Keeping the existing layout and plumbing locations",
  "Choosing stock or semi-custom cabinetry over fully custom",
  "Reusing sound cabinet boxes, flooring, or fixtures where practical",
  "A flexible timeline that lets us schedule efficiently",
  "Combining adjacent rooms into a single mobilization",
];

const PROJECT_UPGRADES: Record<ProjectType, string[]> = {
  kitchen: [
    "Island addition or expansion",
    "Panel-ready or integrated appliance fronts",
    "Walk-in or butler's pantry",
    "Layered and under-cabinet lighting design",
    "Waterfall edges or full-height stone backsplash",
  ],
  bathroom: [
    "Radiant heated flooring",
    "Steam shower or body-spray systems",
    "Freestanding soaking tub",
    "Frameless custom glass enclosure",
    "Double vanity with custom storage",
  ],
  "whole-home": [
    "Opening the floor plan between primary living spaces",
    "New windows and exterior doors throughout",
    "HVAC replacement or zoning",
    "Smart home wiring and integration",
    "Built-in cabinetry and millwork packages",
  ],
  addition: [
    "Vaulted or coffered ceilings",
    "A full bath rather than a half bath",
    "Matching or replacing existing siding and roofing for a seamless exterior",
    "Covered porch or deck tie-in",
  ],
  adu: [
    "Full kitchen rather than a kitchenette",
    "Separate utility metering",
    "Garage or covered parking",
    "Upgraded exterior to match the main home",
  ],
  basement: [
    "Wet bar or kitchenette",
    "Home theater pre-wire and soundproofing",
    "Additional egress windows for extra bedrooms",
    "Full bathroom rather than a half bath",
  ],
};

const PROJECT_EXCLUDES: Partial<Record<ProjectType, string[]>> = {
  kitchen: ["Countertop appliances, cookware, and small-appliance garages beyond the cabinet plan"],
  basement: [
    "Foundation repair, waterproofing, or drainage correction if moisture is present",
    "Radon mitigation, if testing shows it is needed",
  ],
  addition: ["Site work beyond the building footprint, such as utility mains or driveway changes"],
  adu: [
    "Utility connection fees and impact fees charged by the jurisdiction",
    "Site work beyond the building footprint",
  ],
};

/**
 * Everything a homeowner needs to read the number correctly: what it covers,
 * what it does not, what it assumes, and which way the final figure is likely
 * to move. Shared by the estimator UI and both outbound emails so the two can
 * never tell a different story.
 */
/* ══════════════════════════════════════════════════════════════════════
   TYPICAL SELECTIONS ("project profiles")

   The estimator should behave like a project manager, not a form. A PM does
   not ask a homeowner how many linear feet of cabinet they have; they look at
   an L-shaped kitchen at a mid-range finish and know what that usually means.

   So the finish level carries a profile of what it typically includes, and the
   estimator pre-selects it rather than asking. Two rules keep this honest and
   distinguish it from the hidden inference removed elsewhere in this engine:

     1. Every pre-selected value is SHOWN to the homeowner, not buried.
     2. Every one of them is editable.

   The line is what a homeowner actually knows. They know their project type,
   roughly how big it is, how many bathrooms they have, and how nice they want
   it. They do not know whether their cabinetry is "semi-custom", or whether
   their plumbing counts as "relocated". Asking the second kind adds friction
   without adding accuracy, because the answer is a guess either way.
══════════════════════════════════════════════════════════════════════ */

export interface TypicalSelections {
  cabinetTier: CabinetTier | null;
  plumbingElectrical: PlumbingElectrical | null;
  layoutChanges: LayoutChanges | null;
  /** Plain-language lines describing what this finish level typically includes. */
  summary: string[];
}

const FINISH_PROFILES: Record<FinishLevel, Omit<TypicalSelections, "summary">> = {
  refresh: { cabinetTier: "standard", plumbingElectrical: "cosmetic", layoutChanges: "none" },
  "mid-range": { cabinetTier: "semi-custom", plumbingElectrical: "cosmetic", layoutChanges: "none" },
  "high-end": { cabinetTier: "semi-custom", plumbingElectrical: "partial", layoutChanges: "moderate" },
  luxury: { cabinetTier: "custom", plumbingElectrical: "full", layoutChanges: "major" },
};

const PROFILE_SUMMARY: Record<ProjectType, Record<FinishLevel, string[]>> = {
  kitchen: {
    refresh: ["Stock cabinetry", "Laminate or entry quartz counters", "Existing layout kept", "Plumbing stays where it is", "LVP or tile flooring"],
    "mid-range": ["Semi-custom cabinetry", "Quartz counters", "Tile backsplash", "Existing layout kept", "Plumbing stays where it is"],
    "high-end": ["Semi-custom or custom cabinetry", "Premium stone counters", "Full tile backsplash", "Some walls or plumbing moved", "Layered and under-cabinet lighting"],
    luxury: ["Fully custom cabinetry", "Exotic stone counters", "Structural layout changes", "Systems relocated throughout", "Designer lighting package"],
  },
  bathroom: {
    refresh: ["New vanity and mirror", "Tile shower refresh", "Fixtures replaced in place", "Existing layout kept"],
    "mid-range": ["Custom tile shower", "Semi-custom vanity", "Existing layout kept", "Plumbing stays where it is"],
    "high-end": ["Walk-in or wet-room shower", "Freestanding tub", "Some plumbing moved", "Heated floors"],
    luxury: ["Full layout reconfiguration", "Steam or spa shower", "Systems relocated throughout", "Designer fixtures"],
  },
  "whole-home": {
    refresh: ["Cosmetic kitchen and bath refresh", "New flooring throughout", "Fresh paint", "Existing layout kept"],
    "mid-range": ["Kitchen and baths renovated", "New flooring throughout", "Existing layout kept", "Systems stay in place"],
    "high-end": ["Custom kitchen and baths", "Some structural changes", "New windows and doors", "Systems partly reworked"],
    luxury: ["Full gut renovation", "Structural engineering", "All new systems", "Smart home integration"],
  },
  addition: {
    refresh: [], "mid-range": ["New foundation, framing and roof", "Tied into existing HVAC", "Mid-range finishes", "Standard utility runs"],
    "high-end": ["New foundation, framing and roof", "Custom windows and doors", "Extended utility runs", "High-end finishes"],
    luxury: ["Structural engineering", "Premium finishes throughout", "Separate systems", "Custom design integration"],
  },
  adu: {
    refresh: [], "mid-range": ["Full design-build unit", "Mid-range kitchen and bath", "Separate HVAC", "Permits through certificate of occupancy"],
    "high-end": ["Custom kitchen and bath", "High-end finishes", "Engineered foundation", "Extended utility runs"],
    luxury: ["Premium finishes throughout", "Smart home integration", "Structural engineering", "Fully separate systems"],
  },
  basement: {
    refresh: [], "mid-range": ["Framing, insulation and drywall", "Egress and code compliance", "LVP or carpet throughout", "Recessed lighting"],
    "high-end": ["Full suite build-out", "Premium flooring and tile", "Custom lighting and built-ins", "Some systems reworked"],
    luxury: ["Luxury finishes throughout", "Theater or wine room", "Spa-style bath", "Systems relocated as needed"],
  },
};

/**
 * What the estimator pre-selects for a project at a given finish level, and the
 * plain-language summary shown alongside it. Only fields the project actually
 * prices are returned, so nothing is pre-selected that would never apply.
 */
export function getTypicalSelections(
  project: ProjectType,
  finish: FinishLevel,
): TypicalSelections {
  const normalized = normalizeFinishLevel(project, finish);
  const profile = FINISH_PROFILES[normalized];
  const visibility = getRefinementVisibility(project);
  return {
    cabinetTier: visibility.cabinetTier ? profile.cabinetTier : null,
    plumbingElectrical: visibility.plumbingElectrical ? profile.plumbingElectrical : null,
    layoutChanges: visibility.layoutChanges ? profile.layoutChanges : null,
    summary: PROFILE_SUMMARY[project][normalized] ?? [],
  };
}

export function buildEstimateDisclosure(input: EstimateInput): EstimateDisclosure {
  return {
    includes: [...UNIVERSAL_INCLUDES, ...buildDynamicScope(input)],
    excludes: [...UNIVERSAL_EXCLUDES, ...(PROJECT_EXCLUDES[input.project] ?? [])],
    assumptions: UNIVERSAL_ASSUMPTIONS,
    increases: UNIVERSAL_INCREASES,
    decreases: UNIVERSAL_DECREASES,
    upgrades: PROJECT_UPGRADES[input.project],
  };
}

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
  bathroomCount: null,
  kitchenIncluded: null,
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
  bathroomCount: boolean;
  kitchenIncluded: boolean;
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
    bathroomCount: ASSUMED_BATHROOMS[project] !== undefined,
    kitchenIncluded: ASSUMED_KITCHENS[project] !== undefined,
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
  // The distinction that matters is RELOCATION, not disconnection. Taking a sink
  // out to fit new cabinets and putting it back in the same place is routine and
  // carries no premium; actually moving the supply, drain, or a circuit is what
  // drives cost. The old copy ("Fixtures only" / "Some rerouting") left visitors
  // guessing which side of that line a normal cabinet swap fell on.
  remodel: [
    { value: "cosmetic", label: "Staying put", sub: "Nothing moves location" },
    { value: "partial", label: "Some moves", sub: "A few lines or circuits relocate" },
    { value: "full", label: "Full rework", sub: "Systems relocated or replaced" },
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
/**
 * Base ranges per project x finish AT THE PROJECT'S BASELINE SIZE, before any
 * size scaling or refinement multipliers.
 *
 * SOURCE: the 2025 Boise Remodeling Cost Guide (owner-supplied), which states
 * per-square-foot ranges against a reference size for each project type. Those
 * reference sizes match `PROJECT_SIZE_CONFIG` baselines exactly (kitchen 250,
 * bathroom 80, whole-home 1,800, addition 400, ADU 600, basement 900), so each
 * cell here is the guide's per-square-foot range multiplied by that size.
 *
 * The guide's kitchen high-end cell is internally inconsistent: it lists
 * $400-$650/sf but a total of $100,000-$137,500, and $137,500 implies $550/sf.
 * The per-square-foot figure is used, because the guide's stated unit is per
 * square foot and $650 sits flush against the $700 luxury floor (a $550 cap
 * would leave a gap between the tiers). Change `high` on kitchen high-end to
 * 137500 if the dollar figure was the intended one.
 *
 * The guide quotes kitchens "no wall movement" and bathrooms "no layout
 * change", which is why these are pure baselines: layout, systems, and
 * cabinetry choices are applied on top as multipliers rather than baked in.
 *
 * Note that a per-square-foot rate holds only at the reference size. Cost is
 * scaled sublinearly from here (see SIZE_ELASTICITY), so a larger kitchen has a
 * lower effective rate per square foot, which is how remodel cost actually
 * behaves and is consistent with the guide's own rates falling as project size
 * rises across categories.
 */
const PRICE_MATRIX: Record<ProjectType, Partial<Record<FinishLevel, PriceData>>> = {
  kitchen: {
    refresh: {
      low: 18750, high: 31250, roi: 72,
      included: ["New countertops (laminate/entry quartz)", "Cabinet repaints or door replacement", "Appliance selection guidance (appliances are client-supplied)", "New plumbing fixtures", "LVP or tile flooring"],
    },
    "mid-range": {
      low: 43750, high: 68750, roi: 74,
      included: ["Semi-custom cabinetry", "Quartz or granite countertops", "Appliance selection guidance (appliances are client-supplied)", "Tile backsplash", "Updated plumbing and electrical"],
    },
    "high-end": {
      low: 100000, high: 162500, roi: 70,
      included: ["Custom or semi-custom cabinetry", "Premium stone countertops", "Appliance selection guidance (appliances are client-supplied)", "Island addition or expansion", "Custom tile work and lighting redesign"],
    },
    luxury: {
      low: 175000, high: 225000, roi: 62,
      included: ["Fully custom cabinetry", "Exotic stone countertops", "Appliance selection guidance (appliances are client-supplied)", "Structural layout changes", "Smart home integration"],
    },
  },
  bathroom: {
    refresh: {
      low: 12000, high: 20000, roi: 70,
      included: ["New vanity and mirror", "Tile shower refresh", "Updated fixtures and hardware", "New toilet if needed", "Lighting update"],
    },
    "mid-range": {
      low: 22000, high: 36000, roi: 71,
      included: ["Custom tile shower", "Semi-custom vanity", "Heated floors", "Updated plumbing", "New windows"],
    },
    "high-end": {
      low: 44000, high: 64000, roi: 65,
      included: ["Wet room or custom walk-in shower", "Freestanding soaking tub", "Radiant heated floors", "Custom built-ins", "High-end plumbing fixtures"],
    },
    luxury: {
      low: 72000, high: 112000, roi: 58,
      included: ["Steam shower system", "Spa soaking tub", "Heated floors and walls", "Full layout reconfiguration", "Designer fixtures throughout"],
    },
  },
  "whole-home": {
    refresh: {
      low: 54000, high: 90000, roi: 65,
      included: ["Kitchen and bath cosmetic refresh", "New flooring throughout", "Fresh interior paint", "Updated light fixtures"],
    },
    "mid-range": {
      low: 135000, high: 225000, roi: 68,
      included: ["Kitchen and bath mid-range renovation", "Open-concept conversion", "New flooring throughout", "Updated HVAC and windows"],
    },
    "high-end": {
      low: 270000, high: 387000, roi: 62,
      included: ["Custom kitchen and bath renovation", "Structural modifications", "New windows and doors", "High-end finishes throughout"],
    },
    luxury: {
      low: 450000, high: 765000, roi: 55,
      included: ["Full gut renovation", "Structural engineering", "Smart home system", "Premium finishes throughout", "New HVAC, electrical and plumbing"],
    },
  },
  addition: {
    "mid-range": {
      low: 120000, high: 170000, roi: 63,
      included: ["Bedroom or family room addition", "Full HVAC integration", "Updated electrical panel", "Mid-range finishes"],
    },
    "high-end": {
      low: 200000, high: 280000, roi: 58,
      included: ["400 to 600 sqft addition", "High-end finishes", "Full integration with existing layout", "Custom windows and doors"],
    },
    luxury: {
      low: 340000, high: 460000, roi: 50,
      included: ["600+ sqft addition", "Structural engineering", "Premium finishes throughout", "Custom design integration"],
    },
  },
  /*
   * ADU rates are calibrated to a real closed job, not to the 2025 cost guide.
   *
   * The guide put a mid-range detached ADU at $210,000 to $300,000 against the
   * 600 sq ft reference, i.e. $350/sq ft at the floor. The cheapest detached
   * ADU actually delivered came in around $145,000, and the owner set the
   * starting point at $250/sq ft. Every tier is scaled by the same 0.7364 so
   * the relationships between tiers, which the guide gets right, are preserved
   * while the entry point matches what the work actually costs.
   *
   * This is the first category calibrated against a closed job rather than a
   * published guide. See ESTIMATOR-CALIBRATION.md.
   */
  adu: {
    "mid-range": {
      low: 155000, high: 221000, roi: 70,
      included: ["Full design-build ADU", "Mid-range kitchen and bath finishes", "Separate HVAC system", "Permit coordination through CO"],
    },
    "high-end": {
      low: 221000, high: 309000, roi: 65,
      included: ["600+ sqft ADU or guest house", "High-end finishes throughout", "Custom kitchen and bath", "Engineered foundation and structural plans"],
    },
    luxury: {
      low: 309000, high: 442000, roi: 58,
      included: ["Large detached guest house", "Premium finishes and fixtures", "Smart home integration", "Structural engineering and custom design"],
    },
  },
  basement: {
    "mid-range": {
      low: 45000, high: 76500, roi: 68,
      included: ["Framing, insulation, and drywall", "Egress window and code compliance", "LVP or carpet flooring throughout", "Recessed lighting and updated electrical", "Optional bedroom and full bathroom"],
    },
    "high-end": {
      low: 90000, high: 144000, roi: 62,
      included: ["Full basement suite build-out", "Wet bar or kitchenette rough-in", "Premium flooring and custom tile", "Custom lighting and built-ins", "Full bathroom with tile shower"],
    },
    luxury: {
      low: 157500, high: 225000, roi: 55,
      included: ["Luxury finishes throughout", "Home theater or wine room", "Full kitchenette or bar", "Spa-style bathroom", "Smart home integration"],
    },
  },
};

/** Resolves base price data, normalizing disallowed finish levels first. */
/**
 * Deliberate downward adjustment applied to the published cost-guide rates, set
 * by the owner to avoid opening a conversation with a number that reads as
 * sticker shock.
 *
 * Applied ASYMMETRICALLY, and that matters. Sticker shock is caused by the top
 * of a range: the figure a homeowner fixates on and repeats is the ceiling.
 * Cutting the floor by the same amount softens nothing, and actively harms,
 * because it advertises an entry price the work cannot be delivered for. A
 * uniform 20% cut had pulled the whole-home floor from the guide's $75/sq ft to
 * $60/sq ft, which reads as a light cosmetic refresh rather than the "replace
 * and upgrade" scope that rate is meant to describe.
 *
 * So the ceiling comes down and the floor stays honest. The range narrows from
 * above, which also reads as more confident than a wide one.
 *
 * Set both to 1 to quote the guide exactly as published.
 */
export const PLANNING_RANGE_ADJUSTMENT_LOW = 1;
export const PLANNING_RANGE_ADJUSTMENT_HIGH = 0.8;

/**
 * @deprecated Use the LOW/HIGH pair. Retained because the invariant suite and
 * the whole-home module maths reference a single scalar; it tracks the high-end
 * factor, which is the one that moves.
 */
export const PLANNING_RANGE_ADJUSTMENT = PLANNING_RANGE_ADJUSTMENT_HIGH;

export function getPriceData(project: ProjectType, finish: FinishLevel): PriceData {
  const normalized = normalizeFinishLevel(project, finish);
  const data = PRICE_MATRIX[project][normalized];
  if (!data) {
    // Unreachable as long as getAvailableFinishLevels matches PRICE_MATRIX keys.
    throw new Error(`No price data for ${project}/${normalized}`);
  }
  return {
    ...data,
    low: data.low * PLANNING_RANGE_ADJUSTMENT_LOW,
    high: data.high * PLANNING_RANGE_ADJUSTMENT_HIGH,
  };
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
    else if (key === "bathroomCount" && visibility.bathroomCount) count++;
    else if (key === "kitchenIncluded" && visibility.kitchenIncluded) count++;
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

/**
 * How strongly cost actually tracks floor area, by project type.
 *
 * Remodel cost does NOT scale linearly with square footage. A 400 sqft kitchen
 * does not contain 1.6x the cabinetry, appliances, or plumbing points of a 250
 * sqft one: the extra area is mostly open floor. Cost follows cabinet runs,
 * fixture counts, and tile area, which grow far more slowly than floor area.
 * Treating area as linear was inflating large-room estimates badly (a 400 sqft
 * high-end kitchen priced at $198k-$247k, roughly double a realistic figure).
 *
 * New construction is the exception: an addition or ADU genuinely costs close
 * to proportionally more per square foot added, so those stay near-linear.
 *
 * 1.0 = perfectly linear with area. Lower = more of the cost is fixed.
 */
const SIZE_ELASTICITY: Record<ProjectType, number> = {
  kitchen: 0.55, // cabinet runs + appliance count dominate, not floor area
  bathroom: 0.6, // fixture count and tile area, not floor area
  'whole-home': 0.85, // more area genuinely means more rooms to touch
  addition: 0.95, // new square footage: near-linear
  adu: 0.9, // new construction, but fixed kitchen/bath cores dilute it
  basement: 0.75, // large open areas are cheap per sqft once systems are in
};

function getSizeMultiplier(sqft: number, project: ProjectType): number {
  const baseline = PROJECT_SIZE_CONFIG[project].baselineSqft;
  // Clamp the ratio before scaling so an extreme slider position cannot produce
  // a runaway multiplier, then damp it by the project's elasticity.
  const ratio = Math.max(0.35, Math.min(3, sqft / baseline));
  const scaled = Math.pow(ratio, SIZE_ELASTICITY[project]);
  return Math.max(0.6, Math.min(2, scaled));
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

  if (project === "addition" && ref.stories !== null && ref.stories > 1) {
    low *= 1.12;
    high *= 1.2;
  }

  // The cost guide's ADU reference is explicitly a DETACHED unit, so detached
  // is the baseline and carries no premium; charging one on top would double
  // count it. An attached unit is the discount, because it shares foundation,
  // envelope, and utility runs with the main home.
  if (project === "adu" && ref.aduConfig === "attached") {
    low *= 0.9;
    high *= 0.93;
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

  if (input.project === "whole-home" && r.bathroomCount !== null) {
    extra.push(`${r.bathroomCount} ${r.bathroomCount === 1 ? "bathroom" : "bathrooms"}`);
  }

  if (input.project === "whole-home" && r.kitchenIncluded !== null) {
    extra.push(r.kitchenIncluded ? "Kitchen renovation included" : "Kitchen not included");
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

/**
 * What the whole-home rate already assumes.
 *
 * A whole-home price is not uniform per square foot: kitchens and bathrooms
 * cost several times what general living space does. The published rate must
 * therefore assume some number of each, and that number is solvable rather than
 * a matter of opinion, because the same guide prices kitchens and bathrooms on
 * their own. Subtracting a kitchen and N baths from the whole-home figure
 * leaves a residual that must be a believable rate for flooring, paint, trim,
 * doors and lighting:
 *
 *   assumed baths     refresh   mid-range   high-end   luxury
 *   1                    $17       $51        $78       $171   per sq ft
 *   2                     $8       $37        $52       $128
 *   3                    -$1       $22        $22        $79
 *
 * Three baths is impossible: it makes refresh negative. One bath implies $51/sf
 * for paint and flooring, more than a bathroom costs per foot. Two is the only
 * count that stays believable at every finish level, and 1,800 sq ft with one
 * kitchen and two baths is the standard Treasure Valley three-bed home.
 */
const WHOLE_HOME_ASSUMED_BATHS = 2;
const WHOLE_HOME_ASSUMES_KITCHEN = true;

/**
 * How many bathrooms each project's published rate already covers.
 *
 * This is NOT a default applied to a lead. The estimator requires the homeowner
 * to state the count on every project type that has one, so the figure here is
 * only ever the reference point the adjustment measures FROM, never a stand-in
 * for an answer nobody gave. A published rate unavoidably contains some number
 * of bathrooms; knowing which number is what makes the stated count priceable.
 *
 * Whole-home's count of 2 is derived arithmetically (see above). The others are
 * read from the scope the guide publishes for each project, which is weaker
 * evidence, so they are recorded here explicitly rather than buried:
 *
 *   basement  "Optional bedroom and full bathroom"  -> optional, so 0 assumed
 *   addition  "Bedroom or family room addition"     -> no bath mentioned, 0
 *   adu       "Mid-range kitchen and bath finishes" -> one bath, 1
 *
 * Projects absent from this map do not price bathroom count: a bathroom remodel
 * IS the bathroom, and a kitchen has none.
 */
const ASSUMED_BATHROOMS: Partial<Record<ProjectType, number>> = {
  "whole-home": WHOLE_HOME_ASSUMED_BATHS,
  basement: 0,
  addition: 0,
  adu: 1,
  // A bathroom project is one bathroom by default, but plenty of homeowners
  // are doing two or three at once and had no way to say so. Handled as a
  // multiplier rather than an additive module (see below), because here the
  // size slider describes EACH bathroom.
  bathroom: 1,
};

export function getAssumedBathrooms(project: ProjectType): number | null {
  return ASSUMED_BATHROOMS[project] ?? null;
}

/**
 * Whether each project's published rate already covers a kitchen, and which
 * kitchen. Same reasoning as bathrooms: the rate contains one or it does not,
 * and the homeowner states what theirs actually has.
 *
 *   whole-home  covers a full kitchen        "Kitchen and bath ... renovation"
 *   addition    covers none                  "Bedroom or family room addition"
 *   basement    covers none, and what gets   "Wet bar or kitchenette rough-in"
 *               added is a wet bar, not a
 *               full kitchen
 *
 * ADU is absent deliberately: a dwelling unit has a kitchen by definition, so
 * there is nothing to ask. Kitchen projects are the kitchen.
 *
 * `tier` is the price to use for one, from the guide's own kitchen figures. A
 * basement wet bar is priced at the refresh tier (cabinets, a counter and a
 * small sink, no appliance or layout work) rather than the project's own finish
 * level, because charging a full high-end kitchen for a wet bar would overstate
 * it several times over.
 */
const ASSUMED_KITCHENS: Partial<
  Record<
    ProjectType,
    {
      covered: boolean;
      tier: FinishLevel | "match";
      /**
       * When set, answering "no" means a SMALLER kitchen rather than none at
       * all, and the deduction is only the difference between the two tiers.
       * An ADU must have a kitchen to be a dwelling; the real variable is
       * whether it is a full one or a compact galley, and the guide already
       * prices a lesser kitchen at its refresh tier.
       */
      lesserTier?: FinishLevel;
    }
  >
> = {
  "whole-home": { covered: true, tier: "match" },
  addition: { covered: false, tier: "match" },
  basement: { covered: false, tier: "refresh" },
  adu: { covered: true, tier: "match", lesserTier: "refresh" },
};

export function getKitchenQuestion(
  project: ProjectType,
): { covered: boolean; isWetBar: boolean; isDowngrade: boolean } | null {
  const cfg = ASSUMED_KITCHENS[project];
  if (!cfg) return null;
  return {
    covered: cfg.covered,
    isWetBar: project === "basement",
    // "No" means a smaller kitchen, not the absence of one.
    isDowngrade: cfg.lesserTier !== undefined,
  };
}

/**
 * Prices a deviation from the assumed bathroom count, and for whole-home the
 * presence of the kitchen, ADDITIVELY using the guide's own figures at the
 * matching finish level.
 *
 * Additive rather than a multiplier, because a bathroom costs what a bathroom
 * costs; it does not scale with the size of the house. And because the
 * adjustment is zero at the assumed baseline, a typical project still
 * reproduces the published rate exactly, which the source-fidelity check
 * enforces.
 *
 * The bathroom figure used is the guide's standalone bathroom remodel. For a
 * basement or an addition the true incremental cost differs somewhat (no
 * demolition, but slab or new plumbing runs instead), so this is a reasoned
 * approximation rather than a derived number, unlike the whole-home baseline.
 */
function getModuleAdjustment(
  project: ProjectType,
  ref: EstimateRefinements,
  finish: FinishLevel,
): { low: number; high: number } {
  let low = 0;
  let high = 0;

  // The bathroom project scales by count instead; see bathroomInstances.
  const assumed = project === "bathroom" ? undefined : ASSUMED_BATHROOMS[project];
  if (assumed !== undefined && ref.bathroomCount !== null) {
    const bath = PRICE_MATRIX.bathroom[normalizeFinishLevel("bathroom", finish)];
    if (bath) {
      const delta = ref.bathroomCount - assumed;
      low += bath.low * delta;
      high += bath.high * delta;
    }
  }

  const kitchenCfg = ASSUMED_KITCHENS[project];
  if (kitchenCfg && ref.kitchenIncluded !== null) {
    const tier =
      kitchenCfg.tier === "match" ? normalizeFinishLevel("kitchen", finish) : kitchenCfg.tier;
    const kitchen = PRICE_MATRIX.kitchen[tier];

    if (kitchen && kitchenCfg.lesserTier && !ref.kitchenIncluded) {
      // Downgrade rather than removal: deduct only the gap between the kitchen
      // the rate assumes and the smaller one actually going in.
      const lesser = PRICE_MATRIX.kitchen[kitchenCfg.lesserTier];
      if (lesser) {
        low -= kitchen.low - lesser.low;
        high -= kitchen.high - lesser.high;
      }
    } else if (kitchen) {
      // +1 when they have one the rate does not cover, -1 when the rate covers
      // one they are not doing, 0 when the two agree.
      const delta = (ref.kitchenIncluded ? 1 : 0) - (kitchenCfg.covered ? 1 : 0);
      low += kitchen.low * delta;
      high += kitchen.high * delta;
    }
  }

  return { low, high };
}

export function calculateEstimate(input: EstimateInput, userRefinementCount = 0): EstimateResult {
  const finish = normalizeFinishLevel(input.project, input.finish);
  const safeInput: EstimateInput = finish === input.finish ? input : { ...input, finish };
  const base = getPriceData(safeInput.project, safeInput.finish);
  const sizeMult = getSizeMultiplier(input.sqft, input.project);
  const refMult = getRefinementMultipliers(input.refinements, input.project);
  const maxFields = getMaxRefinementFields(input.project);
  const { level, percent } = getPlanningDetail(userRefinementCount, maxFields);

  // The estimate is a central figure with an uncertainty band around it.
  //
  // The CENTER is a pure, monotonic function of the cost drivers (project,
  // finish, size, refinements): a more intensive selection always moves the
  // center up, so two configurations remain directly comparable.
  // Center = expected cost; the band below carries the uncertainty. Keeping
  // those two jobs separate matters: the previous form took the mean of
  // (lowest base x lowest multipliers) and (highest base x highest
  // multipliers), so every selection compounded worst-case against worst-case
  // and dragged the center upward. Scaling the midpoints instead keeps the
  // center a fair expected value while staying monotonic - a more intensive
  // selection still always moves it up.
  const baseMid = (base.low + base.high) / 2;
  const refMid = (refMult.low + refMult.high) / 2;

  // Whole-home kitchen and bathroom counts are priced as modules added to or
  // removed from the scaled base, not as multipliers. The adjustment is applied
  // after size scaling because a bathroom costs what a bathroom costs whatever
  // the size of the house, and is scaled by the planning adjustment so it stays
  // consistent with every other figure the estimator shows.
  const modules = getModuleAdjustment(safeInput.project, input.refinements, safeInput.finish);
  const moduleMid =
    ((modules.low + modules.high) / 2) * PLANNING_RANGE_ADJUSTMENT;

  // On a bathroom project the count multiplies rather than adds: three
  // bathrooms is three of the thing being priced, not one large one. Reading it
  // as a single big room and scaling sublinearly understated a three-bathroom
  // project by roughly 43%, which is the direction that sets an expectation a
  // proposal cannot meet.
  const bathroomInstances =
    safeInput.project === "bathroom" && input.refinements.bathroomCount !== null
      ? Math.max(1, input.refinements.bathroomCount)
      : 1;

  const center = Math.max(
    1000,
    (baseMid * sizeMult * refMid + moduleMid) * bathroomInstances,
  );

  // The BAND starts at the category's own natural spread and TIGHTENS as the
  // user supplies more detail, so a fully-specified estimate is genuinely more
  // precise - not just a higher "detail" score. This is what makes "improve
  // estimate accuracy" real: fewer unknowns, a narrower range.
  const rawBand = (base.high - base.low) / (base.high + base.low);
  // Compress the category's natural spread so even a bare estimate reads as a
  // confident, personalized range - not guesswork. A too-wide range erodes
  // trust, and an inflated high end scares qualified homeowners off before we
  // get to talk value. Clamp the starting spread to a sensible maximum.
  // The base range now comes from the owner's own cost guide, so it IS the
  // honest spread for a typical project. Compressing it (this previously
  // multiplied by 0.82 to make ranges read as more confident) would quote a
  // narrower range than our own published guidance, claiming precision the
  // source does not support. The starting band therefore reproduces the guide
  // exactly, and only real detail from the visitor tightens it below that.
  const MAX_START_BAND = 0.28; // safety cap; no current category reaches it
  const startBand = Math.min(MAX_START_BAND, rawBand);

  const detailRatio = maxFields > 0 ? Math.min(1, userRefinementCount / maxFields) : 0;
  const BAND_TIGHTENING = 0.6; // remove up to 60% of the band at full detail
  const MIN_BAND = 0.1; // keep an honest band (~1.2x); never a false single number
  const band = Math.max(MIN_BAND, startBand * (1 - BAND_TIGHTENING * detailRatio));

  const priceLow = Math.round((center * (1 - band)) / 1000) * 1000;
  const priceHigh = Math.round((center * (1 + band)) / 1000) * 1000;

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
  /**
   * The visitor's literal on-screen choices, attached by the estimator so the
   * consultation form can forward them to the emails. The engine itself does
   * not use these; they exist so an emailed estimate can restate the layout
   * card and upgrade chips that were actually clicked, rather than only the
   * refinements those choices happened to derive.
   */
  layoutLabel?: string;
  upgradeLabels?: string[];
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

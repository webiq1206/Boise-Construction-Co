/**
 * PROJECT TYPES SPAN TWO BUSINESSES, AND ONLY ONE IS SOLD.
 *
 * The first three are new residential construction and are what the estimator
 * offers the public (see PROJECT_TYPE_ORDER in EstimateCalculator, which is the
 * list a visitor actually sees). The remodel types below them are retained
 * because the company still takes RE-10 repair work, because the guide engine's
 * market ceiling for new construction is derived from them, and because they
 * carry a large calibrated invariant suite that is worth keeping rather than
 * deleting. They are not offered on the public calculator.
 */
export type NewConstructionProjectType =
  | "custom-home"
  | "semi-custom-home"
  | "build-on-your-lot"
  | "shop-home";

export type RemodelProjectType =
  | "kitchen"
  | "bathroom"
  | "whole-home"
  | "addition"
  | "adu"
  | "basement";

export type ProjectType = NewConstructionProjectType | RemodelProjectType;

/** The projects the public estimator offers. */
export const NEW_CONSTRUCTION_PROJECT_TYPES: NewConstructionProjectType[] = [
  "custom-home",
  "semi-custom-home",
  "build-on-your-lot",
  "shop-home",
];

export function isNewConstructionProject(
  project: ProjectType,
): project is NewConstructionProjectType {
  return (NEW_CONSTRUCTION_PROJECT_TYPES as ProjectType[]).includes(project);
}
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
  | "aduConfig"
  | "garageBays"
  | "basementType"
  | "lotServices"
  | "siteDifficulty"
  | "coveredOutdoor"
  | "shopSize";

/** Garage size, asked as bays because that is how buyers think about it. */
export type GarageBays = "none" | "two" | "three" | "four";

/** Basement, asked in the three forms a Treasure Valley buyer actually chooses between. */
export type BasementType = "none" | "unfinished" | "finished";

/**
 * Whether the lot is on city water and sewer or needs its own well and septic.
 * This is the single largest site-cost swing in a Treasure Valley build, so it is
 * asked explicitly rather than assumed.
 */
export type LotServices = "city" | "well-septic" | "unsure";

export type SiteDifficulty = "simple" | "moderate" | "steep";

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
  /**
   * Kitchen and bathroom: which upgrade components the homeowner is actually
   * redoing (the "what are you upgrading" chips). null or an empty array means
   * "not specified", which is priced as a full typical remodel. A non-empty
   * subset scopes the estimate down: unselected components have their share of
   * the variable cost removed, while fixed work (demolition, rough plumbing,
   * permits, project management) stays in regardless. See UPGRADE_SCOPE_WEIGHTS.
   */
  upgradeScope: string[] | null;

  /* ------------------------------------------- new residential construction */

  /** Attached garage, asked in bays. */
  garageBays: GarageBays | null;
  /** Basement, and whether it is finished living space or shell only. */
  basementType: BasementType | null;
  /** City water and sewer, or a well and septic system. */
  lotServices: LotServices | null;
  /** How much earthwork and access the site needs. */
  siteDifficulty: SiteDifficulty | null;
  /** Covered patio or covered deck, in square feet. */
  coveredOutdoor: number | null;
  /** Working shop area on a shop home, in square feet. */
  shopSize: number | null;
}

/* ----------------------------- construction selection to engine quantities */

/**
 * Garage bays to square feet. A bay is about 240 SF including circulation, which
 * matches the 480 SF two-car and 720 SF three-car garages built here.
 */
export const GARAGE_BAY_SQFT: Record<GarageBays, number> = {
  none: 0,
  two: 480,
  three: 720,
  four: 960,
};

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

/**
 * The new-construction counterpart. On a remodel the unknowns are inside the
 * house; on a build they are under it. Same promise, different unknowns, and
 * saying "what is behind the walls" to someone with a bare lot reads as
 * boilerplate written for a different company.
 */
export const NEW_CONSTRUCTION_ONSITE_NOTICE =
  "Every lot is different, and the things that move a build budget most (soils and how deep we have to dig, slope, how far utilities have to run, access for concrete and framing trucks, and what the jurisdiction requires) cannot be assessed from a web form. A firm, itemized proposal follows a site visit and a lot review.";

export function getOnsiteNotice(project: ProjectType): string {
  return isNewConstructionProject(project)
    ? NEW_CONSTRUCTION_ONSITE_NOTICE
    : ONSITE_REQUIRED_NOTICE;
}

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
 * homeowner sees that permits and coordination are covered rather than
 * assuming they are extras.
 *
 * The coordination line is deliberately phrased as the benefit rather than as
 * "project management". The homeowner still learns it is included and costs
 * them nothing extra, but the estimate never uses the vocabulary of a priced
 * management line - see CLIENT_FORBIDDEN_PHRASES in shared/costCatalog.ts for
 * why that vocabulary is kept off every lead-facing surface.
 */
const UNIVERSAL_INCLUDES = [
  "Design and planning",
  "Permits",
  "Demolition and disposal",
  "Labor and materials",
  "One dedicated point of contact from start to finish",
  "Standard warranties",
];

/**
 * Exclusions and assumptions that hold for every project type.
 *
 * Written tight on purpose. These lists are the bulk of the confirmation email
 * and of the on-page scope panel, and a homeowner skims fine print or ignores
 * it. Every distinct fact below is one a lead needs, so the editing is to the
 * wording and never to the substance: no item has been dropped to save room,
 * only said in fewer words.
 */
const UNIVERSAL_EXCLUDES = [
  "Appliances, cookware, and small-appliance storage. Appliances are client-supplied: we guide selection but do not purchase or install",
  "Unknown conditions found at demolition: rot, water damage, failed framing, pest damage",
  "Hazardous material abatement (asbestos, lead paint), common in pre-1980 homes",
  "Code upgrades triggered by inspection: panel replacement, egress, insulation",
  "Furniture, decor, window coverings, and art",
  "Landscaping or exterior restoration beyond the work area",
  "Temporary housing, storage, or moving costs",
];

const UNIVERSAL_ASSUMPTIONS = [
  "The home is structurally sound, with no active leaks, rot, or pest damage",
  "Systems not being replaced already meet code",
  "Work runs in one continuous phase with normal site access",
  "Standard lead times, with no expedited or special-order surcharges",
  "Finishes come from the allowances set during design",
  "2025 Boise-area labor and material costs",
  // "A typical project with no major structural issues" used to sit here and
  // said the same thing as the first line, which already covers structure.
];

const UNIVERSAL_INCREASES = [
  "Relocating plumbing, gas, or load-bearing walls",
  "Structural surprises found once walls or floors are open",
  "Knob-and-tube wiring, galvanized supply lines, or plaster in older homes",
  "Custom millwork, imported stone, or specialty-order materials",
  "A compressed schedule, or living in the home during construction",
  "Difficult access: second story, tight lots, limited staging",
];

const UNIVERSAL_DECREASES = [
  "Keeping the existing layout and plumbing locations",
  "Stock or semi-custom cabinetry instead of fully custom",
  "Reusing sound cabinet boxes, flooring, or fixtures where practical",
  "A flexible timeline that lets us schedule efficiently",
  "Combining adjacent rooms into a single mobilization",
];

/* --------------------------------------------------------------------------
 * New-construction disclosure lists.
 *
 * The lists above describe a remodel: demolition, what is behind the walls,
 * knob-and-tube, reusing cabinet boxes. None of that applies to a bare lot, and
 * these lists are the bulk of the confirmation email and the on-page scope
 * panel, so getting them wrong is the most visible way the estimate can read as
 * a remodeler's form with the words swapped.
 *
 * Same editing discipline as the remodel lists: every distinct fact a lead needs
 * is here, said in as few words as it can be said in. Nothing was dropped for
 * length.
 * ------------------------------------------------------------------------ */

const NC_INCLUDES = [
  "Architectural design, engineering, and permit-ready drawings",
  "Building permits and plan review",
  "Foundation, framing, envelope, and finishes",
  "Labor and materials",
  "One dedicated point of contact from start to finish",
  "Standard warranties",
];

const NC_EXCLUDES = [
  "The land itself, and closing costs on the lot",
  "Appliances, cookware, and small-appliance storage. Appliances are client-supplied: we guide selection but do not purchase or install",
  "Impact fees, utility connection and meter fees, and district assessments, which are set by the jurisdiction and vary by address",
  "Well drilling and septic design or installation where no municipal service exists",
  "Unknown subsurface conditions: rock, high groundwater, expansive or unstable soils, buried debris",
  "Off-site work a jurisdiction may require: road frontage, curb and gutter, sidewalk, or utility extension",
  "Landscaping, fencing, and irrigation beyond the finish grade around the home",
  "Furniture, decor, window coverings, and art",
  "Temporary housing, storage, or moving costs",
];

const NC_ASSUMPTIONS = [
  "The lot is buildable, legally platted, and has recorded access",
  "Soils are typical for the area and support a conventional foundation",
  "Power, water, and sewer are available at or near the property line",
  "Work runs in one continuous phase with normal site access",
  "Standard lead times, with no expedited or special-order surcharges",
  "Finishes come from the allowances set during design",
  "2025 Boise-area labor and material costs",
];

const NC_INCREASES = [
  "A sloped lot, or one needing significant cut, fill, or retaining",
  "Rock, high groundwater, or soils that require an engineered foundation",
  "Long utility runs, a shared or new well, or a septic system",
  "Daylight or walkout basements, and tall or complex rooflines",
  "Custom millwork, imported stone, or specialty-order materials",
  "A compressed schedule, or a winter foundation pour",
  "Difficult access: narrow county roads, tight infill lots, limited staging",
];

const NC_DECREASES = [
  "Starting from a proven plan instead of a fully custom design",
  "A flat, rectangular lot with utilities already at the line",
  "A simpler footprint and roofline, which cuts framing and envelope labor",
  "Stock or semi-custom cabinetry instead of fully custom",
  "A single-story plan on a slab or crawlspace rather than a basement",
  "A flexible timeline that lets us schedule efficiently",
];

const PROJECT_UPGRADES: Record<ProjectType, string[]> = {
  "custom-home": [
    "A finished basement, which is the cheapest square footage you will ever add",
    "A larger garage or a shop bay with its own overhead door",
    "Covered outdoor living with a fireplace and heaters",
    "A high-performance envelope package for lower running costs",
    "A primary suite with a wet room or a soaking alcove",
  ],
  "semi-custom-home": [
    "Structural options the plan already supports, such as a bonus room over the garage",
    "Upgrading the elevation to more stone or timber",
    "A third or fourth garage bay",
    "Extending the covered patio across the rear elevation",
    "A finished basement under the existing footprint",
  ],
  "build-on-your-lot": [
    "A shop or detached garage alongside the house",
    "A finished basement where the soils and water table allow",
    "Covered outdoor living oriented to the view",
    "A high-performance envelope package, which pays back faster on a rural site",
    "Landscaping and irrigation beyond the front yard",
  ],
  "shop-home": [
    "A taller shop for an RV or a lift, which changes the door and the wall height",
    "Heating the shop, and insulating it well enough to be worth heating",
    "A floor drain, compressed air lines, or a wash bay",
    "A mezzanine or office inside the shop footprint",
    "Finishing the shop interior rather than leaving the structure exposed",
  ],
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
  // Appliances already have a universal exclusion; a second kitchen-specific
  // one two lines below it made the same point twice. Cookware and
  // small-appliance garages fold into the universal line instead.
  kitchen: [],
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
  /*
   * All four tiers are offered on a new home, because a new build genuinely
   * spans from production-grade specification to fully bespoke. What the tiers
   * mean is different from a remodel, though: on a new home the shell is the
   * same shell at every tier, and the tier describes the specification level of
   * everything inside and on the elevation. See NEW_CONSTRUCTION_FINISH_LABELS
   * for the names a visitor sees, which are not the internal keys.
   */
  "custom-home": {
    refresh: [
      "Production-grade specification, custom plan",
      "LVP and carpet throughout, tile in wet areas",
      "Painted stock cabinetry with quartz counters",
      "Siding elevation with a stone accent",
      "Front-yard landscaping and irrigation",
    ],
    "mid-range": [
      "Custom plan drawn for your lot and how you live",
      "Engineered hardwood in living areas, tile in baths",
      "Semi-custom cabinetry with quartz throughout",
      "Mixed siding and stone elevation",
      "Gas fireplace and covered patio",
    ],
    "high-end": [
      "Fully bespoke plan with structural steel for open spans",
      "Wide-plank hardwood and large-format tile",
      "Custom cabinetry, built-ins and a custom vent hood",
      "Stone-forward elevation with timber accents",
      "Designer lighting and custom closet systems",
    ],
    luxury: [
      "Architect-led design with no repeated detail",
      "Stone, hardwood and specialty metals throughout",
      "Fully custom millwork and cabinetry",
      "Timber, stone and standing-seam elevation",
      "Every room specified individually",
    ],
  },
  "semi-custom-home": {
    refresh: [
      "An existing plan built as drawn",
      "LVP and carpet throughout, tile in wet areas",
      "Painted stock cabinetry with quartz counters",
      "Siding elevation with a stone accent",
      "Front-yard landscaping and irrigation",
    ],
    "mid-range": [
      "An existing plan with the options you choose",
      "Engineered hardwood in living areas, tile in baths",
      "Semi-custom cabinetry with quartz throughout",
      "Mixed siding and stone elevation",
      "Gas fireplace and covered patio",
    ],
    "high-end": [
      "An existing plan taken to a custom specification",
      "Wide-plank hardwood and large-format tile",
      "Custom cabinetry and built-ins",
      "Stone-forward elevation",
      "Designer lighting and custom closets",
    ],
    luxury: [
      "An existing plan finished to a bespoke standard",
      "Stone and hardwood throughout",
      "Fully custom millwork",
      "Upgraded elevation in every material",
      "Specified room by room",
    ],
  },
  "build-on-your-lot": {
    refresh: [
      "Built on land you already own",
      "Production-grade specification",
      "LVP and carpet throughout, tile in wet areas",
      "Siding elevation with a stone accent",
      "Front-yard landscaping and irrigation",
    ],
    "mid-range": [
      "Built on land you already own, sited for the views and the sun",
      "Engineered hardwood in living areas, tile in baths",
      "Semi-custom cabinetry with quartz throughout",
      "Mixed siding and stone elevation",
      "Gas fireplace and covered patio",
    ],
    "high-end": [
      "Sited and designed specifically for your parcel",
      "Wide-plank hardwood and large-format tile",
      "Custom cabinetry, built-ins and a custom vent hood",
      "Stone-forward elevation with timber accents",
      "Designer lighting and custom closet systems",
    ],
    luxury: [
      "Architect-led design responding to the site",
      "Stone, hardwood and specialty metals throughout",
      "Fully custom millwork and cabinetry",
      "Timber, stone and standing-seam elevation",
      "Every room specified individually",
    ],
  },
  /*
   * The tiers describe the living half. The shop is the same shop at every
   * tier: a slab, a clear-span structure, doors and power. Nobody specifies a
   * luxury shop, and pretending the tier changes it would be a way of charging
   * for nothing.
   */
  "shop-home": {
    refresh: [
      "Living space and a working shop under one roof",
      "Insulated shop with an overhead door and 240V power",
      "LVP and carpet in the living space, tile in wet areas",
      "Painted stock cabinetry with quartz counters",
      "Metal or siding elevation on both halves",
    ],
    "mid-range": [
      "Living space and a working shop under one roof",
      "Insulated shop with an overhead door and 240V power",
      "Engineered hardwood in living areas, tile in baths",
      "Semi-custom cabinetry with quartz throughout",
      "Mixed siding and stone on the living elevation",
    ],
    "high-end": [
      "Living space finished to a custom standard beside the shop",
      "Insulated shop with an overhead door and 240V power",
      "Wide-plank hardwood and large-format tile",
      "Custom cabinetry and built-ins",
      "Stone-forward living elevation with timber accents",
    ],
    luxury: [
      "Living space specified room by room beside the shop",
      "Insulated shop with an overhead door and 240V power",
      "Stone and hardwood throughout the living space",
      "Fully custom millwork and cabinetry",
      "Timber, stone and standing-seam on the living elevation",
    ],
  },
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
  const nc = isNewConstructionProject(input.project);
  return {
    includes: [...(nc ? NC_INCLUDES : UNIVERSAL_INCLUDES), ...buildDynamicScope(input)],
    excludes: [
      ...(nc ? NC_EXCLUDES : UNIVERSAL_EXCLUDES),
      ...(PROJECT_EXCLUDES[input.project] ?? []),
    ],
    assumptions: nc ? NC_ASSUMPTIONS : UNIVERSAL_ASSUMPTIONS,
    increases: nc ? NC_INCREASES : UNIVERSAL_INCREASES,
    decreases: nc ? NC_DECREASES : UNIVERSAL_DECREASES,
    upgrades: PROJECT_UPGRADES[input.project],
  };
}

export const PROJECT_SIZE_CONFIG: Record<ProjectType, ProjectSizeConfig> = {
  /*
   * New construction sizes are FINISHED LIVING AREA, excluding the garage and
   * any unfinished basement, because that is the number on a plan and the number
   * a buyer quotes. The garage and basement are asked separately and priced on
   * top, so a visitor who enters 2,400 is not silently charged for 3,000.
   *
   * The 1,200 floor is a small single-level plan; 7,000 covers the largest
   * foothills homes built here. The baseline of 2,400 is the median new home in
   * the Treasure Valley and is the size every published cost figure is quoted
   * against (see shared/seoContent.ts).
   */
  "custom-home": { min: 1200, max: 7000, step: 100, baselineSqft: 2400 },
  "semi-custom-home": { min: 1200, max: 4500, step: 100, baselineSqft: 2200 },
  "build-on-your-lot": { min: 1200, max: 6000, step: 100, baselineSqft: 2400 },
  /*
   * Living area only; the shop is sized separately. The range starts lower and
   * tops out lower than a conventional house because a shop home splits the
   * budget: someone spending on 2,000 SF of shop is usually not also building
   * 5,000 SF of house.
   */
  "shop-home": { min: 800, max: 3500, step: 100, baselineSqft: 1700 },
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
  upgradeScope: null,
  garageBays: null,
  basementType: null,
  lotServices: null,
  siteDifficulty: null,
  coveredOutdoor: null,
  shopSize: null,
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
  "custom-home": { label: "Custom Home", sub: "Designed from scratch for you" },
  "semi-custom-home": { label: "Semi-Custom Home", sub: "An existing plan, your choices" },
  "build-on-your-lot": { label: "Build on My Lot", sub: "You already own the land" },
  "shop-home": { label: "Shop Home", sub: "A house and a shop, one roof" },
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

/**
 * The same four internal tiers, named for someone building a house.
 *
 * "Refresh" and "Mid-Range" are remodeling words: there is nothing to refresh in
 * a house that does not exist yet, and a buyer choosing a specification level
 * for a new home is not choosing how much of it to replace. The internal keys
 * stay as they are, because the entire calibrated rate ladder and its invariant
 * suite are keyed on them; only the display names change.
 */
export const NEW_CONSTRUCTION_FINISH_LABELS: Record<FinishLevel, { label: string; sub: string }> = {
  refresh: { label: "Essential", sub: "Well built, efficiently specified" },
  "mid-range": { label: "Signature", sub: "Our standard specification" },
  "high-end": { label: "Premium", sub: "Custom cabinetry, stone, hardwood" },
  luxury: { label: "Bespoke", sub: "Specified room by room" },
};

export function getFinishLabels(project: ProjectType): Record<FinishLevel, { label: string; sub: string }> {
  return isNewConstructionProject(project) ? NEW_CONSTRUCTION_FINISH_LABELS : FINISH_LABELS;
}

export function getFinishLabel(project: ProjectType, finish: FinishLevel): { label: string; sub: string } {
  return getFinishLabels(project)[finish];
}

const ALL_FINISH_LEVELS: FinishLevel[] = ["refresh", "mid-range", "high-end", "luxury"];

/**
 * Finish levels available for a given project type. "Refresh" (cosmetic
 * upgrades / repaint) is meaningless for an addition or a basement build-out, so
 * those start at "mid-range".
 *
 * New construction keeps all four, because the tier there describes
 * specification level rather than how much is being replaced, and a new home
 * genuinely spans from production-grade to bespoke.
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
  /*
   * Kitchen is calibrated 2026-07 against two issued estimates, not the guide.
   *
   * Every tier is scaled by 0.85 from the guide's published figures, which were
   * refresh [18750, 31250], mid-range [43750, 68750], high-end [100000, 162500]
   * and luxury [175000, 225000].
   *
   * Evidence. EST-10088 billed $34,335 and EST-10049 billed $31,850 for its
   * kitchen. Neither is directly comparable, because both carry a narrower
   * scope than this catalog's kitchen: EST-10088 has no flooring and no
   * backsplash, EST-10049 has no flooring, demolition, drywall or paint in the
   * kitchen line. Normalizing each to the full component scope in
   * costCatalog.ts (by the share of direct work it actually covers, and
   * removing the client-supplied appliances EST-10049 lists) puts a
   * full-scope, mid-range equivalent at about $35,250 and $46,330 against a
   * model that quoted $49,500. That is 0.71x and 0.94x.
   *
   * The two disagree, so 0.85 is deliberately the conservative middle rather
   * than the lower reading. Cutting to 0.71 would match EST-10088 but would
   * under-quote a genuinely full-scope kitchen, which is the more expensive
   * mistake: the floor is what a homeowner holds you to. One more closed
   * kitchen with its square footage recorded settles this properly.
   *
   * NOTE none of the reference estimates state square footage, so the 250 sq ft
   * baseline is assumed rather than measured. See ESTIMATOR-CALIBRATION.md.
   */
  /*
   * NEW CONSTRUCTION. These cells serve a narrower purpose than the remodel ones.
   *
   * The number a visitor sees comes from the line-item takeoff in
   * shared/costs/newConstructionRules.ts, not from here. What these do is feed
   * `marketCeiling`, the guard that stops the takeoff quoting above what the
   * business is willing to charge. They are therefore set with deliberate
   * headroom above the takeoff at baseline size, roughly 15 percent, so the guard
   * stays out of the way at ordinary configurations and only fires on genuinely
   * extreme scope (a steep foothills lot, a well and septic, and a bespoke
   * specification all at once). Setting them tight to the takeoff would trim
   * margin on normal homes and freeze the price against every further input.
   *
   * `high` is multiplied by PLANNING_RANGE_ADJUSTMENT_HIGH (0.8) before use, so
   * a ceiling of $815,000 is written here as $1,019,000.
   *
   * ROI IS ZERO ON PURPOSE, and the results panel hides the resale line when it
   * is. "Typical resale return for this project type" is a remodeling measure: it
   * compares what you spent against what it added to an existing house. A new
   * home has no before, and quoting a percentage would be inventing a claim we
   * cannot support.
   */
  "custom-home": {
    refresh: {
      low: 560000, high: 840000, roi: 0,
      included: ["Custom plan drawn for your lot", "Production-grade specification", "Permits and inspections", "Front-yard landscaping and irrigation"],
    },
    "mid-range": {
      low: 680000, high: 1020000, roi: 0,
      included: ["Custom plan and engineering", "Semi-custom cabinetry and quartz throughout", "Mixed siding and stone elevation", "Gas fireplace and covered patio"],
    },
    "high-end": {
      low: 980000, high: 1500000, roi: 0,
      included: ["Fully bespoke plan with steel for open spans", "Custom cabinetry and built-ins", "Stone-forward elevation with timber", "Designer lighting and custom closets"],
    },
    luxury: {
      low: 1450000, high: 2240000, roi: 0,
      included: ["Architect-led design", "Stone, hardwood and specialty metals", "Fully custom millwork", "Every room specified individually"],
    },
  },
  "semi-custom-home": {
    refresh: {
      low: 520000, high: 800000, roi: 0,
      included: ["An existing plan built as drawn", "Production-grade specification", "Permits and inspections", "Front-yard landscaping and irrigation"],
    },
    "mid-range": {
      low: 640000, high: 980000, roi: 0,
      included: ["An existing plan with your options", "Semi-custom cabinetry and quartz throughout", "Mixed siding and stone elevation", "Gas fireplace and covered patio"],
    },
    "high-end": {
      low: 930000, high: 1440000, roi: 0,
      included: ["An existing plan at custom specification", "Custom cabinetry and built-ins", "Stone-forward elevation", "Designer lighting and custom closets"],
    },
    luxury: {
      low: 1380000, high: 2150000, roi: 0,
      included: ["An existing plan finished bespoke", "Stone and hardwood throughout", "Fully custom millwork", "Specified room by room"],
    },
  },
  "build-on-your-lot": {
    refresh: {
      low: 560000, high: 850000, roi: 0,
      included: ["Built on land you already own", "Lot feasibility and siting", "Production-grade specification", "Permits and inspections"],
    },
    "mid-range": {
      low: 690000, high: 1040000, roi: 0,
      included: ["Sited for views, sun and drainage", "Semi-custom cabinetry and quartz throughout", "Mixed siding and stone elevation", "Well and septic coordination where needed"],
    },
    "high-end": {
      low: 990000, high: 1530000, roi: 0,
      included: ["Designed specifically for your parcel", "Custom cabinetry and built-ins", "Stone-forward elevation with timber", "Designer lighting and custom closets"],
    },
    luxury: {
      low: 1470000, high: 2280000, roi: 0,
      included: ["Architect-led design responding to the site", "Stone, hardwood and specialty metals", "Fully custom millwork", "Every room specified individually"],
    },
  },
  /*
   * Shop homes sit well below the other three, and the reason is arithmetic
   * rather than a cheaper house: the ceiling is quoted against LIVING area, and
   * a shop home's living area is typically 1,400 to 2,200 SF where a custom home
   * is 2,400 to 4,000. The shop is real money but it is not living area, so it
   * lands in the takeoff without inflating the ceiling basis.
   *
   * Same 15% headroom above the baseline takeoff as the other new-construction
   * cells, and the same `high` inflation for PLANNING_RANGE_ADJUSTMENT_HIGH.
   */
  "shop-home": {
    refresh: {
      low: 470000, high: 760000, roi: 0,
      included: ["Living space and a working shop under one roof", "Insulated shop with an overhead door and 240V power", "Production-grade specification", "Permits and inspections"],
    },
    "mid-range": {
      low: 590000, high: 950000, roi: 0,
      included: ["Living space and a working shop under one roof", "Insulated shop with an overhead door and 240V power", "Semi-custom cabinetry and quartz throughout", "Mixed siding and stone on the living elevation"],
    },
    "high-end": {
      low: 850000, high: 1370000, roi: 0,
      included: ["Living space at a custom specification", "Insulated shop with an overhead door and 240V power", "Custom cabinetry and built-ins", "Stone-forward living elevation"],
    },
    luxury: {
      low: 1200000, high: 1950000, roi: 0,
      included: ["Living space specified room by room", "Insulated shop with an overhead door and 240V power", "Fully custom millwork", "Timber, stone and standing-seam on the living elevation"],
    },
  },
  kitchen: {
    refresh: {
      low: 15900, high: 26600, roi: 72,
      included: ["New countertops (laminate/entry quartz)", "Cabinet repaints or door replacement", "New plumbing fixtures", "LVP or tile flooring"],
    },
    "mid-range": {
      low: 37200, high: 58400, roi: 74,
      included: ["Semi-custom cabinetry", "Quartz or granite countertops", "Tile backsplash", "Updated plumbing and electrical"],
    },
    "high-end": {
      low: 85000, high: 138100, roi: 70,
      included: ["Custom or semi-custom cabinetry", "Premium stone countertops", "Island addition or expansion", "Custom tile work and lighting redesign"],
    },
    luxury: {
      low: 148800, high: 191300, roi: 62,
      included: ["Fully custom cabinetry", "Exotic stone countertops", "Structural layout changes", "Smart home integration"],
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
  /*
   * Whole-home is an OWNER PRICING DECISION (2026-07), not the guide and not a
   * regression against closed jobs.
   *
   * Every tier scaled by 4/3 from the guide, which published refresh
   * [54000, 90000], mid-range [135000, 225000], high-end [270000, 387000] and
   * luxury [450000, 765000]. The factor is set by the mid-range target: an
   * 1,800 sq ft mid-range whole-home now quotes $180,000 to $240,000, a $100/sf
   * floor, against $135,000 to $180,000 ($75/sf) before.
   *
   * Evidence status. The range test found no systematic bias to correct: the
   * two reference jobs erred in OPPOSITE directions (VA Proposal 0.84x, i.e.
   * the engine quoting LOW, and a water-damage repair 1.45x high, which is not
   * a remodel). So the data did not contradict an increase, and the one job
   * that was a real renovation said the engine was low. The size of the
   * increase is the owner's market judgement. Set the factor back to 1 to
   * restore the guide.
   *
   * Tier spacing improves: mid-range to high-end was an unusually wide 1.93x
   * and the ladder is unchanged because all four tiers moved together.
   */
  "whole-home": {
    refresh: {
      low: 72000, high: 120000, roi: 65,
      included: ["Kitchen and bath cosmetic refresh", "New flooring throughout", "Fresh interior paint", "Updated light fixtures"],
    },
    "mid-range": {
      low: 180000, high: 300000, roi: 68,
      included: ["Kitchen and bath mid-range renovation", "Open-concept conversion", "New flooring throughout", "Updated HVAC and windows"],
    },
    "high-end": {
      low: 360000, high: 516000, roi: 62,
      included: ["Custom kitchen and bath renovation", "Structural modifications", "New windows and doors", "High-end finishes throughout"],
    },
    luxury: {
      low: 600000, high: 1020000, roi: 55,
      included: ["Full gut renovation", "Structural engineering", "Smart home system", "Premium finishes throughout", "New HVAC, electrical and plumbing"],
    },
  },
  /*
   * Addition rates are derived from the calibrated ADU, not from the 2025 cost
   * guide, because the guide's addition numbers were internally contradictory.
   *
   * At every matched size the guide made a room addition cost MORE per square
   * foot than an ADU: $282 to $345 against $248 to $303 at 600 sq ft. That is
   * backwards. An ADU carries a full kitchen, a full bathroom and its own
   * utility connections, which the component catalog puts at 18% of its cost
   * and which a bedroom or family room addition does not have. The guide's ADU
   * figure was already proven 26% high by a real closed job, and its addition
   * figure was never corrected, so the two drifted into contradiction.
   *
   * Derivation: strip those three components (18%) from the calibrated ADU,
   * then add back 10% for tying into an existing structure, which an ADU on a
   * clean pad never pays: demolishing the exterior wall, the structural
   * header, and matching roofline and finishes. Net 0.902 of an equivalent
   * size ADU, which puts every tier at 0.8116 of the guide.
   *
   * This is DERIVED, not measured. It is better founded than the guide, which
   * is demonstrably wrong here, but one real closed addition would beat it.
   * See ESTIMATOR-CALIBRATION.md.
   */
  addition: {
    "mid-range": {
      low: 97000, high: 138000, roi: 63,
      included: ["Bedroom or family room addition", "Full HVAC integration", "Updated electrical panel", "Mid-range finishes"],
    },
    "high-end": {
      low: 162000, high: 227000, roi: 58,
      included: ["400 to 600 sqft addition", "High-end finishes", "Full integration with existing layout", "Custom windows and doors"],
    },
    luxury: {
      low: 276000, high: 373000, roi: 50,
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
  // A new home is close to linear in size: more square feet is more foundation,
  // more roof, more framing and more finish. It is not fully linear, because the
  // kitchen, the mechanical plant, the permit and the site work are largely
  // fixed, which is why a 4,500 sq ft home costs less per square foot than a
  // 1,600 sq ft one. 0.92 reproduces the line-item takeoff's own size curve.
  "custom-home": 0.92,
  "semi-custom-home": 0.92,
  "build-on-your-lot": 0.92,
  // Lower than the others because the basis is living area only. Growing the
  // living half of a shop home leaves the shop, the site work and the slab where
  // they were, so the marginal square foot moves the total less.
  "shop-home": 0.85,
  kitchen: 0.55, // cabinet runs + appliance count dominate, not floor area
  bathroom: 0.6, // fixture count and tile area, not floor area
  'whole-home': 0.85, // more area genuinely means more rooms to touch
  addition: 0.95, // new square footage: near-linear
  adu: 0.9, // new construction, but fixed kitchen/bath cores dilute it
  basement: 0.75, // large open areas are cheap per sqft once systems are in
};

function getSizeMultiplier(sqft: number, project: ProjectType): number {
  const config = PROJECT_SIZE_CONFIG[project];

  /*
   * Guard the INPUT, not the output.
   *
   * This used to clamp the ratio to [0.35, 3] and the result to [0.6, 2] as a
   * runaway guard. But sqft is already bounded by the project's own slider and
   * re-validated server side, so those clamps were redundant, and they bound
   * well inside the legitimate range instead of at the extremes:
   *
   *   whole-home at 8,000 sqft   understated by 78% (quoted as ~4,000 sqft)
   *   addition at 1,200 sqft     understated by 42%
   *   small whole-home, addition, adu, basement   overstated by 10 to 20%
   *
   * Worst of all it produced plateaus: every whole-home between 4,070 and
   * 8,000 sqft returned an identical price, as did every addition above about
   * 830 sqft. The monotonicity invariant missed it because equal is not less.
   *
   * Clamping sqft to the project's configured range bounds the input honestly
   * and lets the elasticity curve run over the whole legitimate span.
   */
  const bounded = Math.max(config.min, Math.min(config.max, sqft));
  return Math.pow(bounded / config.baselineSqft, SIZE_ELASTICITY[project]);
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
 *
 * STALE AS OF 2026-07 - the table above no longer reconciles. Whole-home was
 * raised by 4/3 (owner pricing decision) and kitchen was cut to 0.85 (calibrated
 * against two issued estimates), while the bathroom rate did not move. Re-running
 * the same arithmetic on the current numbers leaves $75/sq ft of residual at two
 * baths, where the original solve accepted $37 and rejected $51 as impossible.
 *
 * The count is deliberately LEFT AT 2 rather than re-solved. Re-solving would
 * push it to about 4, and because this is the figure the stated-bathroom-count
 * adjustment measures FROM, raising it would quietly discount every home with
 * fewer than four baths and cancel out the increase that was just applied.
 *
 * The honest reading is that the residual test itself is too crude now: it
 * treats everything that is not a kitchen or a bath as "flooring, paint and
 * trim", when whole-home scope also carries HVAC, windows, electrical and
 * plumbing. Settling this properly needs a closed whole-home job with its
 * square footage and bathroom count, not more arithmetic on published rates.
 * See ESTIMATOR-CALIBRATION.md.
 */
const WHOLE_HOME_ASSUMED_BATHS = 2;

/**
 * Square feet of house per bathroom the whole-home rate already covers.
 *
 * The count above is solved at the 1,800 sq ft reference, but the rate is then
 * scaled across an 800 to 8,000 sq ft slider, and the bath content embedded in
 * it scales too. Holding the reference at a flat 2 makes the adjustment measure
 * from the wrong place at every size except the baseline.
 *
 * Solved the same way as the baseline count. Subtract a kitchen and N baths
 * from the whole-home figure and read the residual left for general living
 * space, which should stay roughly constant across house sizes because
 * flooring, paint and trim do not get cheaper per foot as a house grows. At
 * mid-range the 1,800 sq ft reference leaves $39/sq ft with 2 baths, and that
 * same residual is reproduced by:
 *
 *   1,800 sq ft -> 2 baths      5,000 sq ft -> 5 baths
 *   3,000 sq ft -> 3 baths      8,000 sq ft -> 8 baths
 *
 * which is one bath per 1,000 sq ft, and returns exactly 2 at the reference so
 * the source-fidelity check is untouched.
 *
 * Note what this implies: eight bathrooms in an 8,000 sq ft house is a lot, so
 * the top of the size curve is probably generous. That is a question about the
 * elasticity, not about this constant, and it is recorded in
 * ESTIMATOR-CALIBRATION.md rather than papered over here.
 */
const WHOLE_HOME_SQFT_PER_BATH = 1000;

/**
 * Bathrooms the published rate already covers for a house of this size.
 *
 * This is a reference point, never a default applied to a lead: the estimator
 * asks for the real count, and this is only what the adjustment measures FROM.
 */
export function getAssumedBathroomsForSize(
  project: ProjectType,
  sqft: number,
): number | null {
  if (project === "whole-home") {
    return Math.max(1, Math.round(sqft / WHOLE_HOME_SQFT_PER_BATH));
  }
  return ASSUMED_BATHROOMS[project] ?? null;
}
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
  sqft: number,
): { low: number; high: number } {
  let low = 0;
  let high = 0;

  // The bathroom project scales by count instead; see bathroomInstances.
  // Whole-home's reference scales with house size; every other project's is
  // fixed, because a basement or addition does not gain baths as it grows.
  const assumed =
    project === "bathroom"
      ? undefined
      : (getAssumedBathroomsForSize(project, sqft) ?? undefined);
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

/**
 * How much of a full kitchen or bathroom each upgrade chip accounts for.
 *
 * These are the "what are you upgrading" chips. A homeowner redoing only some
 * of them is doing a partial remodel that should cost less than a full one, but
 * not proportionally less: demolition, rough plumbing, permits and project
 * management happen regardless of which finishes are touched. So each weight is
 * the component's share of the VARIABLE cost only, and the fixed remainder
 * (1 minus the sum of the weights) is always charged.
 *
 * Values are informed by the component catalog (see costCatalog.ts): a kitchen
 * is cabinet-dominated, a bathroom is split across the wet area, tile and
 * vanity. Selecting every chip reproduces the full base rate exactly, so the
 * source-fidelity check is untouched; selecting a subset scopes down; selecting
 * none is treated as "not specified" and priced as a full typical remodel.
 *
 * Only kitchen and bathroom have finish-scope chips. Additions and ADUs list
 * what a build inherently includes (foundation, framing), which is not optional
 * and therefore does not scope the price.
 */
const UPGRADE_SCOPE_WEIGHTS: Partial<Record<ProjectType, Record<string, number>>> = {
  kitchen: { cabinets: 0.24, counters: 0.12, flooring: 0.06, lighting: 0.06 },
  bathroom: { shower: 0.1, tub: 0.08, vanity: 0.1, tile: 0.12 },
};

/**
 * Scope factor in [fixedFraction, 1]. 1.0 when the project has no scope chips,
 * or when the homeowner has not specified a subset (null/empty), or when they
 * selected everything. Below 1.0 for a genuine partial scope.
 */
export function getUpgradeScopeMultiplier(
  project: ProjectType,
  scope: string[] | null | undefined,
): number {
  const weights = UPGRADE_SCOPE_WEIGHTS[project];
  if (!weights) return 1;
  if (!scope || scope.length === 0) return 1; // not specified -> full typical

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const fixedFraction = 1 - total;
  const selected = scope.reduce((sum, id) => sum + (weights[id] ?? 0), 0);
  // Clamp so an unknown id or a superset can never push above the full rate.
  return Math.min(1, fixedFraction + selected);
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
  const modules = getModuleAdjustment(
    safeInput.project,
    input.refinements,
    safeInput.finish,
    safeInput.sqft,
  );
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

  // Partial-scope discount for kitchen and bathroom: doing only some of the
  // upgrade components costs less than a full remodel. 1.0 when the scope is
  // unspecified or complete, so a typical estimate is unchanged.
  const scopeMult = getUpgradeScopeMultiplier(
    safeInput.project,
    input.refinements.upgradeScope,
  );

  const center = Math.max(
    1000,
    (baseMid * sizeMult * refMid + moduleMid) * bathroomInstances * scopeMult,
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

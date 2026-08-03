/**
 * The contract between reading an architectural plan set and the estimator.
 *
 * Deliberately the same shape as shared/re10/extraction.ts, for the same
 * reason: the extractor's job is to read what the drawings say, the estimator's
 * job is to price it, and the boundary here means either can be changed or
 * stubbed without the other knowing.
 *
 * WHAT THIS TARGETS. Residential plan sets in this market put the numbers the
 * estimator needs in the cover-sheet titleblock, in almost exactly this form:
 *
 *     PROJECT INFORMATION
 *     DESCRIPTION: SINGLE FAMILY RESIDENCE
 *     SCOPE:  LIVABLE:  1ST FLOOR 1,129 SF   2ND FLOOR 908 SF   TOTAL 2,037 SF
 *             NON-LIVABLE:  GARAGE 488 SF    COVERED EXT. SPACE 0 SF
 *
 * That is a verbatim reading of one of the sets this schema was built against.
 * So the fields below are the fields a cover sheet actually states, rather than
 * a wish list, and everything is nullable because a schematic set states far
 * less than a permit set.
 *
 * THE MOST IMPORTANT FIELD IS `isNewConstruction`. Two of the four plan sets
 * used to design this were remodels and additions, carrying EXISTING, DEMO and
 * NEW sheet series and a titleblock that reads "REMODEL SITE". Feeding one of
 * those to a new-home estimator would price an entire house where the client
 * asked for a kitchen expansion, so it is asked explicitly and the caller is
 * expected to stop rather than to price it anyway.
 */

/** How sure the extractor is about a single reading. */
export type PlanConfidence = "high" | "medium" | "low";

/**
 * Everything worth pulling off a plan set, all optional.
 *
 * Areas are in square feet as printed. Nothing here is derived: if the cover
 * sheet gives floor areas but no total, the total stays null and the caller
 * adds them, because a total the drawings never stated is a number nobody can
 * check against the paper.
 */
export interface ExtractedPlan {
  /** True when this is a ground-up new home rather than a remodel or addition. */
  isNewConstruction: boolean;
  /** What the drawings call the project, e.g. "SINGLE FAMILY RESIDENCE". */
  description?: string | null;
  projectAddress?: string | null;

  /** Conditioned living area, excluding garage and covered outdoor space. */
  livableSqft?: number | null;
  /** Per-floor areas when stated, first floor first. */
  floorAreas?: number[] | null;
  storiesAboveGrade?: number | null;

  garageSqft?: number | null;
  /** Covered patio, covered deck, covered entry: roofed but not conditioned. */
  coveredOutdoorSqft?: number | null;

  bedrooms?: number | null;
  /** Full bathrooms. Half baths are counted separately. */
  fullBathrooms?: number | null;
  halfBathrooms?: number | null;

  /** "none" when the drawings show a slab or crawlspace and no basement. */
  basement?: "none" | "unfinished" | "finished" | null;

  /** Separate buildings drawn on the site plan. */
  accessoryStructures?: ExtractedStructure[] | null;

  /** Per-field confidence, so a low reading can be flagged for confirmation. */
  confidence: PlanConfidence;
  /** Anything a human should know: unreadable sheets, conflicts, missing pages. */
  notes: string[];
}

export interface ExtractedStructure {
  /** Free text as drawn: "SHOP", "DETACHED GARAGE", "ADU", "BARN". */
  label: string;
  sqft?: number | null;
  attached?: boolean | null;
}

/**
 * The JSON schema the model is constrained to.
 *
 * `additionalProperties: false` throughout, and every numeric field is nullable
 * so "the drawings do not say" has a representation that is not zero. Zero and
 * null are different answers here: a cover sheet stating COVERED EXT. SPACE 0 SF
 * is a fact, and a set that never mentions covered space is not.
 */
export const PLAN_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    isNewConstruction: {
      type: "boolean",
      description:
        "True only if this is a ground-up new home. False for a remodel, addition, tenant improvement, or any set carrying EXISTING/DEMO sheet series or describing work to a house that already stands.",
    },
    description: { type: ["string", "null"], description: "The project description as printed, e.g. 'SINGLE FAMILY RESIDENCE'." },
    projectAddress: { type: ["string", "null"] },

    livableSqft: {
      type: ["number", "null"],
      description:
        "Conditioned living area in square feet, as printed. Usually labelled LIVABLE, HEATED, or FINISHED. Excludes garage and covered outdoor space. Null if not stated.",
    },
    floorAreas: {
      type: ["array", "null"],
      items: { type: "number" },
      description: "Per-floor living areas in order, ground floor first, only when the set states them separately.",
    },
    storiesAboveGrade: { type: ["number", "null"], description: "Count of storeys of living space above grade. A basement does not count." },

    garageSqft: { type: ["number", "null"], description: "Garage area in square feet as printed. Null if not stated." },
    coveredOutdoorSqft: {
      type: ["number", "null"],
      description:
        "Roofed but unconditioned outdoor area: covered patio, covered deck, covered entry. Use 0 only if the set explicitly states zero.",
    },

    bedrooms: { type: ["number", "null"], description: "Count rooms labelled as bedrooms on the floor plans." },
    fullBathrooms: { type: ["number", "null"], description: "Bathrooms with a shower or tub." },
    halfBathrooms: { type: ["number", "null"], description: "Powder rooms: toilet and basin only." },

    basement: {
      type: ["string", "null"],
      enum: ["none", "unfinished", "finished", null],
      description:
        "'finished' when the basement is drawn as living space, 'unfinished' when it is shell or storage, 'none' for slab or crawlspace. Null if the drawings do not show the foundation type.",
    },

    accessoryStructures: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "As labelled on the drawings: SHOP, DETACHED GARAGE, ADU, BARN, POOL HOUSE." },
          sqft: { type: ["number", "null"] },
          attached: { type: ["boolean", "null"], description: "True if it shares a wall with the house." },
        },
        required: ["label"],
        additionalProperties: false,
      },
      description:
        "Separate buildings drawn on the site plan. Do NOT include the attached garage here; that is garageSqft. Omit structures the plans note as existing and not part of this work.",
    },

    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description:
        "'high' only when a titleblock or area schedule states the numbers outright. 'low' when you had to read them off the drawings or interpret.",
    },
    notes: {
      type: "array",
      items: { type: "string" },
      description: "Anything a human should know: pages that would not render, conflicting area figures, a set that stops at schematic.",
    },
  },
  required: ["isNewConstruction", "confidence", "notes"],
  additionalProperties: false,
} as const;

/**
 * What the extractor is told to do.
 *
 * Stated as prohibitions where it matters commercially. The expensive failure
 * mode is the same one the RE-10 extractor guards against: a confident number
 * the drawings never stated. Here it would set the square footage that the
 * entire estimate scales from, so a scaled-off guess is worse than a null.
 */
export const PLAN_EXTRACTION_SYSTEM_PROMPT = `You read residential architectural plan sets and permit drawings, and you extract the facts a home builder needs to produce a construction budget.

WHERE THE NUMBERS USUALLY ARE
Most residential sets state areas outright on the cover sheet, in a PROJECT INFORMATION or SCOPE block, in roughly this form:

  SCOPE:  LIVABLE:  1ST FLOOR 1,129 SF   2ND FLOOR 908 SF   TOTAL 2,037 SF
          NON-LIVABLE:  GARAGE 488 SF    COVERED EXT. SPACE 0 SF

Prefer a stated figure over anything you work out yourself, every time. Check the cover sheet and any area schedule before reading areas off the floor plans.

NEVER INVENT A NUMBER
- Give an area ONLY when the drawings state it or when you can read it from a dimensioned plan with confidence. If you cannot, use null.
- Do not scale, estimate, or infer square footage from the look of a drawing. Square footage is what the whole budget scales from, so a plausible guess is far worse than no answer: it produces a confident price for a house that was never drawn.
- Do not add floor areas together to produce a total the set does not state. Report the floors you found and leave the total null.
- 0 and null are different answers. Use 0 only when the drawings explicitly say zero.

NEW CONSTRUCTION VERSUS REMODEL - READ THIS CAREFULLY
Set isNewConstruction to FALSE if the set is for a remodel, addition, or alteration. Tell-tale signs: sheet series named EXISTING, DEMO, or NEW; a site plan labelled REMODEL SITE; notes such as "GARAGE NOT ALTERED DURING PROJECT" or "BASEMENT TO REMAIN UNCHANGED"; areas broken into EXISTING and NEW ADDITION; hatching that indicates existing construction to be demolished.

This matters more than anything else you report. These drawings are being used to budget a ground-up home, so a remodel set read as a new build would price an entire house that nobody asked for.

ACCESSORY STRUCTURES
Report separate buildings drawn on the site plan - shop, detached garage, ADU, guest house, barn, pool house - with their areas if stated. Do not put the attached garage here. If the drawings mark a structure as existing and outside the scope of this work, leave it out and say so in notes.

CONFIDENCE AND NOTES
Use "high" only when a titleblock or schedule stated the key areas outright. Use "low" when pages would not render, the set is schematic, or you had to interpret. Put anything odd in notes: conflicting area figures, missing sheets, a set that is clearly partial. A builder reads notes before trusting the numbers.

If the upload is not an architectural plan set at all, set isNewConstruction to false, leave the areas null, and say what it appears to be in notes.`;

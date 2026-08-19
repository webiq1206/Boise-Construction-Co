/**
 * Reading a plan set for MILLWORK, not for a house.
 *
 * WHY A SECOND EXTRACTION TARGET. The residential schema asks a plan set how
 * big the house is, how many bedrooms, how many baths. Pointed at a 103-sheet
 * restaurant set it answered honestly and uselessly: every residential field
 * null, because a steakhouse does not state them. The customer had asked for
 * "the millwork only", and there was no shape in the system capable of holding
 * that answer. A narrower question needs its own schema, not a narrower prompt
 * over the wrong one.
 *
 * THE UNIT IS A LINE ITEM, NOT A BUILDING. Millwork is priced per run, per
 * fixture, per sheet of paneling - so the output is a list of things with
 * quantities, each pinned to the sheet it was read from. That per-item sheet
 * reference is not decoration: it is how an estimator checks the takeoff
 * against the drawings before anyone bids it.
 *
 * QUANTITY BASIS IS THE HONESTY MECHANISM. A number lifted off a casework
 * schedule and a number scaled off a plan view are not the same fact, and
 * pricing them identically is how a takeoff quietly becomes fiction. Every item
 * records which it is, and the pricing layer treats them differently - see
 * ./pricing. "I could not determine this" is a first-class answer here.
 */

export type MillworkCategory =
  /** Base, upper, tall and island cabinet runs. Priced by linear foot. */
  | "cabinetry"
  /** Worktops of any material. Linear foot of finished top. */
  | "countertop"
  /** Purpose-built joinery: bar die, host stand, back bar, banquette, built-in seating. */
  | "built-in"
  /** Bathroom and similar vanity runs. */
  | "vanity"
  /** Wall panelling, wainscot, slat walls, feature ceilings. Priced by area. */
  | "paneling"
  /** Base, casing, crown, chair rail and other running trim. */
  | "trim"
  /** Shelving and closet/storage systems. */
  | "shelving"
  /** Doors supplied by the millwork package. */
  | "door"
  /** Anything real that does not fit above. Always priced with a caveat. */
  | "specialty";

export const MILLWORK_CATEGORY_LABELS: Record<MillworkCategory, string> = {
  cabinetry: "Cabinetry",
  countertop: "Countertops",
  "built-in": "Custom built-ins",
  vanity: "Vanities",
  paneling: "Wall panelling and feature walls",
  trim: "Trim and running millwork",
  shelving: "Shelving and closet systems",
  door: "Doors (millwork package)",
  specialty: "Specialty millwork",
};

export type MillworkUnit = "LF" | "SF" | "EA";

/**
 * Where the number came from. Ordered by how much weight it can carry.
 *
 * `scheduled` - written in a casework/millwork/finish schedule. Trustworthy.
 * `dimensioned` - read off a dimension string on a drawing. Trustworthy.
 * `counted` - the item is drawn and countable (four vanities on a plan).
 * `scaled` - measured off the drawing by eye or by scale. NOT trustworthy for a
 *   bid, and the pricing layer refuses to treat it as one.
 * `unknown` - the item is clearly present but no quantity is determinable.
 */
export type QuantityBasis = "scheduled" | "dimensioned" | "counted" | "scaled" | "unknown";

export interface MillworkItem {
  /** What it is, in the drawings' own words where possible. */
  label: string;
  category: MillworkCategory;
  /** Room or area, as named on the sheet. */
  location: string | null;
  /** Sheet number it was read from, e.g. "A601". How a human verifies it. */
  sheetRef: string | null;
  /** Null when the sheets do not support a number. Never a guess. */
  quantity: number | null;
  unit: MillworkUnit | null;
  quantityBasis: QuantityBasis;
  /** Species, laminate, solid surface, stone - as specified. */
  material: string | null;
  finish: string | null;
  notes: string | null;
}

/**
 * Something the reader needs a human to answer.
 *
 * The existing gating layer already insists every blocker carry a question,
 * because "we cannot price this yet" without "here is what would let us" is a
 * dead end. This carries that idea into extraction: a set that specifies
 * "P-LAM casework" without a grade, or shows a bar die with no elevation, is
 * not a failure - it is a question, and the customer is the one holding the
 * answer.
 */
export interface MillworkQuestion {
  /** Stable within a job, so an answer can be attached to the right question. */
  id: string;
  /** Asked of the customer, in plain language. */
  question: string;
  /** Why it changes the number, so it does not read as bureaucracy. */
  whyItMatters: string;
  /** Item labels this would resolve. Empty when it affects the whole package. */
  affects: string[];
  /**
   * How much answering it moves the number. This is the ORDERING KEY.
   *
   * Questions are asked one at a time, highest impact first, because a customer
   * will answer one good question and abandon a form of eight. Cabinet
   * construction grade can move casework by a factor of two; whether the toe
   * kick is finished or painted cannot. Asking them in the wrong order spends
   * the customer's patience on the cheap one.
   */
  impact: "high" | "medium" | "low";
  /**
   * Choices, when the question genuinely has them.
   *
   * A question that can be answered by tapping "Plastic laminate" gets answered.
   * The same question as an empty text box gets skipped. Null when the answer is
   * genuinely open (a dimension, a product name).
   */
  options: string[] | null;
}

export interface MillworkTakeoff {
  /** True when the drawings are a commercial/tenant fit-out rather than a home. */
  isCommercial: boolean;
  /** Project name or building type as stated on the sheets. */
  projectDescription: string | null;
  items: MillworkItem[];
  questions: MillworkQuestion[];
  confidence: "high" | "medium" | "low";
  notes: string[];
}

/**
 * The schema, shaped for a TOOL input_schema.
 *
 * Deliberately flat and small. The residential schema was refused outright by
 * the API with "Schema is too complex", and the fix was both to send it as a
 * tool and to stop nesting so hard. This one keeps one level of object nesting
 * (the item and question rows) and nothing deeper.
 */
export const MILLWORK_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    isCommercial: {
      type: "boolean",
      description: "True if these drawings are a commercial or tenant fit-out rather than a house.",
    },
    projectDescription: {
      type: ["string", "null"],
      description: "Project name and building type as stated on the sheets.",
    },
    items: {
      type: "array",
      description: "Every millwork element these sheets state. One row per run or fixture.",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          category: {
            type: "string",
            enum: [
              "cabinetry",
              "countertop",
              "built-in",
              "vanity",
              "paneling",
              "trim",
              "shelving",
              "door",
              "specialty",
            ],
          },
          location: { type: ["string", "null"] },
          sheetRef: { type: ["string", "null"] },
          quantity: { type: ["number", "null"] },
          unit: { type: ["string", "null"], enum: ["LF", "SF", "EA", null] },
          quantityBasis: {
            type: "string",
            enum: ["scheduled", "dimensioned", "counted", "scaled", "unknown"],
          },
          material: { type: ["string", "null"] },
          finish: { type: ["string", "null"] },
          notes: { type: ["string", "null"] },
        },
        required: ["label", "category", "quantityBasis"],
      },
    },
    questions: {
      type: "array",
      description: "What you need a human to answer before this could be priced properly.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Short stable slug, e.g. cabinet-grade." },
          question: { type: "string" },
          whyItMatters: { type: "string" },
          affects: { type: "array", items: { type: "string" } },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          options: {
            type: ["array", "null"],
            items: { type: "string" },
            description: "Answer choices when the question has them. Null for open answers.",
          },
        },
        required: ["id", "question", "whyItMatters", "impact"],
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["isCommercial", "items", "questions", "confidence", "notes"],
} as const;

export const MILLWORK_SYSTEM_PROMPT = `You are a millwork and casework estimator reading a set of construction drawings. You produce TAKEOFFS, not designs and not prices.

WHAT COUNTS AS MILLWORK
Cabinetry and casework, countertops and worktops, purpose-built joinery (bar dies, back bars, host stands, banquettes, built-in seating, reception desks, display fixtures), wall panelling and wainscot, feature ceilings made of wood or panel product, running trim, shelving and closet systems, and doors where the millwork package supplies them.

NOT millwork: structure, MEP, appliances and cooking equipment, loose furniture, signage, and anything the drawings show as owner-supplied or by others. If a schedule marks an item OFOI/OFCI or "by others", record it with a note saying so and no quantity - the customer still needs to know it was excluded and why.

WHERE THE NUMBERS LIVE
Casework, millwork, finish and door schedules are the highest-value content in any set, and they usually sit on the A6xx sheets. Interior elevations give run lengths. Read the schedule before the plan view, and read both before reporting a quantity.

QUANTITY BASIS - THIS IS THE FIELD THAT MATTERS MOST
Every item records where its number came from:
- "scheduled": written in a schedule. 
- "dimensioned": read off a dimension string.
- "counted": the item is drawn and you counted it.
- "scaled": you measured it off the drawing. Say so honestly - do NOT dress a scaled measurement up as a dimensioned one.
- "unknown": the item is clearly there but no quantity is determinable. Report it with quantity null. An item named with no number is useful; an invented number is not.

Never state a quantity the sheets do not support. A takeoff that says "bar die, quantity unknown, see A604" is worth money. A takeoff that guesses 24 linear feet is worth less than nothing, because someone will bid it.

ASK QUESTIONS
When something would materially change the price and the drawings do not settle it, put it in questions rather than assuming. Good questions are specific and name what they affect: cabinet construction grade (economy / custom / premium), plastic laminate versus wood veneer versus painted MDF, whether the bar die millwork is in this package or by the fixture supplier, countertop material where the schedule says only "solid surface", and whether shop drawings exist. Explain why each one moves the number.

Every question carries an impact rating, and you should be strict about it. "high" means answering it changes the price materially - construction grade, core material, whether a major fixture is in this package at all. "medium" changes a line. "low" is a detail. Questions are put to the customer ONE AT A TIME in impact order, so getting this ranking right is what decides whether the first question asked is the useful one.

Give options whenever the question has natural choices, because a question someone can answer by picking gets answered and the same question as a blank box does not.

Do not ask questions the sheets already answer. Do not ask more than about eight.

BATCH READING
You are reading ONE BATCH of sheets from a larger set. Report only what these sheets state; another batch covers the rest. Each sheet is introduced by "PAGE ID: <id>" - list every id you genuinely examined in pagesRead, and put sheets you could not read in pagesUnreadable with a reason. A sheet nobody reports on becomes a hole in the takeoff, so saying "I could not read this" is far more useful than saying nothing.

Most sets are scans. Read title blocks, schedules, dimension strings, keynotes and legends the way an estimator does. Handwriting, clouds and stamps are real content. If a sheet has no millwork on it, that is a normal and expected answer - report it read, with no items.`;

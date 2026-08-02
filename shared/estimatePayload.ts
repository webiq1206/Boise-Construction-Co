/**
 * The wire schema for an estimate submitted from the calculator.
 *
 * This lives here, once, because it used to live twice: /api/estimate-lead and
 * /api/consultation each carried their own hand-written copy. Both still listed
 * only the six remodel project types after the calculator moved to new
 * construction, so every lead the public estimator produced failed validation
 * and 400ed. Both were also missing the six new-construction refinements
 * (garage, basement, lot services, site difficulty, covered outdoor, shop
 * size), and because Zod strips unknown keys rather than rejecting them, that
 * failure was silent: the server would have recomputed the price without the
 * garage or the well and septic and quoted a different number than the visitor
 * was shown.
 *
 * The exhaustiveness checks below are the actual protection. Adding a member to
 * ProjectType or UserRefinementKey without adding it here is a compile error,
 * not a runtime surprise on a lead form.
 */
import { z } from "zod";
import type {
  ProjectType,
  FinishLevel,
  UserRefinementKey,
} from "./estimateEngine";

/**
 * Every project the engine can price, including the remodel types. The public
 * calculator only offers the new-construction four (PROJECT_TYPE_ORDER in
 * EstimateCalculator), but the API stays permissive so an estimate saved in a
 * visitor's session before the repositioning still submits instead of 400ing.
 */
export const PROJECT_TYPE_VALUES = [
  "custom-home",
  "semi-custom-home",
  "build-on-your-lot",
  "shop-home",
  "kitchen",
  "bathroom",
  "whole-home",
  "addition",
  "adu",
  "basement",
] as const satisfies readonly ProjectType[];

export const FINISH_LEVEL_VALUES = [
  "refresh",
  "mid-range",
  "high-end",
  "luxury",
] as const satisfies readonly FinishLevel[];

/** Fails to compile if a ProjectType is missing from the list above. */
type MissingProject = Exclude<ProjectType, (typeof PROJECT_TYPE_VALUES)[number]>;
const _allProjectsCovered: MissingProject extends never ? true : never = true;

type MissingFinish = Exclude<FinishLevel, (typeof FINISH_LEVEL_VALUES)[number]>;
const _allFinishesCovered: MissingFinish extends never ? true : never = true;

export const projectTypeSchema = z.enum(PROJECT_TYPE_VALUES);
export const finishLevelSchema = z.enum(FINISH_LEVEL_VALUES);

/**
 * Refinements accepted over the wire.
 *
 * Every key is nullable and optional by the engine's own contract: null means
 * "not told us yet" and never moves the price. roomCount is deprecated but
 * still accepted so estimates stored in an older session still parse.
 */
export const refinementsSchema = z
  .object({
    layoutChanges: z.enum(["none", "moderate", "major"]).nullable().optional(),
    plumbingElectrical: z.enum(["cosmetic", "partial", "full"]).nullable().optional(),
    cabinetTier: z.enum(["standard", "semi-custom", "custom"]).nullable().optional(),
    fixtureCount: z.number().int().min(1).max(8).nullable().optional(),
    stories: z.number().int().min(1).max(2).nullable().optional(),
    roomCount: z.number().int().min(1).max(12).nullable().optional(),
    bathroomCount: z.number().int().min(0).max(12).nullable().optional(),
    kitchenIncluded: z.boolean().nullable().optional(),
    aduConfig: z.enum(["detached", "attached"]).nullable().optional(),
    upgradeScope: z.array(z.string().max(40)).max(20).nullable().optional(),

    /* --------------------------------------- new residential construction */    garageBays: z.enum(["none", "two", "three", "four"]).nullable().optional(),
    basementType: z.enum(["none", "unfinished", "finished"]).nullable().optional(),
    lotServices: z.enum(["city", "well-septic", "unsure"]).nullable().optional(),
    siteDifficulty: z.enum(["simple", "moderate", "steep"]).nullable().optional(),
    // Bounded rather than unbounded: these feed square-footage takeoffs, and a
    // client-supplied 10,000 SF covered patio would price a garden shed like a
    // hotel. The caps are generous against anything a real Treasure Valley
    // build would specify.
    coveredOutdoor: z.number().int().min(0).max(4_000).nullable().optional(),
    shopSize: z.number().int().min(0).max(20_000).nullable().optional(),
  })
  .optional()
  .nullable();

/**
 * Fails to compile if a user-facing refinement key is not accepted above.
 * roomCount is excluded from UserRefinementKey (it is deprecated) but is still
 * parsed, which is why this checks one direction only.
 */
type AcceptedRefinementKey = keyof NonNullable<
  NonNullable<z.infer<typeof refinementsSchema>>
>;
type MissingRefinement = Exclude<UserRefinementKey, AcceptedRefinementKey>;
const _allRefinementsCovered: MissingRefinement extends never ? true : never = true;

/** The estimate object shared by both lead routes. */
export const estimateSchema = z.object({
  project: projectTypeSchema,
  finish: finishLevelSchema,
  sqft: z.number().int().positive(),
  priceLow: z.number().nonnegative(),
  priceHigh: z.number().nonnegative(),
  roi: z.number(),
  /** The homeowner's own budget, typed after they saw the range. */
  statedBudget: z.number().positive().max(50_000_000).nullable().optional(),
  confidence: z.string().max(80).optional(),
  refinements: refinementsSchema,
  // The visitor-facing labels for the layout card and upgrade chips they chose.
  // Length-capped here and escaped at render, so the emails can restate every
  // selection verbatim without trusting the client.
  layoutLabel: z.string().max(60).optional(),
  upgradeLabels: z.array(z.string().max(40)).max(12).optional(),
});

export type EstimatePayload = z.infer<typeof estimateSchema>;

// Referenced so the exhaustiveness constants are not dropped as unused.
void _allProjectsCovered;
void _allFinishesCovered;
void _allRefinementsCovered;

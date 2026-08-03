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
  EstimateRefinements,
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
    // Approximate garage / partial-basement sizes. Bounded like coveredOutdoor
    // below: both multiply a rate in the takeoff, so an absurd figure from the
    // wire must not move the estimate. 2,400 SF is an 8+ bay garage; 6,000 SF
    // outruns any residential footprint this estimator prices.
    garageSqft: z.number().int().min(0).max(2_400).nullable().optional(),
    basementSqft: z.number().int().min(0).max(6_000).nullable().optional(),
    lotServices: z.enum(["city", "well-septic", "unsure"]).nullable().optional(),
    siteDifficulty: z.enum(["simple", "moderate", "steep"]).nullable().optional(),
    utilitiesAtLot: z.boolean().nullable().optional(),
    // Feet of driveway, bounded because it multiplies a flatwork rate.
    drivewayLength: z.number().int().min(0).max(2_000).nullable().optional(),
    // Bounded rather than unbounded: these feed square-footage takeoffs, and a
    // client-supplied 10,000 SF covered patio would price a garden shed like a
    // hotel. The caps are generous against anything a real Treasure Valley
    // build would specify.
    coveredOutdoor: z.number().int().min(0).max(4_000).nullable().optional(),
    shopSize: z.number().int().min(0).max(20_000).nullable().optional(),

    /*
     * BOTH OF THESE MOVE THE PRICE, so both must be listed here.
     *
     * Zod strips unknown keys rather than rejecting them, which is the exact
     * trap described at the top of this file. Omitting these would not fail a
     * request: the server would quietly recompute without them and quote a
     * different number than the visitor was shown. planningStage sets the width
     * of the band, and a single accessory structure is routinely six figures.
     */
    planningStage: z
      .enum(["have-plans", "plans-in-progress", "need-plans", "exploring"])
      .nullable()
      .optional(),
    accessoryStructures: z
      .array(
        z.object({
          kind: z.enum([
            "adu",
            "detached-garage",
            "shop",
            "rv-garage",
            "guest-house",
            "pool-house",
            "barn",
            "other",
          ]),
          // Bounded for the same reason coveredOutdoor is: this is a square
          // footage the takeoff multiplies a rate by.
          sqft: z.number().int().min(0).max(20_000),
          finish: finishLevelSchema.nullable().optional(),
          attached: z.boolean().optional(),
          plumbing: z.boolean().optional(),
          power: z.enum(["none", "standard", "heavy"]).optional(),
          heated: z.boolean().optional(),
        }),
      )
      .max(8)
      .nullable()
      .optional(),
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

/**
 * The stronger check, and the one that would have caught the last omission.
 *
 * UserRefinementKey above covers the things the estimator counts toward its
 * detail score, which is not the same set as the things that move the price.
 * planningStage and accessoryStructures are both priced and neither is a
 * UserRefinementKey, so they were added to EstimateRefinements and silently
 * stripped here - the server recomputing a range without the shop the visitor
 * had just added.
 *
 * This asserts against the engine's own refinement shape instead, so any field
 * added there fails the build until it is accepted over the wire.
 */
type UnacceptedRefinement = Exclude<keyof EstimateRefinements, AcceptedRefinementKey>;
const _everyEngineRefinementCovered: UnacceptedRefinement extends never ? true : never = true;

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
  /*
   * Plan sets the visitor uploaded. Accepted loosely here and then checked for
   * provenance in the route: this schema's job is to let a well-formed payload
   * through, and deciding whether a URL is one we issued is not something a
   * shape check can do.
   */
  planFiles: z
    .array(z.object({ filename: z.string().max(200), url: z.string().max(2000) }))
    .max(12)
    .optional(),
});

export type EstimatePayload = z.infer<typeof estimateSchema>;

// Referenced so the exhaustiveness constants are not dropped as unused.
void _allProjectsCovered;
void _allFinishesCovered;
void _allRefinementsCovered;
void _everyEngineRefinementCovered;

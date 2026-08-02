/**
 * The lead routes must accept what the calculator actually sends.
 *
 * Both /api/estimate-lead and /api/consultation validate the estimate with a
 * Zod schema. When the calculator moved to new construction, that schema still
 * listed only the six remodel project types, so every lead the public estimator
 * produced was rejected with a 400. Nothing caught it: there is no test that
 * posts a realistic payload, and the calculator swallows non-5xx failures.
 *
 * Two distinct failure modes are checked here, because they break differently:
 *
 *   1. REJECTION. A project type or finish the calculator can produce is not in
 *      the enum, so the lead is lost outright.
 *
 *   2. SILENT STRIPPING. Zod drops unknown keys instead of erroring, so a
 *      refinement missing from the schema does not fail: it vanishes. The
 *      server then recomputes the price without the garage, the basement, or
 *      the well and septic, logs an "Estimate mismatch", and quotes a number
 *      the visitor was never shown. That is worse than a 400 because it looks
 *      like it worked.
 *
 * Run: npm run verify:lead-payload
 */
import { estimateSchema, PROJECT_TYPE_VALUES } from '../shared/estimatePayload';
import {
  EMPTY_REFINEMENTS,
  NEW_CONSTRUCTION_PROJECT_TYPES,
  getProjectSizeConfig,
  type EstimateRefinements,
  type FinishLevel,
  type ProjectType,
} from '../shared/estimateEngine';

let failures = 0;
let checks = 0;

function t(name: string, pass: boolean, detail = '') {
  checks++;
  if (!pass) {
    failures++;
    console.error(`  x ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

const FINISHES: FinishLevel[] = ['refresh', 'mid-range', 'high-end', 'luxury'];

/**
 * A fully-populated refinement set. Every field is deliberately non-null so
 * that a key missing from the wire schema shows up as a dropped value rather
 * than passing because it happened to be null anyway.
 */
const FULL_REFINEMENTS: EstimateRefinements = {
  layoutChanges: 'moderate',
  plumbingElectrical: 'full',
  cabinetTier: 'semi-custom',
  fixtureCount: 3,
  stories: 2,
  roomCount: 6,
  bathroomCount: 3,
  kitchenIncluded: true,
  aduConfig: 'detached',
  upgradeScope: ['flooring', 'cabinets'],
  garageBays: 'three',
  basementType: 'finished',
  lotServices: 'well-septic',
  siteDifficulty: 'steep',
  coveredOutdoor: 400,
  shopSize: 1200,
};

/* ── 1. EVERY PROJECT THE CALCULATOR OFFERS IS ACCEPTED ──────────────────── */

for (const project of PROJECT_TYPE_VALUES) {
  const size = getProjectSizeConfig(project as ProjectType);
  for (const finish of FINISHES) {
    const parsed = estimateSchema.safeParse({
      project,
      finish,
      sqft: size.baselineSqft,
      priceLow: 500_000,
      priceHigh: 650_000,
      roi: 0.7,
      refinements: FULL_REFINEMENTS,
      statedBudget: 600_000,
      layoutLabel: 'Open concept great room',
      upgradeLabels: ['Three-car garage', 'Finished basement'],
    });
    t(
      `accepts/${project}/${finish}`,
      parsed.success,
      parsed.success ? '' : JSON.stringify(parsed.error.issues[0]),
    );
  }
}

// The four the public estimator actually shows must be in the enum. This is the
// exact regression: they were not.
for (const project of NEW_CONSTRUCTION_PROJECT_TYPES) {
  t(
    `public-project-in-enum/${project}`,
    (PROJECT_TYPE_VALUES as readonly string[]).includes(project),
    'the public calculator offers a project the API rejects',
  );
}

/* ── 2. NO REFINEMENT IS SILENTLY DROPPED ────────────────────────────────── */

const roundTrip = estimateSchema.safeParse({
  project: 'shop-home',
  finish: 'high-end',
  sqft: 2400,
  priceLow: 700_000,
  priceHigh: 850_000,
  roi: 0.7,
  refinements: FULL_REFINEMENTS,
});

if (!roundTrip.success) {
  t('round-trip/parses', false, JSON.stringify(roundTrip.error.issues[0]));
} else {
  const out = (roundTrip.data.refinements ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(FULL_REFINEMENTS)) {
    if (value === null) continue;
    t(
      `round-trip/${key}`,
      JSON.stringify(out[key]) === JSON.stringify(value),
      out[key] === undefined
        ? 'stripped by the schema; the server would price without it'
        : `sent ${JSON.stringify(value)}, parsed ${JSON.stringify(out[key])}`,
    );
  }
}

// EMPTY_REFINEMENTS is what the engine starts from, so its shape defines the
// full key set. Anything in it that the schema does not know about is a gap.
const emptyParsed = estimateSchema.safeParse({
  project: 'custom-home',
  finish: 'mid-range',
  sqft: 2400,
  priceLow: 1,
  priceHigh: 2,
  roi: 0,
  refinements: EMPTY_REFINEMENTS,
});
t('empty-refinements/parses', emptyParsed.success);

/* ── 3. BOUNDS ARE ENFORCED ──────────────────────────────────────────────── */

// A client-supplied square footage feeds a takeoff directly, so the absurd
// values have to bounce rather than produce an absurd quote.
const absurd = estimateSchema.safeParse({
  project: 'shop-home',
  finish: 'mid-range',
  sqft: 2400,
  priceLow: 1,
  priceHigh: 2,
  roi: 0,
  refinements: { ...FULL_REFINEMENTS, shopSize: 500_000 },
});
t('bounds/rejects-absurd-shop-size', !absurd.success);

const negative = estimateSchema.safeParse({
  project: 'custom-home',
  finish: 'mid-range',
  sqft: -1,
  priceLow: 1,
  priceHigh: 2,
  roi: 0,
  refinements: null,
});
t('bounds/rejects-negative-sqft', !negative.success);

/* ── RESULT ──────────────────────────────────────────────────────────────── */

if (failures > 0) {
  console.error(`\nverify:lead-payload FAILED - ${failures} of ${checks} checks`);
  process.exit(1);
}
console.log(`verify:lead-payload OK (${checks} checks)`);

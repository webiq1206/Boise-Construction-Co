/**
 * Every price this site publishes for a new home, an addition, an ADU or a
 * detached garage or shop comes from the P5 instant estimator (owner
 * instruction, 21 November 2026): the same estimator the "Get an instant
 * estimate" button opens, so a page never shows a number the estimator would
 * not show for the same inputs.
 *
 * This script runs that estimator for each case the site publishes a figure
 * for and writes shared/content/p5PublishedFigures.json. The site never
 * imports p5-home-co: the JSON is committed, and tests/p5-published-figures.test.ts
 * pins the copy to it.
 *
 * Run (from this repository, with p5-home-co checked out beside it):
 *
 *   npm run pricing:p5-figures
 *
 * P5_HOME_CO_DIR points at another checkout. Pass --check to compare the
 * estimator's answers with the committed JSON without writing it.
 *
 * Inputs, stated so anyone can re-run them:
 *   - brand "construction", the projects this brand offers in the estimator
 *     (custom-home, addition, adu, garage-shop), every finish tier
 *   - only answers a visitor can give (flows.ts): any answer not named here is
 *     the flow's default, which for a new home is an attached 2-car garage, no
 *     basement and no plans yet
 *   - plans "none" unless a case says otherwise, so design, engineering and
 *     permit fees are priced from the cost book (owner, 21 November 2026)
 *   - the seed cost book in p5-home-co (no database), labor at $120 an hour
 *     (the live rate; budgetary projects do not move with it)
 *   - a Boise address and no property record
 *   - the customer range is customerEstimate().range, exactly what a visitor
 *     is shown on screen, with the note under it (rangeNotes) and the lists
 *     of what is excluded and not yet determined
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const p5Dir = path.resolve(process.env.P5_HOME_CO_DIR ?? path.join(repo, "..", "p5-home-co"));
const outFile = path.join(repo, "shared", "content", "p5PublishedFigures.json");

const LABOR_RATE = 120;
const NOW = new Date("2026-11-21T12:00:00Z");
const ADDRESS = "100 Example Ave, Boise, ID 83702";
const BRAND = "construction";

const load = (rel: string) => import(pathToFileURL(path.join(p5Dir, rel)).href);
const price = await load("app/lib/estimator/price.ts");
const flows = await load("app/lib/estimator/flows.ts");
const scopeTypes = await load("app/lib/scopes/types.ts");

const settings = { ...scopeTypes.DEFAULT_SCOPE_SETTINGS, laborRate: LABOR_RATE };

const TIERS = ["builder", "mid", "high", "luxury"] as const;
type Tier = (typeof TIERS)[number];
const TIER_NAMES: Record<Tier, string> = { builder: "Essential", mid: "Signature", high: "Premium", luxury: "Luxury" };

type Answers = Record<string, string | number>;
type Range = { low: number; high: number };

/** Refuse an input the estimator cannot be given: a visitor could never see that figure. */
function checkInputs(project: string, answers: Answers) {
  const flow = flows.flowById(project);
  if (!flow) throw new Error(`No estimator project ${project}.`);
  for (const [id, value] of Object.entries(answers)) {
    const q = flow.questions.find((x: { id: string }) => x.id === id);
    if (!q) throw new Error(`${project} asks no question "${id}".`);
    if (q.kind === "number") {
      const n = Number(value);
      // The estimator keeps a number as a multiple of its step, within its limits (resolveAnswers in types.ts).
      if (!(n >= q.min && n <= q.max && Math.round(n / q.step) * q.step === n)) throw new Error(`${project}: ${id} ${value} is not an answer a visitor can enter.`);
    } else if (q.kind === "choice") {
      if (!q.options.some((o: { id: string }) => o.id === value)) throw new Error(`${project}: ${id} "${value}" is not an option.`);
    }
  }
}

type View = Range & { rangeNotes: string[]; excluded: string[]; undetermined: string[] };

function run(project: string, tier: Tier, answers: Answers): View {
  checkInputs(project, answers);
  const estimate = price.priceEstimate(
    { brand: BRAND, project, tier, answers, address: ADDRESS, property: null },
    { now: NOW, settings },
  );
  if (price.priceWithheld(estimate)) throw new Error(`The estimator withholds a price for ${project} ${tier} ${JSON.stringify(answers)}.`);
  const view = price.customerEstimate(estimate, { token: "t".repeat(40), address: null, createdAt: NOW, officialCopy: "after-review" });
  const low = view.range?.low;
  const high = view.range?.high;
  if (typeof low !== "number" || typeof high !== "number") throw new Error(`No customer range for ${project} ${tier}.`);
  return { low, high, rangeNotes: [...view.guide.rangeNotes], excluded: [...view.guide.excluded], undetermined: [...view.guide.undetermined] };
}

/** Per square foot, rounded outward so a stated band is never narrower than the range it came from. */
const perSqFt = (r: Range, sqft: number): Range => ({ low: Math.floor(r.low / sqft), high: Math.ceil(r.high / sqft) });

type Case = { id: string; project: string; label: string; answers: Answers; sqft?: number };

const HOME_SIZES = [1600, 2000, 2400, 3000, 3600];
const CASES: Case[] = [
  ...HOME_SIZES.map((sqft) => ({
    id: `home-${sqft}`,
    project: "custom-home",
    label: `New home, ${sqft.toLocaleString("en-US")} sq ft of living space, attached 2-car garage, no basement, no plans yet`,
    answers: { sqft },
    sqft,
  })),
  ...HOME_SIZES.map((sqft) => ({
    id: `home-${sqft}-complete-plans`,
    project: "custom-home",
    label: `New home, ${sqft.toLocaleString("en-US")} sq ft of living space, attached 2-car garage, no basement, complete design and engineered plans provided`,
    answers: { sqft, plans: "complete" },
    sqft,
  })),
  { id: "addition-room-300", project: "addition", label: "Room addition, 300 sq ft, no plans yet", answers: { type: "room", sqft: 300 }, sqft: 300 },
  { id: "addition-room-400", project: "addition", label: "Room addition, 400 sq ft, no plans yet", answers: { type: "room", sqft: 400 }, sqft: 400 },
  { id: "addition-room-600", project: "addition", label: "Room addition, 600 sq ft, no plans yet", answers: { type: "room", sqft: 600 }, sqft: 600 },
  { id: "addition-suite", project: "addition", label: "Primary suite addition, typical size, no plans yet", answers: { type: "suite" } },
  { id: "addition-inlaw", project: "addition", label: "In-law suite addition, typical size, no plans yet", answers: { type: "inlaw" } },
  { id: "addition-second", project: "addition", label: "Second-story addition, typical size, no plans yet", answers: { type: "second" } },
  { id: "adu-detached", project: "adu", label: "Detached ADU of about 600 sq ft, no plans yet", answers: { type: "detached" }, sqft: 600 },
  { id: "adu-attached", project: "adu", label: "Attached ADU, typical size, no plans yet", answers: { type: "attached" } },
  { id: "adu-garage", project: "adu", label: "Garage conversion to an ADU, no plans yet", answers: { type: "garage" } },
  ...[576, 864, 1200, 2400].map((sqft) => ({
    id: `garage-shop-${sqft}`,
    project: "garage-shop",
    label: `Detached garage or shop, ${sqft.toLocaleString("en-US")} sq ft, no plans yet`,
    answers: { sqft },
    sqft,
  })),
];

const cases: Record<string, unknown> = {};
/** What the customer is told under the range, per project and plans answer. It must not differ between sizes or tiers. */
const scope: Record<string, { rangeNotes: string[]; excluded: string[]; undetermined: string[] }> = {};
const ranges = new Map<string, Range>();

for (const c of CASES) {
  const tiers: Record<string, unknown> = {};
  const views = TIERS.map((t) => [t, run(c.project, t, c.answers)] as const);
  for (const [t, v] of views) {
    const r = { low: v.low, high: v.high };
    tiers[t] = { finish: TIER_NAMES[t], ...r, ...(c.sqft ? { perSqFt: perSqFt(r, c.sqft) } : {}) };
    ranges.set(`${c.id}/${t}`, r);
    const key = `${c.project}/${String(c.answers.plans ?? "none")}`;
    const said = { rangeNotes: v.rangeNotes, excluded: v.excluded, undetermined: v.undetermined };
    if (!scope[key]) scope[key] = said;
    else if (c.project !== "adu" && c.project !== "addition" && JSON.stringify(scope[key]) !== JSON.stringify(said)) {
      throw new Error(`${c.id} ${t}: the estimator says something different under the range than other ${key} cases.`);
    }
  }
  // Two spans copy may quote: Essential to Signature, and the whole finish ladder.
  const essentialToSignature = { low: ranges.get(`${c.id}/builder`)!.low, high: ranges.get(`${c.id}/mid`)!.high };
  const allFinishes = { low: ranges.get(`${c.id}/builder`)!.low, high: ranges.get(`${c.id}/luxury`)!.high };
  const premiumToLuxury = { low: ranges.get(`${c.id}/high`)!.low, high: ranges.get(`${c.id}/luxury`)!.high };
  cases[c.id] = {
    project: c.project,
    label: c.label,
    inputs: c.answers,
    ...(c.sqft ? { sqft: c.sqft } : {}),
    tiers,
    spans: {
      essentialToSignature: { ...essentialToSignature, ...(c.sqft ? { perSqFt: perSqFt(essentialToSignature, c.sqft) } : {}) },
      premiumToLuxury: { ...premiumToLuxury, ...(c.sqft ? { perSqFt: perSqFt(premiumToLuxury, c.sqft) } : {}) },
      allFinishes: { ...allFinishes, ...(c.sqft ? { perSqFt: perSqFt(allFinishes, c.sqft) } : {}) },
    },
  };
}

// ADU and addition types say different things (an attached garage needs no
// energy code work), so their notes are kept per case type.
for (const c of CASES.filter((x) => x.project === "adu" || x.project === "addition")) {
  const v = run(c.project, "mid", c.answers);
  scope[`${c.project}/${String(c.answers.type)}/none`] = { rangeNotes: v.rangeNotes, excluded: v.excluded, undetermined: v.undetermined };
}
for (const key of Object.keys(scope)) if (/^(adu|addition)\/none$/.test(key)) delete scope[key];

/**
 * What design, engineering and energy code work add to a new home's range:
 * the range with no plans less the range with complete plans, at the same size
 * and finish. Both ranges are the estimator's own; this is their difference.
 */
const designAndEngineering: Record<string, unknown> = {};
for (const sqft of HOME_SIZES) {
  const tiers: Record<string, Range & { finish: string }> = {};
  for (const t of TIERS) {
    const a = ranges.get(`home-${sqft}/${t}`)!;
    const b = ranges.get(`home-${sqft}-complete-plans/${t}`)!;
    tiers[t] = { finish: TIER_NAMES[t], low: a.low - b.low, high: a.high - b.high };
  }
  designAndEngineering[`home-${sqft}`] = {
    label: `What design, structural engineering and energy code calculations add to a ${sqft.toLocaleString("en-US")} sq ft new home's range (no plans less complete plans)`,
    tiers,
    essentialToSignature: { low: Math.min(tiers.builder.low, tiers.mid.low), high: Math.max(tiers.builder.high, tiers.mid.high) },
  };
}

let p5Commit = "unknown";
try {
  p5Commit = execSync("git rev-parse --short HEAD", { cwd: p5Dir }).toString().trim();
} catch {}

const figures = {
  about:
    "Preliminary customer ranges from the P5 instant estimator (the tool behind \"Get an instant estimate\"), one estimate per tier per case. Written by scripts/pricing/p5-published-figures.mts; do not edit by hand.",
  asOf: "November 2026",
  generatedOn: NOW.toISOString().slice(0, 10),
  p5Commit,
  rulesVersion: price.ESTIMATOR_RULES_VERSION,
  inputs: {
    brand: BRAND,
    laborRatePerHour: LABOR_RATE,
    costBook: "p5-home-co seed cost book, no database overrides",
    address: ADDRESS,
    property: null,
    defaults: "Any answer a case does not name is the estimator's default: a new home has an attached 2-car garage, no basement and no plans yet.",
    tiers: TIER_NAMES,
  },
  cases,
  designAndEngineering,
  scope,
};

const text = `${JSON.stringify(figures, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const committed = JSON.parse(readFileSync(outFile, "utf8"));
  const strip = (f: Record<string, unknown>) => JSON.stringify({ ...f, p5Commit: undefined });
  if (strip(committed) !== strip(figures)) {
    console.error("The estimator's answers differ from shared/content/p5PublishedFigures.json. Re-run without --check and update the copy.");
    process.exit(1);
  }
  console.log("p5PublishedFigures.json matches the estimator.");
} else {
  writeFileSync(outFile, text);
  for (const c of CASES) {
    const row = TIERS.map((t) => {
      const r = ranges.get(`${c.id}/${t}`)!;
      return `${TIER_NAMES[t]} ${r.low}-${r.high}`;
    });
    console.log(`${c.id}\t${row.join("\t")}`);
  }
}

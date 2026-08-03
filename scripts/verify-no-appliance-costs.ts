/**
 * Appliances must never be priced. Boise Construction Co does not supply or
 * install them, and every public page says so.
 *
 * This is a standing rule rather than a one-time cleanup, which is why it is a
 * build gate. Two appliance lines had previously worked their way in: a $10,000
 * package plus $800 of install labour on every ADU, and $800 of install labour
 * on every kitchen. Both quietly contradicted the site's own answer to "are
 * appliances included?" and inflated the ranges homeowners were shown.
 *
 * The catalog rows themselves stay: they are the owner's workbook data, and
 * deleting rows there would break the reconciliation that proves the catalog
 * matches the source spreadsheets. What must never happen is a SCOPE RULE
 * pointing at one, so that is what this checks.
 */
import { LINE_ITEMS } from "../shared/costs/lineItemCatalog";
import { RULES_BY_PROJECT } from "../shared/costs/scopeRules";
import { buildEstimateDisclosure, type ProjectType, type FinishLevel, EMPTY_REFINEMENTS,
  getProjectSizeConfig } from "../shared/estimateEngine";
import { resolveInternalEstimate } from "../shared/costs/resolve";

const FORBIDDEN_DIVISION = "APPLIANCES";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  FAIL: ${msg}`);
};

/** Every catalog code that belongs to the appliances division, incl. -M/-L splits. */
const applianceCodes = new Set(
  LINE_ITEMS.filter((li) => li.division === FORBIDDEN_DIVISION).map((li) => li.code),
);
const applianceRoots = new Set([...applianceCodes].map((c) => c.replace(/-[ML]$/, "")));

console.log(`Appliance codes in catalog: ${[...applianceCodes].join(", ")}`);

/* 1. No scope rule may reference an appliance code, by exact code or by the
      root that expands into the -M / -L pair. */
for (const [project, rules] of Object.entries(RULES_BY_PROJECT)) {
  if (!rules) continue;
  for (const rule of rules) {
    const root = rule.code.replace(/-[ML]$/, "");
    if (applianceCodes.has(rule.code) || applianceRoots.has(root)) {
      fail(`${project} scope rule references appliance code ${rule.code}`);
    }
  }
}

/* 2. Belt and braces: price every project and assert no appliance money lands
      in the internal estimate, whatever route the rules took to get there. */
/*
 * New construction is included deliberately. A new home is the easiest place for
 * an appliance package to creep back in, because the catalog carries a $10,000
 * appliance line and a complete house plausibly "needs" one. The company's
 * published position is that appliances are client-supplied, so a new-build
 * takeoff must exclude them exactly as a kitchen remodel does.
 */
const PROJECTS: ProjectType[] = [
  "custom-home", "semi-custom-home", "build-on-your-lot", "shop-home",
  "kitchen", "bathroom", "whole-home", "addition", "adu", "basement",
];
const FINISHES: FinishLevel[] = ["refresh", "mid-range", "high-end", "luxury"];
let priced = 0;

for (const project of PROJECTS) {
  const cfg = getProjectSizeConfig(project);
  for (const sqft of [cfg.min, Math.round((cfg.min + cfg.max) / 2), cfg.max]) {
    for (const finish of FINISHES) {
      const resolved = resolveInternalEstimate(project, finish, sqft, EMPTY_REFINEMENTS);
      if (!resolved) continue;
      priced++;
      for (const trade of resolved.admin.trades) {
        if (trade.division.toUpperCase() === FORBIDDEN_DIVISION) {
          fail(`${project}/${finish}/${sqft}sf priced an ${FORBIDDEN_DIVISION} trade`);
        }
      }
    }
  }
}

/* 3. The homeowner-facing scope must not promise appliances either. Exclusions
      are where appliances are allowed to appear, and should keep appearing. */
for (const project of PROJECTS) {
  const cfg = getProjectSizeConfig(project);
  for (const finish of FINISHES) {
    const d = buildEstimateDisclosure({ project, finish, sqft: cfg.min, refinements: EMPTY_REFINEMENTS });
    for (const line of d.includes) {
      if (/\bappliance/i.test(line)) {
        fail(`${project}/${finish} lists "${line}" as covered; appliances are never covered`);
      }
    }
  }
}

console.log(
  failures === 0
    ? `verify:no-appliance-costs: OK (${priced} priced scenarios, no appliance costs anywhere)`
    : `verify:no-appliance-costs: FAILED with ${failures} problem(s)`,
);
process.exit(failures === 0 ? 0 : 1);

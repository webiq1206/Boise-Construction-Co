/**
 * Invariants for the margin guard and the planning range.
 *
 * These are properties that must hold for every project, quality level and size
 * on the sliders, not spot checks. A pricing engine that is right at the
 * baseline and wrong at the extremes is worse than one that is uniformly wrong,
 * because nobody looks at the extremes until a lead does.
 */
import { buildInternalEstimate, MINIMUM_GROSS_MARGIN, TARGET_GROSS_MARGIN, priceAtMargin, type QualityLevel } from "../shared/costs/engine";
import { buildPlanningRange, decideMargin } from "../shared/costs/pricing";
import { RULES_BY_PROJECT, BASELINE_SQFT } from "../shared/costs/scopeRules";
import { estimateProject } from "../shared/costs/index";
import { findLeadLeak } from "../shared/costs/outputs";
import { getAvailableFinishLevels, getProjectSizeConfig, type ProjectType } from "../shared/estimateEngine";

let checks = 0;
let failed = 0;
function check(cond: boolean, msg: string) {
  checks++;
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  }
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const PROJECTS: ProjectType[] = ["kitchen", "bathroom", "whole-home", "addition", "adu", "basement"];

// 1. GROSS MARGIN IS A MARGIN, NOT A MARKUP.
{
  const price = priceAtMargin(70000, 0.3);
  check(Math.abs(price - 100000) < 1, `30% GM on $70,000 must be $100,000, got ${usd(price)}`);
  const realised = (price - 70000) / price;
  check(Math.abs(realised - 0.3) < 1e-9, `realised margin must be 30%, got ${(realised * 100).toFixed(2)}%`);
  // The markup error this guards against.
  const markup = 70000 * 1.3;
  check(markup < price, "a 30% markup must be less than a 30% margin price, or the distinction is inverted");
}

// 2. SWEEP every project x quality x size.
for (const project of PROJECTS) {
  const rules = RULES_BY_PROJECT[project];
  check(Boolean(rules), `${project}: must have a rule set`);
  if (!rules) continue;

  const cfg = getProjectSizeConfig(project);
  const qualities = getAvailableFinishLevels(project) as QualityLevel[];

  for (const quality of qualities) {
    let previousCentre = 0;
    for (let sqft = cfg.min; sqft <= cfg.max; sqft += cfg.step) {
      const internal = buildInternalEstimate(rules, { quality, sqft }, project);

      check(
        Number.isFinite(internal.totalInternalCost) && internal.totalInternalCost > 0,
        `${project}/${quality}@${sqft}: internal cost must be finite and positive`,
      );

      // Every line must have a positive quantity and a real rate.
      check(
        internal.lines.every((l) => l.quantity > 0 && l.unitCost > 0 && Number.isFinite(l.cost)),
        `${project}/${quality}@${sqft}: a cost line has a non-positive quantity or rate`,
      );

      // Trade rollups must reconcile to the line total exactly.
      const tradeSum = internal.trades.reduce((s, t) => s + t.internalCost, 0);
      check(
        Math.abs(tradeSum - internal.directCost) < 0.01,
        `${project}/${quality}@${sqft}: trade rollup ${usd(tradeSum)} != direct cost ${usd(internal.directCost)}`,
      );

      // No cost code may appear twice: that is the duplicate-charge guard.
      const codes = internal.lines.map((l) => l.code);
      check(
        new Set(codes).size === codes.length,
        `${project}/${quality}@${sqft}: a cost code appears more than once in the takeoff`,
      );

      const range = buildPlanningRange(internal, project, quality, sqft);

      check(range.low > 0 && range.high > range.low, `${project}/${quality}@${sqft}: range must be positive and ordered`);
      check(
        range.appliedMargin >= MINIMUM_GROSS_MARGIN - 1e-9 && range.appliedMargin <= TARGET_GROSS_MARGIN + 1e-9,
        `${project}/${quality}@${sqft}: applied margin ${range.appliedMargin} outside [${MINIMUM_GROSS_MARGIN}, ${TARGET_GROSS_MARGIN}]`,
      );

      // The band the owner specified: 0.85x to 1.15x of centre, before rounding.
      const lowRatio = range.low / range.centre;
      const highRatio = range.high / range.centre;
      check(
        lowRatio > 0.8 && lowRatio < 0.9,
        `${project}/${quality}@${sqft}: low end ${lowRatio.toFixed(3)}x of centre, expected about 0.85x`,
      );
      check(
        highRatio > 1.1 && highRatio < 1.2,
        `${project}/${quality}@${sqft}: high end ${highRatio.toFixed(3)}x of centre, expected about 1.15x`,
      );

      // Monotonic in size: a bigger space never costs less.
      check(
        range.centre >= previousCentre - 0.01,
        `${project}/${quality}: centre fell from ${usd(previousCentre)} to ${usd(range.centre)} as size grew to ${sqft}`,
      );
      previousCentre = range.centre;
    }
  }

  // 3. Richer finish never costs less, at the baseline size.
  const base = BASELINE_SQFT[project] ?? cfg.baselineSqft;
  let prev = 0;
  for (const quality of qualities) {
    const internal = buildInternalEstimate(rules, { quality, sqft: base }, project);
    const range = buildPlanningRange(internal, project, quality, base);
    check(
      range.centre >= prev - 0.01,
      `${project}: ${quality} centre ${usd(range.centre)} is below the tier beneath it (${usd(prev)})`,
    );
    prev = range.centre;
  }
}

// 4. THE MARGIN GUARD ACTUALLY GUARDS. Force a cost far above any ceiling and
//    confirm it trims to the floor and says so, rather than quoting blind.
{
  const decision = decideMargin(5_000_000, "kitchen", "mid-range", 250);
  check(decision.trimmed, "guard must trim margin on an absurdly expensive kitchen");
  check(
    Math.abs(decision.appliedMargin - MINIMUM_GROSS_MARGIN) < 1e-9,
    `guard must stop at the ${MINIMUM_GROSS_MARGIN} floor, got ${decision.appliedMargin}`,
  );
  check(decision.warnings.length > 0, "guard must warn when it trims to the floor");

  // And that it does NOT fire on an ordinary job.
  const ordinary = decideMargin(20000, "kitchen", "mid-range", 250);
  check(!ordinary.trimmed, "guard must not fire on an ordinary kitchen");
  check(
    Math.abs(ordinary.appliedMargin - TARGET_GROSS_MARGIN) < 1e-9,
    "an ordinary job must price at the full target margin",
  );
}

// 5. THE LEAD / ADMIN WALL. A lead view must never carry cost, margin or
//    line-item vocabulary, and the admin trade rows must reconcile to the
//    number the homeowner was actually shown.
for (const project of PROJECTS) {
  if (!RULES_BY_PROJECT[project]) continue;
  const base = BASELINE_SQFT[project];
  for (const quality of getAvailableFinishLevels(project) as QualityLevel[]) {
    const rows = [
      { label: "Project", value: project },
      { label: "Finish level", value: quality },
      { label: "Size", value: `${base} sq ft` },
    ];
    const result = estimateProject(project, { quality, sqft: base }, rows);

    const rendered = JSON.stringify(result.lead);
    const leak = findLeadLeak(rendered);
    check(leak === null, `${project}/${quality}: lead view leaks "${leak}"`);

    check(
      !rendered.includes(String(Math.round(result.admin.totalInternalCost))),
      `${project}/${quality}: lead view contains the internal cost figure`,
    );
    check(
      result.lead.low === result.range.low && result.lead.high === result.range.high,
      `${project}/${quality}: lead range must match the computed range exactly`,
    );
    check(result.lead.disclaimers.length >= 4, `${project}/${quality}: lead view must carry the disclaimers`);

    const sum = result.admin.trades.reduce((s, t) => s + t.customerAmount, 0);
    check(
      Math.abs(sum - result.admin.customerPrice) < 1,
      `${project}/${quality}: admin trade rows sum to ${usd(sum)}, centre is ${usd(result.admin.customerPrice)}`,
    );
    check(
      result.admin.trades.every((t) => t.children.length > 0),
      `${project}/${quality}: a trade row lost its child line items`,
    );
    check(
      Math.abs(result.admin.grossProfit - (result.admin.customerPrice - result.admin.totalInternalCost)) < 0.01,
      `${project}/${quality}: gross profit does not reconcile`,
    );
  }
}

console.log(`\nBaseline planning ranges:`);
for (const project of PROJECTS) {
  const rules = RULES_BY_PROJECT[project];
  if (!rules) continue;
  const base = BASELINE_SQFT[project];
  const qualities = getAvailableFinishLevels(project) as QualityLevel[];
  const cells = qualities.map((q) => {
    const internal = buildInternalEstimate(rules, { quality: q, sqft: base }, project);
    const r = buildPlanningRange(internal, project, q, base);
    return `${q}: ${usd(r.low)}-${usd(r.high)}${r.marginTrimmed ? " (trimmed)" : ""}`;
  });
  console.log(`  ${project.padEnd(11)} @${String(base).padStart(5)}sf  ${cells.join("  |  ")}`);
}

console.log(`\n${failed === 0 ? "All" : failed + " of"} ${checks} cost-pricing checks ${failed === 0 ? "passed" : "FAILED"}.`);
if (failed > 0) process.exit(1);

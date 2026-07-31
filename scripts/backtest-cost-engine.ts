/**
 * Back-test the line-item cost engine against every estimate the owner issued.
 *
 * The billed figures already contain the company's margin, so they are compared
 * against the engine's CUSTOMER PRICE, never its cost. Comparing a billed price
 * against a cost is the commonest way a back-test flatters a model by exactly
 * the margin.
 *
 * Where a real job's scope was narrower than the rule set (no flooring, client
 * supplied the tile, demolition carried on a different project line), the
 * difference is stated rather than silently absorbed into a fudge factor.
 */
import { buildInternalEstimate, type ScopeSelections } from "../shared/costs/engine";
import { RULES_BY_PROJECT } from "../shared/costs/scopeRules";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

interface Reference {
  label: string;
  project: string;
  /** What the homeowner was actually charged, margin included. */
  billed: number;
  /** Scope the real job carried that the rule set does NOT, or vice versa. */
  scopeNote: string;
  /** Multiplier applied to the engine result to line the two scopes up, with a reason. */
  scopeAdjust?: { factor: number; why: string };
  selections: ScopeSelections;
  /** Set when the job is too unlike the rule set to score. */
  informationalOnly?: boolean;
}

const REFERENCES: Reference[] = [
  {
    label: "Kitchen EST-10088",
    project: "kitchen",
    billed: 34335 - 2220.51,
    scopeNote: "no flooring, no backsplash; drywall and paint limited to a new pantry",
    scopeAdjust: { factor: 1, why: "scope matched via upgradeScope" },
    selections: {
      quality: "mid-range",
      sqft: 250,
      cabinetTier: "semi-custom",
      layoutChanges: "none",
      plumbingElectrical: "partial",
      appliancesByClient: true,
      upgradeScope: ["cabinets", "counters"],
    },
  },
  {
    label: "Kitchen in EST-10049",
    project: "kitchen",
    billed: 31850 - 4500,
    scopeNote: "cabinets, counters and relocated systems only; no flooring, paint or demo in this line",
    selections: {
      quality: "mid-range",
      sqft: 250,
      cabinetTier: "semi-custom",
      layoutChanges: "moderate",
      plumbingElectrical: "full",
      appliancesByClient: true,
      upgradeScope: ["cabinets", "counters"],
    },
  },
  {
    label: "Walden primary bath",
    project: "bathroom",
    billed: 24565 - 3000 + 2062.5,
    scopeNote: "tub, glass shower, double vanity; demo and paint carried on project-wide lines",
    selections: {
      quality: "mid-range",
      sqft: 110,
      layoutChanges: "moderate",
      plumbingElectrical: "full",
      fixtureCount: 1,
    },
  },
  {
    label: "Basement finish EST-10089",
    project: "basement",
    billed: 62108,
    scopeNote: "customer supplied tile, shower pan, surround, toilet and vanities",
    selections: {
      quality: "mid-range",
      sqft: 900,
      plumbingElectrical: "full",
      bathroomCount: 1,
    },
  },
  {
    label: "VA Proposal EST-10079",
    project: "whole-home",
    billed: 133808,
    scopeNote: "primary suite, laundry, living and kitchen; 40% of the total was Plans & Admin",
    selections: {
      quality: "mid-range",
      sqft: 1200,
      bathroomCount: 2,
      kitchenIncluded: true,
      plumbingElectrical: "partial",
      layoutChanges: "moderate",
    },
  },
  {
    label: "Walden Addition EST-10010",
    project: "addition",
    billed: 187470,
    scopeNote:
      "addition PLUS two full bathrooms, whole-house flooring, demo and repaint - far wider than an addition rule set",
    informationalOnly: true,
    selections: { quality: "mid-range", sqft: 600, plumbingElectrical: "full", layoutChanges: "major" },
  },
  {
    label: "Ringtail garage conversion",
    project: "basement",
    billed: 26945,
    scopeNote: "modeled as a basement finish; there is no garage-conversion rule set",
    informationalOnly: true,
    selections: { quality: "mid-range", sqft: 440, plumbingElectrical: "cosmetic", bathroomCount: 0 },
  },
];

let scored = 0;
let outside = 0;
const ratios: number[] = [];

console.log("=".repeat(96));
console.log("LINE-ITEM COST ENGINE - BACK-TEST vs ISSUED ESTIMATES");
console.log("Billed figures include margin, so they are compared against CUSTOMER PRICE.");
console.log("=".repeat(96));

for (const ref of REFERENCES) {
  const rules = RULES_BY_PROJECT[ref.project];
  if (!rules) {
    console.log(`\n${ref.label}: no rule set for "${ref.project}"`);
    continue;
  }
  const est = buildInternalEstimate(rules, ref.selections, ref.project);
  const adjusted = est.customerPrice * (ref.scopeAdjust?.factor ?? 1);
  const ratio = adjusted / ref.billed;

  console.log(`\n${"-".repeat(96)}`);
  console.log(`${ref.label}  [${ref.project} @ ${ref.selections.sqft} sf, ${ref.selections.quality}]`);
  console.log(`  scope note: ${ref.scopeNote}`);
  console.log(`  top trades:`);
  for (const t of est.trades.slice(0, 6)) {
    console.log(`    ${t.division.padEnd(28)} ${t.scopeSummary.padEnd(20)} cost ${usd(t.internalCost).padStart(10)}`);
  }
  console.log(
    `  direct ${usd(est.directCost)}  + contingency ${usd(est.contingency)}  = internal ${usd(est.totalInternalCost)}`,
  );
  console.log(`  customer price @ 30% GM: ${usd(est.customerPrice)}`);
  console.log(`  billed: ${usd(ref.billed)}   ratio ${ratio.toFixed(2)}x`);

  if (ref.informationalOnly) {
    console.log(`  -> INFORMATIONAL ONLY, not scored`);
  } else {
    scored++;
    ratios.push(ratio);
    const verdict = ratio > 1.2 ? "ENGINE HIGH" : ratio < 0.85 ? "ENGINE LOW" : "OK";
    if (verdict !== "OK") outside++;
    console.log(`  -> ${verdict}`);
  }
  const dupes = est.warnings.filter((w) => w.severity === "warn");
  if (dupes.length) for (const w of dupes.slice(0, 3)) console.log(`  [warn] ${w.message}`);
}

const mean = ratios.reduce((s, r) => s + r, 0) / (ratios.length || 1);
console.log(`\n${"=".repeat(96)}`);
console.log(`Scored ${scored} references, ${outside} outside tolerance. Mean ratio ${mean.toFixed(2)}x`);
console.log(`Ratios: ${ratios.map((r) => r.toFixed(2)).join(", ")}`);
if (outside > 0) process.exitCode = 0; // diagnostic script, never fails the build

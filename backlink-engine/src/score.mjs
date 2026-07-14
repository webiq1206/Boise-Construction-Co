#!/usr/bin/env node
/**
 * Backlink Engine – scoring + qualification stage.
 *
 * Reads config/scoring.json, config/quality-gates.json and a list of raw
 * opportunities, then:
 *   1. applies HARD quality gates (Google-guidelines compliance / anti-spam),
 *   2. scores every surviving opportunity on a transparent 0-100 value blend,
 *   3. computes an acquisition Priority (value adjusted for effort + competitor
 *      validation) and buckets it into P1..P4 tiers,
 *   4. writes data/opportunities.scored.json and data/pipeline-report.md.
 *
 * Deterministic, no dependencies.  Usage:
 *   node src/score.mjs [path/to/opportunities.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = readJSON(join(ROOT, "config/scoring.json"));
const gates = readJSON(join(ROOT, "config/quality-gates.json"));
const inputPath = process.argv[2] || join(ROOT, "data/opportunities.seed.json");
const opps = readJSON(inputPath);

function readJSON(p) { return JSON.parse(readFileSync(p, "utf8")); }
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round1 = (n) => Math.round(n * 10) / 10;

function matchesSpamBlog(domain) {
  const d = String(domain || "").toLowerCase();
  return gates.spamBlogPatternHints.some((h) => d.includes(h));
}

// ---- HARD GATES --------------------------------------------------------
function applyGates(o) {
  const reasons = [];
  if (Array.isArray(o.spamFlags) && o.spamFlags.length) reasons.push(`spamFlags:${o.spamFlags.join("|")}`);
  if ((o.dr ?? 0) < 10 && (o.traffic ?? 0) === 0 && o.linkType === "profile")
    reasons.push("authorityFloorFail");
  if ((o.traffic ?? 0) === 0 && (o.dr ?? 0) < 65 && matchesSpamBlog(o.domain))
    reasons.push("worthlessFootprint");

  const warnings = [];
  if (o.cost && o.cost !== "free") warnings.push(`paidApproval:${o.cost}`);
  if (o.dofollow === false) warnings.push("nofollow");
  if (o.indexed === false) warnings.push("holdUntilIndexed");
  return { rejected: reasons.length > 0, reasons, warnings };
}

// ---- VALUE SCORE (0-100) ----------------------------------------------
function componentScores(o) {
  const s = cfg.scales;
  const relevance = s.relevance[o.relevance] ?? 0;
  const authority = clamp(o.dr ?? 0, 0, 100);
  const linkType = s.linkType[o.linkType] ?? 0;
  const dofollow = s.dofollow[String(o.dofollow)] ?? s.dofollow.unknown;
  const traffic = clamp((Math.log10((o.traffic ?? 0) + 1) / 6) * 100, 0, 100);
  const local = o.local ? 100 : 0;
  return { relevance, authority, linkType, dofollow, traffic, local };
}

function valueScore(c) {
  const w = cfg.valueWeights;
  return (
    w.relevance * c.relevance +
    w.authority * c.authority +
    w.linkType * c.linkType +
    w.dofollow * c.dofollow +
    w.traffic * c.traffic +
    w.local * c.local
  );
}

function priorityOf(o, value) {
  const mult = cfg.feasibilityMultiplier[o.feasibility] ?? 0.8;
  const nComp = (o.competitorValidated || []).length;
  const bonus = Math.min(cfg.competitorValidationBonus.perCompetitor * nComp, cfg.competitorValidationBonus.max);
  const priority = clamp(round1(value * mult + bonus), 0, 100);
  const tier = cfg.tiers.find((t) => priority >= t.min)?.name ?? cfg.tiers.at(-1).name;
  return { priority, tier, feasibilityMult: mult, competitorBonus: bonus };
}

// ---- RUN ---------------------------------------------------------------
const scored = opps.map((o) => {
  const gate = applyGates(o);
  const comps = componentScores(o);
  const value = round1(valueScore(comps));
  const pr = gate.rejected ? { priority: 0, tier: "REJECTED", feasibilityMult: 0, competitorBonus: 0 } : priorityOf(o, value);
  return {
    id: o.id, name: o.name, domain: o.domain, category: o.category,
    dr: o.dr, traffic: o.traffic, dofollow: o.dofollow, relevance: o.relevance, local: !!o.local,
    linkType: o.linkType, feasibility: o.feasibility, cost: o.cost,
    competitorValidated: o.competitorValidated || [],
    valueScore: value, priority: pr.priority, tier: pr.tier,
    status: gate.rejected ? "rejected" : (o.status || "new"),
    gate, action: o.action, contact: o.contact, targetPage: o.targetPage,
    estimated: o.estimated || [],
  };
});

const active = scored.filter((s) => !s.gate.rejected).sort((a, b) => b.priority - a.priority);
const rejected = scored.filter((s) => s.gate.rejected);

writeFileSync(join(ROOT, "data/opportunities.scored.json"),
  JSON.stringify({ scoredOn: process.env.RUN_DATE || "run", counts: { total: scored.length, active: active.length, rejected: rejected.length }, opportunities: [...active, ...rejected] }, null, 2));

// ---- REPORT ------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const lines = [];
lines.push("# Backlink pipeline - scored opportunities", "");
lines.push(`Input: \`${inputPath.replace(ROOT + "/", "")}\` · ${scored.length} raw · ${active.length} qualified · ${rejected.length} gated out`, "");
lines.push("| # | Priority | Tier | Opportunity | Category | DR | Follow | Feasibility | Next action |");
lines.push("|---|---------|------|-------------|----------|----|--------|-------------|-------------|");
active.forEach((o, i) => {
  lines.push(`| ${i + 1} | **${o.priority}** | ${o.tier.split(" ")[0]} | ${o.name} | ${o.category} | ${o.dr} | ${o.dofollow === true ? "yes" : o.dofollow === false ? "no" : "?"} | ${o.feasibility} | ${o.action?.split(".")[0] ?? ""}. |`);
});
if (rejected.length) {
  lines.push("", "## Gated out (never pursued)", "");
  rejected.forEach((o) => lines.push(`- **${o.name}** - ${o.gate.reasons.join(", ")}`));
}
writeFileSync(join(ROOT, "data/pipeline-report.md"), lines.join("\n") + "\n");

// ---- CONSOLE SUMMARY ---------------------------------------------------
console.log(`\nScored ${scored.length} opportunities - ${active.length} qualified, ${rejected.length} gated out\n`);
console.log(pad("PRIO", 6), pad("TIER", 5), pad("DR", 4), pad("FEASIBILITY", 14), "OPPORTUNITY");
console.log("-".repeat(90));
for (const o of active) {
  console.log(pad(o.priority, 6), pad(o.tier.split(" ")[0], 5), pad(o.dr, 4), pad(o.feasibility, 14), o.name.slice(0, 46));
}
if (rejected.length) {
  console.log("\nGATED OUT:");
  for (const o of rejected) console.log(" ✗", pad(o.name.slice(0, 40), 42), o.gate.reasons.join(", "));
}
console.log(`\nWrote data/opportunities.scored.json and data/pipeline-report.md`);

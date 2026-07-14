#!/usr/bin/env node
/**
 * Autonomous runner for the deployed (Replit cron) engine.
 * Stages: DISCOVER (competitor mining) -> QUALIFY/CLASSIFY -> SCORE -> MONITOR -> DRAFT -> DIGEST.
 * Network stages require AHREFS_API_KEY; pass --dry-run to exercise scoring/drafting offline.
 *
 * Cron:  npm run backlink:run     (see package.json)
 * Human-only steps are never performed here: no sends, submissions, payments, or disavow uploads.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { ahrefs, _today } from "./ahrefs.mjs";
import { classify } from "./classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const p = (f) => join(ROOT, f);
const readJSON = (f) => JSON.parse(readFileSync(p(f), "utf8"));
const writeJSON = (f, v) => writeFileSync(p(f), JSON.stringify(v, null, 2) + "\n");
const DATE = _today();

const gates = readJSON("config/quality-gates.json");
const competitors = readJSON("data/competitors.json");
const seed = readJSON("data/opportunities.seed.json");
const known = new Set(seed.map((o) => String(o.domain).toLowerCase()));

const log = [`## Run ${DATE}${DRY ? " (dry-run)" : ""}`];
let added = 0, rejected = 0;

// ---- DISCOVER + CLASSIFY ----------------------------------------------
if (!DRY && ahrefs.hasKey()) {
  for (const c of competitors.competitors) {
    if (c.analyzed) continue;
    try {
      const { refdomains = [] } = await ahrefs.refDomains(c.domain, { limit: 40 });
      for (const row of refdomains) {
        const d = String(row.domain || "").toLowerCase();
        const res = classify(row, c.domain);
        if (!res.keep) { rejected++; continue; }
        if (known.has(d)) continue; // dedupe
        known.add(d);
        seed.push(res.opp);
        added++;
      }
      c.analyzed = true;
      c.analyzedOn = DATE;
    } catch (e) {
      log.push(`- discover ${c.domain} FAILED: ${e.message}`);
    }
  }
  writeJSON("data/competitors.json", competitors);
  writeJSON("data/opportunities.seed.json", seed);
  log.push(`- Discovery: +${added} new opportunities, ${rejected} rejected (spam/noise/footprint).`);
} else {
  log.push(`- Discovery: skipped (${DRY ? "dry-run" : "no AHREFS_API_KEY"}).`);
}

// ---- SCORE ------------------------------------------------------------
execSync(`node ${JSON.stringify(p("src/score.mjs"))}`, { stdio: "inherit", env: { ...process.env, RUN_DATE: DATE } });
const scored = readJSON("data/opportunities.scored.json");
const top = scored.opportunities.filter((o) => o.status !== "rejected").slice(0, 5);
log.push(`- Pipeline: ${scored.counts.active} qualified / ${scored.counts.rejected} gated out. Top P1: ` +
  top.map((o) => `${o.name} (${o.priority})`).join(", ") + ".");

// ---- MONITOR ----------------------------------------------------------
if (!DRY && ahrefs.hasKey()) {
  try {
    const audit = readJSON("data/our-profile-audit.json");
    const [dr, stats] = await Promise.all([
      ahrefs.domainRating("boiseremodeling.co", DATE),
      ahrefs.backlinksStats("boiseremodeling.co", DATE),
    ]);
    const nowDR = dr?.domain_rating?.domain_rating ?? "?";
    const nowRD = stats?.metrics?.live_refdomains ?? "?";
    const baseRD = audit.baseline.liveRefdomains;
    log.push(`- Monitor: DR ${audit.baseline.domainRating} -> ${nowDR} (goal 50). Live refdomains ${baseRD} -> ${nowRD}.`);
  } catch (e) {
    log.push(`- Monitor FAILED: ${e.message}`);
  }
} else {
  log.push("- Monitor: skipped (offline).");
}

// ---- DRAFT (queue only, never send) -----------------------------------
const queuePath = "outreach/queue.json";
const queue = existsSync(p(queuePath)) ? readJSON(queuePath) : [];
const queued = new Set(queue.map((q) => q.domain));
const cap = gates.velocityPolicy.maxOutreachSendsPerDay;
const needsMessage = new Set(["outreach", "digital_pr", "application"]);
let drafts = 0;
for (const o of scored.opportunities) {
  if (drafts >= cap) break;
  if (o.status === "rejected" || o.priority < 52) continue;   // P1/P2 only
  if (!needsMessage.has(o.feasibility)) continue;             // self-serve => packet, not message
  if (queued.has(o.domain)) continue;
  queue.push({
    domain: o.domain, name: o.name, channel: o.feasibility, category: o.category,
    priority: o.priority, contact: o.contact || "", status: "awaiting_approval",
    missingInputs: ["senderName", "senderEmail", "senderPhone"].filter(() => true),
    draftedOn: DATE, note: "Fill placeholders from outreach/templates.md; human approves + sends.",
  });
  queued.add(o.domain);
  drafts++;
}
writeJSON(queuePath, queue);
log.push(`- Drafts: +${drafts} queued (awaiting_approval, cap ${cap}/run). Nothing sent.`);

// ---- DIGEST -----------------------------------------------------------
appendFileSync(p("data/run-log.md"), "\n" + log.join("\n") + "\n");
console.log("\n" + log.join("\n") + "\n");

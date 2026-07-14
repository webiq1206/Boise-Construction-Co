#!/usr/bin/env node
/**
 * Autonomous runner. Stages: DISCOVER -> QUALIFY/CLASSIFY -> SCORE -> MONITOR
 * -> DRAFT -> DIGEST. Uses store.mjs for durable state (Postgres or JSON) and
 * outreach.mjs to generate real drafts/packets. Network stages need
 * AHREFS_API_KEY; --dry-run exercises everything else offline.
 *
 * Never sends, submits, pays, or uploads a disavow file - that is send.mjs,
 * behind a human-approval gate.
 *
 *   npm run backlink:run              # full loop (needs env keys)
 *   npm run backlink:run -- --dry-run # offline (scoring + drafting + persistence via JSON)
 */
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { ahrefs, _today } from "./ahrefs.mjs";
import { classify } from "./classify.mjs";
import { store } from "./store.mjs";
import { buildArtifacts } from "./outreach.mjs";
import { resolveContacts } from "./contacts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (f) => join(ROOT, f);
const readJSON = (f) => JSON.parse(readFileSync(P(f), "utf8"));
const DRY = process.argv.includes("--dry-run");
const DATE = _today();
const OURS = "boiseremodeling.co";

const gates = readJSON("config/quality-gates.json");
const log = [`## Run ${DATE}${DRY ? " (dry-run)" : ""} [store: ${store.mode}]`];

await store.init();
const opps = await store.readOpportunities();
const known = new Set(opps.map((o) => String(o.domain).toLowerCase()));
let added = 0, rejected = 0;

// ---- DISCOVER + CLASSIFY ----------------------------------------------
if (!DRY && ahrefs.hasKey()) {
  const competitors = readJSON("data/competitors.json");
  for (const c of competitors.competitors) {
    if (c.analyzed) continue;
    try {
      const { refdomains = [] } = await ahrefs.refDomains(c.domain, { limit: 40 });
      for (const row of refdomains) {
        const res = classify(row, c.domain);
        if (!res.keep) { rejected++; continue; }
        const d = String(res.opp.domain).toLowerCase();
        if (known.has(d)) continue;
        known.add(d); opps.push(res.opp); added++;
      }
      c.analyzed = true; c.analyzedOn = DATE;
    } catch (e) { log.push(`- discover ${c.domain} FAILED: ${e.message}`); }
  }
  log.push(`- Discovery: +${added} new, ${rejected} rejected (spam/noise/footprint).`);
} else {
  log.push(`- Discovery: skipped (${DRY ? "dry-run" : "no AHREFS_API_KEY"}).`);
}
await store.writeOpportunities(opps);

// ---- SCORE ------------------------------------------------------------
execSync(`node ${JSON.stringify(P("src/score.mjs"))}`, { stdio: "inherit", env: { ...process.env, RUN_DATE: DATE } });
const scored = readJSON("data/opportunities.scored.json");
// persist scores back onto the canonical records
const scoreById = new Map(scored.opportunities.map((s) => [s.id, s]));
for (const o of opps) { const s = scoreById.get(o.id); if (s) { o.priority = s.priority; o.tier = s.tier; o.status = s.status; } }
await store.writeOpportunities(opps);
const activeSorted = scored.opportunities.filter((o) => o.status !== "rejected").sort((a, b) => b.priority - a.priority);
log.push(`- Pipeline: ${scored.counts.active} qualified / ${scored.counts.rejected} gated out. Top: ` + activeSorted.slice(0, 5).map((o) => `${o.name.split(" ")[0]} (${o.priority})`).join(", ") + ".");

// ---- MONITOR ----------------------------------------------------------
if (!DRY && ahrefs.hasKey()) {
  try {
    const audit = readJSON("data/our-profile-audit.json");
    const [dr, stats, refs] = await Promise.all([
      ahrefs.domainRating(OURS, DATE),
      ahrefs.backlinksStats(OURS, DATE),
      ahrefs.refDomains(OURS, { limit: 100 }),
    ]);
    const nowDR = dr?.domain_rating?.domain_rating ?? null;
    const m = stats?.metrics ?? {};
    await store.appendSnapshot({ date: DATE, dr: nowDR, liveBacklinks: m.live, liveRefdomains: m.live_refdomains, allTimeRefdomains: m.all_time_refdomains });
    const { added: newRefs, lost: lostRefs } = await store.syncRefdomains(refs?.refdomains ?? []);
    // refresh disavow with any newly-seen spam-blog residue pointing at us
    const newSpam = (refs?.refdomains ?? []).map((r) => String(r.domain).toLowerCase())
      .filter((d) => gates.spamBlogPatternHints.some((h) => d.includes(h)));
    if (newSpam.length) await store.addDisavow(newSpam, "spam-blog residue (auto-flagged)");
    const prev = await store.lastSnapshot();
    const trend = prev?.dr != null && nowDR != null ? (nowDR > prev.dr ? "up" : nowDR < prev.dr ? "down" : "flat") : "n/a";
    log.push(`- Monitor: DR ${audit.baseline.domainRating} baseline -> ${nowDR} (goal 50, trend ${trend}). Live refdomains ${m.live_refdomains}. +${newRefs.length} new, -${lostRefs.length} lost. ${newSpam.length} new spam flagged for disavow.`);
    if (lostRefs.length) log.push(`  Lost refdomains: ${lostRefs.slice(0, 8).join(", ")}${lostRefs.length > 8 ? "..." : ""}`);
  } catch (e) { log.push(`- Monitor FAILED: ${e.message}`); }
} else {
  log.push("- Monitor: skipped (offline).");
}

// ---- DRAFT (artifacts only; never sends) ------------------------------
const queue = await store.readQueue();
const queued = new Set(queue.map((q) => q.domain));
const toDraft = activeSorted.filter((o) => o.priority >= 52 && !queued.has(o.domain)); // P1/P2

// Resolve outreach contacts (email discovery) for email-channel drafts. Network,
// so skipped in --dry-run; self-serve targets are form submissions and need none.
let resolvedCount = 0, formOnly = 0;
if (!DRY) {
  const emailChannels = new Set(["application", "digital_pr", "outreach"]);
  const targets = toDraft.filter((o) => emailChannels.has(o.feasibility));
  const contacts = await resolveContacts(targets);
  for (const o of toDraft) {
    const c = contacts.get(o.id);
    if (!c) continue;
    o.resolvedContact = c;
    if (c.email) resolvedCount++; else if (c.contactForm) formOnly++;
  }
  log.push(`- Contacts: resolved ${resolvedCount} email addresses, ${formOnly} form-only (of ${targets.length} email-channel targets).`);
}

const artifacts = buildArtifacts(toDraft.map((s) => ({ ...s, feasibility: s.feasibility, category: s.category, resolvedContact: s.resolvedContact })));
const merged = [...queue, ...artifacts];
await store.writeQueue(merged);
const emails = artifacts.filter((a) => a.type === "email").length;
const packets = artifacts.filter((a) => a.type === "packet").length;
const ready = artifacts.filter((a) => (a.missingInputs || []).length === 0).length;
log.push(`- Drafts: +${artifacts.length} (${emails} emails, ${packets} citation packets); ${ready} send-ready, ${artifacts.length - ready} awaiting inputs. Velocity cap at SEND: ${gates.velocityPolicy.maxOutreachSendsPerDay}/day. Nothing sent.`);

// ---- DIGEST -----------------------------------------------------------
mkdirSync(P("data"), { recursive: true });
appendFileSync(P("data/run-log.md"), "\n" + log.join("\n") + "\n");
console.log("\n" + log.join("\n") + "\n");

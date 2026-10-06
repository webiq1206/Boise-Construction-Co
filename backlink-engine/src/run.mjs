#!/usr/bin/env node
/** Offline free-growth preparation. No fetch, paid SDK, database, crawler or dispatch imports. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { ROOT, loadIdentity, BRAND, assertConstructionArtifact } from "./identity.mjs";
import { importCandidates, mergeCandidates } from "./free-sources.mjs";
import { scoreOpportunities } from "./score.mjs";
import { buildArtifacts } from "./outreach.mjs";

const read = (path, fallback) => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
export async function run({ scoreOnly = false } = {}) {
  loadIdentity(); // Fail before any state read/write when brand configuration drifts.
  const args = process.argv.slice(2);
  const importIndex = args.indexOf("--import");
  if (args.filter((arg) => arg === "--import").length > 1 || args.filter((arg) => arg === "--dry-run").length > 1 ||
      args.some((arg, index) => !["--dry-run", "--import"].includes(arg) && !(importIndex >= 0 && index === importIndex + 1))) throw new Error("Use --dry-run or --import <manifest.json> only.");
  if (importIndex >= 0 && (!args[importIndex + 1] || args[importIndex + 1].startsWith("--"))) throw new Error("--import requires a local JSON manifest.");
  // Ignored, local state prevents discovered contacts/receipts from being committed publicly.
  const state = resolve(ROOT, "../.backlink-state");
  const existing = read(join(state, "opportunities.json"), []);
  let opportunities = mergeCandidates(existing, []);
  if (importIndex >= 0) opportunities = mergeCandidates(existing, importCandidates(read(resolve(args[importIndex + 1]), null)));
  const scored = scoreOpportunities(opportunities);
  const existingQueue = read(join(state, "queue.json"), []);
  existingQueue.forEach(assertConstructionArtifact);
  const queued = new Set(existingQueue.map((entry) => entry.id));
  const artifacts = scoreOnly ? [] : buildArtifacts(scored.filter((entry) => !queued.has(entry.id)));
  const report = { brandId: BRAND.id, mode: "offline_free_only", networkCalls: 0, providerSpend: 0, dispatchPaused: true,
    counts: { candidates: scored.length, reviewed: scored.filter((entry) => entry.qualified).length, held: scored.filter((entry) => !entry.qualified).length, draftsAdded: artifacts.length },
    outcomes: { verifiedLinks: null, qualifiedLeads: null, authority: null, traffic: null },
    note: "Preparation only. Unknown outcomes are not zero. Existing P5 growth owner controls any authorized live verification or distribution." };
  if (!args.includes("--dry-run")) {
    mkdirSync(state, { recursive: true, mode: 0o700 });
    for (const [name, data] of [["opportunities.json", opportunities], ["scored.json", scored], ["queue.json", [...existingQueue, ...artifacts]], ["report.json", report]]) {
      const path = join(state, name); const temp = `${path}.${process.pid}.tmp`;
      writeFileSync(temp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 }); renameSync(temp, path);
    }
  }
  console.log(JSON.stringify({ ...report, writes: args.includes("--dry-run") ? 0 : "local_state_only" }, null, 2));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

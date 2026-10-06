import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { BRAND, ROOT } from "../backlink-engine/src/identity.mjs";
import { importCandidates, mergeCandidates, MAX_RECORDS, publicUrl } from "../backlink-engine/src/free-sources.mjs";
import { scoreOpportunity } from "../backlink-engine/src/score.mjs";

const today = new Date().toISOString().slice(0, 10);
const manifest = (extra = {}) => ({ brandId: BRAND.id, kind: "known_urls", observedOn: today, records: [{ sourceUrl: "https://example.org/resources" }], ...extra });
const reviewed = (extra = {}) => ({ ...importCandidates(manifest())[0], linkType: "editorial", review: { editorialFit: true, relevance: "high", local: true, evidenceUrl: "https://example.org/resources", reviewedOn: today }, route: { cost: "free", verified: true, url: "https://example.org/contact", checkedOn: today }, ...extra });

test("known URL adapter is deterministic, bounded and explicit about unknowns", () => {
  const [candidate] = importCandidates(manifest({ records: [{ sourceUrl: "https://example.org/resources", dr: 99, traffic: 1000000 }, { sourceUrl: "https://example.org/resources" }] }));
  assert.deepEqual(candidate, importCandidates(manifest())[0]);
  assert.equal(candidate.dr, null);
  assert.equal(candidate.traffic, null);
  assert.equal(candidate.dofollow, null);
  assert.equal(candidate.verifiedLink, false);
  assert.equal(candidate.status, "discovered");
  assert.throws(() => importCandidates(manifest({ records: Array(MAX_RECORDS + 1).fill({ sourceUrl: "https://example.org" }) })), /limited/);
});
test("manual Search Console export requires the exact property and never proves a link", () => {
  const [candidate] = importCandidates(manifest({ kind: "search_console_links_export", property: `sc-domain:${BRAND.domain}` }));
  assert.equal(candidate.source.kind, "search_console_links_export");
  assert.equal(candidate.verifiedLink, false);
  assert.throws(() => importCandidates(manifest({ kind: "search_console_links_export", property: "sc-domain:boiseremodeling.co" })), /property/);
  assert.throws(() => importCandidates(manifest({ kind: "search_console_api" })), /Unsupported/);
});
for (const sourceUrl of ["http://example.org", "https://name:secret@example.org", "https://example.org/?email=private", "https://example.org/#private", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://service.local", "https://example.org:5000"]) {
  test(`rejects unsuitable source URL ${new URL(sourceUrl).hostname}`, () => assert.throws(() => publicUrl(sourceUrl)));
}
test("rejects wrong brand, owned source, malformed/future dates and cross-brand CTA", () => {
  assert.throws(() => importCandidates(manifest({ brandId: "boise-remodeling-co" })));
  assert.throws(() => importCandidates(manifest({ records: [{ sourceUrl: BRAND.url }] })));
  for (const observedOn of ["unknown", "2026-02-31", "2999-01-01"]) assert.throws(() => importCandidates(manifest({ observedOn })));
  assert.throws(() => importCandidates(manifest({ records: [{ sourceUrl: "https://example.org", targetUrl: "https://boiseremodeling.co" }] })));
});
for (const status of ["suppressed", "submitted_pending_review", "attempted_unconfirmed", "sent", "verified_link", "rejected"]) {
  test(`reimport preserves ${status}, receipts and review`, () => {
    const previous = reviewed({ status, receipt: { reference: "existing-receipt" } });
    assert.deepEqual(mergeCandidates([previous], importCandidates(manifest())), [previous]);
    assert.equal(scoreOpportunity(previous).qualified, false);
  });
}
test("source merge rejects existing cross-brand state", () => {
  assert.throws(() => mergeCandidates([{ ...reviewed(), brandId: "boise-remodeling-co" }], []));
});
test("unknown metrics remain null and do not exclude a genuinely reviewed free resource", () => {
  const scored = scoreOpportunity(reviewed({ dr: 99, traffic: 1000000, dofollow: true }));
  assert.equal(scored.qualified, true);
  assert.equal(scored.priority, 100);
  assert.equal(scored.dr, null);
  assert.equal(scored.traffic, null);
  assert.equal(scored.dofollow, null);
  assert.deepEqual(scored.metricStatus, { authority: "unknown", traffic: "unknown", dofollow: "unknown" });
});
test("observed metrics require traceable current evidence; they never alter rank", () => {
  const observed = (value) => ({ status: "observed", value, sourceUrl: "https://example.org/report", observedOn: today });
  const scored = scoreOpportunity(reviewed({ metrics: { authority: observed(0), traffic: observed(0), dofollow: observed(false) } }));
  assert.equal(scored.dr, 0); assert.equal(scored.traffic, 0); assert.equal(scored.dofollow, false);
  assert.equal(scored.priority, scoreOpportunity(reviewed()).priority);
  for (const metric of [{ value: 88 }, { ...observed(88), status: "estimated" }, { ...observed(88), sourceUrl: "bad" }, { ...observed(88), observedOn: "2020-01-01" }, { ...observed(88), observedOn: "2999-01-01" }, observed(101), observed(-1)]) {
    assert.equal(scoreOpportunity(reviewed({ metrics: { authority: metric } })).dr, null);
  }
});
test("paid, unknown, stale or unreviewed opportunities never become qualified drafts", () => {
  assert.equal(scoreOpportunity(importCandidates(manifest())[0]).qualified, false);
  for (const extra of [
    { route: { ...reviewed().route, cost: "paid_membership" } },
    { route: { ...reviewed().route, cost: "unknown" } },
    { route: { ...reviewed().route, checkedOn: "2020-01-01" } },
    { review: { ...reviewed().review, reviewedOn: "2026-02-31" } },
    { review: { ...reviewed().review, editorialFit: false } },
    { spamFlags: ["paid_link_marketplace"] },
    { feasibility: "self_serve" },
    { brandId: "boise-remodeling-co" },
  ]) assert.equal(scoreOpportunity(reviewed(extra)).qualified, false, JSON.stringify(extra));
  assert.equal(scoreOpportunity(reviewed({ feasibility: "self_serve", review: { ...reviewed().review, listingEligibility: "verified" } })).qualified, true);
});

test("full runner is offline, dry-run is write-free, imports are idempotent, private state stays local", () => {
  const temp = mkdtempSync(join(tmpdir(), "construction-growth-test-"));
  try {
    const engine = join(temp, "backlink-engine"); mkdirSync(engine);
    cpSync(join(ROOT, "src"), join(engine, "src"), { recursive: true });
    cpSync(join(ROOT, "config"), join(engine, "config"), { recursive: true });
    const input = join(temp, "input.json"); writeFileSync(input, JSON.stringify(manifest()));
    const trap = join(temp, "deny-network.mjs"); writeFileSync(trap, 'globalThis.fetch = () => { throw new Error("NETWORK FORBIDDEN"); };');
    const env = { ...process.env, AHREFS_API_KEY: "test-only", HUNTER_API_KEY: "test-only", RESEND_API_KEY: "test-only", DATABASE_URL: "invalid-test-only", BACKLINK_SEND_ENABLED: "true" };
    const run = (...args) => spawnSync(process.execPath, ["--import", trap, join(engine, "src/run.mjs"), ...args], { env, encoding: "utf8" });
    let result = run("--import", input, "--dry-run");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).networkCalls, 0);
    assert.equal(JSON.parse(result.stdout).writes, 0);
    assert.equal(existsSync(join(temp, ".backlink-state")), false);
    result = run("--import", input); assert.equal(result.status, 0, result.stderr);
    const state = join(temp, ".backlink-state");
    const old = readFileSync(join(state, "opportunities.json"), "utf8");
    assert.equal(JSON.parse(old).length, 1);
    assert.equal(JSON.parse(readFileSync(join(state, "queue.json"))).length, 0);
    result = run("--import", input); assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(state, "opportunities.json"), "utf8"), old);
    for (const args of [["garbage"], ["--import"], ["--import", input, "--import", input]]) assert.equal(run(...args).status, 1);
    writeFileSync(join(state, "opportunities.json"), JSON.stringify([reviewed()]));
    result = run(); assert.equal(result.status, 0, result.stderr);
    const queue = JSON.parse(readFileSync(join(state, "queue.json")));
    assert.equal(queue.length, 1); assert.equal(queue[0].dispatchPaused, true);
    result = run(); assert.equal(JSON.parse(result.stdout).counts.draftsAdded, 0);
    writeFileSync(join(state, "queue.json"), JSON.stringify([{ ...queue[0], brandId: "boise-remodeling-co" }]));
    assert.equal(run().status, 1);
    writeFileSync(join(state, "queue.json"), "[]");
    writeFileSync(join(state, "opportunities.json"), JSON.stringify([reviewed({ targetUrl: "https://boiseremodeling.co" })]));
    assert.equal(run().status, 1);
    writeFileSync(join(state, "opportunities.json"), JSON.stringify([reviewed(), reviewed({ status: "suppressed" })]));
    assert.equal(run().status, 1);
    // Neither history nor a poisoned paid client can influence the supported path.
    assert.equal(existsSync(join(engine, "legacy")), false);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test("persisted candidates cannot bypass source, target, ID or provenance validation", () => {
  for (const extra of [
    { sourceUrl: "https://secret:token@service.local/private" }, { targetUrl: "https://boiseremodeling.co" },
    { id: "arbitrary-id" }, { domain: "different.example.org" }, { source: { kind: "unknown", observedOn: today } },
    { source: { kind: "known_urls", observedOn: "2026-02-31" } },
  ]) {
    const candidate = reviewed(extra);
    assert.equal(scoreOpportunity(candidate).qualified, false);
    assert.throws(() => mergeCandidates([candidate], []));
  }
});
test("conflicting existing duplicates fail instead of discarding suppression or receipts", () => {
  const first = reviewed();
  const suppressed = { ...first, status: "suppressed", receipt: { reference: "preserve-this" } };
  for (const records of [[first, suppressed], [suppressed, first]]) assert.throws(() => mergeCandidates(records, []), /Duplicate existing/);
});

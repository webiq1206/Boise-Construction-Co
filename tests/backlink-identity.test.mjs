import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { BRAND, ROOT, loadIdentity, assertBrandIdentity, assertConstructionArtifact } from "../backlink-engine/src/identity.mjs";
import { draftFor } from "../backlink-engine/src/outreach.mjs";

const clone = (value) => structuredClone(value);
test("verified Construction public identity is internally consistent", () => {
  const { site, profile } = loadIdentity();
  assert.equal(assertBrandIdentity(site, profile), true);
  assert.equal(site.nap.phone, "(208) 477-1169");
  assert.equal(profile.portfolioAssets.length, 0);
});
for (const field of ["domain", "sender", "asset", "copy", "schema", "street", "phone", "phoneTel", "city", "state", "legalParent", "senderPhone"]) {
  test(`rejects cross-brand or private ${field}`, () => {
    const { site, profile } = clone(loadIdentity());
    if (field === "domain") site.domain = "boiseremodeling.co";
    if (field === "sender") profile.sender.email = "hello@boiseremodeling.co";
    if (field === "asset") profile.portfolioAssets = [{ url: "https://other.example/photo.webp" }];
    if (field === "copy") profile.descriptions.short = "Boise Remodeling Co";
    if (field === "schema") site.schema = { name: "Boise Remodeling Co" };
    if (field === "street") site.nap.street = "private address";
    if (["phone", "phoneTel", "city", "state"].includes(field)) site.nap[field] = "wrong identity";
    if (field === "legalParent") site.legalParent = "Unrelated LLC";
    if (field === "senderPhone") profile.sender.phone = "wrong phone";
    assert.throws(() => assertBrandIdentity(site, profile));
  });
}
test("packets and resource drafts remain Construction-only and blocked", () => {
  for (const feasibility of ["self_serve", "review_profile", "application", "digital_pr", "outreach"]) {
    const draft = draftFor({ id: "reviewed-fixture", brandId: BRAND.id, domain: "example.org", feasibility, qualified: true });
    assert.equal(draft.status, "draft_only");
    assert.equal(draft.dispatchPaused, true);
    assert.ok(draft.missingInputs.length > 0);
    assert.doesNotMatch(JSON.stringify(draft), /boiseremodeling|Jared|completed kitchen/i);
    assertConstructionArtifact(draft);
  }
  assert.throws(() => draftFor({ brandId: "boise-remodeling-co" }));
  assert.throws(() => assertConstructionArtifact({ brandId: BRAND.id, fields: { website: "https://boiseremodeling.co" } }));
  assert.throws(() => assertConstructionArtifact({ brandId: BRAND.id, fields: { email: "hello@elsewhere.example" } }));
});
test("legacy dispatch cannot be armed", () => {
  const result = spawnSync(process.execPath, [`${ROOT}/src/send.mjs`], { env: { ...process.env, BACKLINK_SEND_ENABLED: "true", RESEND_API_KEY: "test-only-not-a-credential" }, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /dispatch is paused/);
});
test("preflight is offline despite ambient paid-provider and database configuration", () => {
  const result = spawnSync(process.execPath, [`${ROOT}/src/preflight.mjs`], { env: { ...process.env, AHREFS_API_KEY: "test-only", HUNTER_API_KEY: "test-only", DATABASE_URL: "invalid-test-only", BACKLINK_SEND_ENABLED: "true" }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /UNKNOWN/);
  assert.match(result.stdout, /PAUSED/);
});

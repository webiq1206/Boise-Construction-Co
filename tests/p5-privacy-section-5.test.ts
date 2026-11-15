import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const page = readFileSync("app/privacy-policy/page.tsx", "utf8").replace(/\s+/g, " ");

test("the construction privacy policy discloses analytics, ads and the Meta pixel", () => {
  assert.match(page, /Google Analytics 4 \(GA4\)/);
  assert.match(page, /Google Ads to measure which of our ads lead to quote requests, calls and texts/);
  assert.match(page, /doesn't send Google your name, your own phone number/);
  assert.match(page, /We also use the Meta Pixel and Meta's Conversions API/);
  assert.match(page, /https:\/\/www\.facebook\.com\/privacy\/policy/);
});

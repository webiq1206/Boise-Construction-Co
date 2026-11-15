import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const page = readFileSync("app/privacy-policy/page.tsx", "utf8");

test("the privacy page discloses Google Analytics 4 and Google Ads", () => {
  assert.match(page, /Google Analytics 4/);
  assert.match(page, /Google Ads/);
  assert.match(page, /Meta Pixel/);
});

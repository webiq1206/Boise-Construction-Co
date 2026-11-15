/**
 * The homepage calculator and the conversational estimator both price from
 * the v2 cost book. Totals below are the selling ranges those functions
 * return for projects this site's calculator offers.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { priceReviewedScope } from "../lib/p5/costBook.ts";
import { createPlanningConfiguration, PLANNING_MODEL_VERSION } from "../lib/p5/planningBooks.ts";
import { priceBookRates, sharedBookRate } from "../lib/p5/priceBook.ts";
import { bookQuote, UNPRICED_CALCULATOR_ITEMS } from "../shared/costBookQuote.ts";
import { calculateEstimate, EMPTY_REFINEMENTS, GARAGE_BAY_SQFT } from "../shared/estimateEngine.ts";

const REQUIRED = ["03-17-01-M", "03-17-01-L", "03-15-02-M", "03-15-02-L", "03-16-01-M", "03-16-01-L", "03-14-01-M", "03-14-01-L", "03-04-01", "03-04-02", "03-04-03", "03-05-02-M", "03-05-02-L", "REF-GENERAL-HOUR", "REF-PLUMBING-HOUR", "REF-ELECTRICAL-HOUR"];
const NOW = new Date("2026-11-15T12:00:00Z");

function estimatorRange(sqft: number, finish: string) {
  const answers = { service: "new-construction", sqft: String(sqft), finish, stories: "1", garageIncluded: "no" };
  const catalog = {
    version: PLANNING_MODEL_VERSION,
    source: "owner",
    authorizedBy: "owner",
    importedAt: "2026-11-15T00:00:00.000Z",
    rates: [
      ...REQUIRED.map((code) => ({ code, description: "Synthetic", type: "Labor" as const, unit: code.includes("HOUR") ? "HR" : "SF", amount: 1, source: "Synthetic", basis: "owner-average-cost" as const })),
      ...priceBookRates(answers),
    ],
  };
  const priced = priceReviewedScope(
    { text: `New ${sqft} square foot home`, answers, extraction: null, uploads: [], reviewedAt: "2026-11-15", corrections: [] } as never,
    createPlanningConfiguration(catalog, ["new-construction"]),
    NOW,
  );
  return priced.customer.range;
}

const homes: { name: string; project: "custom-home" | "semi-custom-home" | "build-on-your-lot"; sqft: number; finish: "refresh" | "mid-range" | "high-end" | "luxury"; low: number; high: number }[] = [
  { name: "Custom home, 2,400 SF, Signature", project: "custom-home", sqft: 2400, finish: "mid-range", low: 755000, high: 878000 },
  { name: "Custom home, 2,000 SF, Essential", project: "custom-home", sqft: 2000, finish: "refresh", low: 472000, high: 549000 },
  { name: "Semi-custom home, 2,200 SF, Premium", project: "semi-custom-home", sqft: 2200, finish: "high-end", low: 934000, high: 1086000 },
  { name: "Build on your lot, 2,400 SF, Luxury", project: "build-on-your-lot", sqft: 2400, finish: "luxury", low: 1151000, high: 1338000 },
];

test("homepage calculator and estimator return the same v2 ranges", () => {
  for (const item of homes) {
    const homepage = calculateEstimate({ project: item.project, finish: item.finish, sqft: item.sqft, refinements: { ...EMPTY_REFINEMENTS } });
    const estimator = estimatorRange(item.sqft, item.finish);
    assert.deepEqual({ low: homepage.priceLow, high: homepage.priceHigh }, { low: item.low, high: item.high }, item.name);
    assert.deepEqual(estimator, { low: item.low, high: item.high }, `${item.name} estimator`);
    const rate = sharedBookRate("90-10-01", item.finish === "refresh" ? "builder" : item.finish === "mid-range" ? "mid" : item.finish === "high-end" ? "high" : "luxury", false);
    assert.ok(rate && rate.amount > 0);
    assert.ok(homepage.priceLow > rate.amount * item.sqft, `${item.name} customer price is above the direct book cost`);
  }
});

test("a shop home prices living area and a stated shop from two book lines", () => {
  const living = sharedBookRate("90-10-01", "mid", false);
  const shop = sharedBookRate("90-50-13", "mid", false);
  assert.equal(living?.amount, 200);
  assert.equal(shop?.amount, 48);
  const quoted = bookQuote({
    project: "shop-home",
    finish: "mid-range",
    sqft: 1600,
    refinements: { shopSize: 1200 },
  });
  assert.deepEqual(
    quoted.lines.map((line) => [line.code, line.quantity, line.unitAmount]),
    [["90-10-01", 1600, 200], ["90-50-13", 1200, 48]],
  );
  assert.equal(quoted.direct, 1600 * 200 + 1200 * 48);
  const homepage = calculateEstimate({
    project: "shop-home",
    finish: "mid-range",
    sqft: 1600,
    refinements: { ...EMPTY_REFINEMENTS, shopSize: 1200 },
  });
  assert.equal(homepage.priceLow, 594000);
  assert.equal(homepage.priceHigh, 691000);
});

test("an unstated shop size is not given an invented price", () => {
  const quoted = bookQuote({ project: "shop-home", finish: "mid-range", sqft: 1700, refinements: {} });
  assert.deepEqual(quoted.lines.map((line) => line.code), ["90-10-01"]);
  assert.ok(UNPRICED_CALCULATOR_ITEMS.some((item) => /shop size/i.test(item.item)));
});

test("a stated garage uses the book garage rate and the bay quantity", () => {
  const garage = sharedBookRate("90-10-03", "mid", false);
  assert.equal(garage?.amount, 65);
  const homepage = calculateEstimate({
    project: "custom-home",
    finish: "mid-range",
    sqft: 2400,
    refinements: { ...EMPTY_REFINEMENTS, garageBays: "two" },
  });
  const estimator = estimatorRange(2400, "mid-range");
  assert.ok(estimator);
  assert.ok(homepage.priceLow > (estimator?.low ?? 0), "a garage raises the customer price");
  assert.equal(homepage.priceLow, 804000);
  assert.equal(homepage.priceHigh, 935000);
  assert.equal(GARAGE_BAY_SQFT.two, 480);
});

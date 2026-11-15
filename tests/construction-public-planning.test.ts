import "../scripts/offline-network-guard.cjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateEstimate, EMPTY_REFINEMENTS, PROJECT_SIZE_CONFIG, type EstimateInput} from "../shared/estimateEngine.ts";
import {PLANNING_PROJECTS, planningRangeInput, publicPlanningRange} from "../shared/publicPlanningRange.ts";
import {publicPlanningRangePost} from "../server/services/publicPlanningRange.ts";

const golden = JSON.parse(readFileSync(new URL("./fixtures/construction-calculator-751ed80-golden.json", import.meta.url), "utf8")) as {source: string; cases: {name: string; input: EstimateInput; expected: {priceLow: number; priceHigh: number}}[]};
const request = (value: unknown, headers = {"Content-Type": "application/json"}) => new Request("http://127.0.0.1/api/planning-range", {method: "POST", headers, body: JSON.stringify(value)});

test("all existing calculator projects, finish tiers and priced refinements retain their recorded customer ranges", () => {
  assert.equal(golden.source, "751ed80ca0e7532aaac9a723c3662c2436c109f3");
  assert.equal(golden.cases.length, 49);
  for (const fixture of golden.cases) {
    const result = calculateEstimate(fixture.input);
    assert.deepEqual({priceLow: result.priceLow, priceHigh: result.priceHigh}, fixture.expected, fixture.name);
  }
});

test("all public planning branches and area boundaries return only unchanged selling endpoints with zero network", async () => {
  const originalFetch = globalThis.fetch;
  let network = 0;
  globalThis.fetch = async () => {network++; throw Error("No provider may be called");};
  try {
    for (const [project, size] of Object.entries(PLANNING_PROJECTS)) {
      assert.deepEqual(size, PROJECT_SIZE_CONFIG[project as keyof typeof PLANNING_PROJECTS]);
      for (const sqft of [size.min, size.baselineSqft, size.max]) {
        const result = await publicPlanningRangePost(request({project, sqft}));
        assert.equal(result.status, 200);
        assert.equal(result.headers.get("cache-control"), "no-store");
        const body = await result.json();
        assert.deepEqual(Object.keys(body).sort(), ["priceHigh", "priceLow"]);
        const expected = calculateEstimate({project: project as keyof typeof PLANNING_PROJECTS, finish: "mid-range", sqft, refinements: {...EMPTY_REFINEMENTS}});
        assert.deepEqual(body, {priceLow: expected.priceLow, priceHigh: expected.priceHigh});
        assert.ok(publicPlanningRange(body));
        if (sqft === size.baselineSqft) assert.deepEqual(body, golden.cases.find(f => f.name === `${project}-mid-range`)!.expected);
      }
    }
    assert.equal(network, 0);
  } finally {globalThis.fetch = originalFetch;}
});

test("the public endpoint rejects unknown fields, invalid types and out-of-bounds input without echoing private data", async () => {
  const invalid: unknown[] = [null, [], "scope", {}, {project: "constructor", sqft: 2400}, {project: "kitchen", sqft: 250}, {project: "custom-home", sqft: "2400"}, {project: "custom-home", sqft: 2400.5}, {project: "custom-home", sqft: 0}, {project: "custom-home", sqft: 1199}, {project: "custom-home", sqft: 7001}, {project: "custom-home", sqft: 2400, finance: {annualOverhead: 1}}, {project: "custom-home", sqft: 2400, refinements: {}}, {project: "custom-home", sqft: 2400, finish: "luxury"}];
  for (const input of invalid) {
    assert.equal(planningRangeInput(input), null);
    const result = await publicPlanningRangePost(request(input));
    assert.equal(result.status, 400, JSON.stringify(input));
    assert.deepEqual(Object.keys(await result.json()), ["error"]);
  }
  assert.equal((await publicPlanningRangePost(request({}, {"Content-Type": "text/plain"}))).status, 415);
  assert.equal((await publicPlanningRangePost(new Request("http://127.0.0.1/api/planning-range"))).status, 405);
  assert.equal((await publicPlanningRangePost(new Request("http://127.0.0.1/api/planning-range", {method: "POST", headers: {"Content-Type": "application/json"}, body: "{"}))).status, 400);
});

test("declared and streamed oversized requests are refused before calculation", async () => {
  for (const headers of [{"Content-Type": "application/json"}, {"Content-Type": "application/json", "Content-Length": "1024"}]) {
    const result = await publicPlanningRangePost(new Request("http://127.0.0.1/api/planning-range", {method: "POST", headers, body: " ".repeat(1024)}));
    assert.equal(result.status, 413);
    assert.deepEqual(Object.keys(await result.json()), ["error"]);
  }
});

test("the client accepts only finite customer range fields", () => {
  for (const value of [null, [], {}, {priceLow: 1, priceHigh: 2, direct: 1}, {priceLow: "1", priceHigh: 2}, {priceLow: Infinity, priceHigh: Infinity}, {priceLow: -1, priceHigh: 2}, {priceLow: 3, priceHigh: 2}]) assert.equal(publicPlanningRange(value), null);
  assert.deepEqual(publicPlanningRange({priceLow: 1, priceHigh: 2}), {priceLow: 1, priceHigh: 2});
});

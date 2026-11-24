import test from "node:test";
import assert from "node:assert/strict";
import { calculateOwnerServices, ownerServiceBase } from "../shared/ownerServices";

test("small jobs use whole-project minima and exact final customer rates", () => {
  const result = calculateOwnerServices(100);
  assert.deepEqual(result.lines.map(l => [l.sku, l.qboItemId, l.hours, l.rate, l.amount]), [
    ["01-31-03", "48", .25, 120, 30], ["01-31-04", "49", .125, 120, 15], ["01-31-05", "47", .125, 120, 15],
  ]);
  assert.equal(result.additionalCustomerAmount, 60);
});
test("large projects use outside direct cost, not selling price", () => {
  const result = calculateOwnerServices(1000000);
  assert.deepEqual(result.lines.map(l => l.hours), [500, 200, 100]);
  assert.equal(result.additionalCustomerAmount, 96000);
});
test("exclude prior owner, tax, overhead and profit from the base", () => {
  assert.equal(ownerServiceBase([
    { amount: 10000 }, { code: "PB-01-31-01", amount: 2000 }, { code: "01-31-05", amount: 500 },
    { kind: "overhead", amount: 2000 }, { kind: "tax", amount: 1000 }, { kind: "profit", amount: 500 },
    { kind: "supervision-allowance", amount: 1000 },
  ]), 10000);
  assert.equal(ownerServiceBase([], 1234), 1234);
});
test("credit overlapping owner and salary recovery once, never below zero", () => {
  assert.equal(calculateOwnerServices(1000, { overlappingOwnerRecovery: 60, salaryOverheadRecovery: 10 }).additionalCustomerAmount, 29);
  assert.equal(calculateOwnerServices(100, { overlappingOwnerRecovery: 100 }).additionalCustomerAmount, 0);
});
test("milestone defaults allocate a single project minimum", () => {
  const result = calculateOwnerServices(100, { milestones: [{ id: "a", outsideCost: 25 }, { id: "b", outsideCost: 75 }] });
  assert.deepEqual(result.lines[0].milestones.map(m => m.hours), [.0625, .1875]);
  assert.equal(result.lines.reduce((s, l) => s + l.milestones.reduce((n, m) => n + m.amount, 0), 0), 60);
  assert.deepEqual(calculateOwnerServices(100, { milestones: [{ id: "a" }, { id: "b" }] }).lines[0].milestones.map(m => m.hours), [.125, .125]);
});
test("internal edits win and invalid edits fail explicitly", () => {
  assert.equal(calculateOwnerServices(100, { hours: { "01-31-03": 2 } }).lines[0].amount, 240);
  assert.throws(() => calculateOwnerServices(100, { hours: { "01-31-03": -1 } }));
  assert.throws(() => calculateOwnerServices(NaN));
  assert.equal(calculateOwnerServices(100, { milestones: [{ id: "a", hours: { "01-31-03": 3 } }] }).lines[0].hours, 3);
});
test("central P5 and frozen historical pricing are not surcharged", () => {
  assert.equal(calculateOwnerServices(100000, { centralEstimate: true }).additionalCustomerAmount, 0);
  assert.equal(calculateOwnerServices(100000, { preserveOriginal: true }).additionalCustomerAmount, 0);
});

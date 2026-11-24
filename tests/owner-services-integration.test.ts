import test from "node:test";
import assert from "node:assert/strict";
import { applyDocumentOwnerServices, ownerServiceWriteValues } from "../lib/pricing/ownerDocumentAdapter";
import { resolveInternalEstimate } from "../shared/costs/resolve";
import { priceMillworkTakeoff } from "../shared/plans/millwork/pricing";
import { query } from "../lib/p5/database";
import { savedOwnerServiceResponse } from "../lib/pricing/ownerSubmissionResponse";

function document(cost: number) {
  const price = cost * 1.5;
  return {
    internal: { publishable: true, directCost: cost, contractPrice: price, planningRange: { low: price, high: price }, allocationDollars: { overhead: price * .2 }, lines: [
      { id: "outside", description: "Outside trade", category: "subcontractors", cost, unitCost: cost, quantity: 1, unit: "EA", sellingAmount: price, overheadRecovery: price * .2 },
    ] },
    customer: { range: { low: price, high: price }, lineItems: [{ id: "outside", category: "General", description: "Outside trade", quantity: 1, low: price, high: price }] },
  };
}
test("document small/large final-price lines and credits reconcile", () => {
  for (const cost of [100, 1000000]) {
    const record = document(cost);
    const result = applyDocumentOwnerServices(record.internal, record.customer);
    assert.deepEqual(result.internal.ownerServices.lines.map((l: any) => l.rate), [120, 120, 120]);
    assert.ok(Math.abs(result.internal.lines.reduce((s: number, l: any) => s + l.sellingAmount, 0) - result.internal.contractPrice) < .01);
    assert.equal(result.customer.range.low, result.internal.contractPrice);
    assert.deepEqual(applyDocumentOwnerServices(result.internal, result.customer), result);
    assert.equal(record.internal.lines.length, 1);
  }
});
test("normal brand persistence boundary updates saved estimate and every outbox record atomically", async () => {
  const record = document(100);
  let written: unknown[] = [];
  (globalThis as any).__p5Pool = { query: async (sql: string, args: unknown[]) => {
    if (sql.startsWith("SELECT internal_estimate")) return { rows: [{ status: "draft", customer_estimate: null }] };
    written = args; return { rows: [{ id: "new" }] };
  }};
  try {
    const sql = "WITH accepted AS (UPDATE p5_estimator_drafts SET status='submitted',internal_estimate=$1::jsonb,customer_estimate=$2::jsonb WHERE id=$3) INSERT INTO p5_estimator_outbox SELECT $5";
    await query(sql, [JSON.stringify(record.internal), JSON.stringify(record.customer), "new", 1, JSON.stringify([{ payload: record }])]);
    const saved = JSON.parse(written[0] as string);
    const delivery = JSON.parse(written[4] as string)[0].payload;
    assert.equal(saved.ownerServices.lines.length, 3);
    assert.deepEqual(delivery.internal, saved);
    assert.deepEqual(delivery.customer, JSON.parse(written[1] as string));
  } finally { delete (globalThis as any).__p5Pool; }
});
test("historical issued estimates are preserved at the persistence boundary", async () => {
  const record = document(100);
  const values = [JSON.stringify(record.internal), JSON.stringify(record.customer), "old"];
  const result = await ownerServiceWriteValues("UPDATE p5_estimator_drafts SET internal_estimate=$1,customer_estimate=$2 INSERT INTO p5_estimator_outbox", values, async () => [{ internal_estimate: record.internal, customer_estimate: record.customer }]);
  assert.equal(result, values);
});
test("successful response returns the persisted owner-adjusted range, not the old result", async () => {
  const record = document(100);
  const adjusted = applyDocumentOwnerServices(record.internal, record.customer);
  (globalThis as any).__p5Pool = { query: async () => ({ rows: [{ internal_estimate: adjusted.internal, customer_estimate: adjusted.customer }] }) };
  try {
    const response = await savedOwnerServiceResponse(Response.json({ accepted: true, id: "new", result: record.customer }));
    const body = await response.json();
    assert.deepEqual(body.result.range, adjusted.customer.range);
    assert.equal(JSON.stringify(body.result).includes("qboItemId"), false);
  } finally { delete (globalThis as any).__p5Pool; }
});
test("normal local consultation resolver carries all owner services", () => {
  const resolved = resolveInternalEstimate("custom-home", "mid", 2000, {});
  assert.ok(resolved?.internal.ownerServices);
  assert.equal(resolved.internal.ownerServices.lines.length, 3);
  assert.equal(resolved.admin.trades.filter(t => t.sku).length, 3);
  assert.ok(Math.abs(resolved.admin.trades.reduce((sum, t) => sum + t.customerAmount, 0) - resolved.range.centre) < .01);
});
test("duplicate owner time is credited while distinct outside supervision remains chargeable", () => {
  const record: any = document(10000);
  record.internal.lines.push(
    { id: "PB-01-31-01", category: "project-supervision", quantity: 1, cost: 200, sellingAmount: 300, overheadRecovery: 60 },
    { id: "PB-01-31-02", category: "subcontractors", quantity: 1, cost: 400, sellingAmount: 600, overheadRecovery: 120 },
  );
  record.internal.contractPrice += 900;
  record.internal.allocationDollars.overhead += 180;
  record.customer.range.low += 900; record.customer.range.high += 900;
  const adjusted = applyDocumentOwnerServices(record.internal, record.customer, { salaryOverheadRecovery: 0 });
  assert.equal(adjusted.internal.ownerServices.credit, 300);
  assert.equal(adjusted.internal.lines.find((l: any) => l.id === "PB-01-31-01").sellingAmount, 0);
  assert.equal(adjusted.internal.lines.find((l: any) => l.id === "PB-01-31-02").sellingAmount, 600);
});
test("cabinet quotes have one project allocation, not one per cabinet", () => {
  const takeoff: any = { items: [], questions: [], confidence: "high", isCommercial: false };
  assert.equal(priceMillworkTakeoff(takeoff).total, 0);
  takeoff.items = [{ category: "cabinetry", label: "Kitchen cabinets", quantity: 20, unit: "LF", quantityBasis: "scheduled" }];
  const quote = priceMillworkTakeoff(takeoff);
  assert.equal(quote.ownerServices?.lines.length, 3);
  assert.equal(quote.total, quote.priced.reduce((s, l) => s + l.price, 0) + quote.ownerServices!.additionalCustomerAmount);
  const historic = priceMillworkTakeoff(takeoff, { preserveOriginal: true });
  assert.equal(historic.total, historic.priced.reduce((s, l) => s + l.price, 0));
});

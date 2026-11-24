import { calculateOwnerServices, isOwnerServiceCode, ownerServiceBase, type OwnerServiceOptions } from "../../shared/ownerServices";

type Row = Record<string, any>;
const money = (n: number) => Math.round(n * 100) / 100;
const code = (line: Row) => String(line.sku || line.code || `${line.id || ""} ${line.evidence?.reference || ""}`).match(/(?:PB-)?(01-31-0[1-5])\b/)?.[1] || "";
const outsideSupervisor = (line: Row) => line.category === "subcontractors" || line.ownerLaborTreatment === "outside-supervision";
const duplicateOwner = (line: Row) => isOwnerServiceCode(code(line)) && !outsideSupervisor(line);

/**
 * Brand-owned final-price adapter. The canonical cost engine and its hashes stay untouched.
 * This runs at the atomic save/outbox boundary, not during PDF rendering or delivery retries.
 */
export function applyDocumentOwnerServices(internal: Row, customer: Row, options: OwnerServiceOptions = {}) {
  if (!internal?.publishable || !customer?.range || internal.ownerServices || options.preserveOriginal || options.centralEstimate) return { internal, customer };
  const originalLines: Row[] = internal.lines || [];
  const base = ownerServiceBase(originalLines.map(line => ({
    code: code(line), amount: Math.max(0, Number(line.cost || 0) - Number(line.taxAmount || (line.landed?.tax || 0) * (line.quantity || 0))),
    kind: duplicateOwner(line) || line.category === "owner-production" ? "owner" as const
      : line.category === "project-supervision" ? "supervision-allowance" as const
      : ["tax", "overhead", "profit"].includes(line.category) ? line.category as "tax" | "overhead" | "profit" : "outside" as const,
  })), Number(internal.directCost || 0));
  const ownerRecovery = originalLines.filter(duplicateOwner).reduce((sum, line) => sum + Number(line.sellingAmount || 0), 0);
  const gross = calculateOwnerServices(base, options).gross;
  const availableOverhead = originalLines.filter(line => !duplicateOwner(line)).reduce((sum, line) => sum + Number(line.overheadRecovery || 0), 0);
  // The legacy policy explicitly includes owner salaries but does not separate them.
  // Reserve a conservative credit from that recovery rather than charging it twice.
  // An authenticated review may supply the actual salary allocation instead.
  const salaryRecovery = Math.min(availableOverhead, options.salaryOverheadRecovery ?? Math.max(0, gross - ownerRecovery));
  const ownerServices = calculateOwnerServices(base, { ...options, overlappingOwnerRecovery: ownerRecovery, salaryOverheadRecovery: salaryRecovery });
  let creditRemaining = ownerServices.credit;
  const lines = originalLines.map(line => {
    const available = duplicateOwner(line) ? Number(line.sellingAmount || 0) : 0;
    const credit = Math.min(creditRemaining, available);
    creditRemaining -= credit;
    return { ...line, sellingAmount: money(line.sellingAmount - credit), ownerServiceCredit: money(credit) };
  });
  const salaryCredit = creditRemaining;
  for (const line of lines) {
    if (!creditRemaining || duplicateOwner(line)) continue;
    const credit = Math.min(creditRemaining, Number(line.overheadRecovery || 0), line.sellingAmount);
    creditRemaining -= credit;
    line.sellingAmount = money(line.sellingAmount - credit);
    line.overheadRecovery = money(line.overheadRecovery - credit);
    line.ownerServiceCredit = money(line.ownerServiceCredit + credit);
  }
  if (creditRemaining > .011) throw new Error("Owner-service credit cannot reconcile with existing recovery");
  for (const line of lines) line.sellingUnitPrice = line.sellingAmount / line.quantity;
  const serviceLines = ownerServices.lines.map(line => ({
    id: line.sku, sku: line.sku, qboItemId: line.qboItemId,
    description: line.description, category: "owner-production", trade: "Project Management",
    quantity: line.hours, unit: "hour", unitCost: 0, cost: 0, contingency: 0,
    riskAdjustedCost: 0, overheadRecovery: 0, operatingProfit: 0,
    sellingAmount: line.amount, sellingUnitPrice: line.rate,
    priceBasis: "customer-price", quantitySource: line.basis,
    evidence: { basis: "planning-assumption", reference: ownerServices.policy },
  }));
  const delta = ownerServices.additionalCustomerAmount;
  const range = { low: money(customer.range.low + delta), high: money(customer.range.high + delta) };
  const updatedInternal = {
    ...internal, lines: [...lines, ...serviceLines], ownerServices: {
      ...ownerServices, options, salaryCredit: money(salaryCredit),
      salaryCreditBasis: options.salaryOverheadRecovery === undefined ? "Conservative credit against salary-inclusive overhead; editable after payroll allocation review." : "Internal salary allocation",
    },
    contractPrice: money(internal.contractPrice + delta), planningRange: range,
    planningBandHigh: money((internal.planningBandHigh || internal.planningRange.high) + delta),
    allocationDollars: { ...internal.allocationDollars, overhead: money(internal.allocationDollars.overhead - salaryCredit) },
    reconciliation: money((internal.reconciliation || 0) + ownerServices.gross - ownerServices.credit - delta),
  };
  // Public scope and total remain separate from internal hourly/QBO detail.
  // Reconcile the existing customer line allocation after applying the net change.
  const weight = (customer.lineItems || []).reduce((sum: number, line: Row) => sum + Math.max(0, line.high || 0), 0);
  let lowRemaining = range.low, highRemaining = range.high;
  const publicLines = (customer.lineItems || []).map((line: Row, index: number, all: Row[]) => {
    const share = weight ? Math.max(0, line.high || 0) / weight : 1 / all.length;
    const low = index === all.length - 1 ? money(lowRemaining) : money(range.low * share);
    const high = index === all.length - 1 ? money(highRemaining) : money(range.high * share);
    lowRemaining -= low; highRemaining -= high;
    return { ...line, low, high, unitLow: low / line.quantity, unitHigh: high / line.quantity };
  });
  const categories = [...new Set(publicLines.map((line: Row) => line.category))];
  return {
    internal: updatedInternal,
    customer: {
      ...customer, range, lineItems: publicLines,
      categoryRanges: categories.map(category => ({ category, low: money(publicLines.filter((l: Row) => l.category === category).reduce((s: number, l: Row) => s + l.low, 0)), high: money(publicLines.filter((l: Row) => l.category === category).reduce((s: number, l: Row) => s + l.high, 0)) })),
      assumptions: [...(customer.assumptions || []), "Includes project management, administration and accounting."],
    },
  };
}

type Query = (statement: string, values?: unknown[]) => Promise<Row[]>;
/** Only the two canonical atomic estimate/outbox writes; all other SQL passes through. */
export async function ownerServiceWriteValues(statement: string, values: unknown[], read: Query): Promise<unknown[]> {
  if (!statement.includes("UPDATE p5_estimator_drafts SET ") || !statement.includes("INSERT INTO p5_estimator_outbox")) return values;
  // Both protected writes use $1 internal, $2 customer, $3 draft ID.
  if (!statement.includes("internal_estimate=$1") || !statement.includes("customer_estimate=$2")) throw new Error("Estimate persistence contract changed; owner-service review required");
  const [existing] = await read("SELECT internal_estimate,customer_estimate,status FROM p5_estimator_drafts WHERE id=$1", [values[2]]);
  if (!existing) return values;
  const internal = JSON.parse(String(values[0])), customer = JSON.parse(String(values[1]));
  // Existing issued prices without this policy are historical; never adopt it on replay/review.
  if (existing.customer_estimate && !existing.internal_estimate?.ownerServices) return values;
  if (internal.signed || internal.acceptedAt || existing.internal_estimate?.signed || existing.internal_estimate?.acceptedAt) return values;
  const options = internal.manualReview?.input?.ownerServices || existing.internal_estimate?.ownerServices?.options || {};
  const adjusted = applyDocumentOwnerServices(internal, customer, options);
  const next = [...values]; next[0] = JSON.stringify(adjusted.internal); next[1] = JSON.stringify(adjusted.customer);
  // Replace the complete record in every queued delivery in the SAME atomic statement.
  for (let i = 4; i < next.length; i++) {
    if (typeof next[i] !== "string") continue;
    let data: any; try { data = JSON.parse(next[i] as string); } catch { continue; }
    if (!Array.isArray(data) || !data.some(job => job?.payload?.internal && job?.payload?.customer)) continue;
    next[i] = JSON.stringify(data.map(job => job?.payload?.internal && job?.payload?.customer ? {
      ...job, payload: { ...job.payload, internal: adjusted.internal, customer: adjusted.customer },
    } : job));
  }
  return next;
}

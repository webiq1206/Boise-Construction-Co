/**
 * Owner-authorized editable planning assumption, November 23, 2026.
 * These are FINAL customer rates, never costs to mark up or contingency bases.
 * Call once with the entire project's eligible outside direct costs.
 */
export const OWNER_SERVICE_POLICY = "owner-services-2026-11-23";
export const OWNER_SERVICES = [
  { sku: "01-31-03", qboItemId: "48", description: "Project management", hoursPerThousand: .50, minimum: .25 },
  { sku: "01-31-04", qboItemId: "49", description: "Project administration", hoursPerThousand: .20, minimum: .125 },
  { sku: "01-31-05", qboItemId: "47", description: "Project accounting", hoursPerThousand: .10, minimum: .125 },
] as const;
export type OwnerServiceSku = typeof OWNER_SERVICES[number]["sku"];
export interface OwnerServiceOptions {
  /** Internal authenticated edits only. Zero is not a valid service allocation. */
  hours?: Partial<Record<OwnerServiceSku, number>>;
  milestones?: { id: string; outsideCost?: number; hours?: Partial<Record<OwnerServiceSku, number>> }[];
  /** Final customer dollars already recovered for the same owner work. */
  overlappingOwnerRecovery?: number;
  salaryOverheadRecovery?: number;
  /** Frozen jobs and externally calculated central P5 estimates are never repriced. */
  preserveOriginal?: boolean;
  centralEstimate?: boolean;
}
export interface OwnerServiceCost {
  code?: string;
  amount: number;
  kind?: "outside" | "owner" | "overhead" | "profit" | "tax" | "supervision-allowance";
}
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
function nonnegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be finite and nonnegative`);
  return value;
}
function positive(value: number, name: string): number {
  nonnegative(value, name);
  if (value === 0) throw new Error(`${name} must be positive`);
  return value;
}
export function isOwnerServiceCode(code = ""): boolean {
  return /(?:^|PB-)01-31-0[1-5](?:$|\b)/.test(code);
}
/** Explicit outside supervision stays chargeable but prior allowances are not the hours base. */
export function ownerServiceBase(lines: OwnerServiceCost[], fallbackDirectCost = 0): number {
  if (!lines.length) return nonnegative(fallbackDirectCost, "Pre-owner direct cost");
  return lines.reduce((total, line) => {
    nonnegative(line.amount, "Cost");
    return total + ((!line.kind || line.kind === "outside") && !isOwnerServiceCode(line.code) ? line.amount : 0);
  }, 0);
}
export function calculateOwnerServices(outsideDirectCost: number, options: OwnerServiceOptions = {}) {
  const base = nonnegative(outsideDirectCost, "Outside direct cost");
  const milestones = options.milestones?.length ? options.milestones : [{ id: "project" }];
  if (new Set(milestones.map(m => m.id)).size !== milestones.length || milestones.some(m => !m.id.trim())) {
    throw new Error("Milestone IDs must be unique and nonempty");
  }
  const weights = milestones.map(m => nonnegative(m.outsideCost ?? 0, "Milestone outside cost"));
  const lines = OWNER_SERVICES.map(service => {
    const projectHours = positive(options.hours?.[service.sku] ?? Math.max(service.minimum, base / 1000 * service.hoursPerThousand), "Owner service hours");
    const explicit = milestones.map(m => m.hours?.[service.sku]);
    explicit.forEach(h => { if (h !== undefined) positive(h, "Milestone hours"); });
    const editedTotal = explicit.reduce<number>((s, h) => s + (h ?? 0), 0);
    const missing = explicit.map((h, i) => h === undefined ? i : -1).filter(i => i >= 0);
    if (missing.length && editedTotal >= projectHours) throw new Error("Milestone edits leave no positive hours for remaining milestones");
    if (!missing.length && options.hours?.[service.sku] !== undefined && Math.abs(editedTotal - projectHours) > 1e-8) {
      throw new Error("Milestone edits must reconcile with the project hours override");
    }
    const remainingWeight = missing.reduce((s, i) => s + weights[i], 0);
    const allocations = milestones.map((m, i) => ({
      id: m.id,
      hours: explicit[i] ?? (projectHours - editedTotal) * (remainingWeight > 0 ? weights[i] / remainingWeight : 1 / missing.length),
    }));
    const hours = allocations.reduce((s, a) => s + a.hours, 0);
    const amount = cents(hours * 120);
    // Allocate pennies, not additional per-milestone minima.
    let assigned = 0;
    const allocated = allocations.map((a, i) => {
      const value = i === allocations.length - 1 ? cents(amount - assigned) : cents(a.hours * 120);
      assigned = cents(assigned + value);
      return { ...a, amount: value };
    });
    return { sku: service.sku, qboItemId: service.qboItemId, description: service.description, hours, rate: 120 as const, amount, milestones: allocated, basis: options.hours?.[service.sku] !== undefined || explicit.some(h => h !== undefined) ? "internal-override" : "editable-planning-assumption" };
  });
  const gross = cents(lines.reduce((s, l) => s + l.amount, 0));
  const priorRecovery = nonnegative(options.overlappingOwnerRecovery ?? 0, "Overlapping owner recovery");
  const salaryRecovery = nonnegative(options.salaryOverheadRecovery ?? 0, "Owner salary overhead recovery");
  const credit = cents(Math.min(gross, priorRecovery + salaryRecovery));
  const bypass = Boolean(options.preserveOriginal || options.centralEstimate);
  return { policy: OWNER_SERVICE_POLICY, outsideDirectCost: base, lines, gross, credit, additionalCustomerAmount: bypass ? 0 : cents(gross - credit), bypass };
}

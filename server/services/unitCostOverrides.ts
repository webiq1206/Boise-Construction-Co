/**
 * Owner-entered unit-cost overrides, shared by every route that prices an
 * estimate (admin pricing panel, consultation, estimate-lead, public unit
 * costs). Lived in app/api/admin/pricing/route.ts originally, but Next's
 * generated route types reject non-route exports from a route file, so the
 * read side lives here.
 */
import { db } from "@/lib/db";
import { siteSettings } from "@/shared/schema";
import { eq } from "drizzle-orm";
import type { UnitCostOverrides } from "@/shared/costCatalog";

export const UNIT_COST_SETTINGS_KEY = "pricing.unitCostOverrides";

export async function readUnitCostOverrides(): Promise<UnitCostOverrides> {
  if (!db) return {};
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, UNIT_COST_SETTINGS_KEY));
    if (rows.length === 0) return {};
    const parsed = JSON.parse(rows[0].value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: UnitCostOverrides = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) out[id] = value;
    }
    return out;
  } catch {
    // A malformed blob must not take pricing down; fall back to derived costs.
    return {};
  }
}

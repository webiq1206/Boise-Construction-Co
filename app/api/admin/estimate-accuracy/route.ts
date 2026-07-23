/**
 * Estimate accuracy: what the estimator said versus what the job contracted for.
 *
 * This closes the only loop that can actually prove the estimator right. The
 * invariant suite proves the model is internally consistent, which is not the
 * same thing. The cost guide proved nothing at all: its mid-range ADU floor
 * sat 26 percent above the cheapest ADU the company had ever delivered, and
 * only a real closed job surfaced it.
 *
 * Variance is measured against the RANGE the homeowner was shown, not against
 * a midpoint. The question worth answering is "was the number we gave them
 * true", and a contract landing anywhere inside the quoted band is a correct
 * estimate, not a near miss. Only jobs landing outside the band count as
 * misses, and the direction matters: quoting under costs the company money and
 * trust, quoting over loses the lead before anyone picks up the phone.
 */

import { getSession, getUserFromDb } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { PROJECT_LABELS, type ProjectType } from "@/shared/estimateEngine";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await getUserFromDb(session.userId);
  if (!user || user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!db) {
    return { error: NextResponse.json({ error: "Database unavailable" }, { status: 503 }) };
  }
  return { userId: session.userId };
}

interface Outcome {
  id: string;
  name: string;
  project: string;
  projectLabel: string;
  finish: string | null;
  sqft: number | null;
  low: number;
  high: number;
  actual: number;
  /** 0 when the contract landed inside the quoted band. */
  variancePct: number;
  verdict: "inside range" | "above range" | "below range";
  notes: string | null;
  recordedAt: string | null;
}

function summarize(outcomes: Outcome[]) {
  if (outcomes.length === 0) {
    return { count: 0, insideRange: 0, hitRate: 0, medianVariancePct: 0, bias: "n/a" as const };
  }
  const inside = outcomes.filter((o) => o.verdict === "inside range").length;
  const sorted = [...outcomes].map((o) => o.variancePct).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const above = outcomes.filter((o) => o.verdict === "above range").length;
  const below = outcomes.filter((o) => o.verdict === "below range").length;

  return {
    count: outcomes.length,
    insideRange: inside,
    hitRate: Math.round((inside / outcomes.length) * 100),
    medianVariancePct: Math.round(median * 10) / 10,
    // "quoting low" means real contracts land ABOVE what was shown.
    bias:
      above > below * 1.5
        ? ("quoting low" as const)
        : below > above * 1.5
          ? ("quoting high" as const)
          : ("balanced" as const),
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const rows = await db!
    .select()
    .from(consultationRequests)
    .where(isNotNull(consultationRequests.actualContractValue));

  const outcomes: Outcome[] = rows
    .map((row) => {
      const low = Number(row.estimateLow);
      const high = Number(row.estimateHigh);
      const actual = Number(row.actualContractValue);
      if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(actual)) {
        return null;
      }

      // Distance outside the quoted band, as a percentage of the nearer edge.
      // Inside the band is zero: the estimate was correct.
      let variancePct = 0;
      let verdict: Outcome["verdict"] = "inside range";
      if (actual > high) {
        variancePct = ((actual - high) / high) * 100;
        verdict = "above range";
      } else if (actual < low) {
        variancePct = ((actual - low) / low) * 100;
        verdict = "below range";
      }

      const project = (row.estimateProject ?? row.projectType) as string;
      return {
        id: row.id,
        name: row.name,
        project,
        projectLabel:
          PROJECT_LABELS[project as ProjectType]?.label ?? project,
        finish: row.estimateFinish,
        sqft: row.estimateSqft,
        low,
        high,
        actual,
        variancePct: Math.round(variancePct * 10) / 10,
        verdict,
        notes: row.actualNotes,
        recordedAt: row.actualRecordedAt ? row.actualRecordedAt.toISOString() : null,
      } satisfies Outcome;
    })
    .filter((o): o is Outcome => o !== null);

  const byProject: Record<string, ReturnType<typeof summarize> & { label: string }> = {};
  for (const outcome of outcomes) {
    if (!byProject[outcome.project]) {
      const group = outcomes.filter((o) => o.project === outcome.project);
      byProject[outcome.project] = { ...summarize(group), label: outcome.projectLabel };
    }
  }

  return NextResponse.json({
    overall: summarize(outcomes),
    byProject,
    outcomes: outcomes.sort((a, b) =>
      Math.abs(b.variancePct) - Math.abs(a.variancePct)
    ),
    guidance:
      "A contract landing inside the quoted range is a correct estimate, not a near miss. Fewer than about 8 recorded jobs in a category is too few to act on. When a category is consistently outside the band, move that category's base rate in PRICE_MATRIX using the procedure in ESTIMATOR-CALIBRATION.md, not the multipliers.",
  });
}

/** Record what a job actually contracted for. Body: { id, actualContractValue, notes? } */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  let body: { id?: unknown; actualContractValue?: unknown; notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (body.actualContractValue === null) {
    await db!
      .update(consultationRequests)
      .set({ actualContractValue: null, actualRecordedAt: null, actualNotes: null })
      .where(eq(consultationRequests.id, id));
    return NextResponse.json({ ok: true, cleared: true });
  }

  const value = Number(body.actualContractValue);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json(
      { error: "actualContractValue must be a positive number, or null to clear" },
      { status: 400 }
    );
  }

  await db!
    .update(consultationRequests)
    .set({
      actualContractValue: String(value),
      actualRecordedAt: new Date(),
      actualNotes: typeof body.notes === "string" ? body.notes.slice(0, 1000) : null,
    })
    .where(eq(consultationRequests.id, id));

  return NextResponse.json({ ok: true });
}

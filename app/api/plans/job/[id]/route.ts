import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/server/services/plans/jobStore";
import type { CoverageLedger } from "@/server/services/documents/coverage";

export const runtime = "nodejs";

/**
 * The finished read.
 *
 * Shaped to match what /api/plans/analyze returns so the estimator applies a
 * stepped read and a single-request read through exactly the same code. Two
 * response shapes for the same answer is how the large-set path and the small-
 * set path start behaving differently for no reason a user could understand.
 *
 * Coverage is trimmed the same way too: only sheets needing attention are sent,
 * because a clean 200-sheet set would otherwise ship 200 redundant "processed"
 * rows to a browser that renders none of them.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const job = await getJob(params.id).catch(() => null);
  if (!job) {
    return NextResponse.json({ error: "failed", message: "That review has expired." }, { status: 404 });
  }

  const base = {
    jobId: job.id,
    status: job.status,
    totalPages: job.totalPages,
    chunksDone: job.chunksDone,
    totalChunks: job.totalChunks,
    instructions: job.instructions,
  };

  if (job.status !== "complete") {
    return NextResponse.json({ ...base, message: job.error ?? null });
  }

  const stored = job.result as { plan: unknown; gate: unknown } | null;
  const ledger = job.coverage as CoverageLedger | null;

  return NextResponse.json({
    ...base,
    plan: stored?.plan ?? null,
    gate: stored?.gate ?? null,
    conflicts: job.conflicts ?? [],
    coverage: ledger
      ? {
          totalPages: ledger.totalPages,
          processed: ledger.processed,
          unreadable: ledger.unreadable,
          missing: ledger.missing,
          complete: ledger.complete,
          attention: ledger.pages
            .filter((p) => p.status !== "processed")
            .map((p) => ({
              sheet: `${p.filename} p.${p.pageNumber}`,
              status: p.status,
              reason: p.reason,
            })),
          skippedFiles: ledger.skippedFiles,
        }
      : null,
  });
}

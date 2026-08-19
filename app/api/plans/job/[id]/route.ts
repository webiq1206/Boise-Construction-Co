import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/server/services/plans/jobStore";
import type { CoverageLedger } from "@/server/services/documents/coverage";
import { questionProgress, selectNextQuestion, type QuestionAnswer } from "@/shared/plans/millwork/dialogue";
import type { MillworkTakeoff } from "@/shared/plans/millwork/extraction";
import type { MillworkPricing } from "@/shared/plans/millwork/pricing";

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
    scope: job.scope,
    totalPages: job.totalPages,
    chunksDone: job.chunksDone,
    totalChunks: job.totalChunks,
    instructions: job.instructions,
  };

  if (job.status !== "complete") {
    return NextResponse.json({ ...base, message: job.error ?? null });
  }

  const ledger = job.coverage as CoverageLedger | null;
  const coverage = ledger
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
    : null;

  /* A millwork job answers a different question and returns a different shape:
     a priced takeoff plus the next thing we need to know, rather than a set of
     house dimensions. The client branches on `scope`. */
  if (job.scope === "millwork") {
    const mw = job.result as { takeoff: MillworkTakeoff; pricing: MillworkPricing } | null;
    const answers = (job.answers as QuestionAnswer[] | null) ?? [];
    return NextResponse.json({
      ...base,
      coverage,
      takeoff: mw?.takeoff ?? null,
      pricing: mw?.pricing ?? null,
      answers,
      nextQuestion: mw?.takeoff ? selectNextQuestion(mw.takeoff.questions, answers) : null,
      progress: mw?.takeoff ? questionProgress(mw.takeoff.questions, answers) : null,
    });
  }

  const stored = job.result as { plan: unknown; gate: unknown } | null;

  return NextResponse.json({
    ...base,
    plan: stored?.plan ?? null,
    gate: stored?.gate ?? null,
    conflicts: job.conflicts ?? [],
    coverage,
  });
}

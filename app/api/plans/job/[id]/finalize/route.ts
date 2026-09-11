import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, listPageRefs, loadChunks } from "@/server/services/plans/jobStore";
import { mergePlanChunks, type PlanChunkContribution } from "@/shared/plans/mergeChunks";
import { buildCoverageLedger } from "@/server/services/documents/coverage";
import { gatePlanEstimate } from "@/shared/plans/gating";
import { mergeMillworkChunks, type MillworkChunkResult } from "@/server/services/plans/millwork";
import { priceMillworkTakeoff } from "@/shared/plans/millwork/pricing";
import { selectNextQuestion, type QuestionAnswer } from "@/shared/plans/millwork/dialogue";
import { planChunkRanges } from "@/shared/plans/upload";
import type { MillworkTakeoff } from "@/shared/plans/millwork/extraction";

export const runtime = "nodejs";

/**
 * Merge every pass into one answer, once they have all been attempted.
 *
 * Reads the per-chunk rows rather than an accumulator, which is what lets the
 * passes run in parallel in the first place. It is also idempotent: calling it
 * twice merges the same rows into the same result, so a client that retries
 * after a dropped response cannot corrupt anything.
 *
 * FAILED PASSES ARE NOT SILENTLY DROPPED. A chunk row carrying an error
 * contributes its page ids to the ledger as holes, so a set where three passes
 * died reports "we could not review 12 of your 103 sheets" rather than quietly
 * pricing the 91 it managed and calling that the answer.
 */
export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const job = await getJob(params.id).catch(() => null);
  if (!job) {
    return NextResponse.json({ error: "failed", message: "That review has expired." }, { status: 404 });
  }

  const refs = await listPageRefs(job.uploadId);
  const ranges = planChunkRanges(refs.map((r) => r.byteLength));
  const chunks = await loadChunks(job.id);

  const okChunks = chunks.filter((c) => !c.error && c.contribution);
  if (okChunks.length === 0) {
    await updateJob(job.id, { status: "failed", error: "We could not read that plan set." });
    return NextResponse.json({ status: "failed", message: "We could not read that plan set." }, { status: 422 });
  }

  const reportedRead = chunks.flatMap((c) => c.pagesRead);
  const reportedUnreadable = chunks.flatMap((c) => c.pagesUnreadable);

  /* Any index with no successful row - failed, or never attempted because the
     visitor closed the tab - owes its pages to the ledger as holes. */
  const doneIdx = new Set(okChunks.map((c) => c.chunkIndex));
  const failedChunks = ranges
    .filter((r) => !doneIdx.has(r.index))
    .map((r) => ({
      index: r.index,
      pageIds: refs.slice(r.start, r.start + r.count).map((p) => `${p.fileIndex}:${p.pageNumber}`),
      reason: chunks.find((c) => c.chunkIndex === r.index)?.error ?? "This batch was not reviewed.",
    }));

  const ledger = buildCoverageLedger({
    allPages: refs.map((r) => ({ id: `${r.fileIndex}:${r.pageNumber}`, filename: r.filename, pageNumber: r.pageNumber })),
    manifestUnreadable: [],
    reportedRead,
    reportedUnreadable,
    skippedFiles: [],
    failedChunks,
  });

  /* ------------------------------------------------------------- millwork */
  if (job.scope === "millwork") {
    const answers = (job.answers as QuestionAnswer[] | null) ?? [];
    const takeoff = mergeMillworkChunks(
      okChunks.map((c) => ({
        takeoff: c.contribution as MillworkTakeoff,
        pagesRead: c.pagesRead,
        pagesUnreadable: c.pagesUnreadable,
      })) as MillworkChunkResult[],
    );
    const pricing = priceMillworkTakeoff(takeoff);
    await updateJob(job.id, { status: "complete", chunksDone: okChunks.length, result: { takeoff, pricing }, coverage: ledger, conflicts: [] });
    return NextResponse.json({
      status: "complete", scope: "millwork",
      totalPages: ledger.totalPages, processed: ledger.processed, missing: ledger.missing,
      nextQuestion: selectNextQuestion(takeoff.questions, answers),
    });
  }

  /* ---------------------------------------------------------- residential */
  const merged = mergePlanChunks(okChunks.map((c) => c.contribution as PlanChunkContribution));

  const notes = [...merged.plan.notes];
  if (!ledger.complete) {
    const bits: string[] = [];
    if (ledger.missing > 0) bits.push(`${ledger.missing} sheet(s) could not be reviewed`);
    if (ledger.unreadable > 0) bits.push(`${ledger.unreadable} sheet(s) were unreadable`);
    if (bits.length > 0) {
      notes.unshift(`Incomplete review: ${bits.join(" and ")} out of ${ledger.totalPages}. Scope on those sheets is not reflected here.`);
    }
  }
  for (const c of merged.conflicts) {
    notes.push(
      `Sheets disagree on ${c.field}: ${c.readings.map((r) => `${r.value} (${r.pageLabels.join(", ") || "unknown sheet"})`).join(" vs ")}. Confirm before pricing.`,
    );
  }

  const plan = { ...merged.plan, notes };
  const gate = gatePlanEstimate({ plan, coverage: ledger, conflicts: merged.conflicts });

  await updateJob(job.id, {
    status: "complete",
    chunksDone: okChunks.length,
    result: { plan, gate },
    coverage: ledger,
    conflicts: merged.conflicts,
  });

  console.log(
    `[plans/finalize] job=${job.id} pages=${ledger.totalPages} processed=${ledger.processed} missing=${ledger.missing} passes=${okChunks.length}/${ranges.length} finalizable=${gate.canFinalize}`,
  );

  return NextResponse.json({
    status: "complete", scope: "residential",
    totalPages: ledger.totalPages, processed: ledger.processed, missing: ledger.missing,
  });
}

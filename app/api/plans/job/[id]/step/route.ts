import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, loadPageWindow, listPageRefs } from "@/server/services/plans/jobStore";
import { readPlanChunk } from "@/server/services/planExtract";
import { mergePlanChunks, type PlanChunkContribution } from "@/shared/plans/mergeChunks";
import { buildCoverageLedger } from "@/server/services/documents/coverage";
import { gatePlanEstimate } from "@/shared/plans/gating";
import { CHUNKS_PER_STEP, planChunkRanges } from "@/shared/plans/upload";
import { readMillworkChunk, mergeMillworkChunks, type MillworkChunkResult } from "@/server/services/plans/millwork";
import { priceMillworkTakeoff } from "@/shared/plans/millwork/pricing";
import { selectNextQuestion, type QuestionAnswer } from "@/shared/plans/millwork/dialogue";

export const runtime = "nodejs";

/**
 * Read the next slice of a plan set, then return.
 *
 * THIS IS THE WHOLE TRICK. A 200-sheet set cannot be read inside one HTTP
 * request - not because the model is slow, but because every proxy between the
 * browser and the container has an opinion about how long a request may live,
 * and the old code's `maxDuration = 300` was a Vercel directive that does
 * nothing at all on a standalone Node server behind Autoscale. So no request
 * tries. Each step reads a couple of passes, writes down what it learned, and
 * hands control back. The client calls it again.
 *
 * Every step PERSISTS BEFORE RETURNING, which is what makes the job resumable:
 * a step that dies costs its own two passes, never the hundred that came
 * before it. It is also why a visitor can close the tab and the team still has
 * a partial read rather than nothing.
 *
 * Steps are idempotent by position: work is indexed by chunksDone, so a client
 * that retries a step it already completed re-reads those sheets rather than
 * skipping ahead or double-counting them into the merge.
 */

interface MillworkAccumulated {
  chunks: MillworkChunkResult[];
  reportedRead: string[];
  reportedUnreadable: { id: string; reason: string }[];
  failedChunks: { index: number; pageIds: string[]; reason: string }[];
}

interface Accumulated {
  contributions: PlanChunkContribution[];
  reportedRead: string[];
  reportedUnreadable: { id: string; reason: string }[];
  failedChunks: { index: number; pageIds: string[]; reason: string }[];
}

function emptyAccumulator(): Accumulated {
  return { contributions: [], reportedRead: [], reportedUnreadable: [], failedChunks: [] };
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const jobId = params.id;

  const job = await getJob(jobId).catch(() => null);
  if (!job) {
    return NextResponse.json({ error: "failed", message: "That review has expired." }, { status: 404 });
  }
  if (job.status === "complete" || job.status === "failed") {
    return NextResponse.json({ status: job.status, chunksDone: job.chunksDone, totalChunks: job.totalChunks });
  }

  const refs = await listPageRefs(job.uploadId);
  const ranges = planChunkRanges(refs.map((r) => r.byteLength));

  /* A millwork job asks the sheets an entirely different question, so it runs
     its own reader, its own merge and its own pricing. Everything upstream -
     the page manifest, the chunking, the stepping - is indifferent to which. */
  if (job.scope === "millwork") {
    return stepMillwork(job, refs, ranges);
  }

  const acc: Accumulated = (job.result as Accumulated | null) ?? emptyAccumulator();

  let done = job.chunksDone;
  const target = Math.min(done + CHUNKS_PER_STEP, ranges.length);

  for (let i = done; i < target; i++) {
    const range = ranges[i];
    const pages = await loadPageWindow(job.uploadId, range.start, range.count);

    const outcome = await readPlanChunk(
      pages.map((p) => ({
        id: p.id,
        filename: p.filename,
        pageNumber: p.pageNumber,
        mimeType: p.mimeType,
        data: p.data,
      })),
      job.instructions,
    );

    if (outcome.ok) {
      acc.contributions.push(outcome.contribution);
      acc.reportedRead.push(...outcome.contribution.pageIds);
      acc.reportedUnreadable.push(...outcome.unreadable);
    } else {
      /* A failed pass fails ITS OWN sheets, never the upload. Those page ids
         become holes in the ledger, which is a reportable state; losing the
         other 190 sheets because one pass timed out is not. */
      acc.failedChunks.push({
        index: range.index,
        pageIds: pages.map((p) => p.id),
        reason: outcome.message,
      });
    }
    done = i + 1;
  }

  const finished = done >= ranges.length;

  if (!finished) {
    await updateJob(jobId, { status: "running", chunksDone: done, result: acc });
    return NextResponse.json({
      status: "running",
      chunksDone: done,
      totalChunks: ranges.length,
      totalPages: job.totalPages,
    });
  }

  /* ---------------------------------------------------------- finalisation */

  if (acc.contributions.length === 0) {
    await updateJob(jobId, {
      status: "failed",
      chunksDone: done,
      result: acc,
      error: "We could not read that plan set. A PDF of the cover sheet and floor plans usually works best.",
    });
    return NextResponse.json(
      { status: "failed", message: "We could not read that plan set." },
      { status: 422 },
    );
  }

  const merged = mergePlanChunks(acc.contributions);

  const ledger = buildCoverageLedger({
    allPages: refs.map((r) => ({
      id: `${r.fileIndex}:${r.pageNumber}`,
      filename: r.filename,
      pageNumber: r.pageNumber,
    })),
    manifestUnreadable: [],
    reportedRead: acc.reportedRead,
    reportedUnreadable: acc.reportedUnreadable,
    skippedFiles: [],
    failedChunks: acc.failedChunks,
  });

  /* Coverage shortfalls and cross-sheet contradictions go in the notes a
     builder reads before trusting a number, not only in a structured field a
     caller might forget to render. */
  const notes = [...merged.plan.notes];
  if (!ledger.complete) {
    const bits: string[] = [];
    if (ledger.missing > 0) bits.push(`${ledger.missing} sheet(s) could not be reviewed`);
    if (ledger.unreadable > 0) bits.push(`${ledger.unreadable} sheet(s) were unreadable`);
    if (bits.length > 0) {
      notes.unshift(
        `Incomplete review: ${bits.join(" and ")} out of ${ledger.totalPages}. Scope on those sheets is not reflected here.`,
      );
    }
  }
  for (const c of merged.conflicts) {
    notes.push(
      `Sheets disagree on ${c.field}: ${c.readings
        .map((r) => `${r.value} (${r.pageLabels.join(", ") || "unknown sheet"})`)
        .join(" vs ")}. Confirm before pricing.`,
    );
  }

  const plan = { ...merged.plan, notes };
  const gate = gatePlanEstimate({ plan, coverage: ledger, conflicts: merged.conflicts });

  await updateJob(jobId, {
    status: "complete",
    chunksDone: done,
    result: { plan, gate },
    coverage: ledger,
    conflicts: merged.conflicts,
  });

  console.log(
    `[plans/job/step] job=${jobId} COMPLETE pages=${ledger.totalPages} processed=${ledger.processed} missing=${ledger.missing} unreadable=${ledger.unreadable} conflicts=${merged.conflicts.length} finalizable=${gate.canFinalize}`,
  );

  /* THE SHEETS ARE DELIBERATELY KEPT.
   *
   * Deleting them here was the obvious move - they are megabytes apiece and the
   * merged read is what the estimator needs. But the single-request path stored
   * every upload precisely because the builder wants to look at the drawings
   * before the first call, and a lead that arrives with a number and no plan set
   * is worse than a slightly larger table. The rows ARE the set, so keeping them
   * loses nothing that a reassembled download could not serve later.
   *
   * What this owes: a retention sweep, and an endpoint that stitches the sheets
   * back into one PDF for the team. Until those exist, erring toward keeping the
   * customer's drawings is the side to err on.
   */

  return NextResponse.json({
    status: "complete",
    chunksDone: done,
    totalChunks: ranges.length,
    totalPages: ledger.totalPages,
  });
}


/* ------------------------------------------------------------------ millwork */

type Job = NonNullable<Awaited<ReturnType<typeof getJob>>>;
type Refs = Awaited<ReturnType<typeof listPageRefs>>;
type Ranges = ReturnType<typeof planChunkRanges>;

async function stepMillwork(job: Job, refs: Refs, ranges: Ranges) {
  const acc: MillworkAccumulated =
    (job.result as MillworkAccumulated | null) ?? {
      chunks: [],
      reportedRead: [],
      reportedUnreadable: [],
      failedChunks: [],
    };
  const answers = (job.answers as QuestionAnswer[] | null) ?? [];

  let done = job.chunksDone;
  const target = Math.min(done + CHUNKS_PER_STEP, ranges.length);

  for (let i = done; i < target; i++) {
    const range = ranges[i];
    const pages = await loadPageWindow(job.uploadId, range.start, range.count);

    const outcome = await readMillworkChunk(
      pages.map((p) => ({
        id: p.id,
        filename: p.filename,
        pageNumber: p.pageNumber,
        mimeType: p.mimeType,
        data: p.data,
      })),
      job.instructions,
      answers,
    );

    if (outcome.ok) {
      acc.chunks.push(outcome.result);
      acc.reportedRead.push(...outcome.result.pagesRead);
      acc.reportedUnreadable.push(...outcome.result.pagesUnreadable);
    } else {
      acc.failedChunks.push({
        index: range.index,
        pageIds: pages.map((p) => p.id),
        reason: outcome.message,
      });
    }
    done = i + 1;
  }

  const finished = done >= ranges.length;

  if (!finished) {
    await updateJob(job.id, { status: "running", chunksDone: done, result: acc });
    return NextResponse.json({
      status: "running",
      scope: "millwork",
      chunksDone: done,
      totalChunks: ranges.length,
      totalPages: job.totalPages,
    });
  }

  if (acc.chunks.length === 0) {
    await updateJob(job.id, {
      status: "failed",
      chunksDone: done,
      result: acc,
      error: "We could not read that plan set.",
    });
    return NextResponse.json({ status: "failed", message: "We could not read that plan set." }, { status: 422 });
  }

  const takeoff = mergeMillworkChunks(acc.chunks);
  const pricing = priceMillworkTakeoff(takeoff);

  const ledger = buildCoverageLedger({
    allPages: refs.map((r) => ({
      id: `${r.fileIndex}:${r.pageNumber}`,
      filename: r.filename,
      pageNumber: r.pageNumber,
    })),
    manifestUnreadable: [],
    reportedRead: acc.reportedRead,
    reportedUnreadable: acc.reportedUnreadable,
    skippedFiles: [],
    failedChunks: acc.failedChunks,
  });

  /* The conversation starts here: the highest-impact open question is chosen
     now, so the customer is asked something useful the moment the read lands
     rather than being handed a list to work through. */
  const nextQuestion = selectNextQuestion(takeoff.questions, answers);

  await updateJob(job.id, {
    status: "complete",
    chunksDone: done,
    result: { takeoff, pricing, raw: acc },
    coverage: ledger,
    conflicts: [],
  });

  console.log(
    `[plans/job/step] job=${job.id} MILLWORK COMPLETE pages=${ledger.totalPages} items=${takeoff.items.length} priced=${pricing.priced.length} unpriced=${pricing.unpriced.length} questions=${takeoff.questions.length} bidReady=${pricing.bidReady}`,
  );

  return NextResponse.json({
    status: "complete",
    scope: "millwork",
    chunksDone: done,
    totalChunks: ranges.length,
    totalPages: ledger.totalPages,
    nextQuestion,
  });
}

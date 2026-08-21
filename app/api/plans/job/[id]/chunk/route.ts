import { NextRequest, NextResponse } from "next/server";
import { getJob, loadPageWindow, listPageRefs, saveChunk, completedChunkIndexes } from "@/server/services/plans/jobStore";
import { readPlanChunk } from "@/server/services/planExtract";
import { readMillworkChunk } from "@/server/services/plans/millwork";
import { planChunkRanges } from "@/shared/plans/upload";
import type { QuestionAnswer } from "@/shared/plans/millwork/dialogue";

export const runtime = "nodejs";

/**
 * Read ONE batch of sheets and write down what it found.
 *
 * THE BUG THIS REPLACES. The previous endpoint read two batches per request.
 * Each batch of four scanned sheets takes 35-55 seconds, so every request ran
 * for 75-110 seconds and the proxy in front of the app killed it long before
 * it finished. Because the write happened only after both batches, a killed
 * request persisted NOTHING - so the client retried, hit the same wall, and
 * the upload sat on "Reading your drawings" forever without ever advancing.
 * A 103-sheet set never got past the first pass.
 *
 * One batch per request keeps each one around 40 seconds, and it writes its
 * own row before returning. Two consequences worth stating:
 *
 *  1. Progress is durable at the granularity of a single pass. A request that
 *     dies costs that pass and nothing else, and re-running it is safe because
 *     the row is keyed on (job, index).
 *  2. Passes can run CONCURRENTLY, because no two of them touch the same row.
 *     That is what turns sixteen minutes of sequential reading into about four.
 *     It is also why this endpoint takes the index from the caller rather than
 *     deriving it from a counter - a counter is shared state, and shared state
 *     is the race this design exists to avoid.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const job = await getJob(params.id).catch(() => null);
  if (!job) {
    return NextResponse.json({ error: "failed", message: "That review has expired." }, { status: 404 });
  }

  let body: { index?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "failed", message: "Bad request." }, { status: 400 });
  }

  const index = Number(body.index);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "failed", message: "Bad chunk index." }, { status: 400 });
  }

  /*
   * ALREADY DONE? SAY SO AND SPEND NOTHING.
   *
   * When a proxy times a request out, the client gives up but the SERVER keeps
   * running and still writes its row. A retry that re-ran the model would pay
   * for those sheets a second time and, on a 200-sheet set, could double the
   * cost of the whole read for no new information. Checking first makes a retry
   * free, and makes the endpoint safely idempotent for the concurrent caller.
   */
  const done = await completedChunkIndexes(job.id).catch(() => [] as number[]);
  if (done.includes(index)) {
    return NextResponse.json({ ok: true, index, cached: true });
  }

  const refs = await listPageRefs(job.uploadId);
  const ranges = planChunkRanges(refs.map((r) => r.byteLength));
  const range = ranges[index];
  if (!range) {
    return NextResponse.json({ error: "failed", message: "No such batch." }, { status: 400 });
  }

  const pages = await loadPageWindow(job.uploadId, range.start, range.count);
  const pageIds = pages.map((p) => p.id);
  const input = pages.map((p) => ({
    id: p.id,
    filename: p.filename,
    pageNumber: p.pageNumber,
    mimeType: p.mimeType,
    data: p.data,
  }));

  const started = Date.now();

  if (job.scope === "millwork") {
    const answers = (job.answers as QuestionAnswer[] | null) ?? [];
    const outcome = await readMillworkChunk(input, job.instructions, answers);
    if (!outcome.ok) {
      /* The failure is RECORDED, not thrown away. Those sheets become holes in
         the coverage ledger, which is a reportable state; a pass that vanishes
         silently is not. */
      await saveChunk(job.id, { chunkIndex: index, contribution: null, pagesRead: [], pagesUnreadable: [], error: outcome.message });
      return NextResponse.json({ ok: false, index, reason: outcome.reason, message: outcome.message }, { status: outcome.reason === "busy" ? 503 : 422 });
    }
    await saveChunk(job.id, {
      chunkIndex: index,
      contribution: outcome.result.takeoff,
      pagesRead: outcome.result.pagesRead,
      pagesUnreadable: outcome.result.pagesUnreadable,
      error: null,
    });
    return NextResponse.json({ ok: true, index, read: outcome.result.pagesRead.length, ms: Date.now() - started });
  }

  const outcome = await readPlanChunk(input, job.instructions);
  if (!outcome.ok) {
    await saveChunk(job.id, { chunkIndex: index, contribution: null, pagesRead: [], pagesUnreadable: [], error: outcome.message });
    return NextResponse.json({ ok: false, index, reason: outcome.reason, message: outcome.message }, { status: outcome.reason === "busy" ? 503 : 422 });
  }
  await saveChunk(job.id, {
    chunkIndex: index,
    contribution: outcome.contribution,
    pagesRead: outcome.contribution.pageIds,
    pagesUnreadable: outcome.unreadable,
    error: null,
  });
  return NextResponse.json({
    ok: true,
    index,
    read: outcome.contribution.pageIds.length,
    unreadable: outcome.unreadable.length,
    ms: Date.now() - started,
    /* Echoed so the caller can show "batch 7 of 26" without a second request. */
    totalChunks: ranges.length,
    pageIds,
  });
}

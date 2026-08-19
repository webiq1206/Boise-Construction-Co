import { NextRequest, NextResponse } from "next/server";
import { createJob, listPageRefs } from "@/server/services/plans/jobStore";
import { detectPlanScope } from "@/server/services/plans/scopeDetect";
import {
  MAX_INSTRUCTIONS_CHARS,
  MAX_PLAN_PAGES,
  describePageLimit,
  planChunkRanges,
} from "@/shared/plans/upload";

export const runtime = "nodejs";

/**
 * Close an upload and open a reading job.
 *
 * The page count is taken from what ACTUALLY LANDED, never from what the
 * browser says it sent. A set where nine sheets failed to upload should be read
 * as the 194 sheets we have, with the shortfall visible - not as the 203 the
 * client believed in, which would make coverage lie about sheets that were
 * never here.
 */
export async function POST(request: NextRequest) {
  let body: { uploadId?: string; instructions?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "failed", message: "Bad request." }, { status: 400 });
  }

  const uploadId = String(body.uploadId ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return NextResponse.json({ error: "failed", message: "Bad upload id." }, { status: 400 });
  }

  const instructions = (body.instructions ?? "").trim().slice(0, MAX_INSTRUCTIONS_CHARS) || null;

  let refs: Awaited<ReturnType<typeof listPageRefs>>;
  try {
    refs = await listPageRefs(uploadId);
  } catch (err) {
    console.error("[plans/upload/complete] could not list pages:", err);
    return NextResponse.json({ error: "failed", message: "Could not read that upload." }, { status: 500 });
  }

  if (refs.length === 0) {
    return NextResponse.json(
      { error: "failed", message: "No sheets arrived. Try the upload again." },
      { status: 400 },
    );
  }
  if (refs.length > MAX_PLAN_PAGES) {
    return NextResponse.json({ error: "failed", message: describePageLimit(refs.length) }, { status: 400 });
  }

  const chunks = planChunkRanges(refs.map((r) => r.byteLength));

  /* Decided ONCE, here, and stored. Re-deriving it per step would let a set be
     read half as a house and half as joinery, which merges into an answer that
     is neither. */
  const scope = await detectPlanScope(instructions);

  try {
    const job = await createJob({
      uploadId,
      instructions,
      scope,
      totalPages: refs.length,
      totalChunks: chunks.length,
    });
    console.log(
      `[plans/upload/complete] job=${job.id} scope=${scope} pages=${refs.length} chunks=${chunks.length} instructions=${instructions ? "yes" : "no"}`,
    );
    return NextResponse.json({
      jobId: job.id,
      scope,
      totalPages: refs.length,
      totalChunks: chunks.length,
    });
  } catch (err) {
    console.error("[plans/upload/complete] could not create job:", err);
    return NextResponse.json({ error: "failed", message: "Could not start the review." }, { status: 500 });
  }
}

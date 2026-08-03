import { NextRequest, NextResponse } from "next/server";
import { extractPlan, isPlanExtractionConfigured, type PlanExtractionInput } from "@/server/services/planExtract";
import {
  classifyUpload,
  resolveMimeType,
  MAX_UPLOAD_FILES,
  MAX_TOTAL_UPLOAD_BYTES,
  READABLE_FORMATS_LABEL,
} from "@/shared/re10/uploads";
import { uploadFile } from "@/lib/storage/blob";
import { randomUUID } from "crypto";

/**
 * Upload a plan set and get back what the drawings say.
 *
 * NO PRICE IS RETURNED HERE. The visitor uploads, sees what we read, and
 * corrects it - all before giving us a phone number. Pricing still lives behind
 * the estimator's own contact gate. Splitting the two is what keeps the gate
 * honest: nobody pays with their contact details for the privilege of finding
 * out we misread their drawings.
 *
 * Files are stored as well as read, because the team needs the actual plan set
 * attached to the lead, and a builder will want to look at the drawings before
 * the first call regardless of what the extractor found. Storage failures are
 * deliberately non-fatal: a visitor who uploaded a valid set should get their
 * numbers even if the blob store is having a bad day.
 *
 * The upload rules are imported from shared/re10/uploads rather than restated.
 * They are named for RE-10 because that is where they were written, but they
 * are generic - size caps, extension-to-MIME resolution, and the readable /
 * attachment / rejected split - and two copies of a size limit is how the UI
 * ends up warning at a different number than the server enforces.
 */

export const runtime = "nodejs";
// A full permit set is dozens of large sheets and genuinely takes a while.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!isPlanExtractionConfigured()) {
    // 503, not 500: the code is fine, the environment is not configured. The UI
    // uses this to fall back to plain attachment rather than showing an error.
    return NextResponse.json(
      {
        error: "not-configured",
        message:
          "Automatic plan review is not switched on yet. Attach your plans anyway and we will read them by hand.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "failed", message: "Could not read the upload." }, { status: 400 });
  }

  const uploaded = form.getAll("files").filter((f): f is File => f instanceof File);
  if (uploaded.length === 0) {
    return NextResponse.json({ error: "failed", message: "No files were attached." }, { status: 400 });
  }
  if (uploaded.length > MAX_UPLOAD_FILES) {
    return NextResponse.json(
      { error: "failed", message: `Please send at most ${MAX_UPLOAD_FILES} files at a time.` },
      { status: 400 },
    );
  }

  const rejected = uploaded.filter((f) => classifyUpload(f.name, f.type) === "rejected");
  if (rejected.length > 0) {
    return NextResponse.json(
      {
        error: "failed",
        message: `We can read ${READABLE_FORMATS_LABEL}. These are not supported: ${rejected.map((f) => f.name).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const total = uploaded.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: "failed",
        message:
          "That plan set is too large. The cover sheet and floor plans are usually enough - the structural and detail sheets rarely change a budget.",
      },
      { status: 400 },
    );
  }

  const files: PlanExtractionInput[] = [];
  for (const f of uploaded) {
    files.push({
      filename: f.name,
      // Resolved from the extension when the browser declares nothing. Plan sets
      // routinely arrive out of an email client or a shared drive as
      // application/octet-stream, and taking that at face value would make a
      // dropped PDF unreadable while the same file picked from a dialog worked.
      mimeType: resolveMimeType(f.name, f.type),
      data: Buffer.from(await f.arrayBuffer()),
    });
  }

  const readable = files.filter((f) => classifyUpload(f.filename, f.mimeType) === "readable");
  const attachedOnly = files
    .filter((f) => classifyUpload(f.filename, f.mimeType) === "attachment")
    .map((f) => f.filename);

  // Keep the originals whatever happens next: the builder wants the drawings.
  const batch = randomUUID();
  const stored: { filename: string; url: string }[] = [];
  await Promise.all(
    files.map(async (f, i) => {
      try {
        const url = await uploadFile(`plans/${batch}/${i}-${f.filename}`, f.data, f.mimeType);
        stored.push({ filename: f.filename, url });
      } catch (err) {
        console.error("[plans/analyze] could not store upload:", err);
      }
    }),
  );

  if (readable.length === 0) {
    return NextResponse.json(
      {
        error: "nothing-readable",
        message: `We have got ${attachedOnly.join(", ")} and our team can open ${attachedOnly.length === 1 ? "it" : "them"}, but we cannot read ${attachedOnly.length === 1 ? "that format" : "those formats"} automatically. Add a PDF of the cover sheet and floor plans to have the estimator fill itself in.`,
        batch,
        stored,
        attachedOnly,
      },
      { status: 422 },
    );
  }

  const outcome = await extractPlan(readable);

  if (!outcome.ok) {
    const status = outcome.reason === "busy" || outcome.reason === "not-configured" ? 503 : 422;
    return NextResponse.json(
      { error: outcome.reason, message: outcome.message, batch, stored, attachedOnly },
      { status },
    );
  }

  return NextResponse.json({
    batch,
    stored,
    // Named back so nobody believes a file was read when it was only filed.
    attachedOnly,
    plan: outcome.result,
  });
}

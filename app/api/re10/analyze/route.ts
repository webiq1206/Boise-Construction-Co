import { NextRequest, NextResponse } from "next/server";
import { extractRepairs, isExtractionConfigured, MAX_TOTAL_UPLOAD_BYTES, type ExtractionInput } from "@/server/services/re10Extract";
import { uploadFile } from "@/lib/storage/blob";
import { randomUUID } from "crypto";

/**
 * Upload an RE-10 and get back the repairs it contains.
 *
 * NO PRICE IS RETURNED HERE, and that is the point. The homeowner uploads,
 * sees what we read, and corrects it - all before giving us a phone number.
 * Pricing lives behind /api/re10/estimate, which requires contact details.
 * Splitting the two is what makes the gate honest: they are not paying with
 * their contact information for the privilege of finding out we misread their
 * document.
 *
 * Files are stored as well as analyzed, because the team needs the original
 * RE-10 attached to the lead. Storage failures are non-fatal - a homeowner who
 * uploaded a valid document should get their repair list even if our blob
 * store is having a bad day.
 */

export const runtime = "nodejs";
// Analysis of a long inspection report with photos genuinely takes a while.
export const maxDuration = 300;

const MAX_FILES = 12;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  if (!isExtractionConfigured()) {
    // 503, not 500: the code is fine, the environment is not configured. The
    // UI uses this to offer the manual path instead of showing an error.
    return NextResponse.json(
      {
        error: "not-configured",
        message:
          "Automatic document review is not switched on yet. Send your RE-10 to us directly and we will review it by hand.",
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
  if (uploaded.length > MAX_FILES) {
    return NextResponse.json(
      { error: "failed", message: `Please send at most ${MAX_FILES} files at a time.` },
      { status: 400 },
    );
  }

  const rejected = uploaded.filter((f) => !ALLOWED.has(f.type));
  if (rejected.length > 0) {
    return NextResponse.json(
      {
        error: "failed",
        message: `We can read PDFs and photos. These are not supported: ${rejected.map((f) => f.name).join(", ")}.`,
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
          "Those files are too large together. The RE-10 plus the relevant inspection pages is usually enough - the full report rarely is.",
      },
      { status: 400 },
    );
  }

  const files: ExtractionInput[] = [];
  for (const f of uploaded) {
    files.push({
      filename: f.name,
      mimeType: f.type,
      data: Buffer.from(await f.arrayBuffer()),
    });
  }

  // Keep the originals so the team has the actual RE-10 on the lead. Deliberately
  // not awaited-and-failed: a storage outage must not cost the homeowner their
  // analysis, and we would rather have the repair list than the file.
  const batch = randomUUID();
  const stored: { filename: string; url: string }[] = [];
  await Promise.all(
    files.map(async (f, i) => {
      try {
        const url = await uploadFile(`re10/${batch}/${i}-${f.filename}`, f.data, f.mimeType);
        stored.push({ filename: f.filename, url });
      } catch (err) {
        console.error("[re10/analyze] could not store upload:", err);
      }
    }),
  );

  const outcome = await extractRepairs(files);

  if (!outcome.ok) {
    const status = outcome.reason === "busy" ? 503 : outcome.reason === "not-configured" ? 503 : 422;
    return NextResponse.json(
      { error: outcome.reason, message: outcome.message, batch, stored },
      { status },
    );
  }

  return NextResponse.json({
    batch,
    stored,
    ...outcome.result,
  });
}

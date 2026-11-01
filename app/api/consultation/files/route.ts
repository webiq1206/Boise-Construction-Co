import { NextRequest, NextResponse } from "next/server";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import { verifyDetailsToken } from "@/server/services/consultationDetails";
import { createDrizzleLeadFileStore, storeLeadFile, validateLeadFile } from "@/server/services/leadFiles";
import { MAX_LEAD_FILE_BYTES, leadFileProblem } from "@/shared/leadFiles";

/**
 * POST /api/consultation/files: ONE attachment for a request that was already
 * accepted. multipart/form-data with inquiryKey, token, file and the website
 * honeypot.
 *
 * The request is sent first and files follow, so a slow or failed upload can
 * never cost the lead. The token is the one /api/consultation issued after its
 * honeypot and dwell-time guard, so this route inherits that guard; it adds a
 * per-connection rate limit, a per-request cap, a size cap checked before the
 * body is read, and a type check on the file's own bytes. The stored link is
 * sent to the team by /api/consultation/details.
 */
export const runtime = "nodejs";

/** Room for the multipart boundary and the small text fields. */
const BODY_OVERHEAD_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKeyFrom(request.headers, "consultation-files"), 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Too many uploads. Please wait a few minutes, or text the files to us.", reason: "rate" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_LEAD_FILE_BYTES + BODY_OVERHEAD_BYTES) {
    return NextResponse.json({ message: leadFileProblem("This file", "size"), reason: "size" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "We could not read that file.", reason: "unreadable" }, { status: 400 });
  }
  if (String(form.get("website") ?? "").trim()) return NextResponse.json({ accepted: false });

  const inquiryKey = String(form.get("inquiryKey") ?? "");
  const token = String(form.get("token") ?? "");
  const file = form.get("file");
  if (!/^inq_[A-Za-z0-9_-]{16,120}$/.test(inquiryKey) || !(file instanceof File)) {
    return NextResponse.json({ message: "Invalid request", reason: "invalid" }, { status: 400 });
  }
  const check = verifyDetailsToken(inquiryKey, token, process.env.SESSION_SECRET ?? "");
  if (check !== "ok") {
    return NextResponse.json({ message: "Invalid request", reason: check }, { status: 401 });
  }

  try {
    const store = await createDrizzleLeadFileStore();
    const existing = await store.count(inquiryKey);
    const buffer = Buffer.from(await file.arrayBuffer());
    const verdict = validateLeadFile(
      { name: file.name, type: file.type, size: buffer.byteLength, head: buffer.subarray(0, 16) },
      existing,
    );
    if (!verdict.ok) {
      return NextResponse.json(
        { message: leadFileProblem(file.name || "This file", verdict.reason), reason: verdict.reason },
        { status: verdict.reason === "size" ? 413 : 400 },
      );
    }
    // A request that was never accepted has no row; refuse rather than store an orphan.
    const { createDrizzleDetailsRepository } = await import("@/server/services/consultationDetailsDelivery");
    if (!(await (await createDrizzleDetailsRepository()).load(inquiryKey))) {
      return NextResponse.json({ message: "Invalid request", reason: "invalid" }, { status: 401 });
    }
    const stored = await storeLeadFile(store, inquiryKey, {
      name: file.name,
      buffer,
      ext: verdict.ext,
      contentType: verdict.contentType,
    });
    return NextResponse.json({ file: { id: stored.id, name: stored.name, size: stored.size, contentType: stored.contentType } });
  } catch (err) {
    console.error("[consultation-files] store failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ message: "We could not save that file.", reason: "store" }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { storePage } from "@/server/services/plans/jobStore";
import { MAX_PAGE_BYTES } from "@/shared/plans/upload";
import { classifyUpload, resolveMimeType } from "@/shared/re10/uploads";

export const runtime = "nodejs";

/**
 * Receive ONE sheet.
 *
 * This is the request that used to be the whole upload. Keeping it to a single
 * page is what makes a 300MB set possible at all: nothing here is ever larger
 * than one drawing, so no proxy body limit, no 165MB database row and no
 * container holding the set in heap.
 *
 * The browser split the PDF, so it also decided the page numbering - which is
 * why every field is re-validated here. A browser check is a courtesy; this is
 * the control.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "failed", message: "Could not read that sheet." }, { status: 400 });
  }

  const uploadId = String(form.get("uploadId") ?? "");
  const fileIndex = Number(form.get("fileIndex"));
  const pageNumber = Number(form.get("pageNumber"));
  const filename = String(form.get("filename") ?? "");
  const file = form.get("page");

  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return NextResponse.json({ error: "failed", message: "Bad upload id." }, { status: 400 });
  }
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex > 1000) {
    return NextResponse.json({ error: "failed", message: "Bad file index." }, { status: 400 });
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 5000) {
    return NextResponse.json({ error: "failed", message: "Bad page number." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "failed", message: "No sheet attached." }, { status: 400 });
  }
  if (file.size > MAX_PAGE_BYTES) {
    const mb = Math.round(MAX_PAGE_BYTES / (1024 * 1024));
    return NextResponse.json(
      { error: "page-too-large", message: `Sheet ${pageNumber} is over ${mb}MB and was skipped.` },
      { status: 413 },
    );
  }

  const mimeType = resolveMimeType(filename || "sheet.pdf", file.type);
  if (classifyUpload(filename || "sheet.pdf", mimeType) !== "readable") {
    return NextResponse.json({ error: "failed", message: "That sheet is not a readable format." }, { status: 400 });
  }

  try {
    await storePage({
      uploadId,
      fileIndex,
      filename: filename.slice(0, 300) || "plans.pdf",
      pageNumber,
      mimeType,
      data: Buffer.from(await file.arrayBuffer()),
    });
  } catch (err) {
    console.error("[plans/upload/page] store failed:", err);
    return NextResponse.json({ error: "failed", message: "Could not save that sheet." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

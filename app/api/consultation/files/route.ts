import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import {
  PROJECT_FILE_LIMITS,
  safeProjectLeaf,
  sniffProjectFile,
} from "@/lib/projectNoteFiles";
import { uploadFile } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stores optional plans or photos for the short project note.
 * This does not read drawings or start the multi-step intake.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKeyFrom(request.headers, "consultation-files"), 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Upload could not be read" }, { status: 400 });
  }

  const incoming = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (incoming.length === 0) {
    return NextResponse.json({ files: [] });
  }
  if (incoming.length > PROJECT_FILE_LIMITS.maxFiles) {
    return NextResponse.json({ message: `Attach up to ${PROJECT_FILE_LIMITS.maxFiles} files` }, { status: 400 });
  }

  let total = 0;
  const stored: { filename: string; url: string }[] = [];
  const uploadId = randomUUID();

  for (const file of incoming) {
    if (file.size > PROJECT_FILE_LIMITS.maxBytes) {
      return NextResponse.json({ message: "Each file must be 10 MB or smaller" }, { status: 413 });
    }
    total += file.size;
    if (total > PROJECT_FILE_LIMITS.maxTotalBytes) {
      return NextResponse.json({ message: "Those files are too large together" }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffProjectFile(bytes);
    if (!kind) {
      return NextResponse.json(
        { message: "Use a PDF, JPG, PNG, WEBP, or HEIC file" },
        { status: 400 },
      );
    }
    const leaf = `${safeProjectLeaf(file.name)}.${kind.ext}`;
    const key = `consultation/${uploadId}/${leaf}`;
    const url = await uploadFile(key, Buffer.from(bytes), kind.mime);
    stored.push({ filename: leaf, url });
  }

  return NextResponse.json({ files: stored });
}

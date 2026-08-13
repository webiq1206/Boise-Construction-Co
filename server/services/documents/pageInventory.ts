/**
 * Page-level accounting for uploaded documents.
 *
 * WHY THIS EXISTS. Both extractors used to send every uploaded byte to the
 * model in ONE request and take back one JSON blob. That design cannot answer
 * the only question that matters on a large set - "was page 73 actually read?"
 * - because nothing downstream ever knew page 73 existed. It also meant a
 * 100-page permit set (routinely 50-300MB) was refused outright rather than
 * processed, since the whole set had to fit inside a single request.
 *
 * This module turns an upload into a PAGE MANIFEST: a stable, ordered list of
 * pages with an id apiece, grouped into chunks small enough to send. Every
 * later stage - extraction, coverage checking, gating, the audit trail -
 * addresses pages by those ids. Coverage stops being a guess and becomes set
 * arithmetic: pages we asked about, minus pages the model reported on.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not rasterize and it does not OCR.
 * A PDF page is forwarded to the model as a one-page PDF, because the model's
 * own document handling reads embedded text and scanned images better than a
 * naive rasterize-then-OCR pass would, and re-encoding is where fidelity gets
 * lost. Pages that genuinely will not parse are reported as such rather than
 * dropped - an unreadable page is a finding, not an absence.
 */
import { PDFDocument } from "pdf-lib";

/** Types we can hand to the model directly. */
const PDF_TYPE = "application/pdf";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface SourceFile {
  filename: string;
  mimeType: string;
  data: Buffer;
}

/**
 * One addressable page. `id` is what every downstream stage quotes, so it must
 * stay stable for a given upload: "<file index>:<page number within file>".
 */
export interface ManifestPage {
  id: string;
  filename: string;
  /** 1-based page number within its own file. Images are always page 1. */
  pageNumber: number;
  mimeType: string;
  data: Buffer;
  byteLength: number;
  /** Set when the page could not be isolated; it is still listed, never dropped. */
  unreadable?: { reason: string };
}

export interface PageChunk {
  index: number;
  pages: ManifestPage[];
  byteLength: number;
}

export interface PageManifest {
  pages: ManifestPage[];
  chunks: PageChunk[];
  totalPages: number;
  /** Pages that could not be isolated from their source file. */
  unreadablePages: ManifestPage[];
  /** Files we stored but cannot send to the model (e.g. .docx). */
  skippedFiles: { filename: string; reason: string }[];
}

/**
 * Chunk sizing.
 *
 * Two independent ceilings, and whichever binds first wins:
 *  - PAGES_PER_CHUNK keeps the model's attention on a readable number of
 *    sheets. A drawing set rewards depth per page, and a chunk holding 40
 *    sheets gets skimmed in exactly the way this whole exercise is meant to
 *    prevent.
 *  - CHUNK_BYTE_BUDGET keeps the encoded request well inside the API's 32MB
 *    request limit. Base64 inflates by ~4/3, so the budget is set against the
 *    encoded size, not the raw size.
 *
 * A SINGLE page larger than the byte budget is not split further - it is sent
 * alone and allowed to be the whole chunk. Splitting a page is not possible
 * without rasterizing, and a 30MB single sheet is a scanned page that the API
 * will either take or reject cleanly.
 */
export const PAGES_PER_CHUNK = 8;
const CHUNK_BYTE_BUDGET = 16 * 1024 * 1024; // raw; ~21MB base64

function encodedSize(raw: number): number {
  return Math.ceil(raw / 3) * 4;
}

/** Encoded-size ceiling for one request, kept under the API's 32MB. */
const MAX_ENCODED_CHUNK_BYTES = 28 * 1024 * 1024;

/**
 * Split a multi-page PDF into one-page PDFs.
 *
 * Each page is copied into a fresh document so the model receives a real,
 * self-contained PDF page rather than a byte range. Failures are per-page: one
 * corrupt page in a 200-page set must not lose the other 199, so a page that
 * will not copy is returned marked unreadable and the loop continues.
 */
async function splitPdf(file: SourceFile, fileIndex: number): Promise<ManifestPage[]> {
  let source: PDFDocument;
  try {
    // ignoreEncryption: permit-set PDFs are frequently flagged read-only. That
    // restricts editing, not reading, and refusing them would reject a large
    // share of real submissions for no protective benefit.
    source = await PDFDocument.load(file.data, { ignoreEncryption: true });
  } catch (err) {
    return [
      {
        id: `${fileIndex}:1`,
        filename: file.filename,
        pageNumber: 1,
        mimeType: PDF_TYPE,
        data: Buffer.alloc(0),
        byteLength: 0,
        unreadable: {
          reason: `PDF could not be opened (${err instanceof Error ? err.message : "unknown error"}). It may be corrupt or password protected.`,
        },
      },
    ];
  }

  const count = source.getPageCount();
  const pages: ManifestPage[] = [];

  for (let i = 0; i < count; i++) {
    const id = `${fileIndex}:${i + 1}`;
    try {
      const single = await PDFDocument.create();
      const [copied] = await single.copyPages(source, [i]);
      single.addPage(copied);
      const bytes = Buffer.from(await single.save());
      pages.push({
        id,
        filename: file.filename,
        pageNumber: i + 1,
        mimeType: PDF_TYPE,
        data: bytes,
        byteLength: bytes.byteLength,
      });
    } catch (err) {
      pages.push({
        id,
        filename: file.filename,
        pageNumber: i + 1,
        mimeType: PDF_TYPE,
        data: Buffer.alloc(0),
        byteLength: 0,
        unreadable: {
          reason: `Page ${i + 1} could not be isolated (${err instanceof Error ? err.message : "unknown error"}).`,
        },
      });
    }
  }

  return pages;
}

/**
 * Build the manifest for an upload.
 *
 * Every readable page in every file becomes exactly one ManifestPage, in
 * document order, with a stable id. Nothing is dropped silently: unsupported
 * files land in skippedFiles and unparseable pages land in unreadablePages,
 * both of which the caller is expected to surface rather than ignore.
 */
export async function buildPageManifest(files: SourceFile[]): Promise<PageManifest> {
  const pages: ManifestPage[] = [];
  const skippedFiles: { filename: string; reason: string }[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];

    if (file.mimeType === PDF_TYPE) {
      pages.push(...(await splitPdf(file, fileIndex)));
      continue;
    }

    if (IMAGE_TYPES.has(file.mimeType)) {
      pages.push({
        id: `${fileIndex}:1`,
        filename: file.filename,
        pageNumber: 1,
        mimeType: file.mimeType,
        data: file.data,
        byteLength: file.data.byteLength,
      });
      continue;
    }

    skippedFiles.push({
      filename: file.filename,
      reason: "Not a PDF or image, so it cannot be read automatically. It is stored and sent to the team.",
    });
  }

  const readable = pages.filter((p) => !p.unreadable);
  const unreadablePages = pages.filter((p) => p.unreadable);

  return {
    pages,
    chunks: chunkPages(readable),
    totalPages: pages.length,
    unreadablePages,
    skippedFiles,
  };
}

/**
 * Group readable pages into request-sized chunks, preserving document order so
 * a chunk holds consecutive sheets. Consecutive matters: a schedule continued
 * across two sheets is only readable if both land in the same pass, and
 * ordering by size would routinely separate them.
 */
export function chunkPages(pages: ManifestPage[]): PageChunk[] {
  const chunks: PageChunk[] = [];
  let current: ManifestPage[] = [];
  let currentBytes = 0;

  const flush = () => {
    if (current.length === 0) return;
    chunks.push({ index: chunks.length, pages: current, byteLength: currentBytes });
    current = [];
    currentBytes = 0;
  };

  for (const page of pages) {
    const wouldExceedBytes = currentBytes + page.byteLength > CHUNK_BYTE_BUDGET;
    const wouldExceedPages = current.length >= PAGES_PER_CHUNK;

    if (current.length > 0 && (wouldExceedBytes || wouldExceedPages)) flush();

    current.push(page);
    currentBytes += page.byteLength;

    // A single oversized page becomes its own chunk immediately rather than
    // dragging the next pages over the budget with it.
    if (encodedSize(currentBytes) > MAX_ENCODED_CHUNK_BYTES) flush();
  }

  flush();
  return chunks;
}

/** Pages a chunk is responsible for. Used to prove coverage after a pass. */
export function chunkPageIds(chunk: PageChunk): string[] {
  return chunk.pages.map((p) => p.id);
}

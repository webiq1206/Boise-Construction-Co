/**
 * Page-inventory regression suite.
 *
 * The point of the page manifest is that coverage becomes arithmetic rather
 * than a claim, so these checks are about accounting, not about extraction
 * quality: every page gets exactly one stable id, ids survive chunking without
 * loss or duplication, document order holds, and a page that cannot be read is
 * REPORTED rather than dropped. A silent drop is the failure mode this whole
 * module exists to make impossible, so it is the thing most worth testing.
 *
 *   npx tsx scripts/verify-page-inventory.ts
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  buildPageManifest,
  chunkPages,
  PAGES_PER_CHUNK,
  type ManifestPage,
} from "../server/services/documents/pageInventory";

let checks = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  checks++;
  if (!cond) {
    failed++;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

function eq(name: string, got: unknown, want: unknown) {
  check(name, got === want, `got ${String(got)}, want ${String(want)}`);
}

async function makePdf(pageCount: number, label: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`${label} SHEET ${i}/${pageCount}`, { x: 50, y: 700, size: 20, font });
    page.drawText(`PAGE_TOKEN_${i}`, { x: 50, y: 650, size: 11, font });
  }
  return Buffer.from(await doc.save());
}

async function main() {
  /* ---------------------------------------------- a real 120-sheet permit set */
  const big = await makePdf(120, "A-SERIES");
  const manifest = await buildPageManifest([
    { filename: "permit-set.pdf", mimeType: "application/pdf", data: big },
    { filename: "site-photo.jpg", mimeType: "image/jpeg", data: Buffer.alloc(2048, 7) },
    {
      filename: "addendum.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      data: Buffer.from("x"),
    },
  ]);

  eq("120-page set: totalPages", manifest.totalPages, 121); // 120 sheets + 1 image
  eq("120-page set: unreadable", manifest.unreadablePages.length, 0);
  eq("120-page set: skipped files", manifest.skippedFiles.length, 1);
  check(
    "120-page set: docx is the skipped file",
    manifest.skippedFiles[0]?.filename === "addendum.docx",
  );

  /* Coverage arithmetic: chunking must neither lose nor duplicate a page. */
  const ids = manifest.chunks.flatMap((c) => c.pages.map((p) => p.id));
  eq("chunked ids cover every readable page", ids.length, 121);
  eq("chunked ids are unique", new Set(ids).size, 121);

  /* No chunk may exceed the page cap - that cap is what keeps the model from
     skimming, which is the entire failure this design targets. */
  const maxPages = Math.max(...manifest.chunks.map((c) => c.pages.length));
  check(
    `no chunk exceeds ${PAGES_PER_CHUNK} pages`,
    maxPages <= PAGES_PER_CHUNK,
    `largest chunk held ${maxPages}`,
  );

  /* Document order must survive chunking: a schedule continued across two
     sheets is only readable if the sheets stay adjacent and in sequence. */
  const pdfPageNumbers = ids
    .filter((id) => id.startsWith("0:"))
    .map((id) => Number(id.split(":")[1]));
  check(
    "document order preserved across chunks",
    pdfPageNumbers.every((n, i) => i === 0 || n === pdfPageNumbers[i - 1] + 1),
  );
  eq("first page is sheet 1", pdfPageNumbers[0], 1);
  eq("last page is sheet 120", pdfPageNumbers[pdfPageNumbers.length - 1], 120);

  /* --------------------------------------------------- corrupt PDF is reported */
  const corrupt = await buildPageManifest([
    { filename: "corrupt.pdf", mimeType: "application/pdf", data: Buffer.from("not a pdf") },
  ]);
  eq("corrupt PDF still yields a page entry", corrupt.totalPages, 1);
  eq("corrupt PDF is marked unreadable", corrupt.unreadablePages.length, 1);
  check(
    "corrupt PDF carries a reason",
    Boolean(corrupt.unreadablePages[0]?.unreadable?.reason),
  );
  eq("corrupt PDF contributes no chunks", corrupt.chunks.length, 0);

  /* ------------------------------------------- empty upload is not a crash */
  const empty = await buildPageManifest([]);
  eq("empty upload: totalPages", empty.totalPages, 0);
  eq("empty upload: chunks", empty.chunks.length, 0);

  /* ------------------------------- oversized single page becomes its own chunk */
  const fat: ManifestPage[] = [
    { id: "9:1", filename: "huge.pdf", pageNumber: 1, mimeType: "application/pdf", data: Buffer.alloc(0), byteLength: 25 * 1024 * 1024 },
    { id: "9:2", filename: "huge.pdf", pageNumber: 2, mimeType: "application/pdf", data: Buffer.alloc(0), byteLength: 1024 },
  ];
  const fatChunks = chunkPages(fat);
  check(
    "oversized page is isolated into its own chunk",
    fatChunks.length === 2 && fatChunks[0].pages.length === 1,
    `got ${fatChunks.length} chunks, first held ${fatChunks[0]?.pages.length}`,
  );

  /* ------------------------------------ multi-file ids stay distinct per file */
  const twoFiles = await buildPageManifest([
    { filename: "a.pdf", mimeType: "application/pdf", data: await makePdf(3, "A") },
    { filename: "b.pdf", mimeType: "application/pdf", data: await makePdf(3, "B") },
  ]);
  const twoIds = twoFiles.pages.map((p) => p.id);
  eq("two 3-page files -> 6 pages", twoFiles.totalPages, 6);
  eq("ids are unique across files", new Set(twoIds).size, 6);
  check(
    "second file is namespaced separately",
    twoIds.includes("1:1") && twoIds.includes("0:1"),
    twoIds.join(","),
  );

  if (failed > 0) {
    console.error(`verify-page-inventory: ${failed}/${checks} FAILED`);
    process.exit(1);
  }
  console.log(`verify-page-inventory: OK (${checks} checks)`);
}

main().catch((err) => {
  console.error("verify-page-inventory: threw", err);
  process.exit(1);
});

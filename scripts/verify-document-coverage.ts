/**
 * Coverage-accounting regression suite.
 *
 * These tests use a STUB extractor, not the model. That is the point: the
 * thing being proven here is that the accounting is honest under every failure
 * mode a real pass can produce - a pass that reads everything, one that quietly
 * reports fewer pages than it was handed, one that fails outright, one that
 * claims pages it never saw, and a budget that runs out mid-set. Whether the
 * model reads a drawing well is a different question with a different test;
 * whether we can TELL when it did not is this one, and it has to hold without
 * a network or a key.
 *
 *   npx tsx scripts/verify-document-coverage.ts
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildPageManifest } from "../server/services/documents/pageInventory";
import { runChunkedExtraction, type ChunkOutcome } from "../server/services/documents/chunkedExtract";
import { buildCoverageLedger, summarizeCoverage } from "../server/services/documents/coverage";

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

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    doc.addPage([612, 792]).drawText(`SHEET ${i}`, { x: 50, y: 700, size: 20, font });
  }
  return Buffer.from(await doc.save());
}

async function main() {
  const pdf = await makePdf(40);
  const manifest = await buildPageManifest([
    { filename: "set.pdf", mimeType: "application/pdf", data: pdf },
  ]);
  eq("manifest has 40 pages", manifest.totalPages, 40);

  /* ------------------------------------------ 1. honest pass reads everything */
  const good = await runChunkedExtraction(manifest, async (chunk) => ({
    ok: true,
    report: { pagesRead: chunk.pages.map((p) => p.id), data: { n: chunk.pages.length } },
  }));
  eq("all-read: processed", good.ledger.processed, 40);
  eq("all-read: missing", good.ledger.missing, 0);
  check("all-read: complete", good.ledger.complete);
  eq("all-read: results per chunk", good.results.length, manifest.chunks.length);

  /* --------------- 2. THE KEY CASE: a pass that silently skips half its pages */
  const skipper = await runChunkedExtraction(manifest, async (chunk) => ({
    ok: true,
    report: {
      // Reports only the first half of every chunk, but returns a perfectly
      // well-formed answer - exactly what silent skipping looks like.
      pagesRead: chunk.pages.slice(0, Math.ceil(chunk.pages.length / 2)).map((p) => p.id),
      data: { n: 1 },
    },
  }));
  check(
    "silent skip is detected as missing pages",
    skipper.ledger.missing > 0,
    `missing=${skipper.ledger.missing}`,
  );
  check("silent skip marks coverage incomplete", !skipper.ledger.complete);
  eq(
    "silent skip accounting balances",
    skipper.ledger.processed + skipper.ledger.missing + skipper.ledger.unreadable,
    40,
  );

  /* ------------------------- 3. a pass cannot credit pages it was never given */
  const liar = await runChunkedExtraction(manifest, async (chunk) => ({
    ok: true,
    report: {
      pagesRead: [...chunk.pages.map((p) => p.id), "0:999", "7:1"],
      data: { n: 1 },
    },
  }));
  eq("fabricated page ids are ignored", liar.ledger.processed, 40);
  eq("fabricated ids do not inflate the total", liar.ledger.totalPages, 40);

  /* ------------------------------------ 4. one failing chunk loses only itself */
  let call = 0;
  const partial = await runChunkedExtraction(
    manifest,
    async (chunk): Promise<ChunkOutcome<{ n: number }>> => {
      call++;
      if (chunk.index === 1) return { ok: false, reason: "failed", message: "model error" };
      return { ok: true, report: { pagesRead: chunk.pages.map((p) => p.id), data: { n: 1 } } };
    },
    { retries: 0 },
  );
  const lost = manifest.chunks[1].pages.length;
  eq("failed chunk: pages missing equals that chunk", partial.ledger.missing, lost);
  eq("failed chunk: everything else still read", partial.ledger.processed, 40 - lost);
  check("failed chunk: coverage incomplete", !partial.ledger.complete);
  eq("failed chunk is recorded", partial.ledger.failedChunks.length, 1);
  check(
    "failed chunk lists its page ids",
    partial.ledger.failedChunks[0].pageIds.length === lost,
  );

  /* -------------------------------- 5. transient failure is retried, then ok */
  const seen = new Map<number, number>();
  const retried = await runChunkedExtraction(
    manifest,
    async (chunk): Promise<ChunkOutcome<{ n: number }>> => {
      const n = (seen.get(chunk.index) ?? 0) + 1;
      seen.set(chunk.index, n);
      if (chunk.index === 0 && n === 1) return { ok: false, reason: "busy", message: "rate limited" };
      return { ok: true, report: { pagesRead: chunk.pages.map((p) => p.id), data: { n } } };
    },
    { retries: 2 },
  );
  eq("transient failure recovers on retry", retried.ledger.processed, 40);
  check("transient failure ends complete", retried.ledger.complete);

  /* ---------------------------- 6. deadline stops cleanly with honest ledger */
  const slow = await runChunkedExtraction(
    manifest,
    async (chunk) => {
      await new Promise((r) => setTimeout(r, 60));
      return { ok: true, report: { pagesRead: chunk.pages.map((p) => p.id), data: { n: 1 } } };
    },
    { deadlineMs: 80, concurrency: 1, retries: 0 },
  );
  check("deadline: flagged", slow.deadlineReached || slow.attemptedChunks < slow.totalChunks);
  check("deadline: coverage incomplete", !slow.ledger.complete);
  check(
    "deadline: unattempted pages counted as missing",
    slow.ledger.missing > 0,
    `missing=${slow.ledger.missing}`,
  );
  eq(
    "deadline: accounting still balances",
    slow.ledger.processed + slow.ledger.missing + slow.ledger.unreadable,
    40,
  );

  /* ------------------------- 7. unreadable is distinct from missing, and gates */
  const withUnreadable = buildCoverageLedger({
    allPages: [
      { id: "0:1", filename: "a.pdf", pageNumber: 1 },
      { id: "0:2", filename: "a.pdf", pageNumber: 2 },
      { id: "0:3", filename: "a.pdf", pageNumber: 3 },
    ],
    manifestUnreadable: [],
    reportedRead: ["0:1"],
    reportedUnreadable: [{ id: "0:2", reason: "Scan is blank." }],
    skippedFiles: [],
    failedChunks: [],
  });
  eq("unreadable counted separately", withUnreadable.unreadable, 1);
  eq("missing counted separately", withUnreadable.missing, 1);
  check("unreadable alone blocks completeness", !withUnreadable.complete);
  check(
    "unreadable carries its reason",
    withUnreadable.pages.find((p) => p.id === "0:2")?.reason === "Scan is blank.",
  );

  /* A set that is fully read but has one unreadable sheet is NOT complete -
     an unreadable sheet still leaves scope unknown. */
  const oneBadSheet = buildCoverageLedger({
    allPages: [
      { id: "0:1", filename: "a.pdf", pageNumber: 1 },
      { id: "0:2", filename: "a.pdf", pageNumber: 2 },
    ],
    manifestUnreadable: [{ id: "0:2", reason: "corrupt" }],
    reportedRead: ["0:1"],
    reportedUnreadable: [],
    skippedFiles: [],
    failedChunks: [],
  });
  check("one unreadable sheet blocks completeness", !oneBadSheet.complete);

  check("summary mentions the shortfall", summarizeCoverage(oneBadSheet).includes("unreadable"));

  if (failed > 0) {
    console.error(`verify-document-coverage: ${failed}/${checks} FAILED`);
    process.exit(1);
  }
  console.log(`verify-document-coverage: OK (${checks} checks)`);
}

main().catch((err) => {
  console.error("verify-document-coverage: threw", err);
  process.exit(1);
});

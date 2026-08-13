/**
 * Runs a document read across many bounded passes instead of one giant request.
 *
 * WHAT CHANGED AND WHY. Both extractors used to base64 an entire upload into a
 * single call, which capped the readable set at roughly 22MB and made a 100+
 * page permit set something we REFUSED rather than something we read. It also
 * meant one answer covered every sheet, so a pass that quietly skipped half the
 * set was indistinguishable from one that read all of it.
 *
 * This runner inverts that: the manifest decides what exists, each pass is
 * handed a named handful of pages and must report back which of those ids it
 * actually read, and coverage is reconciled afterwards. A pass that fails does
 * not fail the upload - it fails its own pages, which then show up as holes.
 *
 * DEADLINE, NOT HOPE. Serverless requests die at a fixed wall clock. Rather
 * than let a 200-page set run until the platform kills the request and the
 * visitor sees nothing, the runner works to a budget and stops cleanly when it
 * is spent. What it did read is returned WITH an honest ledger showing what it
 * did not. Partial coverage is a legitimate, reportable state; a truncated
 * request that looks like success is not.
 */
import type { PageChunk, PageManifest } from "./pageInventory";
import { buildCoverageLedger, type CoverageLedger } from "./coverage";

/** What every per-chunk extraction must report, whatever else it returns. */
export interface ChunkReport<T> {
  /** Ids from this chunk the pass genuinely read. Never assume "all of them". */
  pagesRead: string[];
  /** Pages the pass looked at but could not read, with why. */
  pagesUnreadable?: { id: string; reason: string }[];
  /** Tool-specific payload (extracted plan facts, repair rows, ...). */
  data: T;
}

export type ChunkOutcome<T> =
  | { ok: true; report: ChunkReport<T> }
  | { ok: false; reason: "busy" | "refused" | "failed" | "not-configured"; message: string };

export interface ChunkedExtractionOptions {
  /**
   * Passes in flight at once. Kept low deliberately: these are large multimodal
   * requests, and pushing concurrency up trades a modest wall-clock gain for
   * rate-limit errors that cost far more time than they save.
   */
  concurrency?: number;
  /**
   * Wall-clock budget in ms. The runner stops STARTING new passes once this is
   * spent; passes already running are allowed to finish so their work is not
   * thrown away.
   */
  deadlineMs?: number;
  /** Retries per chunk for transient failures only. */
  retries?: number;
}

export interface ChunkedExtractionResult<T> {
  /** Payloads from every successful pass, in chunk order. */
  results: T[];
  ledger: CoverageLedger;
  /** True when the budget stopped us before every chunk was attempted. */
  deadlineReached: boolean;
  attemptedChunks: number;
  totalChunks: number;
}

const DEFAULTS = { concurrency: 3, deadlineMs: 240_000, retries: 1 };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runChunkedExtraction<T>(
  manifest: PageManifest,
  extractChunk: (chunk: PageChunk) => Promise<ChunkOutcome<T>>,
  options: ChunkedExtractionOptions = {},
): Promise<ChunkedExtractionResult<T>> {
  const { concurrency, deadlineMs, retries } = { ...DEFAULTS, ...options };
  const startedAt = Date.now();
  const budgetSpent = () => Date.now() - startedAt >= deadlineMs;

  const results: (T | undefined)[] = new Array(manifest.chunks.length);
  const reportedRead: string[] = [];
  const reportedUnreadable: { id: string; reason: string }[] = [];
  const failedChunks: { index: number; pageIds: string[]; reason: string }[] = [];

  let nextChunk = 0;
  let attempted = 0;
  let deadlineReached = false;

  async function attempt(chunk: PageChunk): Promise<void> {
    for (let tryNo = 0; tryNo <= retries; tryNo++) {
      const outcome = await extractChunk(chunk);

      if (outcome.ok) {
        results[chunk.index] = outcome.report.data;
        /* Only ids this chunk was actually responsible for are credited. A pass
           that hallucinates an id from another chunk must not be able to mark
           a page read that it never saw. */
        const owned = new Set(chunk.pages.map((p) => p.id));
        for (const id of outcome.report.pagesRead) if (owned.has(id)) reportedRead.push(id);
        for (const u of outcome.report.pagesUnreadable ?? []) {
          if (owned.has(u.id)) reportedUnreadable.push(u);
        }
        return;
      }

      // Only transient failures are worth another attempt; a refusal or a bad
      // request will fail identically the second time and just burns budget.
      const transient = outcome.reason === "busy";
      if (!transient || tryNo === retries || budgetSpent()) {
        failedChunks.push({
          index: chunk.index,
          pageIds: chunk.pages.map((p) => p.id),
          reason: outcome.message,
        });
        return;
      }
      await sleep(1_000 * (tryNo + 1));
    }
  }

  async function worker(): Promise<void> {
    for (;;) {
      if (budgetSpent()) {
        deadlineReached = true;
        return;
      }
      const index = nextChunk++;
      if (index >= manifest.chunks.length) return;
      attempted++;
      await attempt(manifest.chunks[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, manifest.chunks.length)) }, worker),
  );

  /* Chunks the budget never let us start are recorded as failures with their
     page ids, so those pages land in the ledger as holes rather than vanishing
     from the accounting entirely. */
  for (let i = nextChunk; i < manifest.chunks.length; i++) {
    const chunk = manifest.chunks[i];
    failedChunks.push({
      index: chunk.index,
      pageIds: chunk.pages.map((p) => p.id),
      reason: "Not attempted: the time budget for this upload was reached.",
    });
  }

  const ledger = buildCoverageLedger({
    allPages: manifest.pages.map((p) => ({
      id: p.id,
      filename: p.filename,
      pageNumber: p.pageNumber,
    })),
    manifestUnreadable: manifest.unreadablePages.map((p) => ({
      id: p.id,
      reason: p.unreadable?.reason ?? "Could not be read.",
    })),
    reportedRead,
    reportedUnreadable,
    skippedFiles: manifest.skippedFiles,
    failedChunks,
  });

  return {
    results: results.filter((r): r is T => r !== undefined),
    ledger,
    deadlineReached,
    attemptedChunks: attempted,
    totalChunks: manifest.chunks.length,
  };
}

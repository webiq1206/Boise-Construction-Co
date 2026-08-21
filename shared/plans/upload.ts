/**
 * The contract for uploading a plan set one page at a time.
 *
 * WHY THIS REPLACED A SINGLE POST. The old path sent the whole set in one
 * request and capped it at 96MB (shared/re10/uploads). A real 103-sheet scanned
 * restaurant set is 123.8MB, so it was refused outright - and simply raising the
 * cap would not have worked, because scanned sheets run ~1.5MB each and the
 * 200-sheet sets we advertise are ~300MB. Three ceilings bind before the model
 * does: the HTTP body, the heap holding one PDF per page, and the wall clock.
 *
 * Splitting in the BROWSER moves the boundary to where it stops hurting. The
 * page is the unit of transfer, so no request is bigger than a sheet, the
 * server never holds the set, and the database never sees a row near its
 * payload limit. It also makes progress honest: "142 of 203 sheets uploaded" is
 * a count of things that actually happened, not a percentage of bytes.
 *
 * These constants live in shared/ because the browser enforces them to give a
 * fast, specific message and the server enforces them again because a browser
 * check is a courtesy, not a control.
 */

/**
 * Sheets in one upload.
 *
 * 200 is the number the estimator promises. The ceiling is not really the
 * pages - it is the reading time, and that is handled by stepping rather than
 * by refusing sheets. Sets beyond this are a conversation with the team, not a
 * silent truncation.
 */
export const MAX_PLAN_PAGES = 200;

/**
 * Bytes for ONE page.
 *
 * A vector sheet is tens of KB; a scanned sheet is 1-2MB; a 600dpi colour scan
 * of a D-size sheet can reach 8MB. 12MB leaves headroom above the worst real
 * sheet while still being far below any request limit. A page over this is
 * reported by name rather than failing the upload, because one absurd sheet in
 * a 200-sheet set must not cost the other 199.
 */
export const MAX_PAGE_BYTES = 12 * 1024 * 1024;

/**
 * Total bytes across the whole set.
 *
 * 400MB comfortably covers a 200-sheet scanned set at ~1.5MB/sheet with room
 * for the heavy ones. This is a sanity bound against a runaway upload, not the
 * mechanism that keeps requests small - that is the per-page split.
 */
export const MAX_PLAN_TOTAL_BYTES = 400 * 1024 * 1024;

/** Source files in one upload (a set is sometimes delivered as several PDFs). */
export const MAX_PLAN_FILES = 30;

/**
 * Pages uploaded concurrently by the browser.
 *
 * Enough to saturate a domestic uplink without opening so many sockets that a
 * flaky connection starts timing pages out and retrying them.
 */
export const PAGE_UPLOAD_CONCURRENCY = 4;

/**
 * Chunks processed per `step` call.
 *
 * Each step must finish well inside any proxy's request timeout, because the
 * whole point of stepping is that no single request is long enough to be killed.
 * Two chunks is ~16 sheets of model reading - comfortably under a minute in
 * practice, and small enough that a step that does die costs little.
 */
export const CHUNKS_PER_STEP = 1;

/**
 * Passes the browser runs at once.
 *
 * THIS IS WHY THE READ USED TO HANG. Each pass over four scanned sheets takes
 * 35-55 seconds. The first version did two passes inside ONE request, so every
 * request ran for 75-110 seconds - far past what the proxy in front of the app
 * will hold open. The request was killed before it wrote anything down, so no
 * progress persisted, the client retried, and it hung on "Reading your
 * drawings" forever making no progress at all.
 *
 * Now one pass per request keeps each one around 40 seconds, and the
 * PARALLELISM lives in the browser instead: four requests in flight turns a
 * 26-pass set from sixteen minutes of sequential waiting into about four.
 * Four rather than eight because these are large multimodal requests and
 * pushing concurrency higher trades a modest wall-clock gain for rate-limit
 * errors that cost far more than they save.
 */
export const CHUNK_REQUEST_CONCURRENCY = 4;

/**
 * How many times a pass may be retried before its sheets are recorded as holes.
 *
 * A pass that fails takes its own sheets down with it and nothing else, so the
 * honest outcome of exhausting this is a smaller coverage number, never a
 * failed upload.
 */
export const CHUNK_MAX_ATTEMPTS = 2;

/** Characters of customer instruction we accept. */
export const MAX_INSTRUCTIONS_CHARS = 2000;

export interface PlanUploadPageRef {
  fileIndex: number;
  filename: string;
  pageNumber: number;
  byteLength: number;
}

/** Shape the client polls while a job runs. */
export interface PlanJobProgress {
  jobId: string;
  status: "queued" | "running" | "complete" | "failed";
  totalPages: number;
  chunksDone: number;
  totalChunks: number;
  error?: string | null;
}

export function describePageLimit(pages: number): string {
  return `That set has ${pages.toLocaleString()} sheets. We can read up to ${MAX_PLAN_PAGES} in one go - send it in a couple of batches, or email it over and we will load it ourselves.`;
}

/**
 * Sheets the model reads in one pass.
 *
 * FOUR, NOT EIGHT. The single-request path used eight because it was racing a
 * 240-second budget and needed to cover the set before the clock ran out. The
 * stepped path is not racing anything, so the trade runs the other way: fewer
 * sheets per pass means more attention per sheet, which is exactly what a dense
 * scanned drawing with a schedule on it needs. Accuracy is the point of this
 * feature; wall-clock is now someone else's problem to display as a progress
 * bar.
 */
export const PAGES_PER_CHUNK = 4;

/**
 * Raw bytes per pass, kept well inside the API's request limit once base64
 * inflates it by ~4/3. Four scanned sheets is ~6MB, so page count is what
 * normally binds and this is the guard against a set of very heavy scans.
 */
export const CHUNK_BYTE_BUDGET = 14 * 1024 * 1024;

export interface ChunkRange {
  index: number;
  /** Offset of the first sheet, 0-based, in document order. */
  start: number;
  /** Number of sheets in this pass. */
  count: number;
}

/**
 * Decide the passes up front, from sizes alone.
 *
 * Both sides run this: the server to know how many steps a job has, the client
 * to render a progress bar that does not jump. Consecutive sheets stay in the
 * same pass because a schedule continued across two sheets is only readable if
 * both land together.
 */
export function planChunkRanges(byteLengths: number[]): ChunkRange[] {
  const ranges: ChunkRange[] = [];
  let start = 0;
  let count = 0;
  let bytes = 0;

  const flush = () => {
    if (count === 0) return;
    ranges.push({ index: ranges.length, start, count });
    start += count;
    count = 0;
    bytes = 0;
  };

  for (const size of byteLengths) {
    if (count > 0 && (count >= PAGES_PER_CHUNK || bytes + size > CHUNK_BYTE_BUDGET)) flush();
    count += 1;
    bytes += size;
  }
  flush();
  return ranges;
}

"use client";

import {
  CHUNK_MAX_ATTEMPTS,
  CHUNK_REQUEST_CONCURRENCY,
  MAX_PAGE_BYTES,
  MAX_PLAN_FILES,
  MAX_PLAN_PAGES,
  MAX_PLAN_TOTAL_BYTES,
  PAGE_UPLOAD_CONCURRENCY,
  describePageLimit,
} from "@/shared/plans/upload";

/**
 * Get a plan set to the server and read, one sheet at a time.
 *
 * THE PROBLEM THIS SOLVES. A real 103-sheet scanned restaurant set is 123.8MB.
 * Posting that as one request failed every time: over the app's own 96MB cap,
 * over whatever the proxy in front of Autoscale will buffer, and - had it
 * arrived - over what a single container should hold in heap while splitting it
 * into 103 more PDFs. Raising the cap would not have helped, because scanned
 * sheets run ~1.5MB each and a 200-sheet set is ~300MB.
 *
 * So the split happens HERE, before anything is sent. The browser already has
 * the file in memory and pdf-lib runs perfectly well in it. Once the unit of
 * transfer is one sheet, every ceiling downstream stops binding at once: no
 * request over a couple of MB, no giant database row, no container holding the
 * set. It also makes the progress bar honest - "sheet 142 of 203" is a count of
 * things that actually happened.
 *
 * pdf-lib is imported dynamically on purpose. It is ~300KB and this is a
 * marketing site whose LCP matters; nobody who never uploads plans should pay
 * for the parser.
 */

export type PlanUploadPhase = "preparing" | "uploading" | "reading" | "done";

export interface PlanUploadProgress {
  phase: PlanUploadPhase;
  /** Sheets found across every file, once splitting has run. */
  totalPages: number;
  /** Sheets successfully stored. */
  uploadedPages: number;
  /** Model passes finished, once reading has started. */
  chunksDone: number;
  totalChunks: number;
}

export interface PlanUploadFailure {
  ok: false;
  message: string;
  /** True when the estimator should offer the plain-attachment path instead. */
  fallback?: boolean;
}

export interface PlanUploadSuccess {
  ok: true;
  jobId: string;
  /** Whatever /api/plans/job/[id] returned once complete. */
  result: Record<string, unknown>;
  /** Sheets that never made it up, by name. Surfaced, never swallowed. */
  failedSheets: string[];
}

export type PlanUploadOutcome = PlanUploadSuccess | PlanUploadFailure;

interface SplitPage {
  fileIndex: number;
  filename: string;
  pageNumber: number;
  blob: Blob;
}

const PDF_TYPE = "application/pdf";

/**
 * Turn the chosen files into single-sheet blobs.
 *
 * A page that will not copy is SKIPPED AND NAMED rather than aborting the set:
 * one corrupt sheet in a 200-sheet permit set must not cost the other 199, and
 * the caller reports the names so nobody believes a sheet was read when it was
 * never sent.
 */
async function splitToPages(
  files: File[],
  onCount: (n: number) => void,
): Promise<{ pages: SplitPage[]; failed: string[] }> {
  const { PDFDocument } = await import("pdf-lib");
  const pages: SplitPage[] = [];
  const failed: string[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];

    // Images are already one page; there is nothing to split.
    if (file.type.startsWith("image/")) {
      pages.push({ fileIndex, filename: file.name, pageNumber: 1, blob: file });
      onCount(pages.length);
      continue;
    }

    let source: import("pdf-lib").PDFDocument;
    try {
      source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    } catch {
      failed.push(`${file.name} (could not be opened)`);
      continue;
    }

    const count = source.getPageCount();
    for (let i = 0; i < count; i++) {
      try {
        const single = await PDFDocument.create();
        const [copied] = await single.copyPages(source, [i]);
        single.addPage(copied);
        const bytes = await single.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: PDF_TYPE });
        if (blob.size > MAX_PAGE_BYTES) {
          failed.push(`${file.name} p.${i + 1} (sheet too large)`);
          continue;
        }
        pages.push({ fileIndex, filename: file.name, pageNumber: i + 1, blob });
        onCount(pages.length);
      } catch {
        failed.push(`${file.name} p.${i + 1}`);
      }
      // Yield so a 200-sheet split does not freeze the tab.
      if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));
    }
  }

  return { pages, failed };
}

async function postPage(uploadId: string, page: SplitPage, signal?: AbortSignal): Promise<boolean> {
  const body = new FormData();
  body.append("uploadId", uploadId);
  body.append("fileIndex", String(page.fileIndex));
  body.append("pageNumber", String(page.pageNumber));
  body.append("filename", page.filename);
  body.append("page", page.blob, `${page.pageNumber}.pdf`);

  // One retry: a dropped sheet on a domestic uplink is common and the server
  // ignores a duplicate, so retrying is cheap and safe.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/plans/upload/page", { method: "POST", body, signal });
      if (res.ok) return true;
      // A sheet the server refuses on its merits will be refused again.
      if (res.status === 413 || res.status === 400) return false;
    } catch {
      if (signal?.aborted) return false;
    }
  }
  return false;
}

export async function uploadAndReadPlanSet(
  files: File[],
  instructions: string,
  onProgress: (p: PlanUploadProgress) => void,
  signal?: AbortSignal,
): Promise<PlanUploadOutcome> {
  if (files.length === 0) return { ok: false, message: "No files were chosen." };
  if (files.length > MAX_PLAN_FILES) {
    return { ok: false, message: `Please send at most ${MAX_PLAN_FILES} files at a time.` };
  }
  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  if (totalBytes > MAX_PLAN_TOTAL_BYTES) {
    const mb = Math.round(MAX_PLAN_TOTAL_BYTES / (1024 * 1024));
    return {
      ok: false,
      message: `That set is over ${mb}MB in total. Send it in a couple of batches, or email it over and we will load it ourselves.`,
      fallback: true,
    };
  }

  const progress: PlanUploadProgress = {
    phase: "preparing",
    totalPages: 0,
    uploadedPages: 0,
    chunksDone: 0,
    totalChunks: 0,
  };
  const emit = () => onProgress({ ...progress });
  emit();

  /* --------------------------------------------------------------- claim id */
  let uploadId: string;
  try {
    const res = await fetch("/api/plans/upload/init", { method: "POST", signal });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message ?? "Plan review is unavailable.", fallback: true };
    uploadId = data.uploadId;
  } catch {
    return { ok: false, message: "Could not reach plan review.", fallback: true };
  }

  /* ----------------------------------------------------------------- split */
  const { pages, failed } = await splitToPages(files, (n) => {
    progress.totalPages = n;
    emit();
  });

  if (pages.length === 0) {
    return { ok: false, message: "None of those pages could be opened. They may be corrupt or password protected." };
  }
  if (pages.length > MAX_PLAN_PAGES) {
    return { ok: false, message: describePageLimit(pages.length) };
  }

  /* ---------------------------------------------------------------- upload */
  progress.phase = "uploading";
  emit();

  const failedSheets = [...failed];
  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= pages.length) return;
      if (signal?.aborted) return;
      const ok = await postPage(uploadId, pages[i], signal);
      if (ok) progress.uploadedPages += 1;
      else failedSheets.push(`${pages[i].filename} p.${pages[i].pageNumber}`);
      emit();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(PAGE_UPLOAD_CONCURRENCY, pages.length) }, worker),
  );

  if (signal?.aborted) return { ok: false, message: "Upload cancelled." };
  if (progress.uploadedPages === 0) {
    return { ok: false, message: "No sheets could be uploaded. Check your connection and try again.", fallback: true };
  }

  /* -------------------------------------------------------------- open job */
  let jobId: string;
  try {
    const res = await fetch("/api/plans/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, instructions }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message ?? "Could not start the review." };
    jobId = data.jobId;
    progress.totalChunks = data.totalChunks ?? 0;
  } catch {
    return { ok: false, message: "Could not start the review.", fallback: true };
  }

  /* ----------------------------------------------------------- read passes */
  progress.phase = "reading";
  emit();

  /*
   * ONE PASS PER REQUEST, SEVERAL REQUESTS AT ONCE.
   *
   * The previous version asked the server to walk the batches itself, two per
   * request. Each batch of four scanned sheets takes 35-55 seconds, so those
   * requests ran for 75-110 seconds and were killed by the proxy before they
   * wrote anything down - which is why a large set sat on "Reading your
   * drawings" indefinitely, retrying and never advancing.
   *
   * Now each request does exactly one pass and persists it, and the
   * parallelism lives here. Four in flight turns a 26-pass set from sixteen
   * minutes into roughly four, and no request lives long enough to be killed.
   * Order does not matter because each pass writes only its own row.
   */
  const total = progress.totalChunks;
  const failedChunks: number[] = [];
  let nextIndex = 0;
  let completed = 0;

  async function runOne(index: number): Promise<void> {
    for (let attempt = 0; attempt < CHUNK_MAX_ATTEMPTS; attempt++) {
      if (signal?.aborted) return;
      try {
        const res = await fetch(`/api/plans/job/${jobId}/chunk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index }),
          signal,
        });
        if (res.ok) return;
        /* 422 is a pass that genuinely could not read those sheets. Retrying
           produces the same answer and only burns time; the server has already
           recorded it so those pages show up as holes. */
        if (res.status === 422) { failedChunks.push(index); return; }
      } catch {
        if (signal?.aborted) return;
      }
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
    failedChunks.push(index);
  }

  async function readWorker(): Promise<void> {
    for (;;) {
      const index = nextIndex++;
      if (index >= total) return;
      if (signal?.aborted) return;
      await runOne(index);
      completed += 1;
      progress.chunksDone = completed;
      emit();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CHUNK_REQUEST_CONCURRENCY, Math.max(1, total)) }, readWorker),
  );

  if (signal?.aborted) return { ok: false, message: "Review cancelled." };

  /* Every pass failing is a different situation from some failing, and the
     visitor should not be shown a confident empty estimate for it. */
  if (total > 0 && failedChunks.length >= total) {
    return {
      ok: false,
      message: "We could not read those drawings. We have kept the files and our team will read them by hand.",
      fallback: true,
    };
  }

  try {
    const res = await fetch(`/api/plans/job/${jobId}/finalize`, { method: "POST", signal });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.message ?? "We could not finish reading that plan set." };
    }
  } catch {
    return { ok: false, message: "We could not finish reading that plan set." };
  }

  /* ---------------------------------------------------------------- result */
  try {
    const res = await fetch(`/api/plans/job/${jobId}`, { signal });
    const data = await res.json();
    if (!res.ok || data.status !== "complete") {
      return { ok: false, message: data.message ?? "The review did not finish. We still have your drawings." };
    }
    progress.phase = "done";
    emit();
    return { ok: true, jobId, result: data, failedSheets };
  } catch {
    return { ok: false, message: "Could not fetch the review result." };
  }
}

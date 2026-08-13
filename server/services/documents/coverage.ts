/**
 * Coverage accounting for a chunked document read.
 *
 * THE CLAIM THIS MODULE MAKES POSSIBLE. "Every page was processed" is either
 * arithmetic or it is marketing. Here it is arithmetic: the manifest says which
 * page ids exist, each extraction pass reports which ids it actually read, and
 * the difference is the gap. Nothing infers coverage from "the request
 * succeeded" - a pass can return a perfectly well-formed answer while silently
 * ignoring half the sheets it was handed, and that is precisely the failure a
 * large set produces.
 *
 * WHY UNREADABLE IS NOT MISSING. A page that would not render is a FINDING: the
 * team can go look at it. A page nobody ever reported on is a HOLE: we do not
 * know what is on it. They gate differently, so they are counted separately and
 * never merged into one "problem pages" number.
 */

export type PageStatus = "processed" | "unreadable" | "missing";

export interface PageOutcome {
  id: string;
  filename: string;
  pageNumber: number;
  status: PageStatus;
  /** Present for unreadable pages; the operator-facing explanation. */
  reason?: string;
}

export interface CoverageLedger {
  totalPages: number;
  processed: number;
  unreadable: number;
  missing: number;
  /** True only when every page is accounted for AND none are missing. */
  complete: boolean;
  pages: PageOutcome[];
  /** Files stored but never sent to the model (e.g. .docx). */
  skippedFiles: { filename: string; reason: string }[];
  /** Chunks that failed outright, with the pages they were carrying. */
  failedChunks: { index: number; pageIds: string[]; reason: string }[];
}

export interface CoverageInput {
  /** Every page id in the manifest, in document order. */
  allPages: { id: string; filename: string; pageNumber: number }[];
  /** Pages the manifest already knew were unreadable (corrupt, unparseable). */
  manifestUnreadable: { id: string; reason: string }[];
  /** Page ids each successful pass confirmed it read. */
  reportedRead: string[];
  /** Pages a pass explicitly flagged as unreadable (blank scan, illegible). */
  reportedUnreadable: { id: string; reason: string }[];
  skippedFiles: { filename: string; reason: string }[];
  failedChunks: { index: number; pageIds: string[]; reason: string }[];
}

export function buildCoverageLedger(input: CoverageInput): CoverageLedger {
  const read = new Set(input.reportedRead);
  const unreadableReasons = new Map<string, string>();

  for (const u of input.manifestUnreadable) unreadableReasons.set(u.id, u.reason);
  for (const u of input.reportedUnreadable) {
    // A pass that looked at the page and could not read it gives a more
    // specific reason than the manifest's parse failure, so it wins.
    unreadableReasons.set(u.id, u.reason);
  }

  const pages: PageOutcome[] = input.allPages.map((p) => {
    if (unreadableReasons.has(p.id)) {
      return { ...p, status: "unreadable" as const, reason: unreadableReasons.get(p.id) };
    }
    if (read.has(p.id)) return { ...p, status: "processed" as const };
    return { ...p, status: "missing" as const };
  });

  const processed = pages.filter((p) => p.status === "processed").length;
  const unreadable = pages.filter((p) => p.status === "unreadable").length;
  const missing = pages.filter((p) => p.status === "missing").length;

  return {
    totalPages: pages.length,
    processed,
    unreadable,
    missing,
    /* Deliberately strict. "Complete" means every page was READ - an unreadable
       page still leaves scope unknown, so a set containing one is not complete
       and must not be quoted as though it were. */
    complete: missing === 0 && unreadable === 0 && input.failedChunks.length === 0,
    pages,
    skippedFiles: input.skippedFiles,
    failedChunks: input.failedChunks,
  };
}

/** Human-readable summary for the operator-facing audit trail. */
export function summarizeCoverage(ledger: CoverageLedger): string {
  const parts = [`${ledger.processed}/${ledger.totalPages} pages read`];
  if (ledger.unreadable > 0) parts.push(`${ledger.unreadable} unreadable`);
  if (ledger.missing > 0) parts.push(`${ledger.missing} never reported`);
  if (ledger.failedChunks.length > 0) parts.push(`${ledger.failedChunks.length} passes failed`);
  if (ledger.skippedFiles.length > 0) parts.push(`${ledger.skippedFiles.length} file(s) not machine-readable`);
  return parts.join(", ");
}

/**
 * Pages a human needs to look at, grouped so the operator sees sheet numbers
 * rather than opaque ids.
 */
export function pagesNeedingAttention(ledger: CoverageLedger): PageOutcome[] {
  return ledger.pages.filter((p) => p.status !== "processed");
}

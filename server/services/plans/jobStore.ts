import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { planJobs, planUploadPages, type PlanJob } from "@/shared/schema";

/**
 * Durable state for a plan read.
 *
 * WHY THE DATABASE AND NOT MEMORY. Autoscale runs more than one container and
 * recycles them freely, so the step that reads sheets 17-32 is routinely served
 * by a different process than the one that read 1-16. In-memory job state would
 * work perfectly in development and lose half of every large set in production
 * - the worst possible failure shape, because it would look like the model
 * missing sheets rather than the server forgetting them.
 *
 * Pages are rows rather than one blob for the same reason the browser splits
 * them: this database speaks over HTTP, and a 165MB base64 payload is not a row
 * it will accept. One sheet per row is ~2MB encoded, which it will.
 */

export type JobStoreError = "no-database";

function requireDb() {
  if (!db) return null;
  return db;
}

export function isJobStoreConfigured(): boolean {
  return db !== null;
}

export interface StoredPageInput {
  uploadId: string;
  fileIndex: number;
  filename: string;
  pageNumber: number;
  mimeType: string;
  data: Buffer;
}

/**
 * Persist one uploaded sheet.
 *
 * onConflictDoNothing, not an upsert: the browser retries a page whose request
 * timed out, and the retry may well arrive after the original succeeded. Doing
 * nothing on conflict makes the retry harmless. Overwriting would be harmless
 * too, but it would rewrite 2MB for no reason on every flaky connection.
 */
export async function storePage(input: StoredPageInput): Promise<void> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  await database
    .insert(planUploadPages)
    .values({
      uploadId: input.uploadId,
      fileIndex: input.fileIndex,
      filename: input.filename,
      pageNumber: input.pageNumber,
      mimeType: input.mimeType,
      byteLength: input.data.byteLength,
      data: input.data.toString("base64"),
    })
    .onConflictDoNothing();
}

/** How many sheets have landed so far. Used to verify a set is fully uploaded. */
export async function countPages(uploadId: string): Promise<number> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  const rows = await database
    .select({ n: sql<number>`count(*)::int` })
    .from(planUploadPages)
    .where(eq(planUploadPages.uploadId, uploadId));
  return rows[0]?.n ?? 0;
}

export interface LoadedPage {
  id: string;
  fileIndex: number;
  filename: string;
  pageNumber: number;
  mimeType: string;
  data: Buffer;
}

/**
 * Load a WINDOW of pages, in document order.
 *
 * Deliberately not "load the set": a step only ever needs the sheets it is
 * about to read, and pulling 200 sheets (~300MB) into a container that only
 * needs 16 of them is how a step runs out of heap on the exact large sets this
 * whole design exists to support.
 */
export async function loadPageWindow(
  uploadId: string,
  offset: number,
  limit: number,
): Promise<LoadedPage[]> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  const rows = await database
    .select()
    .from(planUploadPages)
    .where(eq(planUploadPages.uploadId, uploadId))
    .orderBy(asc(planUploadPages.fileIndex), asc(planUploadPages.pageNumber))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    id: `${r.fileIndex}:${r.pageNumber}`,
    fileIndex: r.fileIndex,
    filename: r.filename,
    pageNumber: r.pageNumber,
    mimeType: r.mimeType,
    data: Buffer.from(r.data, "base64"),
  }));
}

/** Page identities only - enough to build the manifest without the bytes. */
export async function listPageRefs(uploadId: string) {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  return database
    .select({
      fileIndex: planUploadPages.fileIndex,
      filename: planUploadPages.filename,
      pageNumber: planUploadPages.pageNumber,
      mimeType: planUploadPages.mimeType,
      byteLength: planUploadPages.byteLength,
    })
    .from(planUploadPages)
    .where(eq(planUploadPages.uploadId, uploadId))
    .orderBy(asc(planUploadPages.fileIndex), asc(planUploadPages.pageNumber));
}

export async function createJob(params: {
  uploadId: string;
  instructions: string | null;
  totalPages: number;
  totalChunks: number;
}): Promise<PlanJob> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  const [job] = await database
    .insert(planJobs)
    .values({
      uploadId: params.uploadId,
      instructions: params.instructions,
      totalPages: params.totalPages,
      totalChunks: params.totalChunks,
      status: "queued",
    })
    .returning();
  return job;
}

export async function getJob(jobId: string): Promise<PlanJob | null> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  const [job] = await database.select().from(planJobs).where(eq(planJobs.id, jobId)).limit(1);
  return job ?? null;
}

export async function updateJob(
  jobId: string,
  patch: Partial<Pick<PlanJob, "status" | "chunksDone" | "result" | "coverage" | "conflicts" | "error">>,
): Promise<void> {
  const database = requireDb();
  if (!database) throw new Error("no-database");
  await database
    .update(planJobs)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(planJobs.id, jobId));
}

/** Free the sheets once a job is finished; the merged result is what we keep. */
export async function discardPages(uploadId: string): Promise<void> {
  const database = requireDb();
  if (!database) return;
  await database.delete(planUploadPages).where(eq(planUploadPages.uploadId, uploadId));
}

export { and, eq };

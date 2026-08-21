-- Plan-set uploads that are read a sheet at a time.
--
-- The project normally syncs schema with `npm run db:push`. This file exists so
-- the change can also be applied by hand against the Replit database, because
-- these two tables are a HARD RUNTIME DEPENDENCY of the plan estimator: without
-- them /api/plans/upload/page throws on every sheet and the whole feature is
-- dead rather than degraded. Safe to run more than once.

CREATE TABLE IF NOT EXISTS "plan_upload_pages" (
  "id"          varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "upload_id"   varchar NOT NULL,
  "file_index"  integer NOT NULL,
  "filename"    text    NOT NULL,
  "page_number" integer NOT NULL,
  "mime_type"   text    NOT NULL,
  "byte_length" integer NOT NULL,
  "data"        text    NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL
);

-- Pages are always read as "this upload, in document order", never by id.
CREATE INDEX IF NOT EXISTS "plan_upload_pages_upload_idx"
  ON "plan_upload_pages" ("upload_id", "file_index", "page_number");

-- A retried sheet must not become a second copy of that sheet: the browser
-- retries on a flaky connection, and a set that silently gained a duplicate
-- p.47 would double-count whatever that sheet states.
CREATE UNIQUE INDEX IF NOT EXISTS "plan_upload_pages_unique"
  ON "plan_upload_pages" ("upload_id", "file_index", "page_number");

CREATE TABLE IF NOT EXISTS "plan_jobs" (
  "id"           varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "upload_id"    varchar NOT NULL,
  "status"       text    NOT NULL DEFAULT 'queued',
  "instructions" text,
  "total_pages"  integer NOT NULL DEFAULT 0,
  "chunks_done"  integer NOT NULL DEFAULT 0,
  "total_chunks" integer NOT NULL DEFAULT 0,
  "result"       jsonb,
  "coverage"     jsonb,
  "conflicts"    jsonb,
  "error"        text,
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "plan_jobs_upload_idx" ON "plan_jobs" ("upload_id");

-- Trade-scoped reads and the clarifying-question conversation.
ALTER TABLE "plan_jobs" ADD COLUMN IF NOT EXISTS "scope" text NOT NULL DEFAULT 'residential';
ALTER TABLE "plan_jobs" ADD COLUMN IF NOT EXISTS "answers" jsonb;

-- One row per model pass, so passes can run in parallel without racing each
-- other through a single accumulating column.
CREATE TABLE IF NOT EXISTS "plan_job_chunks" (
  "id"               varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id"           varchar NOT NULL,
  "chunk_index"      integer NOT NULL,
  "contribution"     jsonb,
  "pages_read"       jsonb,
  "pages_unreadable" jsonb,
  "error"            text,
  "created_at"       timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "plan_job_chunks_job_idx" ON "plan_job_chunks" ("job_id", "chunk_index");
CREATE UNIQUE INDEX IF NOT EXISTS "plan_job_chunks_unique" ON "plan_job_chunks" ("job_id", "chunk_index");

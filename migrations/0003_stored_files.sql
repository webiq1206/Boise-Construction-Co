-- Quote form attachments: photos, plans and drawings a visitor adds to a
-- request (/api/consultation/files). They are stored in the existing
-- stored_files table (shared/schema.ts), the same store the RE-10 and
-- compliance uploads use, under keys "leads/<inquiry key>/<uuid>-<name>".
--
-- Additive and safe to run more than once. db:prepare applies the same
-- statement (scripts/p5-schema-statements.mjs); this file keeps it reviewable.
-- Never run it by hand against production: publish through the Replit diff,
-- which should show only this CREATE when the table is missing, or nothing.

CREATE TABLE IF NOT EXISTS "stored_files" (
  "id"         varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"        text    NOT NULL,
  "file_name"  text    NOT NULL,
  "mime_type"  text    NOT NULL,
  "file_size"  integer NOT NULL,
  "data"       text    NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "stored_files_key_unique" UNIQUE ("key")
);

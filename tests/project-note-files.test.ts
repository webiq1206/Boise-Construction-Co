import assert from "node:assert/strict";
import test from "node:test";
import {
  isProjectFileUrl,
  joinProjectNote,
  projectFileNote,
  safeProjectLeaf,
  sniffProjectFile,
} from "../lib/projectNoteFiles";

const KEY = "consultation/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/plan-set.pdf";

test("sniffs a PDF and rejects a renamed text file", () => {
  assert.equal(sniffProjectFile(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))?.ext, "pdf");
  assert.equal(sniffProjectFile(new TextEncoder().encode("<svg></svg>")), null);
});

test("accepts only consultation file URLs this site stored", () => {
  assert.equal(isProjectFileUrl(`/api/documents/local/${encodeURIComponent(KEY)}`), true);
  assert.equal(isProjectFileUrl("/api/documents/local/re10%2Fsecret.pdf"), false);
  assert.equal(isProjectFileUrl("https://example.com/consultation/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/plan-set.pdf"), false);
  assert.equal(
    isProjectFileUrl("https://abc.public.blob.vercel-storage.com/consultation/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/plan-set.pdf"),
    true,
  );
});

test("file links survive a long visitor note", () => {
  const files = projectFileNote(
    [{ filename: "plan-set.pdf", url: `/api/documents/local/${encodeURIComponent(KEY)}` }],
    "https://boiseconstruction.co",
  );
  const joined = joinProjectNote("x".repeat(6000), files);
  assert.ok(joined?.includes("https://boiseconstruction.co/api/documents/local/"));
  assert.ok((joined?.length ?? 0) <= 5000);
});

test("file leaf drops paths and odd characters", () => {
  assert.equal(safeProjectLeaf("../../My Plan Set.PDF"), "my-plan-set");
});

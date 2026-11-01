import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTableColumns, getTableName } from "drizzle-orm";
import { consultationBodySchema, CALLBACK_MARKER } from "../server/services/consultationRequest";
import {
  DETAILS_MARKER,
  DETAILS_TOKEN_TTL_MS,
  applyConsultationDetails,
  detailsBodySchema,
  issueDetailsToken,
  mergeDetails,
  verifyDetailsToken,
  type DetailsDestinations,
  type DetailsRepository,
  type StoredLead,
} from "../server/services/consultationDetails";
import {
  leadFileId,
  leadFileUrl,
  safeLeadFileName,
  sniffLeadFile,
  validateLeadFile,
} from "../server/services/leadFiles";
import { buildP5IntakePayload } from "../server/services/p5IntakeBridge";
import { buildDetailsCrmPayload, buildDetailsEmailHtml, buildDetailsSubject } from "../server/services/consultationDetailsDelivery";
import { MAX_LEAD_FILE_BYTES, MAX_LEAD_FILES, checkLeadFile, type LeadFileLink } from "../shared/leadFiles";
import { storedFiles } from "../shared/schema";
import { estimatorSchemaStatements } from "../scripts/p5-schema-statements.mjs";

/**
 * The two-step quote form (/estimate, home and contact): the request, its
 * details token, the "Help us prepare" merge, attachments and the P5 intake
 * contract (external_id, submission_kind, request_kind, contact_preference,
 * best_time, files).
 */

const SECRET = "test-secret-for-details-tokens";
const KEY = "inq_abcdefghijklmnopqrstuvwx";
const NOW = 1_800_000_000_000;

const base = { formStartedAt: NOW - 10_000, website: "" };

test("step 1 payload: the request screen's shape is accepted as sent", () => {
  const parsed = consultationBodySchema.parse({
    ...base,
    name: "Avery Sample",
    phone: "(208) 555-0142",
    email: "",
    preferredContact: "text",
    message: "Custom home on land we own near Star.",
    requestKind: "quote",
    address: "",
    zip: "",
    propertyProfile: null,
    inquiryKey: KEY,
    submissionKind: "initial",
    estimate: null,
  });
  assert.equal(parsed.preferredContact, "text");
  assert.equal(parsed.projectType, "other", "project type moved to step 2; the server records Not sure");
  assert.equal(parsed.message, "Custom home on land we own near Star.");
  assert.equal(parsed.email, "");
});

test("step 1 payload: a callback needs only a name and a number and is marked", () => {
  const parsed = consultationBodySchema.parse({
    ...base,
    name: "Jordan Callback",
    phone: "208-555-0177",
    preferredContact: "text",
    requestKind: "callback",
    bestTimeToCall: "Afternoon",
  });
  assert.equal(parsed.preferredContact, "phone");
  assert.match(parsed.message ?? "", new RegExp(`^${CALLBACK_MARKER}: please call 208-555-0177\\. Best time: Afternoon\\.`));
  assert.equal(consultationBodySchema.safeParse({ ...base, name: "No Number", requestKind: "callback" }).success, false);
});

test("details token: issued, verified, bound to its request, expires", () => {
  const token = issueDetailsToken(KEY, SECRET, NOW);
  assert.equal(verifyDetailsToken(KEY, token, SECRET, NOW), "ok");
  assert.equal(verifyDetailsToken(KEY, token, SECRET, NOW + DETAILS_TOKEN_TTL_MS - 1), "ok");
  assert.equal(verifyDetailsToken(KEY, token, SECRET, NOW + DETAILS_TOKEN_TTL_MS + 1), "expired");
  assert.equal(verifyDetailsToken("inq_someoneelsesrequest0000", token, SECRET, NOW), "invalid");
  assert.equal(verifyDetailsToken(KEY, token, "another-secret", NOW), "invalid");
  assert.equal(verifyDetailsToken(KEY, "", SECRET, NOW), "invalid");
  assert.equal(verifyDetailsToken(KEY, token, "", NOW), "invalid");
  const [expiry, signature] = token.split(".");
  assert.equal(verifyDetailsToken(KEY, `${Number(expiry) + 1}.${signature}`, SECRET, NOW), "invalid", "expiry is signed");
  const flipped = signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");
  assert.equal(verifyDetailsToken(KEY, `${expiry}.${flipped}`, SECRET, NOW), "invalid");
  // A validly signed token that claims to outlive the TTL was not issued here.
  const forged = issueDetailsToken(KEY, SECRET, NOW + 5 * DETAILS_TOKEN_TTL_MS);
  assert.equal(verifyDetailsToken(KEY, forged, SECRET, NOW), "invalid");
  assert.throws(() => issueDetailsToken(KEY, "", NOW), /SESSION_SECRET/);
});

const lead = (overrides: Partial<StoredLead> = {}): StoredLead => ({
  inquiryKey: KEY,
  name: "Avery Sample",
  phone: "(208) 555-0142",
  email: "",
  zip: "",
  address: "",
  city: null,
  projectType: "other",
  message: "Custom home on land we own near Star.",
  propertyProfile: null,
  ...overrides,
});

const details = (overrides: Record<string, unknown> = {}) =>
  detailsBodySchema.parse({ inquiryKey: KEY, token: "t", ...overrides });

const file = (id: string, name: string, size = 120_000): LeadFileLink => ({
  id,
  name,
  url: `https://www.boiseconstruction.co/api/documents/local/leads/${KEY}/${id}-${name}`,
  contentType: name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
  size,
});

test("details merge fills only empty columns and never writes a blank", () => {
  const merge = mergeDetails(
    lead(),
    details({ projectType: "addition", address: "123 Main St, Star, ID 83669", timing: "1 to 3 months", email: "avery@example.com", bestTime: "  " }),
    [],
  );
  assert.deepEqual(merge.columns, {
    projectType: "addition",
    address: "123 Main St, Star, ID 83669",
    email: "avery@example.com",
  });
  assert.deepEqual(merge.lines, [
    "Project type: Home addition",
    "Build site: 123 Main St, Star, ID 83669",
    "Timing: 1 to 3 months",
    "Email: avery@example.com",
  ]);
  assert.ok(merge.block?.startsWith(`${DETAILS_MARKER}\n`));

  // Step 1 answers win: a different project type, address or email is noted, never overwritten.
  const kept = mergeDetails(
    lead({ projectType: "custom-home", address: "9 Old Rd", email: "first@example.com", zip: "83702" }),
    details({ projectType: "addition", address: "123 Main St", zip: "83669", email: "second@example.com" }),
    [],
  );
  assert.deepEqual(kept.columns, {});
  assert.ok(kept.lines.includes("Other email: second@example.com"));

  // Blank and whitespace fields add nothing at all.
  const empty = mergeDetails(lead(), details({ projectType: "", address: "   ", email: "" }), []);
  assert.deepEqual(empty.columns, {});
  assert.equal(empty.block, null);
});

test("details merge lists only files new to the notes", () => {
  const a = file("11111111-1111-4111-8111-111111111111", "kitchen.jpg");
  const b = file("22222222-2222-4222-8222-222222222222", "plans.pdf", 2_400_000);
  const first = mergeDetails(lead(), details(), [a]);
  assert.deepEqual(first.files, [a]);
  assert.match(first.block ?? "", /Files \(1\):\n- kitchen\.jpg \(117 KB\): https:\/\/www\.boiseconstruction\.co\/api\/documents\/local\/leads\//);
  const later = mergeDetails(lead({ message: `${lead().message}\n\n${first.block}` }), details(), [a, b]);
  assert.deepEqual(later.files, [b], "a file already in the notes is not announced twice");
});

/** In-memory twin of the conditional UPDATE in consultationDetailsDelivery. */
function memoryRepository(row: StoredLead): DetailsRepository & { row: StoredLead; applies: number } {
  const repo = {
    row,
    applies: 0,
    async load(key: string) {
      return key === repo.row.inquiryKey ? { ...repo.row } : null;
    },
    async apply(_key: string, columns: object, block: string) {
      if ((repo.row.message ?? "").includes(block)) return false;
      repo.applies += 1;
      repo.row = { ...repo.row, ...columns, message: repo.row.message?.trim() ? `${repo.row.message}\n\n${block}` : block };
      return true;
    },
  };
  return repo;
}

function recordingDestinations() {
  const sent: Array<{ channel: string; block: string | null; files: number }> = [];
  const destinations: DetailsDestinations = {
    async email(_l, merge) {
      sent.push({ channel: "email", block: merge.block, files: merge.files.length });
    },
    async crm(_l, merge) {
      sent.push({ channel: "crm", block: merge.block, files: merge.files.length });
    },
    async p5(_l, merge) {
      sent.push({ channel: "p5", block: merge.block, files: merge.files.length });
    },
  };
  return { sent, destinations };
}

test("applying details is idempotent: the same post twice saves and sends once", async () => {
  const repository = memoryRepository(lead());
  const { sent, destinations } = recordingDestinations();
  const input = details({ address: "123 Main St, Star, ID 83669", timing: "Soon" });
  const files = [file("11111111-1111-4111-8111-111111111111", "kitchen.jpg")];

  const first = await applyConsultationDetails(input, files, { repository, destinations });
  await first.background;
  assert.equal(first.outcome.status, "saved");
  assert.deepEqual(sent.map((s) => s.channel).sort(), ["crm", "email", "p5"]);
  assert.equal(repository.row.address, "123 Main St, Star, ID 83669");
  assert.match(repository.row.message ?? "", /^Custom home on land we own near Star\.\n\nDETAILS ADDED\nBuild site: /);

  const again = await applyConsultationDetails(input, files, { repository, destinations });
  await again.background;
  assert.equal(again.outcome.status, "unchanged");
  assert.equal(sent.length, 3, "a repeated post sends nothing");
  assert.equal(repository.applies, 1);

  const unknown = await applyConsultationDetails(details({ inquiryKey: "inq_notarequestweknowabout" }), [], { repository, destinations });
  assert.equal(unknown.outcome.status, "not-found");
});

test("a failing destination does not undo the save or stop the others", async () => {
  const repository = memoryRepository(lead());
  const calls: string[] = [];
  const result = await applyConsultationDetails(details({ timing: "Soon" }), [], {
    repository,
    destinations: {
      async email() {
        calls.push("email");
        throw new Error("Resend down");
      },
      async crm() {
        calls.push("crm");
      },
      async p5() {
        calls.push("p5");
        throw new Error("P5 down");
      },
    },
  });
  await result.background;
  assert.equal(result.outcome.status, "saved");
  if (result.outcome.status === "saved") {
    assert.deepEqual(result.outcome.delivery, [
      { channel: "adminEmail", delivered: false },
      { channel: "crm", delivered: true },
    ]);
  }
  assert.deepEqual(calls.sort(), ["crm", "email", "p5"]);
});

test("details schema refuses a bad email, an unknown timing and foreign file ids", () => {
  assert.equal(detailsBodySchema.safeParse({ inquiryKey: KEY, token: "t", email: "not-an-email" }).success, false);
  assert.equal(detailsBodySchema.safeParse({ inquiryKey: KEY, token: "t", timing: "Yesterday" }).success, false);
  assert.equal(detailsBodySchema.safeParse({ inquiryKey: KEY, token: "t", fileIds: ["../../etc/passwd"] }).success, false);
  assert.equal(
    detailsBodySchema.safeParse({ inquiryKey: KEY, token: "t", fileIds: Array.from({ length: MAX_LEAD_FILES + 1 }, () => "11111111-1111-4111-8111-111111111111") }).success,
    false,
  );
  assert.equal(detailsBodySchema.safeParse({ inquiryKey: "../../x", token: "t" }).success, false);
});

const bytes = (...parts: Array<string | number[]>) =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(Array(16).fill(0)));
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const PDF = bytes("%PDF-1.7");
const HEIC = bytes([0, 0, 0, 0x18], "ftypheic");
const EXE = bytes("MZ", [0x90, 0]);

test("file validation: the bytes must be a photo or PDF, within size and count", () => {
  assert.equal(sniffLeadFile(PNG), "png");
  assert.equal(sniffLeadFile(JPEG), "jpg");
  assert.equal(sniffLeadFile(PDF), "pdf");
  assert.equal(sniffLeadFile(HEIC), "heic");
  assert.equal(sniffLeadFile(EXE), null);

  assert.deepEqual(validateLeadFile({ name: "kitchen.jpg", type: "image/jpeg", size: 1000, head: JPEG }, 0), { ok: true, ext: "jpg", contentType: "image/jpeg" });
  // Phones often send HEIC with no type: the name and the bytes decide.
  assert.deepEqual(validateLeadFile({ name: "IMG_0042.HEIC", type: "", size: 1000, head: HEIC }, 0), { ok: true, ext: "heic", contentType: "image/heic" });
  assert.deepEqual(validateLeadFile({ name: "plans.pdf", type: "application/pdf", size: 1000, head: PDF }, 3), { ok: true, ext: "pdf", contentType: "application/pdf" });
  assert.deepEqual(validateLeadFile({ name: "photo.jpg", type: "image/jpeg", size: 1000, head: EXE }, 0), { ok: false, reason: "type" });
  assert.deepEqual(validateLeadFile({ name: "photo.jpg", type: "image/jpeg", size: 1000, head: PDF }, 0), { ok: false, reason: "type" }, "a PDF dressed as a photo is refused");
  assert.deepEqual(validateLeadFile({ name: "notes.txt", type: "text/plain", size: 1000, head: PDF }, 0), { ok: false, reason: "type" });
  assert.deepEqual(validateLeadFile({ name: "big.jpg", type: "image/jpeg", size: MAX_LEAD_FILE_BYTES + 1, head: JPEG }, 0), { ok: false, reason: "size" });
  assert.deepEqual(validateLeadFile({ name: "one-more.jpg", type: "image/jpeg", size: 1000, head: JPEG }, MAX_LEAD_FILES), { ok: false, reason: "count" });
  assert.deepEqual(validateLeadFile({ name: "empty.jpg", type: "image/jpeg", size: 0, head: JPEG }, 0), { ok: false, reason: "empty" });

  // The browser applies the same limits before anything is sent.
  assert.deepEqual(checkLeadFile({ name: "IMG_1.heic", type: "", size: 10 }), { ok: true, ext: "heic", contentType: "image/heic" });
  assert.deepEqual(checkLeadFile({ name: "setup.exe", type: "application/x-msdownload", size: 10 }), { ok: false, reason: "type" });
  assert.deepEqual(checkLeadFile({ name: "scan.pdf", type: "application/pdf", size: MAX_LEAD_FILE_BYTES + 1 }), { ok: false, reason: "size" });
});

test("stored file names and links are safe and unguessable", () => {
  assert.equal(safeLeadFileName("../../My Kitchen (1).JPG", "jpg"), "My-Kitchen-1.jpg");
  assert.equal(safeLeadFileName("", "pdf"), "file.pdf");
  const key = `leads/${KEY}/0f8fad5b-d9cb-469f-a165-70867728950e-My-Kitchen-1.jpg`;
  assert.equal(leadFileId(key), "0f8fad5b-d9cb-469f-a165-70867728950e");
  assert.equal(
    leadFileUrl(key, "https://www.boiseconstruction.co/"),
    `https://www.boiseconstruction.co/api/documents/local/leads/${KEY}/0f8fad5b-d9cb-469f-a165-70867728950e-My-Kitchen-1.jpg`,
  );
});

test("P5 intake: the initial request carries external_id, submission_kind, request_kind and contact_preference", () => {
  const quote = buildP5IntakePayload({
    name: "Avery Sample",
    phone: "(208) 555-0142",
    projectType: "other",
    message: "Custom home on land we own near Star.",
    inquiryKey: KEY,
    submissionKind: "initial",
    requestKind: "quote",
    preferredContact: "text",
  });
  assert.equal(quote.external_id, KEY);
  assert.equal(quote.submission_kind, "initial");
  assert.equal(quote.request_kind, "quote");
  assert.equal(quote.contact_preference, "text");
  assert.equal(quote.externalLeadId, `boiseconstruction-consultation:${KEY}`, "today's intake dedupes on this");
  assert.equal(quote.files, undefined);
  assert.equal(quote.best_time, undefined);

  const callback = buildP5IntakePayload({
    name: "Jordan Callback",
    phone: "208-555-0177",
    message: `${CALLBACK_MARKER}: please call 208-555-0177. Best time: Afternoon.`,
    inquiryKey: KEY,
    requestKind: "callback",
    preferredContact: "phone",
    bestTime: "Afternoon",
  });
  assert.equal(callback.request_kind, "callback");
  assert.equal(callback.contact_preference, "call");
  assert.equal(callback.best_time, "Afternoon");
  assert.match(String(callback.summary), /^CALLBACK REQUEST: please call/);
});

test("P5 intake: details merge into the same deal and carry the file links", () => {
  const files = [file("11111111-1111-4111-8111-111111111111", "kitchen.jpg"), file("22222222-2222-4222-8222-222222222222", "plans.pdf")];
  const body = buildP5IntakePayload({
    name: "Avery Sample",
    phone: "(208) 555-0142",
    address: "123 Main St, Star, ID 83669",
    zip: "83669",
    projectType: "addition",
    message: `${DETAILS_MARKER}\nTiming: 1 to 3 months`,
    inquiryKey: KEY,
    submissionKind: "details",
    timeline: "1 to 3 months",
    files,
  });
  assert.equal(body.submission_kind, "details");
  assert.equal(body.external_id, KEY);
  assert.equal(body.externalLeadId, `boiseconstruction-consultation:${KEY}`);
  assert.equal(body.timeline, "1 to 3 months");
  assert.equal(body.address, "123 Main St, Star, ID 83669");
  assert.deepEqual(body.files, files.map(({ name, url, contentType, size }) => ({ name, url, contentType, size })));
});

test("internal follow-up email and CRM update name the same lead and its file links", () => {
  const files = [file("11111111-1111-4111-8111-111111111111", "kitchen.jpg")];
  const merged = lead({ email: "avery@example.com" });
  const merge = mergeDetails(lead(), details({ timing: "Soon" }), files);
  assert.equal(buildDetailsSubject(merged), "Details added: Avery Sample");
  const html = buildDetailsEmailHtml(merged, merge);
  assert.match(html, /same lead, not a new one/);
  assert.match(html, /Timing<\/td><td[^>]*>Soon/);
  assert.ok(html.includes(files[0].url));
  const crm = buildDetailsCrmPayload({ ...merged, message: `${merged.message}\n\n${merge.block}` }, merge);
  assert.equal(crm.finalNotes, merge.block);
  assert.match(crm.estimateSummary, new RegExp(`^${DETAILS_MARKER} for request ${KEY}`));
});

test("stored_files is created additively by db:prepare with the Drizzle columns", () => {
  const statement = estimatorSchemaStatements.find((sql: string) => /CREATE TABLE IF NOT EXISTS stored_files\b/.test(sql));
  assert.ok(statement, "db:prepare creates stored_files where it is missing");
  assert.equal(getTableName(storedFiles), "stored_files");
  for (const column of Object.values(getTableColumns(storedFiles))) {
    assert.match(statement, new RegExp(`\\b${column.name}\\b`), `stored_files.${column.name}`);
  }
  assert.match(readFileSync(new URL("../migrations/0003_stored_files.sql", import.meta.url), "utf8"), /CREATE TABLE IF NOT EXISTS "stored_files"/);
});

test("routes check the token before touching the database, and files never ride on the request", () => {
  const details = readFileSync(new URL("../app/api/consultation/details/route.ts", import.meta.url), "utf8");
  assert.ok(details.indexOf("verifyDetailsToken(") > 0);
  assert.ok(details.indexOf("verifyDetailsToken(") < details.indexOf("createDrizzleDetailsRepository()"));
  assert.match(details, /rateLimit\(/);
  const files = readFileSync(new URL("../app/api/consultation/files/route.ts", import.meta.url), "utf8");
  assert.ok(files.indexOf("verifyDetailsToken(") < files.indexOf("createDrizzleLeadFileStore()"));
  assert.ok(files.indexOf("MAX_LEAD_FILE_BYTES + BODY_OVERHEAD_BYTES") < files.indexOf("request.formData()"), "size is refused before the body is read");
  assert.match(files, /rateLimit\(/);
  assert.match(files, /website/);
  const consult = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(consult, /detailsToken: detailsTokenFor\(intakeResult\.inquiryKey\)/);
  assert.match(consult, /readBoundedJson\(request\)/, "the request itself stays bounded JSON");
});

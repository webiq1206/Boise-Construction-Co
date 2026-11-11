import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CALLBACK_MARKER,
  UNSPECIFIED_PROJECT_TYPE,
  composeConsultationMessage,
  consultationBodySchema,
} from "../server/services/consultationRequest.ts";
import { buildAdminEmailHtml, buildAdminSubject } from "../server/services/consultationEmail.ts";
import { buildLeadNotes } from "../server/services/leadRecord.ts";

const startedAt = Date.now() - 10_000;

/** The one-screen quote form, exactly as components/QuoteRequestWizard.tsx posts it. */
const fullRequest = {
  name: "Ada Example",
  preferredContact: "phone",
  phone: "(208) 555-0102",
  email: "",
  address: "",
  projectType: "",
  message: "Custom home on a lot we own in Star.",
  requestKind: "quote",
  inquiryKey: "inq_abcdefghijklmnopqrstu",
  submissionKind: "initial",
  formStartedAt: startedAt,
  website: "",
  zip: "",
  propertyProfile: null,
  estimate: null,
};

/** "Have us call you": name and phone, optional best time, nothing else. */
const callbackRequest = {
  name: "Ada Example",
  phone: "2085550102",
  requestKind: "callback",
  bestTimeToCall: "Afternoon",
  formStartedAt: startedAt,
  website: "",
};

test("the one-screen quote request is accepted without a project type, email or address", () => {
  const parsed = consultationBodySchema.safeParse(fullRequest);
  assert.equal(parsed.success, true, JSON.stringify(!parsed.success && parsed.error.flatten()));
  if (!parsed.success) return;
  assert.equal(parsed.data.projectType, UNSPECIFIED_PROJECT_TYPE);
  assert.equal(parsed.data.preferredContact, "phone");
  assert.equal(parsed.data.requestKind, "quote");
  assert.equal(parsed.data.message, fullRequest.message, "a normal request keeps the visitor's words unchanged");
});

test("a chosen project type still reaches the pipeline unchanged", () => {
  const parsed = consultationBodySchema.parse({ ...fullRequest, projectType: "custom-home" });
  assert.equal(parsed.projectType, "custom-home");
});

test("the callback shape (name and phone only) is accepted and marked as a callback", () => {
  const parsed = consultationBodySchema.safeParse(callbackRequest);
  assert.equal(parsed.success, true, JSON.stringify(!parsed.success && parsed.error.flatten()));
  if (!parsed.success) return;
  assert.equal(parsed.data.preferredContact, "phone", "a callback is always a call");
  assert.equal(parsed.data.projectType, UNSPECIFIED_PROJECT_TYPE);
  assert.equal(parsed.data.email, "");
  assert.ok(parsed.data.message?.startsWith(`${CALLBACK_MARKER}: please call 2085550102. Best time: Afternoon.`));
});

test("a callback keeps any words the visitor typed after the marker", () => {
  const message = composeConsultationMessage({
    requestKind: "callback",
    phone: "2085550102",
    message: "About a shop home.",
  });
  assert.equal(message, `${CALLBACK_MARKER}: please call 2085550102.\n\nAbout a shop home.`);
});

test("a callback without a usable phone number is rejected", () => {
  for (const phone of ["", "555-01"]) {
    const parsed = consultationBodySchema.safeParse({ ...callbackRequest, phone });
    assert.equal(parsed.success, false);
    if (parsed.success) continue;
    assert.deepEqual(parsed.error.flatten().fieldErrors.phone, ["Valid phone required"]);
  }
});

test("a callback cannot be turned into an email-only request", () => {
  const parsed = consultationBodySchema.safeParse({
    ...callbackRequest,
    phone: "",
    preferredContact: "email",
    email: "ada@example.com",
  });
  assert.equal(parsed.success, false, "callback requires a phone number even when email is present");
});

test("existing contact rules are unchanged for full requests", () => {
  assert.equal(consultationBodySchema.safeParse({ ...fullRequest, phone: "" }).success, false);
  assert.equal(consultationBodySchema.safeParse({ ...fullRequest, preferredContact: "text", phone: "123" }).success, false);
  assert.equal(
    consultationBodySchema.safeParse({ ...fullRequest, preferredContact: "email", phone: "", email: "ada@example.com" }).success,
    true,
  );
  assert.equal(
    consultationBodySchema.safeParse({ ...fullRequest, preferredContact: "email", email: "not-an-email" }).success,
    false,
  );
  // Older cached bundles send no preferredContact; email is still required for them.
  const { preferredContact: _omit, ...legacy } = fullRequest;
  assert.equal(consultationBodySchema.safeParse({ ...legacy, email: "" }).success, false);
  assert.equal(consultationBodySchema.safeParse({ ...legacy, email: "ada@example.com", projectType: "custom-home" }).success, true);
  // name and formStartedAt remain required.
  assert.equal(consultationBodySchema.safeParse({ ...fullRequest, name: "A" }).success, false);
  const { formStartedAt: _started, ...noStart } = fullRequest;
  assert.equal(consultationBodySchema.safeParse(noStart).success, false);
});

test("the team sees the callback in the email subject, the email body and the CRM notes", () => {
  const parsed = consultationBodySchema.parse(callbackRequest);
  const lead = {
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    address: parsed.address,
    projectType: parsed.projectType,
    message: parsed.message,
    preferredContact: parsed.preferredContact,
    requestKind: parsed.requestKind,
  };
  assert.equal(buildAdminSubject(lead, null), "Callback request: Ada Example · 2085550102");
  const html = buildAdminEmailHtml(lead, null);
  assert.match(html, /Callback Request/);
  assert.match(html, /asked us to call 2085550102/);
  assert.match(html, new RegExp(CALLBACK_MARKER));
  const notes = buildLeadNotes(lead, null);
  assert.match(notes, /Request: CALLBACK REQUEST/);
});

test("an optional step 1 project address reaches the team; a blank one stays blank", () => {
  const blank = consultationBodySchema.parse(fullRequest);
  assert.equal(blank.address, "", "no address sends the same blank the form has always sent");
  const parsed = consultationBodySchema.parse({ ...fullRequest, address: "123 Example Lane, Star, ID 83669", zip: "83669" });
  assert.equal(parsed.address, "123 Example Lane, Star, ID 83669");
  const lead = { ...parsed, address: parsed.address };
  assert.match(buildAdminEmailHtml(lead, null), /123 Example Lane, Star, ID 83669/);
  assert.match(buildLeadNotes(lead, null), /123 Example Lane, Star, ID 83669/);
});

test("a full request names the preferred contact method for the team", () => {
  const parsed = consultationBodySchema.parse({ ...fullRequest, preferredContact: "text" });
  const lead = { ...parsed, address: parsed.address };
  assert.equal(buildAdminSubject(lead, null), "New consultation request: Ada Example");
  assert.match(buildAdminEmailHtml(lead, null), /Preferred contact<\/td><td[^>]*>Text</);
  assert.match(buildLeadNotes(lead, null), /Preferred contact: Text/);
});

test("the route validates with the shared schema and stores the composed notes everywhere", () => {
  const source = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(source, /const bodySchema = consultationBodySchema;/);
  assert.match(source, /bodySchema\.safeParse\(raw\)/);
  // One parsed message feeds the database row, the CRM forward, the email and the p5 bridge.
  assert.match(source, /message: data\.message \|\| null,/);
  assert.match(source, /finalNotes: data\.message \|\| undefined,/);
  assert.match(source, /requestKind: data\.requestKind/);
  assert.doesNotMatch(source, /\/api\/callback/);
});

/**
 * Lead confirmation wording and the Schedule now button. No mail is sent.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildCustomerEmailHtml, buildCustomerEmailText, buildCustomerSubject } from "../server/services/consultationEmail.ts";
import { buildAdminEmailHtml } from "../server/services/consultationEmail.ts";
import { buildRe10CustomerEmail } from "../server/services/re10Email.ts";
import { estimateEmail } from "../lib/p5/estimateEmail.ts";
import { renderIntakeEmail } from "../lib/p5/intakeEmail.ts";
import { emptyIntakeDetails, type IntakeSnapshot } from "../lib/p5/intakeContract.ts";
import { routeIntake } from "../lib/p5/intakePolicy.ts";
import {
  SCHEDULE_URL,
  estimatorConfirmation,
  requestConfirmation,
  scheduleIntentFor,
} from "../server/services/scheduleEmail.ts";
import type { LeadContact, VerifiedEstimate } from "../server/services/consultationEmail.ts";
import { EMPTY_REFINEMENTS } from "../shared/estimateEngine.ts";

const BANNED = new RegExp(`${String.fromCharCode(0x2014)}|Perkins 5|showroom|\\bshop\\b`, "i");

function visible(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const lead = (overrides: Partial<LeadContact> = {}): LeadContact => ({
  name: "Ada Example",
  phone: "2085550102",
  email: "ada@example.com",
  address: "1 Main St",
  projectType: "custom-home",
  message: "A custom home on our lot.",
  requestKind: "quote",
  ...overrides,
});

test("the estimator confirmation uses the approved copy and a primary schedule button", () => {
  const message = estimatorConfirmation({
    firstName: "Ada",
    brandName: "Boise Construction Co",
    project: "Custom Home",
    viewUrl: "https://boiseconstruction.co/estimate/e/token",
    accent: "#C48D3F",
  });
  assert.equal(message.subject, "Your custom home estimate from Boise Construction Co");
  assert.match(message.text, /^Hi Ada,/);
  assert.match(message.text, /Thanks for thinking of Boise Construction Co for your custom home\. Your estimate is saved, and you can pull it up any time\./);
  assert.match(message.text, /The next step is a home walkthrough, so we can see the property and turn this estimate into a true bid\. On the scheduling page, choose the 1 hour option\./);
  assert.match(message.text, /We work hard to make that estimate as realistic as we can, but we can't give you a true bid until we walk the property\./);
  assert.match(message.text, /Either way, we'll work with you to get you what you want, within your budget\./);
  assert.match(message.text, /call \(208\) 477-1169/);
  assert.match(message.text, /The Boise Construction Co team/);
  assert.ok(message.text.includes(`Schedule now: ${SCHEDULE_URL}`));
  assert.ok(message.text.includes("View your estimate: https://boiseconstruction.co/estimate/e/token"));
  assert.doesNotMatch(`${message.subject}\n${message.text}\n${visible(message.html)}`, BANNED);
  assert.doesNotMatch(visible(message.html), /\$\s?\d|\bcost\b|\bmargin\b/);
  assert.match(message.html, /background-color:#383837/);
  assert.match(message.html, /color:#ffffff/);
  assert.match(message.html, /v:roundrect/);
  assert.match(message.html, /width="100%"/);
  assert.ok(message.html.indexOf(">Schedule now<") < message.html.indexOf(">View your estimate<"));
  assert.match(message.html, /#C48D3F/);
});

test("a short request names the 1 hour walkthrough, and a callback names the 15 minute consult", () => {
  const project = requestConfirmation({ firstName: "Ada", brandName: "Boise Construction Co", intent: "walkthrough", accent: "#C48D3F" });
  const callback = requestConfirmation({ firstName: "Ada", brandName: "Boise Construction Co", intent: "consult", accent: "#C48D3F" });
  assert.equal(project.subject, "We have your request, Ada");
  assert.match(project.text, /someone from the team will follow up shortly/);
  assert.match(project.text, /choose the 1 hour option for a home walkthrough/);
  assert.match(project.text, /any estimate we share/);
  assert.match(project.text, /that first estimate/);
  assert.doesNotMatch(project.text, /View your estimate/);
  assert.match(callback.text, /choose the 15 minute option for a phone consult/);
  assert.equal(scheduleIntentFor({ requestKind: "callback" }), "consult");
  assert.equal(scheduleIntentFor({ requestKind: "quote" }), "walkthrough");
  assert.equal(scheduleIntentFor({ form: "Site Chat" }), "consult");
  for (const message of [project, callback]) {
    assert.doesNotMatch(`${message.subject}\n${message.text}\n${visible(message.html)}`, BANNED);
    assert.ok(message.text.includes(SCHEDULE_URL));
    assert.match(message.html, /role="presentation"/);
    assert.match(message.html, /background-color:#383837/);
  }
});

test("consultation emails keep the range, and the button follows the request", () => {
  const quote = buildCustomerEmailHtml(lead(), null);
  const callback = buildCustomerEmailHtml(lead({ requestKind: "callback", message: "CALLBACK REQUEST: please call 2085550102." }), null);
  assert.equal(buildCustomerSubject(lead(), null), "We have your request, Ada");
  assert.match(quote, /1 hour option for a home walkthrough/);
  assert.match(callback, /15 minute option for a phone consult/);
  assert.doesNotMatch(callback, /1 hour option/);
  assert.match(buildCustomerEmailText(lead(), null), new RegExp(SCHEDULE_URL.replace(/[.]/g, "\\.")));
  for (const html of [quote, callback]) {
    assert.match(html, /background-color:#383837/);
    assert.match(html, /color:#ffffff/);
    assert.doesNotMatch(visible(html), BANNED);
  }

  const estimate = {
    project: "custom-home",
    finish: "mid-range",
    sqft: 2000,
    priceLow: 400000,
    priceHigh: 500000,
    roi: 0,
    confidence: "early",
    refinements: EMPTY_REFINEMENTS,
    included: ["Foundation"],
  } as VerifiedEstimate;
  const withRange = buildCustomerEmailHtml(lead(), estimate);
  const withRangeText = buildCustomerEmailText(lead(), estimate);
  assert.equal(buildCustomerSubject(lead(), estimate), "Your custom home estimate from Boise Construction Co");
  assert.match(withRange, /Schedule now/);
  assert.match(withRange, /1 hour option/);
  assert.match(withRangeText, /Schedule now: https:\/\/meetings-na2\.hubspot\.com\/client3/);
  assert.match(visible(withRange), /Foundation/);
  const callbackRange = buildCustomerEmailHtml(lead({ requestKind: "callback" }), estimate);
  assert.match(callbackRange, /15 minute option for a phone consult/);
  assert.doesNotMatch(visible(callbackRange), /1 hour option/);

  const admin = buildAdminEmailHtml(lead(), null, null);
  assert.doesNotMatch(admin, /Schedule now/);
  assert.doesNotMatch(admin, /meetings-na2\.hubspot\.com/);
});

test("the RE-10 customer email keeps its firm-price terms and adds the walkthrough button", () => {
  const html = buildRe10CustomerEmail(
    {
      name: "Ada Example",
      email: "ada@example.com",
      phone: "2085550102",
      preferredContact: "email",
      role: "owner",
      propertyAddress: "1 Main St, Boise, ID",
    },
    {
      price: 2400,
      validDays: 30,
      categories: [{ trade: "drywall", itemCount: 1, items: [{ description: "Patch a hole", quantityAssumed: false }] }],
      needsOnsite: [],
      uncertainty: [],
      assumptions: ["Paint is included"],
    },
  );
  const text = visible(html);
  assert.match(html, /Schedule now/);
  assert.match(html, /background-color:#383837/);
  assert.match(html, /1 hour option/);
  assert.match(text, /firm for the repairs listed/i);
  assert.match(text, /can't give you a true bid until we walk the property/);
  assert.doesNotMatch(text, BANNED);
});

test("a missing first name still reads as a sentence", () => {
  const message = requestConfirmation({ firstName: "  ", brandName: "Boise Construction Co", intent: "walkthrough" });
  assert.match(message.text, /^Hi there,/);
  assert.equal(message.subject, "We have your request, there");
});

test("shared estimator and intake customer mail carry the button, and team mail does not", () => {
  const customer = estimateEmail("synthetic", { customer: { summary: "Paint a room", lineItems: [], assumptions: [], exclusions: [] }, contact: { name: "Ada Example" } }, false);
  const admin = estimateEmail("synthetic", { customer: { summary: "Paint a room" }, internal: {}, contact: { name: "Ada Example" } }, true);
  assert.match(customer.html, /Schedule now/);
  assert.match(customer.text, new RegExp(SCHEDULE_URL.replace(/[.]/g, "\\.")));
  assert.match(customer.html, /background-color:#383837/);
  assert.doesNotMatch(admin.html, /Schedule now/);
  assert.doesNotMatch(admin.text, /meetings-na2\.hubspot\.com/);

  const snapshot = {
    schema: 1,
    projectId: "construction:12345678-1234-4234-8234-123456789abc",
    draftId: "12345678-1234-4234-8234-123456789abc",
    originSite: "construction",
    currentSite: "construction",
    revision: 1,
    contextVersion: 0,
    savedAt: "2099-01-02T12:00:00Z",
    contact: { name: "Ada Example", email: "ada@example.com", phone: "2085550100", preferredContact: "email" },
    details: emptyIntakeDetails(),
    scope: { text: "A custom home on our lot.", answers: { service: "new-construction" }, extraction: null, uploads: [] },
    routing: routeIntake("construction", "new-construction"),
    unresolved: [],
  } as IntakeSnapshot;
  const toCustomer = renderIntakeEmail(snapshot, false, []);
  const toTeam = renderIntakeEmail(snapshot, true, []);
  assert.match(toCustomer.html, /Schedule now/);
  assert.match(toCustomer.html, /home walkthrough/);
  assert.match(toCustomer.html, /choose the 1 hour option/);
  assert.match(toCustomer.text, /meetings-na2\.hubspot\.com\/client3/);
  assert.doesNotMatch(visible(toCustomer.html), BANNED);
  assert.doesNotMatch(toTeam.html, /Schedule now/);
  assert.doesNotMatch(toTeam.text, /meetings-na2\.hubspot\.com/);
});

test("a later email address sends one confirmation, and forms still require a real address when one is collected", () => {
  const details = readFileSync("server/services/consultationDetailsDelivery.ts", "utf8");
  assert.match(details, /line\.startsWith\("Email: "\)/);
  assert.match(details, /consultation-customer-/);
  assert.match(details, /CALLBACK_MARKER/);
  const route = readFileSync("app/api/consultation/route.ts", "utf8");
  assert.match(route, /buildCustomerEmailText/);
  assert.match(route, /data\.email \?/);
  const forms = readFileSync("components/QuoteRequestWizard.tsx", "utf8");
  assert.doesNotMatch(forms, /Schedule now/);
  assert.match(forms, /phoneDigits\(data\.phone\) < 10/);
});

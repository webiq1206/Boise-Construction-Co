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
  ESTIMATE_ADJUST_NOTE,
  ESTIMATE_DISCLAIMER,
  ESTIMATE_FAMILY_PS,
  SCHEDULE_URL,
  estimateLeadCard,
  estimatePostscript,
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

/** The owner's wording for estimate emails (16 November 2026), spelled out so a change to the constants is a decision. */
const ADJUST =
  "If something is missing, or you'd like to change the scope, the finishes or the timing, tell us. It's easy to adjust, and we'd rather get it right than have you guessing.";
const FAMILY_PS =
  "P.S. Anything else on your list? Boise Construction Co is part of P5 Home Co, the company behind Boise Remodeling Co, Boise Cabinet Co and Boise Handyman Co. So whether it's a few repairs, new cabinets, a full kitchen or bath remodel, an addition or a new home, tell us and we'll plan it alongside this project.";

/** The P.S. appears once, and nothing follows it inside the message: its paragraph closes, then its container does. */
function assertPostscriptClosesHtml(html: string, label: string): void {
  assert.equal(html.split(FAMILY_PS).length - 1, 1, `${label}: the P.S. appears once`);
  assert.match(html.slice(html.indexOf(FAMILY_PS) + FAMILY_PS.length), /^<\/p>\s*<\/(?:div|td)>/, `${label}: the P.S. is the last paragraph`);
}

/** The invitation to adjust comes before the estimate disclaimer, once the walkthrough sentence has been read. */
function assertAdjustBeforeDisclaimer(body: string, label: string): void {
  const adjust = body.indexOf(ADJUST);
  assert.ok(adjust > -1, `${label}: the adjust paragraph is present`);
  assert.ok(adjust > body.indexOf("turn this estimate into a true bid"), `${label}: the adjust paragraph follows the walkthrough sentence`);
  assert.ok(adjust < body.indexOf(ESTIMATE_DISCLAIMER), `${label}: the adjust paragraph comes before the disclaimer`);
}

function assertNoEstimateWording(body: string, label: string): void {
  assert.ok(!body.includes("P.S."), `${label}: no P.S.`);
  assert.ok(!body.includes("Anything else on your list"), `${label}: no family question`);
  assert.ok(!body.includes("It's easy to adjust"), `${label}: no adjust paragraph`);
  assert.doesNotMatch(body, /\bHey\b/, `${label}: the greeting is unchanged`);
}

test("the estimate wording is the approved text, kept in one place", () => {
  assert.equal(ESTIMATE_ADJUST_NOTE, ADJUST);
  assert.equal(ESTIMATE_FAMILY_PS, FAMILY_PS);
  assert.equal(estimatePostscript().text, FAMILY_PS);
  assert.doesNotMatch(`${ADJUST} ${FAMILY_PS}`, BANNED);
  assert.doesNotMatch(`${ADJUST} ${FAMILY_PS}`, /\bquote\b|\bbid\b|near me|\bminutes?\b|\bhours?\b/i);
  for (const file of ["lib/p5/estimateEmail.ts", "server/services/consultationEmail.ts", "server/services/re10Email.ts", "server/services/re10Lead.ts", "server/services/scheduleEmail.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.ok(!source.includes("Anything else on your list"), `${file} reuses the P.S. from lib/p5/leadSchedule.ts`);
    assert.ok(!source.includes("It's easy to adjust"), `${file} reuses the adjust paragraph from lib/p5/leadSchedule.ts`);
  }
  // A text color that is not a plain hex value never reaches the markup.
  assert.match(estimatePostscript({ color: "#F7F5F3" }).html, /color:#F7F5F3;/);
  assert.match(estimatePostscript({ color: 'red"><script>' }).html, /color:#383837;/);
});

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
  assert.match(message.text, /^Hey Ada,\n/);
  assert.match(visible(message.html), /^\s*Hey Ada,/);
  assert.doesNotMatch(`${message.text}\n${visible(message.html)}`, /\bHi Ada\b/);
  assertAdjustBeforeDisclaimer(message.text, "estimator confirmation text");
  assertAdjustBeforeDisclaimer(message.html, "estimator confirmation html");
  assert.ok(message.text.endsWith(`\n\nThe Boise Construction Co team\n\n${FAMILY_PS}`), "the P.S. is the last paragraph of the text, after the sign-off");
  assertPostscriptClosesHtml(message.html, "estimator confirmation");
  assert.ok(message.html.indexOf("The Boise Construction Co team") < message.html.indexOf(FAMILY_PS));
  assert.equal(message.html.split(">Schedule now<").length - 1, 2, "one Schedule now button (Outlook and standard markup)");
  assert.equal(message.text.split(SCHEDULE_URL).length - 1, 1, "the schedule link is written once");
  assert.match(message.html, /href="https:\/\/meetings-na2\.hubspot\.com\/client3"/);
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
    assert.match(message.text, /^Hi Ada,\n/);
    assertNoEstimateWording(`${message.text}\n${message.html}`, "request confirmation");
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
    assert.match(visible(html), /Hi Ada,/);
    assertNoEstimateWording(html, "request confirmation in the brand shell");
  }
  assertNoEstimateWording(buildCustomerEmailText(lead(), null), "request confirmation text");
  assertNoEstimateWording(buildCustomerEmailText(lead({ requestKind: "callback" }), null), "callback confirmation text");

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

  // An estimate email: "Hey", the invitation to adjust, one schedule link, and the family P.S. last.
  assert.match(visible(withRange), /Hey Ada,/);
  assert.match(withRangeText, /^Hey Ada,\n/);
  assert.doesNotMatch(`${withRangeText}\n${visible(withRange)}`, /\bHi Ada\b/);
  assertAdjustBeforeDisclaimer(withRange, "estimate email html");
  assertAdjustBeforeDisclaimer(withRangeText, "estimate email text");
  assertPostscriptClosesHtml(withRange, "estimate email");
  assert.ok(withRange.indexOf("The Boise Construction Co team") < withRange.indexOf(FAMILY_PS), "the P.S. follows the sign-off");
  assert.match(withRange, new RegExp(`<p style="[^"]*color:#F7F5F3;[^"]*">${FAMILY_PS.replace(/[.?]/g, "\\$&")}</p>`), "the P.S. is readable on the dark shell");
  assert.ok(withRangeText.endsWith(`\n\nThe Boise Construction Co team\n\n${FAMILY_PS}`), "the P.S. is the last paragraph of the text, after the sign-off");
  assert.equal(withRange.split(">Schedule now<").length - 1, 2, "one Schedule now button (Outlook and standard markup)");
  assert.equal(withRangeText.split(SCHEDULE_URL).length - 1, 1, "the schedule link is written once");

  // A phone consult request that carries a saved range opens as a request confirmation and keeps that wording.
  const callbackRange = buildCustomerEmailHtml(lead({ requestKind: "callback" }), estimate);
  const callbackRangeText = buildCustomerEmailText(lead({ requestKind: "callback" }), estimate);
  assert.match(callbackRange, /15 minute option for a phone consult/);
  assert.doesNotMatch(visible(callbackRange), /1 hour option/);
  assert.match(visible(callbackRange), /Hi Ada, Thanks for reaching out to Boise Construction Co\. We have your request/);
  assert.match(callbackRangeText, /^Hi Ada,\n/);
  assertNoEstimateWording(`${callbackRange}\n${callbackRangeText}`, "callback with a saved range");
  assert.equal(estimateLeadCard({ firstName: "Ada", brandName: "Boise Construction Co", project: "Custom Home", intent: "consult" }).aboutEstimate, false);
  assert.equal(estimateLeadCard({ firstName: "Ada", brandName: "Boise Construction Co", project: "Custom Home", intent: "walkthrough" }).aboutEstimate, true);

  const admin = buildAdminEmailHtml(lead(), null, null);
  const adminWithRange = buildAdminEmailHtml(lead(), estimate, null);
  for (const html of [admin, adminWithRange]) {
    assert.doesNotMatch(html, /Schedule now/);
    assert.doesNotMatch(html, /meetings-na2\.hubspot\.com/);
    assertNoEstimateWording(html, "team email");
  }
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

  // It tells the customer about an estimate, so it carries the estimate wording.
  // Its opening line is its own ("Thanks, Ada. Here is the price"), not a greeting to change.
  assert.match(text, /Thanks, Ada\. Here is the price for the repairs on the RE-10 you sent\./);
  assert.doesNotMatch(text, /\bHey\b/);
  assertAdjustBeforeDisclaimer(html, "RE-10 customer email");
  assertPostscriptClosesHtml(html, "RE-10 customer email");
  assert.ok(html.indexOf("The Boise Construction Co team") < html.indexOf(FAMILY_PS), "the P.S. follows the sign-off");
  assert.match(html, /href="https:\/\/meetings-na2\.hubspot\.com\/client3"/);
  assert.equal(html.split(">Schedule now<").length - 1, 2, "one Schedule now button (Outlook and standard markup)");
});

test("a missing first name still reads as a sentence", () => {
  const message = requestConfirmation({ firstName: "  ", brandName: "Boise Construction Co", intent: "walkthrough" });
  assert.match(message.text, /^Hi there,/);
  assert.equal(message.subject, "We have your request, there");
  const estimate = estimatorConfirmation({ firstName: "  ", brandName: "Boise Construction Co", project: "Addition" });
  assert.match(estimate.text, /^Hey there,\n/);
  assert.ok(estimate.text.includes(`Schedule now: ${SCHEDULE_URL}`));
  assert.ok(estimate.text.endsWith(FAMILY_PS));
});

test("shared estimator and intake customer mail carry the button, and team mail does not", () => {
  const customer = estimateEmail("synthetic", { customer: { summary: "Paint a room", lineItems: [], assumptions: [], exclusions: [] }, contact: { name: "Ada Example" } }, false);
  const admin = estimateEmail("synthetic", { customer: { summary: "Paint a room" }, internal: {}, contact: { name: "Ada Example" } }, true);
  assert.match(customer.html, /Schedule now/);
  assert.match(customer.text, new RegExp(SCHEDULE_URL.replace(/[.]/g, "\\.")));
  assert.match(customer.html, /background-color:#383837/);
  assert.doesNotMatch(admin.html, /Schedule now/);
  assert.doesNotMatch(admin.text, /meetings-na2\.hubspot\.com/);

  // The estimate email: "Hey", the invitation to adjust, one schedule link, and the family P.S. last.
  assert.match(visible(customer.html), /Hey Ada,/);
  assert.doesNotMatch(visible(customer.html), /\bHi Ada\b/);
  assertAdjustBeforeDisclaimer(customer.html, "document estimate html");
  assertAdjustBeforeDisclaimer(customer.text, "document estimate text");
  assertPostscriptClosesHtml(customer.html, "document estimate");
  assert.ok(customer.text.endsWith(`\n\n${FAMILY_PS}`), "the P.S. is the last paragraph of the text");
  assert.equal(customer.text.split(FAMILY_PS).length - 1, 1);
  assert.equal(customer.html.split(">Schedule now<").length - 1, 2, "one Schedule now button (Outlook and standard markup)");
  assert.equal(customer.text.split(SCHEDULE_URL).length - 1, 1, "the schedule link is written once");
  assert.doesNotMatch(`${customer.text}\n${visible(customer.html)}`, BANNED);
  // With no name on file the greeting stays "Hello,".
  const unnamed = estimateEmail("synthetic", { customer: { summary: "Paint a room", lineItems: [], assumptions: [], exclusions: [] }, contact: { name: "" } }, false);
  assert.match(visible(unnamed.html), /Hello,/);
  assert.doesNotMatch(visible(unnamed.html), /\bHey\b/);
  assertPostscriptClosesHtml(unnamed.html, "document estimate without a name");
  assertNoEstimateWording(`${admin.html}\n${admin.text}`, "internal estimate record");

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
  assert.match(toCustomer.html, /1 hour option for a home walkthrough/);
  assert.match(toCustomer.text, /meetings-na2\.hubspot\.com\/client3/);
  assert.doesNotMatch(visible(toCustomer.html), BANNED);
  assert.doesNotMatch(toTeam.html, /Schedule now/);
  assert.doesNotMatch(toTeam.text, /meetings-na2\.hubspot\.com/);
  // A project request is not an estimate: neither copy carries the estimate wording.
  assertNoEstimateWording(`${toCustomer.html}\n${toCustomer.text}`, "project request confirmation");
  assertNoEstimateWording(`${toTeam.html}\n${toTeam.text}`, "project request team email");
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

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ContactPage from "../app/contact/page.tsx";
import { CONTACT_FAQS } from "../shared/contactFaqs.ts";
import HomePage from "../app/page.tsx";
import { ConsultationForm, ConsultationSuccessReachOut } from "../components/ConsultationForm.tsx";
import { AbandonmentPromptMessage } from "../components/estimate/recovery/AbandonmentPrompt.tsx";
import { CopyWithTextReply } from "../components/PreferToTextLine.tsx";
import { Re10Faqs } from "../components/re10/Re10Faqs.tsx";
import { generateFAQSchema } from "../lib/schema.ts";
import {
  buildCustomerEmailHtml,
  customerConsultationGreetingHtml,
  customerEstimateFollowUpHtml,
} from "../server/services/consultationEmail.ts";
import { RE10_FAQS } from "../shared/content/re10Content.ts";
import { GBP_MESSAGING, GBP_QA_SEED } from "../shared/gbpProfile.ts";
import { SITE_CONFIG } from "../shared/siteConfig.ts";
import { CONSULT_BULLETS } from "../shared/siteContent.ts";
import {
  insertPreferToTextAfterBusinessDay,
  PREFER_TO_TEXT_LINE,
  TEXT_REPLY_HOURS,
  TEXT_REPLY_SMS_HREF,
} from "../shared/textReply.ts";

// tsx compiles these components with the classic JSX runtime. The identifier
// is resolved when the component runs, so the test host provides it.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const SMS_LINK = `<a href="${TEXT_REPLY_SMS_HREF}" class="underline underline-offset-2">(208) 477-1169</a>`;

function visible(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function assertLineFollows(html: string, original: string) {
  const text = visible(html);
  const expected = insertPreferToTextAfterBusinessDay(original.replace(/\s+/g, " ").trim());
  assert.ok(
    text.includes(expected),
    `expected the text-reply line immediately after:\n${original}\n\nrendered text was missing:\n${expected}`,
  );
  assert.equal(PREFER_TO_TEXT_LINE, `Prefer to text? Text (208) 477-1169. We reply in minutes during business hours (${TEXT_REPLY_HOURS}).`);
  assert.equal(TEXT_REPLY_HOURS, "Mon–Fri 9–6, Sat 9–4 MT");
}

function assertSmsLink(html: string) {
  assert.ok(html.includes(SMS_LINK), "phone in the new line is not an sms:+12084771169 link");
}

function render(node: React.ReactNode): string {
  const client = new QueryClient();
  return renderToStaticMarkup(
    React.createElement(QueryClientProvider, { client }, node),
  );
}

const LEAD = {
  name: "Ada Owner",
  phone: "2085550100",
  email: "ada@example.com",
  address: "1 Main St, Boise, ID",
  projectType: "custom-home",
};

test("the text-reply sentence and sms link are exact", () => {
  assert.equal(
    PREFER_TO_TEXT_LINE,
    "Prefer to text? Text (208) 477-1169. We reply in minutes during business hours (Mon–Fri 9–6, Sat 9–4 MT).",
  );
  assert.equal(TEXT_REPLY_SMS_HREF, "sms:+12084771169");
  assert.equal(SITE_CONFIG.phoneSmsHref, "sms:2084771169");
});

test("contact page keeps each one-business-day line and adds the text line beside it", () => {
  const html = render(React.createElement(ContactPage));
  const text = visible(html);
  assert.match(text, /Prefer to text\? Message us instead/);
  assert.match(text, /Mon – Fri 9 am – 6 pm · Sat 9 am – 4 pm/);
  assert.doesNotMatch(text, /Mon – Fri 7 am|Sat 8 am/);
  const faq = "We respond within one business day. Call us during business hours for an immediate conversation, or submit the form and we will reach out to schedule your free planning consultation.";
  for (const original of [
    faq,
    "Send a few details and we will reach out within one business day to schedule your free 60 to 90 minute planning consultation - budget band, schedule, and site requirements, with no obligation.",
    "Call, email, or visit - we respond within one business day and never use high-pressure sales tactics.",
    "Response within one business day",
    "We reply within one business day",
    "No spam. We respond within one business day.",
  ]) {
    assertLineFollows(html, original);
  }
  // Current main force-mounts closed FAQ answers in server markup. Verify the
  // answer both on the page and through the shared text renderer.
  const faqHtml = renderToStaticMarkup(React.createElement(CopyWithTextReply, { text: CONTACT_FAQS[0].answer }));
  assertLineFollows(faqHtml, faq);
  assertSmsLink(faqHtml);
  assert.equal(CONTACT_FAQS[0].answer, insertPreferToTextAfterBusinessDay(faq));
  assert.equal((html.match(/href="sms:\+12084771169"/g) || []).length, 6);
  assertSmsLink(html);
});

test("homepage keeps the planning-session line and the consult bullet", () => {
  const html = render(React.createElement(HomePage));
  assertLineFollows(
    html,
    "Send a few details and we will set up a free 60 to 90 minute planning session, usually within one business day.",
  );
  assertLineFollows(html, "We reply within one business day");
  assertLineFollows(html, "No spam. We respond within one business day.");
  assertSmsLink(html);
});

test("consultation form trust bullets and the success step render the line", () => {
  const form = render(React.createElement(ConsultationForm, { showTrust: true }));
  assertLineFollows(form, "We reply within one business day");
  assertLineFollows(form, "No spam. We respond within one business day.");
  assert.ok(visible(form).includes(CONSULT_BULLETS[3]));
  const success = renderToStaticMarkup(React.createElement(ConsultationSuccessReachOut));
  assertLineFollows(success, "We reach out within one business day to find a time that works.");
  assertSmsLink(success);
});

test("abandonment prompt keeps both callback lines and adds the text line", () => {
  for (const [sent, original] of [
    [false, "A quick call or text answers most questions in a minute. Or leave a number and we will call you back within one business day."],
    [true, "Thanks. Someone from the team will call within one business day. You can keep going here or close this window."],
  ] as const) {
    const html = renderToStaticMarkup(React.createElement(AbandonmentPromptMessage, { sent }));
    assertLineFollows(html, original);
    assertSmsLink(html);
  }
});

test("RE-10 review FAQ keeps the one-business-day answer and links the text number", () => {
  const answer = RE10_FAQS.find((faq) => faq.question === "How quickly can you review a repair request?")?.answer;
  assert.ok(answer);
  assert.equal(
    answer,
    insertPreferToTextAfterBusinessDay(
      "Most repair lists are reviewed within one business day of receiving the documents. Send them as early as you can. The earlier we see the list, the more honestly we can tell you what fits inside your deadline.",
    ),
  );
  const original = "Most repair lists are reviewed within one business day of receiving the documents. Send them as early as you can. The earlier we see the list, the more honestly we can tell you what fits inside your deadline.";
  const rendered = renderToStaticMarkup(React.createElement(CopyWithTextReply, { text: answer }));
  assertLineFollows(rendered, original);
  assertSmsLink(rendered);
  const page = render(React.createElement(Re10Faqs));
  assert.match(visible(page), /How quickly can you review a repair request/);
  assert.match(JSON.stringify(generateFAQSchema(RE10_FAQS)), /Prefer to text\? Text \(208\) 477-1169\./);
  assert.match(JSON.stringify(generateFAQSchema(RE10_FAQS)), /reviewed within one business day of receiving the documents/);
});

test("confirmation emails keep the follow-up line and link the text number", () => {
  const estimateHtml = customerEstimateFollowUpHtml();
  assertLineFollows(
    estimateHtml,
    "We will reach out within one business day to book your free planning consultation, where we confirm the scope and give you a firm number. Until then, reply here or call (208) 477-1169 with any questions.",
  );
  assert.match(estimateHtml, /href="sms:\+12084771169"/);
  assert.match(estimateHtml, /href="tel:2084771169"/);

  const greeting = customerConsultationGreetingHtml();
  assertLineFollows(
    greeting,
    "We received your consultation request and will reach out within one business day to schedule your free planning consultation.",
  );
  assert.match(greeting, /href="sms:\+12084771169"/);

  const email = buildCustomerEmailHtml(LEAD, null);
  assert.ok(email.includes(greeting));
  assert.match(email, /href="sms:2084771169"/);
  assert.doesNotMatch(email, /href="sms:\+12084771169"[^>]*>send us a text/);
});

test("Google profile copy keeps the one-business-day lines and adds the same sentence", () => {
  assert.equal(
    GBP_MESSAGING.welcomeMessage,
    insertPreferToTextAfterBusinessDay(
      "Thanks for reaching out to Boise Construction Co. We respond within one business day. For faster help, call (208) 477-1169 or book a planning consultation at boiseconstruction.co/contact",
    ),
  );
  const started = GBP_QA_SEED.find((entry) => entry.question === "How do I get started?");
  assert.ok(started);
  assert.equal(
    started.answer,
    insertPreferToTextAfterBusinessDay(
      "Call (208) 477-1169, text us at the same number, or book online: https://boiseconstruction.co/contact. We respond within one business day.",
    ),
  );
  assert.match(GBP_MESSAGING.welcomeMessage, /Prefer to text\? Text \(208\) 477-1169\./);
  assert.match(started.answer, /Prefer to text\? Text \(208\) 477-1169\./);
});

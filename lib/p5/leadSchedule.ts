/**
 * Lead confirmation copy and the Schedule now button.
 *
 * One booking page serves every brand. The URL cannot preselect a length, so
 * the sentence above the button tells the lead which option to choose:
 * 1 hour for a home walkthrough, 15 minutes for a phone consult.
 *
 * The button is a table, with Outlook VML beside it, so Gmail, Outlook and
 * iOS Mail all show a real button without depending on a stylesheet.
 *
 * Copy matches p5-home-co (the Schedule now confirmation). This brand's name,
 * phone and ochre accent are the only substitutions.
 *
 * Lives in lib/p5 so the isolated pricing harness, which copies only this
 * folder, can render the customer button. Brand mail re-exports it.
 */

const DEFAULT_BRAND = "Boise Construction Co";
const DEFAULT_PHONE = "(208) 477-1169";

/** HubSpot meetings page. Durations on the page are 15, 30, 60 and 120 minutes. */
export const SCHEDULE_URL = "https://meetings-na2.hubspot.com/client3";

export const BUTTON_CHARCOAL = "#383837";
export const BUTTON_WHITE = "#ffffff";
export const BUTTON_PAPER = "#fbfaf6";

/** Construction ochre. The button fill stays charcoal; this is the accent bar. */
export const BRAND_ACCENT = "#C48D3F";

export type ScheduleIntent = "walkthrough" | "consult";

export const ESTIMATE_DISCLAIMER =
  "We work hard to make that estimate as realistic as we can, but we can't give you a true bid until we walk the property. Depending on the scope and what we find, the bid may come in higher or lower than this first estimate. Either way, we'll work with you to get you what you want, within your budget.";

export const SHARED_DISCLAIMER =
  "We work hard to make any estimate we share as realistic as we can, but we can't give you a true bid until we walk the property. Depending on the scope and what we find, the bid may come in higher or lower than that first estimate. Either way, we'll work with you to get you what you want, within your budget.";

export function scheduleIntentFor(input: { requestKind?: string | null; form?: string | null }): ScheduleIntent {
  const kind = (input.requestKind ?? "").trim().toLowerCase();
  const form = (input.form ?? "").trim().toLowerCase();
  if (kind === "callback" || form === "site chat" || form.includes("call you")) return "consult";
  return "walkthrough";
}

/** The words that tell the lead which length to pick on the shared booking page. */
export function durationChoice(intent: ScheduleIntent): string {
  return intent === "consult" ? "the 15 minute option for a phone consult" : "the 1 hour option for a home walkthrough";
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHref(value: string): string {
  const trimmed = value.trim();
  if (!/^https:\/\/[^\s"'<>]+$/.test(trimmed)) return SCHEDULE_URL;
  return trimmed;
}

function safeAccent(value: string | undefined): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? (value as string) : BRAND_ACCENT;
}

export function greetingName(firstName: string | null | undefined): string {
  const name = (firstName ?? "").trim();
  return name || "there";
}

export function contactLine(phone: string | undefined): string {
  const shown = (phone ?? "").trim() || DEFAULT_PHONE;
  return `If you have questions, just reply to this email or call ${shown}.`;
}

/**
 * A full-width button. Primary is charcoal with white text and a brand
 * accent bar. Secondary is an outline on paper, shorter, so it reads as
 * the quieter action.
 */
export function bulletproofButton(options: {
  href: string;
  label: string;
  variant: "primary" | "secondary";
  accent?: string;
}): string {
  const href = esc(safeHref(options.href));
  const label = esc(options.label);
  const accent = safeAccent(options.accent);
  if (options.variant === "secondary") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 18px;">
<tr>
<td align="center" bgcolor="${BUTTON_PAPER}" style="background-color:${BUTTON_PAPER};border:2px solid ${BUTTON_CHARCOAL};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:520px;" arcsize="4%" strokecolor="${BUTTON_CHARCOAL}" fillcolor="${BUTTON_PAPER}">
<w:anchorlock/>
<center style="color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" target="_blank" style="display:block;padding:12px 20px;background-color:${BUTTON_PAPER};color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-align:center;text-decoration:none;border:0;mso-hide:all;">${label}</a>
<!--<![endif]-->
</td>
</tr>
</table>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 0;">
<tr>
<td align="center" bgcolor="${BUTTON_CHARCOAL}" style="background-color:${BUTTON_CHARCOAL};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:56px;v-text-anchor:middle;width:520px;" arcsize="4%" strokecolor="${BUTTON_CHARCOAL}" fillcolor="${BUTTON_CHARCOAL}">
<w:anchorlock/>
<center style="color:${BUTTON_WHITE};font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" target="_blank" style="display:block;padding:16px 24px;background-color:${BUTTON_CHARCOAL};color:${BUTTON_WHITE};font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:24px;text-align:center;text-decoration:none;border:0;mso-hide:all;">${label}</a>
<!--<![endif]-->
</td>
</tr>
<tr>
<td bgcolor="${accent}" style="background-color:${accent};height:4px;font-size:0;line-height:0;">&nbsp;</td>
</tr>
</table>`;
}

function wrapHtml(inner: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:${BUTTON_CHARCOAL};max-width:560px;font-size:16px;line-height:1.6;">${inner}</div>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">${esc(text)}</p>`;
}

/** Light paper behind the charcoal button, so it stays prominent on a dark email. */
export function paperScheduleCard(inner: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
<tr>
<td bgcolor="${BUTTON_PAPER}" style="background-color:${BUTTON_PAPER};padding:20px 18px 8px;">
${inner}
</td>
</tr>
</table>`;
}

export type EmbeddedScheduleInput = {
  kind: "estimate" | "request";
  intent: ScheduleIntent;
  accent?: string;
};

/**
 * The scheduling sentence, button and disclaimer, without a greeting.
 * Estimate emails already introduce the project. Request emails already
 * thank the lead. This block is what both of them were missing.
 */
export function embeddedSchedule(input: EmbeddedScheduleInput): { html: string; text: string } {
  const accent = input.accent;
  const disclaimer = input.kind === "estimate" ? ESTIMATE_DISCLAIMER : SHARED_DISCLAIMER;
  const next =
    input.kind === "estimate" && input.intent === "walkthrough"
      ? "The next step is a home walkthrough, so we can see the property and turn this estimate into a true bid. On the scheduling page, choose the 1 hour option."
      : `If you would like to get on the calendar now, use the button below and choose ${durationChoice(input.intent)}.`;
  const text = [next, "", `Schedule now: ${SCHEDULE_URL}`, "", disclaimer].join("\n");
  const html = [
    paragraph(next),
    bulletproofButton({ href: SCHEDULE_URL, label: "Schedule now", variant: "primary", accent }),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
    paragraph(disclaimer),
  ].join("");
  return { html, text };
}

export type EstimatorConfirmationInput = {
  firstName: string | null;
  brandName: string;
  project: string;
  viewUrl?: string;
  phone?: string;
  accent?: string;
};

/**
 * The guided estimator confirmation. Subject stays "Your {project} estimate
 * from {brand}". No price, cost or margin belongs in this message. A view
 * link is included only when the caller has one; this site usually prints
 * the range in the same email instead.
 */
export function estimatorConfirmation(input: EstimatorConfirmationInput): { subject: string; text: string; html: string } {
  const first = greetingName(input.firstName);
  const brandName = input.brandName.trim() || DEFAULT_BRAND;
  const project = input.project.trim().toLowerCase() || "project";
  const phone = contactLine(input.phone);
  const viewUrl = input.viewUrl ? safeHref(input.viewUrl) : "";
  const subject = `Your ${project} estimate from ${brandName}`;
  const thanks = `Thanks for thinking of ${brandName} for your ${project}. Your estimate is saved, and you can pull it up any time.`;
  const schedule = embeddedSchedule({ kind: "estimate", intent: "walkthrough", accent: input.accent });
  const signoff = `The ${brandName} team`;
  const text = [
    `Hi ${first},`,
    "",
    thanks,
    "",
    schedule.text,
    "",
    ...(viewUrl ? [`View your estimate: ${viewUrl}`, ""] : []),
    phone,
    "",
    signoff,
  ].join("\n");
  const html = wrapHtml(
    [
      paragraph(`Hi ${first},`),
      paragraph(thanks),
      schedule.html,
      ...(viewUrl
        ? [`<div style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>`, bulletproofButton({ href: viewUrl, label: "View your estimate", variant: "secondary" })]
        : []),
      paragraph(phone),
      paragraph(signoff),
    ].join(""),
  );
  return { subject, text, html };
}

export type RequestConfirmationInput = {
  firstName: string | null;
  brandName: string;
  intent: ScheduleIntent;
  phone?: string;
  accent?: string;
};

/**
 * Opening of an email that also prints a planning range. Greeting, the
 * scheduling button and the disclaimer sit on paper. The range and the
 * sign-off are added by the caller, so the sign-off is not stranded above
 * the numbers.
 */
export function estimateLeadCard(input: {
  firstName: string | null;
  brandName: string;
  project: string;
  intent: ScheduleIntent;
  accent?: string;
}): { text: string; html: string } {
  const first = greetingName(input.firstName);
  const brandName = input.brandName.trim() || DEFAULT_BRAND;
  const project = input.project.trim().toLowerCase() || "project";
  const thanks =
    input.intent === "consult"
      ? `Thanks for reaching out to ${brandName}. We have your request, and someone from the team will follow up shortly.`
      : `Thanks for thinking of ${brandName} for your ${project}. Your estimate is saved, and you can pull it up any time.`;
  const schedule = embeddedSchedule({ kind: "estimate", intent: input.intent, accent: input.accent });
  const text = [`Hi ${first},`, "", thanks, "", schedule.text].join("\n");
  const html = paperScheduleCard(
    [paragraph(`Hi ${first},`), paragraph(thanks), schedule.html].join(""),
  );
  return { text, html };
}

/** Short request, quote form, and the same note when an email arrives later. */
export function requestConfirmation(input: RequestConfirmationInput): { subject: string; text: string; html: string } {
  const first = greetingName(input.firstName);
  const brandName = input.brandName.trim() || DEFAULT_BRAND;
  const phone = contactLine(input.phone);
  const subject = `We have your request, ${first}`;
  const thanks = `Thanks for reaching out to ${brandName}. We have your request, and someone from the team will follow up shortly.`;
  const schedule = embeddedSchedule({ kind: "request", intent: input.intent, accent: input.accent });
  const signoff = `The ${brandName} team`;
  const text = [`Hi ${first},`, "", thanks, "", schedule.text, "", phone, "", signoff].join("\n");
  const html = wrapHtml(
    [paragraph(`Hi ${first},`), paragraph(thanks), schedule.html, paragraph(phone), paragraph(signoff)].join(""),
  );
  return { subject, text, html };
}

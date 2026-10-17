/**
 * Public text-reply sentence. Hours stay in one constant so every surface
 * uses the window Jared confirmed, including Saturday.
 * TEXT_REPLY_SMS_HREF is only for this sentence. SITE_CONFIG.phoneSmsHref
 * stays as it is.
 */
export const TEXT_REPLY_HOURS = "Mon–Fri 9–6, Sat 9–4 MT";
export const TEXT_REPLY_PHONE = "(208) 477-1169";
export const TEXT_REPLY_SMS_HREF = "sms:+12084771169";

export const PREFER_TO_TEXT_LINE =
  `Prefer to text? Text ${TEXT_REPLY_PHONE}. We reply in minutes during business hours (${TEXT_REPLY_HOURS}).`;

/** Insert the sentence after the sentence that contains "one business day". */
export function insertPreferToTextAfterBusinessDay(text: string): string {
  const phrase = "one business day";
  const at = text.indexOf(phrase);
  if (at < 0) return text;
  let end = at + phrase.length;
  const sentenceEnd = text.slice(end).search(/[.!?]/);
  if (sentenceEnd >= 0) end += sentenceEnd + 1;
  const before = text.slice(0, end).replace(/\s+$/, "");
  const after = text.slice(end).replace(/^\s+/, "");
  return after
    ? `${before} ${PREFER_TO_TEXT_LINE} ${after}`
    : `${before} ${PREFER_TO_TEXT_LINE}`;
}

export function preferToTextHtml(linkStyle?: string): string {
  const styleAttr = linkStyle ? ` style="${linkStyle}"` : "";
  return `Prefer to text? Text <a href="${TEXT_REPLY_SMS_HREF}"${styleAttr}>${TEXT_REPLY_PHONE}</a>. We reply in minutes during business hours (${TEXT_REPLY_HOURS}).`;
}

export function insertPreferToTextHtmlAfterBusinessDay(html: string, linkStyle?: string): string {
  const phrase = "one business day";
  const at = html.indexOf(phrase);
  if (at < 0) return html;
  let end = at + phrase.length;
  const sentenceEnd = html.slice(end).search(/[.!?]/);
  if (sentenceEnd >= 0) end += sentenceEnd + 1;
  const before = html.slice(0, end);
  const after = html.slice(end);
  const gap = after.length === 0 || after.startsWith(" ") || after.startsWith("<") ? "" : " ";
  return `${before} ${preferToTextHtml(linkStyle)}${gap}${after}`;
}

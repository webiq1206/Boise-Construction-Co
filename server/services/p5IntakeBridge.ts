/**
 * Bridge from an accepted Construction consultation to the multi-brand intake
 * on p5homeco.com.
 *
 * That route already creates the HubSpot contact, the mapped deal, and the
 * team email (p5 tip 8a33b28c). This repo must not take a HubSpot dependency
 * or a portal token. A bridge failure is logged and never thrown, so the
 * visitor response, the local save, the customer email, and the BRC dashboard
 * forward stay independent of it.
 *
 * One team email per request (owner decision, 17 November 2026). The bridge
 * asks P5 to confirm its team email (team_alert "confirm") and reports what P5
 * said. The site's own team email is the fallback: it is decided from this
 * result, off the visitor's path (server/services/siteTeamEmail.ts).
 *
 * Project strings are rewritten only when p5 already accepts them: either as
 * a HUBSPOT_PROJECT_TYPES value or as a PROJECT_TYPE_ALIASES key. Unknown
 * visitor labels are forwarded unchanged so p5 can omit p5_project_type
 * instead of rejecting the deal.
 */

export const P5_INTAKE_URL = "https://p5homeco.com/api/leads/intake";

/** Exact BRANDS entry on the p5 intake. Matches SITE_CONFIG.name. */
export const P5_CONSTRUCTION_BRAND = "Boise Construction Co";

export const P5_CONSULTATION_FORM = "Construction consultation";

/**
 * Visitor project text that does not match a p5 alias or HubSpot option at
 * tip 8a33b28c. hubspotProjectType omits these, so the deal can be created
 * with a blank p5_project_type. Prove should watch for that omission.
 */
export const UNMAPPED_P5_PROJECT_TYPES = [
  "other",
  "Other / Not sure yet",
  "something-else",
  "Something else",
  "looking-for-land",
  "Still Looking for Land",
  "General inquiry (assistant chat)",
] as const;

/**
 * Consultation values (estimate enum, form slugs, and on-screen labels) to a
 * string p5 will keep. Targets are HUBSPOT_PROJECT_TYPES values or
 * PROJECT_TYPE_ALIASES keys from p5 tip 8a33b28c.
 *
 * Shop homes have no portal option. "New custom home" is the alias p5 rewrites
 * to "Custom home", which is the closest accepted value. Custom, semi-custom,
 * and build-on-your-lot already have their own options and stay specific.
 */
export const P5_PROJECT_TYPE_BY_VISITOR_LABEL: Readonly<Record<string, string>> = {
  "custom-home": "Custom home",
  "Custom Home": "Custom home",
  "Custom home": "Custom home",
  "New custom home": "New custom home",

  "semi-custom-home": "Semi-custom home",
  "Semi-Custom Home": "Semi-custom home",
  "Semi-custom home": "Semi-custom home",

  "build-on-your-lot": "Build on land I own",
  "build-on-my-lot": "Build on land I own",
  "Build on My Lot": "Build on land I own",
  "Build on land I own": "Build on land I own",

  "shop-home": "New custom home",
  "Shop Home": "New custom home",
  "Shop Home / Barndominium": "New custom home",

  "plans-only": "Home plans or lot evaluation",
  "Home Design & Plans Only": "Home plans or lot evaluation",
  "lot-evaluation": "Home plans or lot evaluation",
  "Lot Evaluation": "Home plans or lot evaluation",
  "Home plans or lot evaluation": "Home plans or lot evaluation",

  kitchen: "kitchen",
  Kitchen: "kitchen",
  "Kitchen Remodel": "kitchen",
  "Kitchen remodel": "kitchen",

  bathroom: "bathroom",
  Bathroom: "bathroom",
  "Bathroom Remodel": "bathroom",
  "Bathroom remodel": "bathroom",

  "whole-home": "whole-home",
  "Whole-Home": "whole-home",
  "Whole-Home Remodel": "whole-home",
  "Whole-home remodel": "whole-home",

  addition: "addition",
  "Room Addition": "Home addition",
  "Home Addition": "Home addition",
  "Home addition": "Home addition",

  adu: "adu",
  ADU: "Accessory dwelling unit (ADU)",
  "ADU / Guest House": "Accessory dwelling unit (ADU)",
  "Accessory dwelling unit (ADU)": "Accessory dwelling unit (ADU)",

  basement: "Basement finishing",
  "Basement Finishing": "Basement finishing",
  "Basement finishing": "Basement finishing",
};

export type ConsultationBridgeInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  projectType?: string | null;
  message?: string | null;
  inquiryId?: string | null;
  inquiryKey?: string | null;
  /**
   * The P5 intake contract for the two-step quote form (P5 implements it; extra
   * fields are ignored by an intake that predates it):
   * "initial" creates the deal; "details" with the same brand and external_id
   * merges into that deal instead of creating one.
   */
  submissionKind?: "initial" | "details";
  /** "callback" is the form's "Have us call you". */
  requestKind?: "quote" | "callback";
  /** The form's value: "phone" means call. */
  preferredContact?: "phone" | "text" | "email" | null;
  bestTime?: string | null;
  /** Step 2 timing answer, e.g. "1 to 3 months". */
  timeline?: string | null;
  /** Stored attachments. Links are unguessable; see server/services/leadFiles.ts. */
  files?: ReadonlyArray<{ name: string; url: string; contentType: string; size: number }>;
  /**
   * Plain "Label: value" lines P5 prints in its team email under "From the
   * website": what this site's own team email carries and the fields above do
   * not. That email is copied into HubSpot by the P5 inbox sync, so these
   * lines must never carry a cost, margin, markup, profit, contingency or
   * overhead figure. Build them with server/services/consultationTeamNotes.ts,
   * which enforces that.
   */
  teamNotes?: ReadonlyArray<string>;
  /**
   * Plain "Label: value" lines P5 prints in its team email under "Internal
   * pricing". This is where cost, margin, markup, gross profit, contingency,
   * overhead, per-trade amounts and the wording of pricing checks go. When any
   * are present P5 sends the email as "Lead and pricing: ..." and not as "New
   * lead: ...", and its inbox sync copies only "New lead" mail into HubSpot, so
   * these figures never reach HubSpot. Never move one of these lines into
   * teamNotes.
   */
  teamInternalNotes?: ReadonlyArray<string>;
};

/** P5 sends its team email before it answers and reports the outcome as `alert`. */
export const P5_TEAM_ALERT_MODE = "confirm";

/** The P5 contract for team_notes and team_internal_notes. */
export const P5_TEAM_NOTES_MAX_LINES = 40;
export const P5_TEAM_INTERNAL_NOTES_MAX_LINES = 60;
export const P5_TEAM_NOTE_MAX_LENGTH = 300;

/**
 * P5 waits for HubSpot (so its email carries the links) and then for its mail
 * server before it answers, which can take about 25 seconds.
 */
export const P5_INTAKE_TIMEOUT_MS = 30_000;

/**
 * What P5 said about its own team email.
 * "sent": its mail server accepted the email.
 * "failed": it did not, or it was still sending when P5 stopped waiting.
 * "none": this submission produced no P5 email (an exact repeat, or details
 * that are waiting for their request).
 * "unknown": anything else: an older P5 without the contract, an HTTP error,
 * a transport failure, a timeout, an unreadable answer.
 */
export type P5TeamAlert = "sent" | "failed" | "none" | "unknown";

export type P5BridgeResult = {
  /** P5 answered with a success status. */
  forwarded: boolean;
  alert: P5TeamAlert;
};

/** Only the three exact strings count. Everything else is not a confirmation. */
export function parseP5TeamAlert(answer: unknown): P5TeamAlert {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return "unknown";
  const alert = (answer as { alert?: unknown }).alert;
  return alert === "sent" || alert === "failed" || alert === "none" ? alert : "unknown";
}

/**
 * Makes any list of lines fit the P5 contract: single lines, no control
 * characters, at most P5_TEAM_NOTE_MAX_LENGTH characters each and at most
 * maxLines of them (40 for team_notes, 60 for team_internal_notes). Order is
 * kept, so callers put the lines the team needs most first.
 *
 * This is only the shape. What may be said in team_notes (never an internal
 * figure) is decided in server/services/consultationTeamNotes.ts.
 */
export function sanitizeTeamNotes(
  lines: ReadonlyArray<unknown> | null | undefined,
  maxLines: number = P5_TEAM_NOTES_MAX_LINES,
): string[] {
  const out: string[] = [];
  for (const raw of lines ?? []) {
    if (typeof raw !== "string") continue;
    const line = raw.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
    if (!line) continue;
    out.push(
      line.length > P5_TEAM_NOTE_MAX_LENGTH ? `${line.slice(0, P5_TEAM_NOTE_MAX_LENGTH - 3).trimEnd()}...` : line,
    );
    if (out.length >= maxLines) break;
  }
  return out;
}

/** p5 contact_preference values. */
export const P5_CONTACT_PREFERENCE = { phone: "call", text: "text", email: "email" } as const;

/** p5 normalizeEmail, kept local so a bad optional phone cannot 422 a good email. */
function reachableEmail(raw: string | null | undefined): string | null {
  const email = raw?.trim() ?? "";
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** p5 normalizePhone. Returns the visitor's original text when it would be stored. */
function reachablePhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+") && !trimmed.startsWith("+1")) {
    return digits.length >= 8 && digits.length <= 15 ? trimmed : null;
  }
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) return null;
  return trimmed;
}

export function p5ProjectType(visitorType: string | null | undefined): string | null {
  const trimmed = visitorType?.trim() ?? "";
  if (!trimmed) return null;
  return P5_PROJECT_TYPE_BY_VISITOR_LABEL[trimmed] ?? trimmed;
}

function composeAddress(address?: string | null, zip?: string | null): string | null {
  const street = address?.trim() ?? "";
  const postal = zip?.trim() ?? "";
  if (!street) return postal || null;
  if (!postal || street.includes(postal)) return street;
  return `${street}, ${postal}`;
}

export function buildP5IntakeBody(input: ConsultationBridgeInput): Record<string, string> {
  const visitorType = input.projectType?.trim() ?? "";
  const projectType = p5ProjectType(visitorType);
  const note = input.message?.trim() ?? "";
  const summaryParts: string[] = [];
  if (visitorType && projectType && projectType !== visitorType) {
    summaryParts.push(`Visitor project: ${visitorType}`);
  }
  if (note) summaryParts.push(note);

  const email = reachableEmail(input.email);
  const phone = reachablePhone(input.phone);
  const rawEmail = input.email?.trim() ?? "";
  const rawPhone = input.phone?.trim() ?? "";

  const body: Record<string, string> = {
    brand: P5_CONSTRUCTION_BRAND,
    name: input.name.trim(),
    form: P5_CONSULTATION_FORM,
    source: "Organic Website",
    sourceDetail: "boiseconstruction.co consultation",
  };

  if (projectType) body.projectType = projectType;
  if (email) body.email = email;
  else if (!phone && rawEmail) body.email = rawEmail;
  if (phone) body.phone = phone;
  else if (!email && rawPhone) body.phone = rawPhone;

  const address = composeAddress(input.address, input.zip);
  if (address) body.address = address;
  const city = input.city?.trim();
  if (city) body.city = city;
  if (summaryParts.length) body.summary = summaryParts.join("\n\n");

  const leadId = input.inquiryKey?.trim() || input.inquiryId?.trim();
  if (leadId) body.externalLeadId = `boiseconstruction-consultation:${leadId}`;

  // The two-step contract. external_id is this site's own request id, stable
  // across the request and its "Help us prepare" details.
  const externalId = input.inquiryKey?.trim();
  if (externalId) {
    body.external_id = externalId;
    body.submission_kind = input.submissionKind ?? "initial";
  }
  if (input.requestKind) body.request_kind = input.requestKind;
  if (input.preferredContact) {
    body.contact_preference =
      input.requestKind === "callback" ? "call" : P5_CONTACT_PREFERENCE[input.preferredContact];
  }
  const bestTime = input.bestTime?.trim();
  if (bestTime) body.best_time = bestTime;
  const timeline = input.timeline?.trim();
  if (timeline) body.timeline = timeline;
  return body;
}

/**
 * The posted JSON: the string fields above, the file links when there are any,
 * the request for a confirmed team email, and the two kinds of team notes when
 * there are any (an older P5 ignores a field it does not know).
 */
export function buildP5IntakePayload(input: ConsultationBridgeInput): Record<string, unknown> {
  const body: Record<string, unknown> = buildP5IntakeBody(input);
  if (input.files?.length) {
    body.files = input.files.map(({ name, url, contentType, size }) => ({ name, url, contentType, size }));
  }
  body.team_alert = P5_TEAM_ALERT_MODE;
  const teamNotes = sanitizeTeamNotes(input.teamNotes);
  if (teamNotes.length) body.team_notes = teamNotes;
  const teamInternalNotes = sanitizeTeamNotes(input.teamInternalNotes, P5_TEAM_INTERNAL_NOTES_MAX_LINES);
  if (teamInternalNotes.length) body.team_internal_notes = teamInternalNotes;
  return body;
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * POST the consultation to p5 intake and report what P5 said about its team
 * email. Never throws: every failure is logged and comes back as
 * { forwarded: false, alert: "unknown" }.
 *
 * Callers must not await this on the visitor's success path. Only the site's
 * own team email waits for the result, and it does so off that path.
 */
export async function forwardConsultationToP5Intake(
  input: ConsultationBridgeInput,
  fetchImpl: FetchLike = fetch,
  options: { timeoutMs?: number } = {},
): Promise<P5BridgeResult> {
  try {
    const body = buildP5IntakePayload(input);
    const res = await fetchImpl(P5_INTAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? P5_INTAKE_TIMEOUT_MS),
    });
    const detail = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[p5-intake] Bridge rejected: ${res.status} ${detail.slice(0, 300)}`,
      );
      return { forwarded: false, alert: "unknown" };
    }
    let answer: unknown = null;
    try {
      answer = JSON.parse(detail);
    } catch {
      answer = null;
    }
    const alert = parseP5TeamAlert(answer);
    console.info(
      `[p5-intake] Consultation ${input.submissionKind === "details" ? "details" : "request"} forwarded (${res.status}), team email: ${alert}.`,
    );
    return { forwarded: true, alert };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[p5-intake] Bridge failed: ${message}`);
    return { forwarded: false, alert: "unknown" };
  }
}

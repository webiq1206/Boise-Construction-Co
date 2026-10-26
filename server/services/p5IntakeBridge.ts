/**
 * Fire-and-forget bridge from an accepted Construction consultation to the
 * multi-brand intake on p5homeco.com.
 *
 * That route already creates the HubSpot contact, the mapped deal, and the
 * fail-open lead_created notice (p5 tip 8a33b28c). This repo must not take a
 * HubSpot dependency or a portal token. A bridge failure is logged and never
 * thrown, so the visitor response, the local save, Resend, and the BRC
 * dashboard forward stay independent of it.
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
};

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
  return body;
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * POST the consultation to p5 intake. Never throws.
 * Callers must not await this on the visitor's success path.
 */
export async function forwardConsultationToP5Intake(
  input: ConsultationBridgeInput,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  try {
    const body = buildP5IntakeBody(input);
    const res = await fetchImpl(P5_INTAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[p5-intake] Bridge rejected: ${res.status} ${detail.slice(0, 300)}`,
      );
      return;
    }
    console.info(`[p5-intake] Consultation forwarded (${res.status}).`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[p5-intake] Bridge failed: ${message}`);
  }
}

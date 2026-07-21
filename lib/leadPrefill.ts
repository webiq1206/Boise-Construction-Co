/**
 * Lead prefill + gate bypass for pre-qualified traffic (e.g. Meta lead-form clicks).
 *
 * When a visitor arrives from a source that ALREADY collected their contact info
 * (a Facebook / Instagram Instant Form), we don't want to ask again. The ad's
 * completion button links here, optionally with the lead's answers as URL params.
 * We:
 *   1. Skip the estimate gate so the price range shows instantly (no re-entry).
 *   2. Prefill the consultation form (name / phone / email) so booking is one tap.
 *   3. Strip any PII params from the visible URL for privacy.
 *
 * Contact info is NOT required to *see* the range (the gate is a lead-capture step),
 * so a pre-qualified visitor can skip straight to the number.
 *
 * Example completion-button link:
 *   https://boiseremodeling.co/?src=fb#calculator
 *   https://boiseremodeling.co/?src=fb&name=Jane%20Smith&email=...&phone=...#calculator
 */

export interface LeadPrefill {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string;
}

/** Sources that mean "this person already gave us their contact info." */
const PREFILLED_SOURCES = new Set([
  "fb", "facebook", "ig", "instagram", "meta", "lead", "leadform", "leadad",
]);

const PII_PARAM_KEYS = [
  "name", "first_name", "last_name", "fname", "lname",
  "email", "phone", "zip", "postal",
];

const STORAGE_PREFILL = "brc_prefill";
const STORAGE_GATE = "brc_gate_passed";
const STORAGE_SOURCE = "brc_lead_source";

/**
 * Parse the current URL for a lead source + prefill params, persist them for the
 * forms, and clean PII out of the address bar. Safe to call on every mount.
 */
export function applyLeadParams(): { skipGate: boolean; prefill: LeadPrefill } {
  const empty = { skipGate: false, prefill: {} as LeadPrefill };
  if (typeof window === "undefined") return empty;

  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;

    const src = (p.get("src") || p.get("utm_source") || "").toLowerCase();
    const explicitSkip = p.get("skipgate") === "1" || p.get("prefilled") === "1";
    const isPrefilledSource = PREFILLED_SOURCES.has(src) || explicitSkip;

    const first = (p.get("first_name") || p.get("fname") || "").trim();
    const last = (p.get("last_name") || p.get("lname") || "").trim();
    const name = (p.get("name") || [first, last].filter(Boolean).join(" ")).trim();
    const email = (p.get("email") || "").trim();
    const phone = (p.get("phone") || "").trim();
    const zip = (p.get("zip") || p.get("postal") || "").trim();

    const prefill: LeadPrefill = {};
    if (name) prefill.name = name;
    if (email) prefill.email = email;
    if (phone) prefill.phone = phone;
    if (zip) prefill.zip = zip;

    if (Object.keys(prefill).length > 0) {
      sessionStorage.setItem(STORAGE_PREFILL, JSON.stringify(prefill));
    }
    if (isPrefilledSource) {
      sessionStorage.setItem(STORAGE_GATE, "1");
      sessionStorage.setItem(STORAGE_SOURCE, src || "fb");
    }

    // Privacy: never leave a phone/email sitting in the address bar (URLs get
    // logged, cached, and shared). Keep everything else, including the #calculator hash.
    const hadPII = PII_PARAM_KEYS.some((k) => p.has(k));
    if (hadPII) {
      PII_PARAM_KEYS.forEach((k) => p.delete(k));
      const qs = p.toString();
      const clean = url.pathname + (qs ? `?${qs}` : "") + url.hash;
      window.history.replaceState(window.history.state, "", clean);
    }

    return { skipGate: isPrefilledSource, prefill };
  } catch {
    return empty;
  }
}

/** Read any stored prefill (set by applyLeadParams) for a form to consume. */
export function readStoredPrefill(): LeadPrefill {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFILL);
    return raw ? (JSON.parse(raw) as LeadPrefill) : {};
  } catch {
    return {};
  }
}

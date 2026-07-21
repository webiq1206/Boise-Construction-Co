/**
 * Lead prefill for pre-qualified traffic (e.g. Meta lead-form clicks).
 *
 * When a visitor arrives from a source that already collected their contact info
 * (a Facebook / Instagram Instant Form), the ad's completion button links here,
 * optionally with the lead's answers as URL params. We PREFILL the estimate gate
 * and the consultation form so they don't re-type what they just entered.
 *
 * We intentionally do NOT skip the gate. Contact info is always captured (or
 * confirmed) on-site BEFORE the price range is shown, so a visitor can never see
 * a number we have no way to follow up on. Prefilling just turns that into a
 * single tap for people who already gave us their details on Facebook.
 *
 * We also strip any PII params from the visible URL for privacy.
 *
 * Example completion-button link:
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
const STORAGE_SOURCE = "brc_lead_source";

/**
 * Parse the current URL for prefill params, persist them for the forms, and
 * clean PII out of the address bar. Safe to call on every mount.
 */
export function applyLeadParams(): { prefill: LeadPrefill } {
  const empty = { prefill: {} as LeadPrefill };
  if (typeof window === "undefined") return empty;

  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;

    const src = (p.get("src") || p.get("utm_source") || "").toLowerCase();
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
    if (PREFILLED_SOURCES.has(src)) {
      sessionStorage.setItem(STORAGE_SOURCE, src);
    }

    // Privacy: never leave a phone/email sitting in the address bar (URLs get
    // logged, cached, and shared). Keep everything else, incl. the #calculator hash.
    const hadPII = PII_PARAM_KEYS.some((k) => p.has(k));
    if (hadPII) {
      PII_PARAM_KEYS.forEach((k) => p.delete(k));
      const qs = p.toString();
      const clean = url.pathname + (qs ? `?${qs}` : "") + url.hash;
      window.history.replaceState(window.history.state, "", clean);
    }

    return { prefill };
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

/** Fired after writeStoredPrefill so already-mounted forms can re-read. */
export const PREFILL_UPDATED_EVENT = "brc_prefill_updated";

/**
 * Persist contact info captured on-site (e.g. from the estimate gate) so the
 * consultation form can prefill it and the visitor never re-types name / email /
 * phone to book a visit. Merges over any existing prefill (so a zip carried in
 * from a Facebook link survives), then notifies mounted forms via a DOM event.
 */
export function writeStoredPrefill(prefill: LeadPrefill): void {
  if (typeof window === "undefined") return;
  try {
    const next: LeadPrefill = { ...readStoredPrefill() };
    if (prefill.name) next.name = prefill.name;
    if (prefill.email) next.email = prefill.email;
    if (prefill.phone) next.phone = prefill.phone;
    if (prefill.zip) next.zip = prefill.zip;
    if (Object.keys(next).length === 0) return;
    sessionStorage.setItem(STORAGE_PREFILL, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(PREFILL_UPDATED_EVENT));
  } catch {
    /* sessionStorage unavailable (private mode / quota) - non-fatal */
  }
}

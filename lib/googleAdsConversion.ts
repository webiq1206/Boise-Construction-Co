/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * One Google Ads conversion action ('P5 Raw Form Submitted') receives every
 * accepted lead, with a per-lead value so Google Ads can report ROAS by
 * campaign. Values are the per-lead estimates agreed with P5 on 14 Sept 2026
 * (form fallback in Google Ads is $50). Enhanced conversions may send a
 * normalized email, a US phone number, and a name or ZIP. They never send a
 * street address, a project description, or other free text. The conversion
 * event itself still carries only a service or project category and an opaque id.
 */
export const GOOGLE_ADS_ID = 'AW-18354188204';
export const GOOGLE_ADS_LEAD_LABEL = 'AW-18354188204/LE2vCPXstO8cEKzf-q9E';
/** 'P5 Website Call (60s+)': swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = 'AW-18354188204/YHR0CIaPz_ccEKzf-q9E';
export const GOOGLE_ADS_PHONE_DISPLAY = '(208) 477-1169';
/** sessionStorage key written by GoogleAnalytics.tsx on the first page view. */
export const ENTRY_PATH_KEY = 'p5_entry_path';

/** Fields a lead form may pass into enhanced conversions. Street and free text are not accepted. */
export interface GoogleAdsUserInput {
  email?: string;
  phone?: string;
  name?: string;
  postalCode?: string;
}

export interface GoogleAdsUserData {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    postal_code?: string;
    country: 'US';
  };
}

export interface LeadContext {
  /** Unified estimator service id (e.g. 're10', 'cabinet-install'). */
  service?: string;
  /** Consultation form project type. */
  projectType?: string;
  /** Enhanced-conversion fields. Omitted from the conversion event parameters. */
  user?: GoogleAdsUserInput;
  /**
   * False when the submit response says this email or phone is suppressed.
   * Only user_data is skipped. The conversion event still fires.
   */
  allowEnhancedConversions?: boolean;
}

export type GoogleAdsLeadParams = {
  send_to: string;
  value: number;
  currency: 'USD';
  transaction_id?: string;
};

/** The path the visitor landed on, which is what the ad campaign controls. */
export function readEntryPath(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(ENTRY_PATH_KEY) ?? window.location.pathname;
  } catch {
    return window.location.pathname;
  }
}

/** Per-lead value in USD for this site (brand: construction). */
export function googleAdsLeadValue(ctx: LeadContext = {}): number {
  // Custom construction is the highest-value lead type in the account.
  void ctx;
  return 300;
}

export function googleAdsLeadParams(
  ctx: LeadContext = {},
  transactionId?: string,
): GoogleAdsLeadParams {
  const params: GoogleAdsLeadParams = {
    send_to: GOOGLE_ADS_LEAD_LABEL,
    value: googleAdsLeadValue(ctx),
    currency: 'USD',
  };
  if (transactionId) params.transaction_id = transactionId;
  return params;
}

const sentLeadKeys = new Set<string>();

/** Same gate the phone-replacement tag uses before it sends data to Google Ads. */
export function googleAdsUserDataAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = (window as { p5Consent?: { ad_storage?: string; ad_user_data?: string } }).p5Consent;
  return consent?.ad_storage === 'granted' && consent?.ad_user_data === 'granted';
}

/** Ten national digits, or eleven digits beginning with 1. Anything else is omitted. */
export function googleAdsPhoneNumber(phone?: string): string | undefined {
  const digits = (phone ?? '').replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return national.length === 10 ? `+1${national}` : undefined;
}

/**
 * Builds the enhanced-conversion user_data object from fields the form collected.
 * Email is trimmed and lowercased. The phone is E.164 +1XXXXXXXXXX or omitted.
 * A name splits into first and last. A postal code is five digits or omitted.
 */
export function googleAdsUserData(input: GoogleAdsUserInput = {}): GoogleAdsUserData | undefined {
  const data: GoogleAdsUserData = {};
  const email = input.email?.trim().toLowerCase();
  if (email) data.email = email;
  const phone = googleAdsPhoneNumber(input.phone);
  if (phone) data.phone_number = phone;

  const name = input.name?.trim().replace(/\s+/g, ' ') ?? '';
  const [first, ...rest] = name ? name.split(' ') : [];
  const last = rest.join(' ');
  const postal = input.postalCode?.trim() ?? '';
  const postalCode = /^\d{5}$/.test(postal) ? postal : undefined;
  if (first || last || postalCode) {
    data.address = { country: 'US' };
    if (first) data.address.first_name = first;
    if (last) data.address.last_name = last;
    if (postalCode) data.address.postal_code = postalCode;
  }

  return data.email || data.phone_number || data.address ? data : undefined;
}

/**
 * Fires the Google Ads lead conversion once per dedupe key (per page load and,
 * where storage allows, per browser session). Returns true when it was sent.
 * user_data is set only when this call sends the conversion and Ads consent
 * already allows the Google tag.
 */
export function trackGoogleAdsLeadConversion(ctx: LeadContext = {}, dedupeKey?: string): boolean {
  if (typeof window === 'undefined') return false;
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  if (storageKey) {
    if (sentLeadKeys.has(storageKey)) return false;
    try {
      if (window.sessionStorage.getItem(storageKey) === 'sent') return false;
    } catch {
      // Storage can be unavailable under strict privacy settings; the in-memory guard still applies.
    }
  }
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return false;
  if (storageKey) {
    sentLeadKeys.add(storageKey);
    try {
      window.sessionStorage.setItem(storageKey, 'sent');
    } catch {
      // Ignore; in-memory guard is enough for this page load.
    }
  }
  if (ctx.allowEnhancedConversions !== false && googleAdsUserDataAllowed()) {
    const userData = googleAdsUserData(ctx.user);
    if (userData) gtag('set', 'user_data', userData);
  }
  gtag('event', 'conversion', googleAdsLeadParams(ctx, dedupeKey));
  return true;
}

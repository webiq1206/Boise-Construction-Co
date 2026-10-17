/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * One Google Ads conversion action ('P5 Raw Form Submitted') receives every
 * accepted lead, with a per-lead value so Google Ads can report ROAS by
 * campaign. Values are the per-lead estimates agreed with P5 on 14 Sept 2026
 * (form fallback in Google Ads is $50). Never pass PII here: no names, phones,
 * emails or free text - only a service/project category and an opaque id.
 */
export const GOOGLE_ADS_ID = 'AW-18354188204';
export const GOOGLE_ADS_LEAD_LABEL = 'AW-18354188204/LE2vCPXstO8cEKzf-q9E';
/** 'P5 Website Call (60s+)': swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = 'AW-18354188204/YHR0CIaPz_ccEKzf-q9E';
/** Click on a tel: link. Separate from the forwarding-number website-call action. */
export const GOOGLE_ADS_CALL_CLICK_LABEL = 'AW-18354188204/ng9fCPiOhaAdEKzf-q9E';
/** Click on an sms: link. */
export const GOOGLE_ADS_TEXT_CLICK_LABEL = 'AW-18354188204/lTxsCOqahaAdEKzf-q9E';
export const GOOGLE_ADS_PHONE_DISPLAY = '(208) 477-1169';
/** sessionStorage key written by GoogleAnalytics.tsx on the first page view. */
export const ENTRY_PATH_KEY = 'p5_entry_path';

export interface LeadContext {
  /** Unified estimator service id (e.g. 're10', 'cabinet-install'). */
  service?: string;
  /** Consultation form project type. */
  projectType?: string;
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

/**
 * Fires the Google Ads lead conversion once per dedupe key (per page load and,
 * where storage allows, per browser session). Returns true when it was sent.
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
  gtag('event', 'conversion', googleAdsLeadParams(ctx, dedupeKey));
  return true;
}

type AdsConsent = { ad_storage?: string; ad_user_data?: string };

/** Same gate as the website-call number swap: both Ads consent signals granted. */
export function googleAdsContactClickAllowed(consent?: AdsConsent): boolean {
  const current =
    consent ??
    (typeof window === 'undefined'
      ? undefined
      : (window as unknown as { p5Consent?: AdsConsent }).p5Consent);
  return current?.ad_storage === 'granted' && current?.ad_user_data === 'granted';
}

/**
 * The click conversion uses the same visitor gate as the Google tag bootstrap:
 * the live host, a real browser, and analytics not switched off. It also
 * requires ad_storage and ad_user_data to be granted. That default is the
 * separate K3 change in lib/consentBootstrap.ts. This pull request does not
 * set it, so the gate does not pass on main until K3 merges.
 */
export function googleAdsClickAnalyticsOn(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname?.toLowerCase() ?? '';
  if (host !== 'boiseconstruction.co' && host !== 'www.boiseconstruction.co') return false;
  if ((window.navigator as { webdriver?: boolean } | undefined)?.webdriver === true) return false;
  try {
    if (window.sessionStorage?.getItem('p5_analytics_disabled') === '1') return false;
  } catch {
    // Unavailable storage does not turn analytics off.
  }
  return true;
}

/** One Ads click conversion for a tel: or sms: href. Other hrefs are ignored. */
export function googleAdsContactClickSendTo(href: string): string | undefined {
  if (href.startsWith('sms:')) return GOOGLE_ADS_TEXT_CLICK_LABEL;
  if (href.startsWith('tel:')) return GOOGLE_ADS_CALL_CLICK_LABEL;
  return undefined;
}

/**
 * Fires one call or text click conversion. A second call is a second click.
 * The conversion object is only the send_to label. No enhanced-conversion
 * fields are attached. Analytics switched off, denied Ads consent, a missing
 * gtag, and any non tel:/sms: href send nothing.
 */
export function trackGoogleAdsContactClick(href: string): boolean {
  const sendTo = googleAdsContactClickSendTo(href);
  if (!sendTo || !googleAdsClickAnalyticsOn() || !googleAdsContactClickAllowed()) return false;
  if (typeof window === 'undefined') return false;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return false;
  try {
    gtag('event', 'conversion', { send_to: sendTo });
  } catch {
    return false;
  }
  return true;
}

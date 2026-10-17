/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * 'P5 Raw Form Submitted' receives every accepted lead, with a per-lead value
 * so Google Ads can report ROAS by campaign. Values are the per-lead estimates
 * agreed with P5 on 14 Sept 2026 (form fallback in Google Ads is $50).
 * Estimator finishes also report 'P5 Estimator Completed'. Never pass PII here:
 * no names, phones, emails or free text - only a service/project category and
 * an opaque id.
 */
export const GOOGLE_ADS_ID = 'AW-18354188204';
export const GOOGLE_ADS_LEAD_LABEL = 'AW-18354188204/LE2vCPXstO8cEKzf-q9E';
/** 'P5 Estimator Completed'. Secondary action for an estimator finish, not a substitute for the form lead. */
export const GOOGLE_ADS_ESTIMATOR_LABEL = 'AW-18354188204/cEzmCPOagKAdEKzf-q9E';
/** 'P5 Website Call (60s+)': swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = 'AW-18354188204/YHR0CIaPz_ccEKzf-q9E';
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

/** Estimator finish keys come from P5Estimator intake confirm and estimate submit. */
export function isEstimatorCompletionKey(dedupeKey?: string): boolean {
  return !!dedupeKey && (dedupeKey.startsWith('intake:') || dedupeKey.startsWith('estimator:'));
}

function claimSend(storageKey: string | undefined): boolean {
  if (!storageKey) return true;
  if (sentLeadKeys.has(storageKey)) return false;
  try {
    if (window.sessionStorage.getItem(storageKey) === 'sent') return false;
  } catch {
    // Storage can be unavailable under strict privacy settings; the in-memory guard still applies.
  }
  sentLeadKeys.add(storageKey);
  try {
    window.sessionStorage.setItem(storageKey, 'sent');
  } catch {
    // Ignore; in-memory guard is enough for this page load.
  }
  return true;
}

function fireConversion(
  gtag: (...args: unknown[]) => void,
  storageKey: string | undefined,
  params: object,
): boolean {
  if (!claimSend(storageKey)) return false;
  try {
    gtag('event', 'conversion', params);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fires Google Ads conversions once per dedupe key (per page load and, where
 * storage allows, per browser session). An estimator finish key fires
 * 'P5 Estimator Completed' and, because that finish submits the lead, the form
 * label. Any other key fires the form label only. Returns true when at least
 * one conversion was sent.
 */
export function trackGoogleAdsLeadConversion(ctx: LeadContext = {}, dedupeKey?: string): boolean {
  if (typeof window === 'undefined') return false;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return false;
  let sent = false;
  if (isEstimatorCompletionKey(dedupeKey)) {
    sent = fireConversion(gtag, `google_ads_estimator:${dedupeKey}`, {
      send_to: GOOGLE_ADS_ESTIMATOR_LABEL,
      transaction_id: dedupeKey,
    }) || sent;
  }
  sent = fireConversion(
    gtag,
    dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined,
    googleAdsLeadParams(ctx, dedupeKey),
  ) || sent;
  return sent;
}

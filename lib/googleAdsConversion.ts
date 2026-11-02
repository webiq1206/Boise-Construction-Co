/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * 'P5 Raw Form Submitted' receives an accepted lead, including an estimator
 * finish, with a per-lead value so Google Ads can report ROAS by campaign.
 * An intake or estimator finish also sends 'P5 Estimator Completed' once for
 * that key. Values are the per-lead estimates agreed with P5 on 14 Sept 2026
 * (form fallback in Google Ads is $50). Never pass PII here: no names, phones,
 * emails or free text - only a service/project category and an opaque id.
 */
export const GOOGLE_ADS_ID = 'AW-18354188204';
export const GOOGLE_ADS_LEAD_LABEL = 'AW-18354188204/LE2vCPXstO8cEKzf-q9E';
/** 'P5 Estimator Completed'. Estimator finish only. Not the consultation form. */
export const GOOGLE_ADS_ESTIMATOR_LABEL = 'AW-18354188204/cEzmCPOagKAdEKzf-q9E';
/** 'P5 Website Call (60s+)': swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = 'AW-18354188204/YHR0CIaPz_ccEKzf-q9E';
/** Click on a tel: link. Separate from the forwarding-number website-call action. */
export const GOOGLE_ADS_CALL_CLICK_LABEL = 'AW-18354188204/ng9fCPiOhaAdEKzf-q9E';
/** Click on an sms: link. One conversion per click. */
export const GOOGLE_ADS_TEXT_CLICK_LABEL = 'AW-18354188204/lTxsCOqahaAdEKzf-q9E';
export const GOOGLE_ADS_PHONE_DISPLAY = '(208) 477-1169';
/** sessionStorage key written by GoogleAnalytics.tsx on the first page view. */
export const ENTRY_PATH_KEY = 'p5_entry_path';

export interface LeadContext {
  /** Unified estimator service id (e.g. 're10', 'cabinet-install'). */
  service?: string;
  /** Consultation form project type. */
  projectType?: string;
  /**
   * Estimator finishes only. False skips the form/lead label for that key.
   * Omitted still sends it. The shared estimator calls this with two arguments
   * and does not pass this flag.
   */
  acceptedLead?: boolean;
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

function isEstimatorFinishKey(dedupeKey?: string): dedupeKey is string {
  return !!dedupeKey && (dedupeKey.startsWith('estimator:') || dedupeKey.startsWith('intake:'));
}

function alreadySent(storageKey: string): boolean {
  if (sentLeadKeys.has(storageKey)) return true;
  try {
    return window.sessionStorage.getItem(storageKey) === 'sent';
  } catch {
    return false;
  }
}

function markSent(storageKey: string) {
  sentLeadKeys.add(storageKey);
  try {
    window.sessionStorage.setItem(storageKey, 'sent');
  } catch {
    // Ignore; in-memory guard is enough for this page load.
  }
}

/**
 * GA4 lead event for an accepted estimator finish ('intake:' or 'estimator:'
 * key). It fires once, in the same place as the Google Ads lead conversion,
 * so GA4 and Ads count the same leads. Form inquiries ('conv_' ids and other
 * keys) already send generate_lead from the form, so they are skipped here to
 * avoid counting one lead twice.
 */
export function estimatorLeadGa4Params(ctx: LeadContext, dedupeKey?: string): Record<string, string> | null {
  if (!dedupeKey || !/^(?:intake|estimator):/.test(dedupeKey)) return null;
  return {
    lead_source: dedupeKey.startsWith('intake:') ? 'estimator_intake' : 'estimator',
    project_type: ctx.service || ctx.projectType || 'unknown',
    event_id: dedupeKey,
  };
}

type PendingConversion = { storageKey?: string; params: Record<string, unknown> };

function pendingConversions(ctx: LeadContext, dedupeKey?: string): PendingConversion[] {
  if (isEstimatorFinishKey(dedupeKey)) {
    const pending: PendingConversion[] = [];
    const estimatorKey = `google_ads_estimator:${dedupeKey}`;
    if (!alreadySent(estimatorKey)) {
      pending.push({
        storageKey: estimatorKey,
        params: { send_to: GOOGLE_ADS_ESTIMATOR_LABEL, transaction_id: dedupeKey },
      });
    }
    if (ctx.acceptedLead !== false) {
      const leadKey = `google_ads_lead:${dedupeKey}`;
      if (!alreadySent(leadKey)) pending.push({ storageKey: leadKey, params: googleAdsLeadParams(ctx, dedupeKey) });
    }
    return pending;
  }
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  if (storageKey && alreadySent(storageKey)) return [];
  return [{ storageKey, params: googleAdsLeadParams(ctx, dedupeKey) }];
}

/**
 * Fires Google Ads conversions once per key (per page load and, where storage
 * allows, per browser session). An `intake:` or `estimator:` key sends
 * Estimator Completed once, with that key as transaction_id, and also sends
 * the form label once for the same key unless `acceptedLead` is false.
 * A `conv_` inquiry id, and any other key, sends the form label only.
 * Returns true when at least one conversion was sent.
 */
export function trackGoogleAdsLeadConversion(ctx: LeadContext = {}, dedupeKey?: string): boolean {
  if (typeof window === 'undefined') return false;
  const pending = pendingConversions(ctx, dedupeKey);
  if (!pending.length) return false;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return false;
  for (const item of pending) {
    if (item.storageKey) markSent(item.storageKey);
    gtag('event', 'conversion', item.params);
    if (item.storageKey?.startsWith('google_ads_lead:')) {
      const ga4Lead = estimatorLeadGa4Params(ctx, dedupeKey);
      if (ga4Lead) gtag('event', 'generate_lead', ga4Lead);
    }
  }
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
 * requires ad_storage and ad_user_data to be granted. The consent bootstrap
 * starts those four signals granted, so a tap on the business number or a
 * Google forwarding number can be counted.
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

/** One Ads click conversion for a tel: or sms: href. The number itself is not checked. */
export function googleAdsContactClickSendTo(href: string): string | undefined {
  if (href.startsWith('sms:')) return GOOGLE_ADS_TEXT_CLICK_LABEL;
  if (href.startsWith('tel:')) return GOOGLE_ADS_CALL_CLICK_LABEL;
  return undefined;
}

/**
 * Fires one call or text click conversion. A second call is a second click.
 * The conversion object is only the send_to label. No phone number, email,
 * or user_data is attached.
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

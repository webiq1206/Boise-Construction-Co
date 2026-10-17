/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * 'P5 Raw Form Submitted' is the consultation form submit. Estimator finishes
 * report 'P5 Estimator Completed' instead, and do not also send the form label.
 * Values are the per-lead estimates agreed with P5 on 14 Sept 2026 (form
 * fallback in Google Ads is $50). Never pass PII here: no names, phones,
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
const waitingLeadKeys = new Set<string>();

type GtagFn = (...args: unknown[]) => void;

/** Twenty half-second checks: ten seconds for lazy gtag, then give up. */
export const GTAG_READY_WAIT_MS = 500;
export const GTAG_READY_ATTEMPTS = 20;

function readGtag(): GtagFn | undefined {
  if (typeof window === 'undefined') return undefined;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof gtag === 'function' ? gtag : undefined;
}

/**
 * Calls fire once gtag exists. A missing library retries for ten seconds
 * and then drops the call. The marker is not written by this waiter.
 */
export function whenGtagReady(fire: (gtag: GtagFn) => void, attempt = 0): void {
  if (typeof window === 'undefined') return;
  const gtag = readGtag();
  if (gtag) {
    fire(gtag);
    return;
  }
  if (attempt >= GTAG_READY_ATTEMPTS) return;
  const schedule = (window as unknown as { setTimeout?: typeof setTimeout }).setTimeout ?? setTimeout;
  schedule(() => whenGtagReady(fire, attempt + 1), GTAG_READY_WAIT_MS);
}

function leadAlreadySent(storageKey?: string): boolean {
  if (!storageKey) return false;
  if (sentLeadKeys.has(storageKey)) return true;
  try {
    return window.sessionStorage.getItem(storageKey) === 'sent';
  } catch {
    return false;
  }
}

function sendConversion(storageKey: string | undefined, payload: () => Record<string, unknown>): boolean {
  if (leadAlreadySent(storageKey)) return false;
  const gtag = readGtag();
  if (!gtag) return false;
  if (storageKey) {
    sentLeadKeys.add(storageKey);
    try {
      window.sessionStorage.setItem(storageKey, 'sent');
    } catch {
      // Ignore; in-memory guard is enough for this page load.
    }
  }
  try {
    gtag('event', 'conversion', payload());
  } catch {
    // A tracking failure must not break the form or the estimator.
  }
  return true;
}

/**
 * Fires one conversion once per storage key. A missing gtag retries for ten
 * seconds and still fires at most once. The sent marker is written only
 * when gtag is ready. gtag itself is called inside try/catch.
 */
function queueConversion(storageKey: string | undefined, payload: () => Record<string, unknown>): boolean {
  if (typeof window === 'undefined') return false;
  if (leadAlreadySent(storageKey) || (storageKey && waitingLeadKeys.has(storageKey))) return false;
  if (readGtag()) return sendConversion(storageKey, payload);
  if (storageKey) waitingLeadKeys.add(storageKey);
  let fired = false;
  whenGtagReady(() => {
    if (storageKey) waitingLeadKeys.delete(storageKey);
    if (fired) return;
    fired = true;
    sendConversion(storageKey, payload);
  });
  return false;
}

/** Estimator finish keys come from P5Estimator intake confirm and estimate submit. */
export function isEstimatorCompletionKey(dedupeKey?: string): boolean {
  return !!dedupeKey && (dedupeKey.startsWith('intake:') || dedupeKey.startsWith('estimator:'));
}

export type LeadConversionOptions = {
  /**
   * Kept so existing callers still type-check. Estimator keys never send the
   * form label, so this flag does not add or remove a conversion.
   */
  accepted?: boolean;
};

/**
 * Fires one Google Ads conversion. An estimator finish (`intake:` or
 * `estimator:`) fires 'P5 Estimator Completed' once, with that raw key as
 * `transaction_id`. A consultation form id, and any other key, fires the form
 * label only. If gtag is not loaded yet, the retry waits ten seconds and
 * still fires at most once. Returns true when the conversion was sent
 * immediately.
 */
export function trackGoogleAdsLeadConversion(
  ctx: LeadContext = {},
  dedupeKey?: string,
  _options?: LeadConversionOptions,
): boolean {
  void _options;
  if (typeof window === 'undefined') return false;
  if (isEstimatorCompletionKey(dedupeKey) && dedupeKey) {
    return queueConversion(`google_ads_estimator:${dedupeKey}`, () => ({
      send_to: GOOGLE_ADS_ESTIMATOR_LABEL,
      transaction_id: dedupeKey,
    }));
  }
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  return queueConversion(storageKey, () => googleAdsLeadParams(ctx, dedupeKey));
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
 * requires ad_storage and ad_user_data to be granted. lib/consentBootstrap.ts
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

/** One Ads click conversion for a tel: or sms: href. Other hrefs are ignored. The number itself is not checked. */
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

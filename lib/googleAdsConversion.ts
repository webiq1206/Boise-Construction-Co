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
   * True when the endpoint returned accepted===true. False for a submit
   * replay `{accepted:false, duplicate:true}`, which sends only the estimator
   * label. The shared engine omits this argument.
   */
  accepted?: boolean;
};

/**
 * Fires Google Ads conversions. An estimator finish fires
 * 'P5 Estimator Completed' once for that raw key. The form label fires for
 * the same key (`intake:${projectId}` or `estimator:${draftId}`), once per
 * key, unless `accepted` is false. Any other key fires the form label only.
 * If gtag is not loaded yet, the retry waits ten seconds and still fires at
 * most once. Returns true when at least one conversion was sent immediately.
 */
export function trackGoogleAdsLeadConversion(
  ctx: LeadContext = {},
  dedupeKey?: string,
  options?: LeadConversionOptions,
): boolean {
  if (typeof window === 'undefined') return false;
  if (isEstimatorCompletionKey(dedupeKey) && dedupeKey) {
    const estimatorSent = queueConversion(`google_ads_estimator:${dedupeKey}`, () => ({
      send_to: GOOGLE_ADS_ESTIMATOR_LABEL,
      transaction_id: dedupeKey,
    }));
    if (options?.accepted === false) return estimatorSent;
    const formSent = queueConversion(`google_ads_lead:${dedupeKey}`, () => googleAdsLeadParams(ctx, dedupeKey));
    return estimatorSent || formSent;
  }
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  return queueConversion(storageKey, () => googleAdsLeadParams(ctx, dedupeKey));
}

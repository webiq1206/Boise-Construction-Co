/**
 * Thin, safe wrapper over gtag for conversion events. GA is loaded via
 * @next/third-parties, which exposes window.gtag once ready; if it is not
 * present (GA disabled, blocked, or SSR) the call is a no-op.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

const GOOGLE_ADS_LEAD_DESTINATION =
  'AW-18354188204/LE2vCPXstO8cEKzf-q9E';
const conversionInFlight = new Set<string>();

export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params);
}

/** Optional first-party identifiers for Conversions API match quality. */
export interface MetaUserData {
  email?: string;
  phone?: string;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Fires a Meta (Facebook) standard event through BOTH the browser Pixel and the
 * server-side Conversions API, sharing one eventID so Meta deduplicates them
 * (counts the conversion once, but keeps the signal that ad blockers / ITP would
 * otherwise strip from the browser). The Pixel is loaded via components/MetaPixel
 * (lazyOnload). Both paths are best-effort no-ops when unavailable:
 * fbq is guarded, and /api/meta-capi silently skips if the CAPI token is unset.
 *
 * Pass a standard event name (e.g. 'Lead'). `userData` (email/phone) is optional
 * but greatly improves server-side match quality; it is hashed on the server and
 * never sent to the Pixel.
 */
export function trackMetaEvent(
  name: string,
  params: GtagParams = {},
  userData?: MetaUserData,
  stableEventId?: string,
): void {
  if (typeof window === 'undefined') return;

  const eventId =
    stableEventId ??
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === 'function') {
    fbq('track', name, params, { eventID: eventId });
  }

  // Server-side copy, deduped via eventId. Fire-and-forget; never block or throw.
  try {
    fetch('/api/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventName: name,
        eventId,
        eventSourceUrl: window.location.href,
        actionSource: 'website',
        customData: params,
        userData,
        fbp: readCookie('_fbp'),
        fbc: readCookie('_fbc'),
      }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/**
 * Sends the native Google Ads lead conversion with a stable transaction ID.
 * The ID is opaque and server-issued, so no contact information reaches Ads.
 */
export function trackGoogleAdsLead(conversionId: string): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_LEAD_DESTINATION,
    transaction_id: conversionId,
  });
}

export interface ClaimedLeadConversion {
  inquiryKey: string;
  claimKey: string;
  conversionId: string;
  ga4Params: GtagParams;
  metaParams: GtagParams;
}

/**
 * Claims one persisted inquiry before sending any lead analytics. The browser
 * marks the stable conversion ID locally before calling vendors, while the
 * server claim protects duplicate callbacks and other tabs.
 */
async function performClaimedLeadConversion(
  input: ClaimedLeadConversion,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (conversionInFlight.has(input.conversionId)) return false;
  conversionInFlight.add(input.conversionId);

  try {
    const tracking = await import('@/lib/inquiryTracking');
    const current = tracking.readInquiryTracking();
    if (
      current?.conversionId === input.conversionId &&
      current.conversionFiredAt
    ) {
      return false;
    }

    let eligible = false;
    try {
      const response = await fetch('/api/inquiry-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryKey: input.inquiryKey,
          claimKey: input.claimKey,
          conversionId: input.conversionId,
        }),
      });
      if (!response.ok) return false;
      const result = (await response.json()) as {
        eligible?: boolean;
        conversionId?: string;
      };
      eligible =
        result.eligible === true &&
        result.conversionId === input.conversionId;
    } catch {
      return false;
    }

    if (!eligible) return false;

    tracking.markInquiryConversionFired(input.conversionId);
    trackEvent('generate_lead', input.ga4Params);
    trackGoogleAdsLead(input.conversionId);
    trackMetaEvent('Lead', input.metaParams, undefined, input.conversionId);

    try {
      await fetch('/api/inquiry-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          inquiryKey: input.inquiryKey,
          claimKey: input.claimKey,
          conversionId: input.conversionId,
          acknowledge: true,
        }),
      });
    } catch {
      /* The stable local marker and vendor IDs still guard a browser retry. */
    }

    return true;
  } finally {
    conversionInFlight.delete(input.conversionId);
  }
}

export async function trackClaimedLeadConversion(
  input: ClaimedLeadConversion,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const lockManager = navigator.locks;
  if (!lockManager) {
    return performClaimedLeadConversion(input);
  }
  return lockManager.request(
    `boise-construction-lead:${input.conversionId}`,
    () => performClaimedLeadConversion(input),
  );
}

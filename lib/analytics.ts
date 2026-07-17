/**
 * Thin, safe wrapper over gtag for conversion events. GA is loaded via
 * @next/third-parties, which exposes window.gtag once ready; if it is not
 * present (GA disabled, blocked, or SSR) the call is a no-op.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params);
}

/**
 * Thin, safe wrapper over the Meta (Facebook) Pixel's fbq. The pixel is loaded
 * via components/MetaPixel with strategy="lazyOnload", which defines window.fbq
 * before any user interaction. If fbq is absent (pixel disabled, blocked, dev,
 * or SSR) the call is a no-op. Pass a Meta standard event name such as 'Lead'.
 */
export function trackMetaEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq !== 'function') return;
  fbq('track', name, params);
}

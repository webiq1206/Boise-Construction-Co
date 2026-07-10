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

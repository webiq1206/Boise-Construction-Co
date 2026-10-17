import { trackEvent } from '@/lib/analytics';
import { trackGoogleAdsContactClick } from '@/lib/googleAdsConversion';

/** Staff tools are outside the public call and text tap. */
export function contactClickExcludedPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/portal' || pathname.startsWith('/portal/');
}

/**
 * One delegated contact click. GA4 contact_click stays on the existing path.
 * Any tel: or sms: link outside /admin and /portal also sends one Google Ads
 * conversion when Ads consent is already granted. The number in the href is
 * not compared with the business number. The caller runs this once per click.
 */
export function trackDelegatedContactClick(href: string, pathname = ''): void {
  if ((href.startsWith('tel:') || href.startsWith('sms:')) && contactClickExcludedPath(pathname)) return;
  if (href.startsWith('tel:')) {
    trackEvent('contact_click', { method: 'phone', link_url: href });
    trackGoogleAdsContactClick(href);
  } else if (href.startsWith('sms:')) {
    trackEvent('contact_click', { method: 'sms', link_url: href });
    trackGoogleAdsContactClick(href);
  } else if (href.startsWith('mailto:')) {
    trackEvent('contact_click', { method: 'email', link_url: href });
  } else if (href === '#consult' || href.endsWith('/#consult')) {
    trackEvent('cta_click', { cta: 'secondary', location: pathname });
  }
}

type Clickable = EventTarget & {
  closest?: (selector: string) => { getAttribute(name: string): string | null } | null;
};

/** One capture listener. The returned function removes that same listener. */
export function bindDelegatedContactClicks(target: EventTarget = document): () => void {
  const onClick = (event: Event) => {
    const node = event.target as Clickable | null;
    const link = node?.closest?.('a[href]');
    if (!link) return;
    const pathname = typeof window === 'undefined' ? '' : window.location?.pathname || '';
    trackDelegatedContactClick(link.getAttribute('href') || '', pathname);
  };
  target.addEventListener('click', onClick, { capture: true });
  return () => target.removeEventListener('click', onClick, { capture: true });
}

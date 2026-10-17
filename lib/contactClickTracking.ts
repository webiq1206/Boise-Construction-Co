import { trackEvent } from '@/lib/analytics';
import { trackGoogleAdsContactClick } from '@/lib/googleAdsConversion';

/**
 * One delegated contact click. GA4 contact_click stays on the existing path.
 * A tel: or sms: click also sends one Google Ads conversion when Ads consent
 * is already granted. The caller runs this once per click.
 */
export function trackDelegatedContactClick(href: string, pathname = ''): void {
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

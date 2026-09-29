import { googleTagBootstrap } from '@/lib/analyticsBootstrap';
import Script from 'next/script';

/**
 * GA4 property "Boise Construction Co" (account 396104300, stream
 * 15431262968, boiseconstruction.co).
 *
 * The default used to be G-NGE449QF9Y, which is the measurement ID for the
 * SEPARATE "Boise Remodeling Co" property - a leftover from when this site
 * was duplicated from boiseremodeling.co. Every session, event and
 * conversion this site produced was landing in the remodeling company's
 * reports. A measurement ID is public (it ships in the page source), so
 * keeping a literal default is safe and means analytics work even if the
 * env var is never set; the bug was that the literal named the wrong
 * property, not that it existed.
 */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-VTVTQZ8JCD';

/** Load only for real visitors on this brand's live hostname. */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !GA_MEASUREMENT_ID) return null;
  return (
    <Script id="ga-init" strategy="lazyOnload">
      {googleTagBootstrap({
        hostname: 'boiseconstruction.co',
        measurementId: GA_MEASUREMENT_ID,
        adsId: 'AW-18354188204',
        phoneConversionLabel: 'YHR0CIaPz_ccEKzf-q9E',
        phoneNumber: '(208) 477-1169',
      })}
    </Script>
  );
}

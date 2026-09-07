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
const GOOGLE_ADS_ID = 'AW-18354188204';

/**
 * Loads GA4 with strategy="lazyOnload" so the ~150KB gtag payload stays off the
 * mobile critical path (a Speed Index / LCP win on throttled connections) while
 * still defining window.gtag before any user interaction. Conversion events fire
 * from lib/analytics.ts on click, which always happens after idle, so nothing is
 * lost; lib/analytics guards on gtag existing anyway.
 */
export function GoogleAnalytics() {
  // Only load analytics in production so local/dev traffic never pollutes the
  // real GA property (and dev network stays quiet for tooling/screenshots).
  if (process.env.NODE_ENV !== 'production') return null;
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}

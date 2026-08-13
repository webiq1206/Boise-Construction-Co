import Script from 'next/script';

/**
 * Meta dataset "Boise Construction Co" (925837669911613).
 *
 * This used to default to 2461987544292871, which is the "Boise Remodeling Co"
 * dataset - the third and last of the analytics identifiers this site
 * inherited when it was duplicated from boiseremodeling.co, after GA4 and
 * Clarity. Confirmed in Events Manager: that dataset is named "Boise
 * Remodeling Co", lists boiseremodeling.co among its websites, and was still
 * receiving PageView events from here.
 *
 * A dataset ID is public (it ships in the page source), so a literal default
 * is safe; the bug was that the literal named someone else's dataset.
 *
 * THE SERVER SIDE MUST MATCH. app/api/meta-capi/route.ts falls back to this
 * same env var for its dataset id, and its META_CAPI_ACCESS_TOKEN is scoped to
 * a specific dataset. Changing the pixel without reissuing that token sends
 * browser events to the new dataset while server events keep going to the old
 * one - worse than either, because the two halves of the same conversion land
 * in different places and deduplication silently stops working.
 */
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '925837669911613';

/**
 * Loads the Meta (Facebook) Pixel with strategy="afterInteractive" so the
 * automatic PageView fires as soon as the page is interactive - NOT after the
 * full page load + browser idle that "lazyOnload" waits for.
 *
 * Why this matters: Meta counts that PageView as a Landing Page View and uses
 * it (plus Lead) to optimize delivery. With lazyOnload, paid traffic that
 * bounced in the first few seconds left before the pixel fired, so those visits
 * never registered an LPV - undercounting landing-page views and starving the
 * optimizer of early signal. afterInteractive keeps the fbevents payload off
 * the LCP critical path while still firing PageView promptly and reliably.
 *
 * Conversion events (e.g. Lead on estimate completion) fire from
 * lib/analytics.ts via trackMetaEvent, which guards on fbq existing anyway.
 * No-op outside production, so local/dev traffic never pollutes the real dataset.
 */
export function MetaPixel() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (!META_PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
    </Script>
  );
}

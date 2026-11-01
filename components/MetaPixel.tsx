import Script from 'next/script';
import { deferVendorLoad,vendorScriptTag } from '@/lib/deferredVendorScript';

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
 * The fbq stub, dataset init and the automatic PageView run as soon as the
 * page is interactive (strategy="afterInteractive"), so those calls are queued
 * on the stub from the start. The fbevents.js file itself is held back until
 * the visitor first interacts (pointerdown, keydown, scroll, touchstart) or 5
 * seconds after load, whichever comes first (lib/deferredVendorScript.ts):
 * the family rule is no third-party script before interaction except gtag.
 * When the file arrives it flushes the queue, so PageView and any Lead fired
 * in between are still sent, in order.
 *
 * Known cost of that rule (reported with the Phase 5 change): a visitor who leaves within 5
 * seconds without touching, scrolling or typing no longer registers a
 * PageView (Landing Page View) in Meta. Server-side Lead events via
 * /api/meta-capi are unaffected.
 *
 * Conversion events (e.g. Lead on estimate completion) fire from
 * lib/analytics.ts via trackMetaEvent, which guards on fbq existing; the stub
 * exists from the start, so they queue rather than drop.
 * No-op outside production, so local/dev traffic never pollutes the real dataset.
 */
export function MetaPixel() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (!META_PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}(window);
fbq('set','autoConfig',false,'${META_PIXEL_ID}');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');
${deferVendorLoad(vendorScriptTag('https://connect.facebook.net/en_US/fbevents.js'))}`}
    </Script>
  );
}

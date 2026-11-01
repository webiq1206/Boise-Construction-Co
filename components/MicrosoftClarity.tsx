import Script from 'next/script';
import { deferVendorLoad,vendorScriptTag } from '@/lib/deferredVendorScript';

/**
 * Clarity project "boiseconstruction.co" (y1sf0nz948).
 *
 * This used to be x5wrjdadlb, which is the project for the SEPARATE
 * "boiseremodeling.co" site - the same inherited-ID bug that sent this site's
 * GA4 traffic to the remodeling company's property, from the same cause: this
 * site was duplicated from that one and kept its analytics identifiers.
 *
 * The consequence here is arguably worse than the GA one. Clarity records
 * SESSIONS and builds HEATMAPS, so every recording of someone using the
 * estimator on boiseconstruction.co was filed under boiseremodeling.co, and
 * both sites' heatmaps were averaged over two different page layouts - which
 * makes them not merely misattributed but meaningless.
 *
 * A Clarity project ID is public (it ships in the page source), so a literal
 * default is safe; the bug was that the literal named the wrong project.
 */
const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? 'y1sf0nz948';

/**
 * The clarity() queue stub runs once the page is interactive; the tag file
 * from www.clarity.ms waits for the first interaction (pointerdown, keydown,
 * scroll, touchstart) or 5 seconds after load, whichever comes first
 * (lib/deferredVendorScript.ts). Calls made before then queue on the stub and
 * flush when the tag loads. The form mask (lib/clarityFormMask, installed
 * beforeInteractive in app/layout.tsx) is in place long before either.
 */
export function MicrosoftClarity() {
  // Production-only: keep dev sessions out of Clarity heatmaps/recordings.
  if (process.env.NODE_ENV !== 'production') return null;
  if (!CLARITY_PROJECT_ID) return null;
  return (
    <Script
      id="clarity-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,a){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};})(window,"clarity");
${deferVendorLoad(vendorScriptTag(`https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}?ref=bwt`))}`,
      }}
    />
  );
}

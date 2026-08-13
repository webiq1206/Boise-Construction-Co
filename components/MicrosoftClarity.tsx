import Script from 'next/script';

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

export function MicrosoftClarity() {
  // Production-only: keep dev sessions out of Clarity heatmaps/recordings.
  if (process.env.NODE_ENV !== 'production') return null;
  if (!CLARITY_PROJECT_ID) return null;
  return (
    <Script
      id="clarity-script"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}?ref=bwt";
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`,
      }}
    />
  );
}

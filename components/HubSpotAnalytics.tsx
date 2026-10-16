'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Family HubSpot portal 247066159 (the same portal as CANONICAL_PORTAL).
 *
 * next/script strategy="lazyOnload" injects the loader after the window
 * load event, so the analytics script stays off the LCP path. The loader
 * still records the page view when it runs. Later client-side navigations
 * are queued on _hsq, which the loader drains once it is on the page.
 */
const HUBSPOT_PORTAL_ID = '247066159';

type HubSpotWindow = Window & { _hsq?: unknown[][] };

export function HubSpotAnalytics() {
  const pathname = usePathname();
  const firstView = useRef(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const queue = ((window as HubSpotWindow)._hsq ??= []);
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    queue.push(['setPath', pathname]);
    queue.push(['trackPageView']);
  }, [pathname]);

  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <Script
      id="hs-script-loader"
      src={`https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`}
      strategy="lazyOnload"
    />
  );
}

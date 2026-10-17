'use client';

import { isEstimatorPath } from '@/lib/p5/estimatorRoutes';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { usePathname } from 'next/navigation';

/** Call and text for estimator routes, which do not render the marketing header. */
export function EstimatorFoldContact() {
  const pathname = usePathname();
  if (!isEstimatorPath(pathname)) return null;
  return (
    <nav aria-label="Call or text" data-estimator-fold-contact data-testid="estimator-fold-contact">
      <a href={SITE_CONFIG.phoneHref} data-testid="link-call-estimator">
        Call
      </a>
      <a href={SITE_CONFIG.phoneSmsHref} data-testid="link-text-estimator">
        Text
      </a>
    </nav>
  );
}

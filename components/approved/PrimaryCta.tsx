'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { familyButtonClass } from '@/components/family/Button';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { INSTANT_ESTIMATE_PATH } from '@/shared/instantEstimate';

/**
 * The one primary action on a page body, in the family button face
 * (components/family/Button.tsx): charcoal with paper text and the ochre bar on
 * light grounds, 48px, square, 16px sentence case. On photo and dark grounds the
 * surrounding `.primary-cta` rules in app/approved-interiors.css flip it to the
 * paper fill, which is the family hero variant. `primary-cta` stays as the
 * layout hook those rules and the interior templates use.
 *
 * With no props it is the sitewide primary action: "Get an instant estimate",
 * to the framed estimator at /instant-estimate (owner decision, 13 November
 * 2026). Pass href and children for any other action, such as the quote request.
 */
export function PrimaryCta({
  href = INSTANT_ESTIMATE_PATH,
  children = CTA_PRIMARY,
  className,
  trackingLocation,
  onClick,
  ...rest
}: {
  href?: string;
  children?: ReactNode;
  className?: string;
  trackingLocation?: string;
  onClick?: () => void;
  'data-testid'?: string;
}) {
  const pathname = usePathname();
  return (
    <a
      {...rest}
      href={href}
      className={familyButtonClass({ variant: 'primary', size: 'lg', className: cn('primary-cta', className) })}
      onClick={() => {
        trackEvent('cta_click', { cta: 'primary', location: trackingLocation ?? pathname ?? '' });
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}

/** Quiet text action beside a primary CTA (phone, consultation): the family tertiary. Never a second button. */
export function HeroTextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={familyButtonClass({ variant: 'tertiary', className: cn('hero-text-link', className) })}>
      {children}
    </a>
  );
}

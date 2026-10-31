'use client';

import { ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { CTA_PRIMARY } from '@/shared/ctaCopy';

/**
 * The one primary action on a page body. Charcoal fill with paper text on
 * light grounds; paper fill with charcoal text on photo and dark grounds (the
 * flip comes from the surrounding `--primary` tokens, see `.primary-cta` in
 * app/approved-interiors.css), so a page never shows two primary styles.
 * Header and mobile-bar actions keep their own chrome components.
 */
export function PrimaryCta({
  href = '/estimate',
  children = CTA_PRIMARY,
  className,
  arrow = true,
  trackingLocation,
  onClick,
  ...rest
}: {
  href?: string;
  children?: ReactNode;
  className?: string;
  arrow?: boolean;
  trackingLocation?: string;
  onClick?: () => void;
  'data-testid'?: string;
}) {
  const pathname = usePathname();
  return (
    <a
      {...rest}
      href={href}
      className={cn('primary-cta', className)}
      onClick={() => {
        trackEvent('cta_click', { cta: 'primary', location: trackingLocation ?? pathname ?? '' });
        onClick?.();
      }}
    >
      {children}
      {arrow && <ArrowUpRight size={18} aria-hidden="true" />}
    </a>
  );
}

/** Quiet text action beside a primary CTA (phone, consultation). Never a second button. */
export function HeroTextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={cn('hero-text-link', className)}>
      {children}
    </a>
  );
}

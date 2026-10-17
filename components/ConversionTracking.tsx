'use client';

import { useEffect } from 'react';
import { trackDelegatedContactClick } from '@/lib/contactClickTracking';

/**
 * Site-wide conversion tracking for call/text/email intent. Uses a single
 * delegated click listener so every tel:/sms:/mailto: link across the site
 * (nav, hero, footer, sticky bar, contact page) fires a GA event without
 * instrumenting each one. A tel: or sms: click also fires one Google Ads
 * conversion when Ads consent is already granted. Form submits are tracked
 * at the form (generate_lead).
 */
export function ConversionTracking() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      trackDelegatedContactClick(link.getAttribute('href') || '', window.location.pathname);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}

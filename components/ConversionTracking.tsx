'use client';

import { useEffect } from 'react';
import { bindDelegatedContactClicks } from '@/lib/contactClickTracking';

/**
 * Site-wide conversion tracking for call/text/email intent. Uses a single
 * delegated click listener so every tel:/sms:/mailto: link across the site
 * (nav, hero, footer, sticky bar, contact page) fires a GA event without
 * instrumenting each one. A tel: or sms: click also fires one Google Ads
 * conversion when Ads consent is already granted, including a Google
 * forwarding number. Form submits are tracked at the form (generate_lead).
 */
export function ConversionTracking() {
  useEffect(() => bindDelegatedContactClicks(), []);

  return null;
}

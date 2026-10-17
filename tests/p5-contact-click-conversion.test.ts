import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GOOGLE_ADS_CALL_CLICK_LABEL,
  GOOGLE_ADS_TEXT_CLICK_LABEL,
  googleAdsContactClickAllowed,
  trackGoogleAdsContactClick,
} from '../lib/googleAdsConversion.ts';
import { trackDelegatedContactClick } from '../lib/contactClickTracking.ts';

const granted = { ad_storage: 'granted', ad_user_data: 'granted' } as const;
const denied = { ad_storage: 'denied', ad_user_data: 'denied' } as const;

function installWindow(consent: { ad_storage: string; ad_user_data: string }) {
  const events: unknown[][] = [];
  const prior = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    p5Consent: { ...consent },
    gtag: (...args: unknown[]) => events.push(args),
    location: { pathname: '/contact' },
  };
  return {
    events,
    restore() {
      if (prior === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = prior;
    },
  };
}

test('call and text clicks send one Ads conversion each when consent is granted', () => {
  const window = installWindow(granted);
  try {
    assert.equal(googleAdsContactClickAllowed(), true);
    assert.equal(trackDelegatedContactClick('tel:2084771169', '/'), undefined);
    assert.equal(trackDelegatedContactClick('sms:+12084771169', '/contact'), undefined);
    const conversions = window.events.filter((event) => event[0] === 'event' && event[1] === 'conversion');
    assert.equal(conversions.length, 2);
    assert.equal((conversions[0][2] as { send_to: string }).send_to, GOOGLE_ADS_CALL_CLICK_LABEL);
    assert.equal((conversions[1][2] as { send_to: string }).send_to, GOOGLE_ADS_TEXT_CLICK_LABEL);
    assert.equal(conversions[0][2] && Object.keys(conversions[0][2] as object).join(','), 'send_to');
    const contactClicks = window.events.filter((event) => event[1] === 'contact_click');
    assert.equal(contactClicks.length, 2);
    assert.equal((contactClicks[0][2] as { method: string }).method, 'phone');
    assert.equal((contactClicks[1][2] as { method: string }).method, 'sms');
  } finally {
    window.restore();
  }
});

test('a second click sends a second conversion and one click sends only one', () => {
  const window = installWindow(granted);
  try {
    trackGoogleAdsContactClick('tel:+12084771169');
    assert.equal(window.events.length, 1);
    trackGoogleAdsContactClick('tel:+12084771169');
    assert.equal(window.events.length, 2);
    assert.equal((window.events[0][2] as { send_to: string }).send_to, GOOGLE_ADS_CALL_CLICK_LABEL);
    assert.equal((window.events[1][2] as { send_to: string }).send_to, GOOGLE_ADS_CALL_CLICK_LABEL);
  } finally {
    window.restore();
  }
});

test('denied or partial Ads consent sends the GA click and skips the Ads conversion', () => {
  const window = installWindow(denied);
  try {
    trackDelegatedContactClick('tel:2084771169');
    trackDelegatedContactClick('sms:2084771169');
    assert.equal(window.events.filter((event) => event[1] === 'conversion').length, 0);
    assert.equal(window.events.filter((event) => event[1] === 'contact_click').length, 2);
    (globalThis as { window: { p5Consent: { ad_storage: string; ad_user_data: string } } }).window.p5Consent = {
      ad_storage: 'granted',
      ad_user_data: 'denied',
    };
    assert.equal(trackGoogleAdsContactClick('tel:2084771169'), false);
    assert.equal(window.events.filter((event) => event[1] === 'conversion').length, 0);
  } finally {
    window.restore();
  }
});

test('email and consultation clicks do not send a call or text conversion', () => {
  const window = installWindow(granted);
  try {
    trackDelegatedContactClick('mailto:hello@boiseconstruction.co');
    trackDelegatedContactClick('/contact#consult');
    trackDelegatedContactClick('https://boiseconstruction.co/contact');
    assert.equal(window.events.filter((event) => event[1] === 'conversion').length, 0);
    assert.equal(window.events.filter((event) => event[1] === 'contact_click').length, 1);
    assert.equal((window.events[0][2] as { method: string }).method, 'email');
    assert.equal(trackGoogleAdsContactClick(''), false);
  } finally {
    window.restore();
  }
});

test('a missing gtag does not throw and does not report the click conversion', () => {
  const prior = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { p5Consent: granted };
  try {
    assert.equal(trackGoogleAdsContactClick('sms:2084771169'), false);
  } finally {
    if (prior === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = prior;
  }
});

test('the site listener is one capture-phase tel and sms delegation', () => {
  const source = fs.readFileSync(new URL('../components/ConversionTracking.tsx', import.meta.url), 'utf8');
  assert.match(source, /trackDelegatedContactClick\(link\.getAttribute\('href'\)/);
  assert.match(source, /addEventListener\('click', onClick, \{ capture: true \}\)/);
  assert.equal(source.split('trackDelegatedContactClick').length - 1, 2);
  assert.doesNotMatch(source, /phone_conversion_number/);
});

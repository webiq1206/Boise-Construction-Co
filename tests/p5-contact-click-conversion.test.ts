import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GOOGLE_ADS_CALL_CLICK_LABEL,
  GOOGLE_ADS_TEXT_CLICK_LABEL,
  googleAdsContactClickAllowed,
  trackGoogleAdsContactClick,
} from '../lib/googleAdsConversion.ts';
import { bindDelegatedContactClicks, trackDelegatedContactClick } from '../lib/contactClickTracking.ts';

const granted = { ad_storage: 'granted', ad_user_data: 'granted' } as const;
const denied = { ad_storage: 'denied', ad_user_data: 'denied' } as const;

function installWindow(
  consent: { ad_storage: string; ad_user_data: string },
  options: { disabled?: boolean; webdriver?: boolean; hostname?: string } = {},
) {
  const events: unknown[][] = [];
  const storage = new Map(options.disabled ? [['p5_analytics_disabled', '1']] : []);
  const prior = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    p5Consent: { ...consent, analytics_storage: 'granted', ad_personalization: 'granted' },
    gtag: (...args: unknown[]) => events.push(args),
    location: { pathname: '/contact', hostname: options.hostname ?? 'boiseconstruction.co' },
    navigator: { webdriver: options.webdriver === true },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
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

test('call and text conversions set no user_data and send no personal data', () => {
  const window = installWindow(granted);
  try {
    assert.equal(trackGoogleAdsContactClick('tel:+12084771169'), true);
    assert.equal(trackGoogleAdsContactClick('sms:+12084771169'), true);
    trackDelegatedContactClick('tel:2084771169', '/contact');
    trackDelegatedContactClick('sms:2084771169', '/contact');
    const sets = window.events.filter((event) => event[0] === 'set');
    assert.deepEqual(sets, []);
    assert.equal(window.events.some((event) => event.includes('user_data')), false);
    const conversions = window.events.filter((event) => event[0] === 'event' && event[1] === 'conversion');
    assert.equal(conversions.length, 4);
    for (const event of conversions) {
      const payload = event[2] as Record<string, unknown>;
      assert.deepEqual(Object.keys(payload).sort(), ['send_to']);
      assert.equal(
        /email|phone_number|first_name|last_name|address|user_data|2084771169|\+1/i.test(JSON.stringify(payload)),
        false,
      );
    }
    const source = fs.readFileSync(new URL('../lib/googleAdsConversion.ts', import.meta.url), 'utf8');
    const body = source.slice(source.indexOf('export function trackGoogleAdsContactClick'));
    assert.match(body, /gtag\('event', 'conversion', \{ send_to: sendTo \}\)/);
    assert.equal(body.includes("gtag('set'"), false);
    assert.equal(body.includes('user_data'), false);
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

test('analytics switched off sends no call or text conversion and still records the GA click', () => {
  for (const options of [
    { disabled: true },
    { webdriver: true },
    { hostname: 'localhost' },
  ]) {
    const window = installWindow(granted, options);
    try {
      trackDelegatedContactClick('tel:2084771169');
      trackDelegatedContactClick('sms:2084771169');
      assert.equal(window.events.filter((event) => event[1] === 'conversion').length, 0);
      assert.equal(window.events.filter((event) => event[1] === 'contact_click').length, 2);
    } finally {
      window.restore();
    }
  }
});

test('strict-mode rebinding leaves one listener, so one click fires once', () => {
  const window = installWindow(granted);
  try {
    class Link extends EventTarget {
      constructor(private href: string) { super(); }
      getAttribute(name: string) { return name === 'href' ? this.href : null; }
      closest() { return this; }
    }
    const call = new Link('tel:2084771169');
    const text = new Link('sms:2084771169');
    const first = bindDelegatedContactClicks(call);
    const second = bindDelegatedContactClicks(call);
    first();
    call.dispatchEvent(new Event('click'));
    assert.equal(window.events.filter((event) => event[1] === 'conversion').length, 1);
    second();
    call.dispatchEvent(new Event('click'));
    const textBind = bindDelegatedContactClicks(text);
    text.dispatchEvent(new Event('click'));
    textBind();
    text.dispatchEvent(new Event('click'));
    const conversions = window.events.filter((event) => event[1] === 'conversion');
    assert.equal(conversions.length, 2);
    assert.equal((conversions[0][2] as { send_to: string }).send_to, GOOGLE_ADS_CALL_CLICK_LABEL);
    assert.equal((conversions[1][2] as { send_to: string }).send_to, GOOGLE_ADS_TEXT_CLICK_LABEL);
  } finally {
    window.restore();
  }
});

test('any tel or sms outside admin and portal fires without matching the business number', () => {
  const window = installWindow(granted);
  try {
    trackDelegatedContactClick('tel:+15555550123', '/contact');
    trackDelegatedContactClick('sms:5555550199', '/services/custom-homes');
    trackDelegatedContactClick('tel:+15555550123', '/admin');
    trackDelegatedContactClick('sms:5555550199', '/admin/p5-estimators');
    trackDelegatedContactClick('tel:+15555550123', '/portal');
    trackDelegatedContactClick('sms:5555550199', '/portal/jobs');
    const conversions = window.events.filter((event) => event[1] === 'conversion');
    assert.equal(conversions.length, 2);
    assert.equal((conversions[0][2] as { send_to: string }).send_to, GOOGLE_ADS_CALL_CLICK_LABEL);
    assert.equal((conversions[1][2] as { send_to: string }).send_to, GOOGLE_ADS_TEXT_CLICK_LABEL);
    assert.equal(JSON.stringify(conversions).includes('555'), false);
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

test('landing chrome links call and text to the configured number', () => {
  const nav = fs.readFileSync(new URL('../components/Navigation.tsx', import.meta.url), 'utf8');
  const estimator = fs.readFileSync(new URL('../components/EstimatorFoldContact.tsx', import.meta.url), 'utf8');
  const layout = fs.readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const home = fs.readFileSync(new URL('../components/approved/ApprovedHome.tsx', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../app/audit-accessibility.css', import.meta.url), 'utf8');
  assert.match(nav, /data-testid="link-call-header"[\s\S]*href=\{SITE_CONFIG\.phoneHref\}|href=\{SITE_CONFIG\.phoneHref\}[\s\S]*data-testid="link-call-header"/);
  assert.match(nav, /href=\{SITE_CONFIG\.phoneSmsHref\}[\s\S]*data-testid="link-text-header"/);
  assert.match(estimator, /href=\{SITE_CONFIG\.phoneHref\}/);
  assert.match(estimator, /href=\{SITE_CONFIG\.phoneSmsHref\}/);
  assert.match(estimator, /isEstimatorPath/);
  assert.match(layout, /<EstimatorFoldContact \/>/);
  assert.match(home, /href=\{SITE_CONFIG\.phoneHref\}/);
  assert.match(home, /href=\{SITE_CONFIG\.phoneSmsHref\}/);
  assert.doesNotMatch(home, /tel:\+12084771169|sms:\+12084771169/);
  assert.match(css, /\[data-mobile-nav-bar\]\[data-p5-actions-ready="false"\]/);
  assert.match(css, /data-estimator-fold-contact/);
});

test('the site listener is bound once and does not add the forwarding snippet', () => {
  const component = fs.readFileSync(new URL('../components/ConversionTracking.tsx', import.meta.url), 'utf8');
  const layout = fs.readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const helper = fs.readFileSync(new URL('../lib/contactClickTracking.ts', import.meta.url), 'utf8');
  assert.match(component, /useEffect\(\(\) => bindDelegatedContactClicks\(\), \[\]\)/);
  assert.equal(component.split('bindDelegatedContactClicks').length - 1, 2);
  assert.equal(layout.split('<ConversionTracking />').length - 1, 1);
  assert.match(helper, /addEventListener\('click', onClick, \{ capture: true \}\)/);
  assert.match(helper, /removeEventListener\('click', onClick, \{ capture: true \}\)/);
  assert.doesNotMatch(component + helper, /phone_conversion_number/);
});

test('the privacy page states what a call or text tap tells Google Ads', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const sentence =
    'We use Google Analytics 4 (GA4) to understand how visitors use this site and Google Ads to measure which of our ads lead to quote requests, calls and texts. These tools set cookies and receive information about your visit, including your IP address, which Google processes under its own privacy policy (<a href="https://policies.google.com/privacy">https://policies.google.com/privacy</a>). When you tap Call or Text on our site, Google Ads is told that the tap happened, on which page, and the ad click identifier Google\'s tag saved if you arrived from one of our ads, so we can count calls and texts that come from our ads. The tap itself doesn\'t send Google your name, your own phone number or what you say or write. Google Analytics also records the tap, including the number tapped, which is our business number.';
  assert.equal(privacy.includes(sentence), true);
  assert.equal(privacy.includes('Google Ads receives a random reference number'), false);
  assert.equal(privacy.includes('We do not send your name, email or phone number to Meta.'), false);
  assert.equal(privacy.includes('our server may send Meta the Lead event'), true);
  assert.equal(privacy.includes('we may send Meta the Lead event'), false);
});

test('the forwarding sentence stands alone immediately after the Google Analytics tap sentence', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const paired =
    "Google Analytics also records the tap, including the number tapped, which is our business number.\n            </p>\n            <p>\n              If your call goes through a Google forwarding number, Google connects the call and can see the calling number and call length, but not what's said.\n            </p>";
  assert.equal(privacy.includes(paired), true);
});

test('the privacy page places the cookies section before data security', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const toc =
    '{"id":"document-section-4","label":"Information Sharing"},{"id":"cookies-analytics-advertising","label":"Cookies, analytics and advertising"},{"id":"document-section-5","label":"Data Security"}';
  assert.equal(privacy.includes(toc), true);
  const headingAt = privacy.indexOf('<h2 id="cookies-analytics-advertising">');
  const securityAt = privacy.indexOf('<h2 id="document-section-5">');
  const collectAt = privacy.indexOf('<h2 id="document-section-2">');
  assert.equal(headingAt > collectAt && headingAt < securityAt, true);
  assert.equal(privacy.includes('id="document-section-8"'), false);
});

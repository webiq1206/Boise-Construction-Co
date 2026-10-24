import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { consentBootstrap } from '../lib/consentBootstrap.ts';
import { googleTagBootstrap } from '../lib/analyticsBootstrap.ts';

const CONSENT_KEYS = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'] as const;

test('Google consent defaults are granted before any tag config', () => {
  const window: {
    dataLayer: unknown[][];
    p5Consent: Record<string, string>;
    gtag: (...args: unknown[]) => void;
    p5UpdateConsent: (value: Record<string, string>) => void;
    dispatchEvent: () => void;
  } = { dataLayer: [], p5Consent: {}, dispatchEvent() {} } as never;
  vm.runInNewContext(consentBootstrap(), {
    window,
    CustomEvent: class {
      constructor(public type: string) {}
    },
  });
  const defaults = window.dataLayer[0][2] as Record<string, string | number>;
  assert.equal(window.dataLayer[0][0], 'consent');
  assert.equal(window.dataLayer[0][1], 'default');
  for (const key of CONSENT_KEYS) {
    assert.equal(window.p5Consent[key], 'granted', key);
    assert.equal(defaults[key], 'granted', key);
  }
  assert.equal(defaults.wait_for_update, 500);
  window.p5UpdateConsent({ ad_storage: 'denied' });
  assert.equal(window.p5Consent.ad_storage, 'denied');
  assert.equal(window.p5Consent.analytics_storage, 'granted');
});

test('the tag bootstrap queues consent default before config and before the tag script', () => {
  const nodes: Record<string, unknown>[] = [];
  const window = {
    location: { hostname: 'boiseconstruction.co', pathname: '/' },
    dataLayer: [] as unknown[][],
    addEventListener() {},
    p5Consent: { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' },
  };
  const context = vm.createContext({
    window,
    navigator: { webdriver: false },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    document: {
      getElementById: (id: string) => nodes.find((node) => node.id === id),
      createElement: () => ({}),
      head: { appendChild: (node: Record<string, unknown>) => nodes.push(node) },
    },
  });
  vm.runInContext(
    googleTagBootstrap({
      hostname: 'boiseconstruction.co',
      measurementId: 'G-TEST',
      adsId: 'AW-TEST',
      phoneConversionLabel: 'CALL',
      phoneNumber: '(208) 477-1169',
    }),
    context,
  );
  const consentAt = window.dataLayer.findIndex((row) => row[0] === 'consent' && row[1] === 'default');
  const configAt = window.dataLayer.findIndex((row) => row[0] === 'config');
  assert.equal(consentAt >= 0, true);
  assert.equal(configAt > consentAt, true);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST');
});

test('the consent snippet is in the head before the vendor tags', () => {
  const layout = fs.readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const consentAt = layout.indexOf('id="p5-consent"');
  const googleAt = layout.indexOf('<GoogleAnalytics />');
  const metaAt = layout.indexOf('<MetaPixel />');
  const clarityAt = layout.indexOf('<MicrosoftClarity />');
  assert.ok(consentAt > 0);
  assert.ok(googleAt > consentAt);
  assert.ok(metaAt > consentAt);
  assert.ok(clarityAt > consentAt);
});

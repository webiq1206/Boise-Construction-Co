import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { consentBootstrap } from '../lib/consentBootstrap.ts';

const CONSENT_KEYS = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'] as const;

test('Google consent defaults are granted and a later update can deny one signal', () => {
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

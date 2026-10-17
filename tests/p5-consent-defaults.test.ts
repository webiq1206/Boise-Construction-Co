import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {consentBootstrap} from '../lib/consentBootstrap.ts';

const CONSENT_KEYS = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'] as const;

test('Google consent defaults grant analytics and ad storage', () => {
  const window: any = {dispatchEvent() {}};
  vm.runInNewContext(consentBootstrap(), {window, CustomEvent: class { constructor(public type: string) {} }});
  const defaults = window.dataLayer[0][2];
  assert.equal(window.dataLayer[0][0], 'consent');
  assert.equal(window.dataLayer[0][1], 'default');
  for (const key of CONSENT_KEYS) {
    assert.equal(window.p5Consent[key], 'granted', key);
    assert.equal(defaults[key], 'granted', key);
  }
  assert.equal(defaults.wait_for_update, 500);
});

test('privacy page discloses Google Analytics, Google Ads, remarketing, and Meta', () => {
  const source = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /Google Analytics 4/);
  assert.match(source, /Google Ads conversion tracking/);
  assert.match(source, /We do not currently send your name, email, phone number or project details to Google\./);
  assert.match(source, /Google's tag also adds visitors to remarketing lists, and Google may use this data to show you relevant ads on other websites \(remarketing\)\./);
  assert.doesNotMatch(source, /personalise ads/);
  assert.match(source, /https:\/\/adssettings\.google\.com/);
  assert.match(source, /https:\/\/tools\.google\.com\/dlpage\/gaoptout/);
  assert.match(source, /Meta Pixel and Meta's Conversions API/);
  assert.match(source, /https:\/\/www\.facebook\.com\/privacy\/policy/);
});

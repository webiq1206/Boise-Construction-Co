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
  assert.match(source, /Last updated: October 17, 2026/);
  assert.match(source, /Cookies, analytics and advertising\./);
  assert.match(source, /We use Google Analytics 4 \(GA4\) to understand how visitors use this site, such as pages viewed, referring site, approximate location, browser and device type\./);
  assert.match(source, /We use Google Ads conversion tracking to measure which of our ads lead to calls, form submissions and completed estimates\./);
  assert.match(source, /Google's tag also adds visitors to remarketing lists, and Google may use this data to show you relevant ads on other websites \(remarketing\)\./);
  assert.doesNotMatch(source, /show our ads to people who have visited this site/);
  assert.match(source, /https:\/\/policies\.google\.com\/privacy/);
  assert.match(source, /We do not currently send your name, email, phone number, address or project description to Google; Google Analytics receives only the type of project you choose \(for example, an addition or an ADU\) when you use the estimator or send an inquiry, and the words you type into our blog search\./);
  assert.match(source, /Calls from our site or ads may be routed through a Google forwarding number so we can measure which ads lead to calls\./);
  assert.doesNotMatch(source, /or project details to Google/);
  assert.doesNotMatch(source, /personalise ads/);
  assert.match(source, /https:\/\/adssettings\.google\.com/);
  assert.match(source, /https:\/\/tools\.google\.com\/dlpage\/gaoptout/);
  assert.match(source, /We also use the Meta Pixel and Meta's Conversions API to measure visits and inquiries from our Facebook and Instagram ads\./);
  assert.match(source, /When you submit an inquiry, we may send Meta the Lead event, the page address, the project type, the inquiry category, your IP address, your browser user agent, and the Meta cookies _fbp and _fbc so it can match the inquiry to an ad\./);
  assert.match(source, /https:\/\/www\.facebook\.com\/privacy\/policy/);
  assert.match(source, /TODO \(pending Larry's approval\): Microsoft Clarity disclosure goes here\. Final wording is not approved yet\./);
  assert.match(source, /id="document-section-1"/);
  assert.match(source, /id="document-section-7"/);
});

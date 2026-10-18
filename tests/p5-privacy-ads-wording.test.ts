import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the privacy page states what a call or text tap tells Google Ads', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const sentence =
    'We use Google Analytics 4 (GA4) to understand how visitors use this site and Google Ads to measure which of our ads lead to quote requests, calls and texts. These tools set cookies and receive information about your visit, including your IP address, which Google processes under its own privacy policy (<a href="https://policies.google.com/privacy">https://policies.google.com/privacy</a>). When you tap Call or Text on our site, Google Ads is told that the tap happened, on which page, and the ad click identifier Google\'s tag saved if you arrived from one of our ads, so we can count calls and texts that come from our ads. The tap itself doesn\'t send Google your name, your own phone number or what you say or write. Google Analytics also records the tap, including the number tapped, which is our business number.';
  assert.equal(privacy.includes(sentence), true);
  assert.equal(privacy.includes('our server may send Meta the Lead event'), true);
  const hashed =
    "Depending on Meta's settings, the pixel may also collect contact details you type into a form, in hashed form.";
  const clickSentence = "Meta's pixel may also record which buttons you click and basic information about the page, such as its title.";
  assert.equal(privacy.includes(hashed), true);
  assert.equal(privacy.indexOf(hashed) > privacy.indexOf(clickSentence), true);
  assert.match(privacy, /form fields are masked so what you type is not recorded/);
  assert.match(privacy, /href="https:\/\/privacy\.microsoft\.com\/privacystatement"/);
});

test('the forwarding sentence stands alone immediately after the Google Analytics tap sentence', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const paired =
    "Google Analytics also records the tap, including the number tapped, which is our business number.\n            </p>\n            <p>\n              If your call goes through a Google forwarding number, Google connects the call and can see the calling number and call length, but not what's said.\n            </p>";
  assert.equal(privacy.includes(paired), true);
});

test('the forwarding sentence is present only when the website-call label is configured', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const analytics = fs.readFileSync(new URL('../components/GoogleAnalytics.tsx', import.meta.url), 'utf8');
  const replacement = fs.readFileSync(new URL('../lib/googlePhoneReplacement.ts', import.meta.url), 'utf8');
  const conversion = fs.readFileSync(new URL('../lib/googleAdsConversion.ts', import.meta.url), 'utf8');
  const forwarding =
    "If your call goes through a Google forwarding number, Google connects the call and can see the calling number and call length, but not what's said.";
  const label = 'AW-18354188204/YHR0CIaPz_ccEKzf-q9E';
  const labelPresent =
    analytics.includes("adsId: 'AW-18354188204'") &&
    analytics.includes("phoneConversionLabel: 'YHR0CIaPz_ccEKzf-q9E'") &&
    analytics.includes("phoneNumber: '(208) 477-1169'") &&
    replacement.includes("config.adsId+'/'+config.phoneConversionLabel") &&
    replacement.includes('phone_conversion_number:config.phoneNumber') &&
    conversion.includes(`export const GOOGLE_ADS_WEBSITE_CALL_LABEL = '${label}'`);
  assert.equal(privacy.includes(forwarding), labelPresent);
});

test('the privacy page keeps ad click ids and campaign tags for 90 days with the inquiry', () => {
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  const paragraph =
    'If you arrive from one of our ads or a link with campaign tags, our site saves the ad click identifier from that link (such as gclid, gbraid, wbraid or dclid) and the campaign tags in your browser for up to 90 days. If you then send an inquiry, we keep them with your inquiry in our customer records so we can tell which ad or campaign led to it.';
  const at = privacy.indexOf(paragraph);
  const afterVendors = privacy.indexOf('https://www.facebook.com/privacy/policy');
  const securityAt = privacy.indexOf('<h2 id="document-section-5">');
  assert.equal(at > afterVendors && at < securityAt, true);
  assert.equal(privacy.includes('Last updated: October 17, 2026'), true);
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
});

test('Meta turns automatic config off before init and passes no user data', () => {
  const pixel = fs.readFileSync(new URL('../components/MetaPixel.tsx', import.meta.url), 'utf8');
  const setAt = pixel.indexOf("fbq('set','autoConfig',false,'${META_PIXEL_ID}');");
  const initAt = pixel.indexOf("fbq('init','${META_PIXEL_ID}');");
  assert.equal(setAt > 0, true);
  assert.equal(initAt > setAt, true);
  assert.equal(/fbq\('init','\$\{META_PIXEL_ID\}',\s*\{/.test(pixel), false);
});

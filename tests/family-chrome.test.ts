import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeHero } from '../components/approved/HomeHero.tsx';
import { Footer } from '../components/Footer.tsx';
import { matchesRoute } from '../lib/family/types.ts';
import { FAMILY_BRAND, PARENT_GOOGLE_PROFILE } from '../lib/familyBrand.ts';
import { BUSINESS_VCARD_PATH } from '../lib/vcard.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { P5_SOCIAL } from '../shared/gbpProfile.ts';
import { GUIDE_PAGES } from '../shared/guideContent.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';
import { SITE_TAGLINE } from '../shared/siteContent.ts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Phase 2 family chrome: the shared components read every Construction fact from
// lib/familyBrand.ts. These pin that the config says what the site says.
test('the brand config carries this site’s facts, one CTA and one destination', () => {
  assert.equal(FAMILY_BRAND.id, 'construction');
  assert.equal(FAMILY_BRAND.cta.label, 'Request a quote');
  // scripts/verify-p5-mobile-seo.mjs pins exactly one a[href="/estimate"] in the bar.
  assert.equal(FAMILY_BRAND.cta.href, '/estimate');
  assert.equal(FAMILY_BRAND.phone.display, '(208) 477-1169');
  assert.equal(FAMILY_BRAND.phone.telHref, SITE_CONFIG.phoneHref);
  assert.equal(FAMILY_BRAND.phone.smsHref, SITE_CONFIG.phoneSmsHref);
  assert.equal(FAMILY_BRAND.email, SITE_CONFIG.email);
  assert.equal(FAMILY_BRAND.saveContactHref, BUSINESS_VCARD_PATH);
  assert.equal(FAMILY_BRAND.tagline, `${SITE_TAGLINE}.`);
  assert.equal(FAMILY_BRAND.parentFacebook.href, P5_SOCIAL.facebook);
  assert.equal(PARENT_GOOGLE_PROFILE.href, 'https://www.google.com/search?kgmid=/g/11ntl1t7dc');
  assert.match(FAMILY_BRAND.nap.line, /4031 W Wapoot St, Meridian, ID 83646/);
  assert.equal(FAMILY_BRAND.accent, '#c48d3f');
  assert.equal(FAMILY_BRAND.accentInk, '#78531e');
  // Approved C7 check: the bar is on the first screen below 1180px.
  assert.equal(FAMILY_BRAND.bar.showOverHero, true);
  assert.equal(FAMILY_BRAND.header.desktopFrom, 1180);
  // The quote wizard and the estimator own the bottom of the screen.
  for (const path of ['/estimate', '/estimate/scope', '/estimate/p5-preview']) assert.equal(matchesRoute(path, FAMILY_BRAND.bar.hiddenOn), true, path);
  for (const path of ['/', '/estimates', '/services']) assert.equal(matchesRoute(path, FAMILY_BRAND.bar.hiddenOn), false, path);
  // Dark header only over the homepage photograph.
  assert.equal(matchesRoute('/', FAMILY_BRAND.header.darkOn), true);
  assert.equal(matchesRoute('/services', FAMILY_BRAND.header.darkOn), false);
  // Navigation labels are sentence case.
  for (const link of FAMILY_BRAND.nav) assert.equal(link.label.slice(1), link.label.slice(1).toLowerCase(), link.label);
});

test('every footer link group points at a published page', () => {
  const published = new Set(GUIDE_PAGES.map((guide) => `/guides/${guide.slug}`));
  const resources = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Resources');
  assert.ok(resources);
  const pillars = resources.links.filter((item) => item.href.startsWith('/guides/'));
  assert.equal(pillars.length, 3);
  for (const link of pillars) assert.ok(published.has(link.href), link.href);
  const services = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Services');
  assert.equal(services?.links.length, SERVICES.length + 1);
  assert.equal(FAMILY_BRAND.footer.areas.links.length, CITIES.length);
});

test('the footer renders the family row, NAP, hours and one registration link, with no headings', () => {
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.equal(/<h[1-6]\b/.test(html), false);
  for (const name of ['P5 Home Co', 'Boise Remodeling Co', 'Boise Handyman Co', 'Boise Cabinet Co']) {
    assert.match(html, new RegExp(`<a href="https://[^"]+" rel="noopener">${name}</a>`), name);
  }
  assert.match(html, /<span class="fam-footer-current" aria-current="true">Boise Construction Co<\/span>/);
  assert.equal(/rel="noopener noreferrer">(P5 Home Co|Boise)/.test(html), false);
  assert.match(html, /data-family-row=""/);
  assert.match(html, /Public representative: Nick Perkins/);
  assert.match(html, /Hours: Mon to Fri 9 to 6, Sat 9 to 4 Mountain\. Closed Sunday\./);
  assert.match(html, /mailto:hello@boiseconstruction\.co/);
  assert.match(html, /href="\/contact\.vcf"/);
  assert.match(html, /is a DBA of <a href="https:\/\/p5homeco\.com" rel="noopener">P5 Home Co LLC<\/a>/);
  assert.match(html, /<a href="\/api\/login" rel="nofollow">Subcontractor login<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.google\.com\/search\?kgmid=\/g\/11ntl1t7dc" rel="noopener" target="_blank" data-testid="link-footer-google">P5 Home Co on Google<\/a>/);
  assert.match(html, /Boise ADU Co projects currently run through Boise Construction Co; its site is coming\./);
  assert.equal((html.match(/>P5 Home Co LLC, Idaho Registered Contractor #8381215<\/a>/g) ?? []).length, 1);
  // Boise ADU Co is not in the family row until its own site exists.
  assert.equal(/>Boise ADU Co</.test(html), false);
});

test('the homepage hero is the family template with sourced proof', () => {
  const html = renderToStaticMarkup(React.createElement(HomeHero));
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  // Same H1 words as before the rollout.
  assert.match(html, /<h1 class="fam-hero-title" id="family-hero-title">Custom home builder in Boise\. <span class="fam-hero-accent">Built around you\.<\/span><\/h1>/);
  const cta = html.match(/<a [^>]*data-hero-cta="primary"[^>]*>([^<]+)<\/a>/);
  assert.ok(cta, 'hero primary CTA');
  assert.match(cta[0], /href="\/estimate"/);
  assert.match(cta[0], /fam-btn--hero fam-btn--lg/);
  assert.equal(cta[1], 'Request a quote');
  assert.match(html, /<a href="tel:\+12084771169" class="fam-hero-link">Call or text \(208\) 477-1169<\/a>/);
  assert.match(html, /<picture class="fam-hero-media"><source media="\(max-width: 1023px\)"/);
  assert.match(html, /Concept design imagery/);
  const support = html.match(/<p class="fam-hero-support">([^<]+)<\/p>/)?.[1] ?? '';
  assert.ok(support.split(/\s+/).length <= 14, support);
  // Proof: only facts already published on the site.
  assert.match(html, /Line-item budget before construction/);
  assert.match(html, /Written updates every Friday/);
  assert.match(html, /One accountable design-build team/);
  assert.match(html, /P5 Home Co LLC, Idaho Registered Contractor #8381215/);
});

test('the shared chrome matches its manifest and stays brand-agnostic', () => {
  const out = execFileSync(process.execPath, ['scripts/verify-family-chrome.mjs'], { encoding: 'utf8' });
  assert.match(out, /shared files match boise-remodeling-co/);
  const manifest = JSON.parse(readFileSync('lib/family/manifest.json', 'utf8'));
  assert.equal(manifest.source, 'boise-remodeling-co');
  assert.equal('lib/familyBrand.ts' in manifest.files, false);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['verify:family-chrome'], 'node scripts/verify-family-chrome.mjs');
  assert.match(pkg.scripts.prebuild, /npm run verify:family-chrome/);
});

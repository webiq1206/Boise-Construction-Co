import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Footer } from '../components/Footer.tsx';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import { P5_PARENT_ORGANIZATION } from '../lib/schema.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { GBP_SOCIAL, P5_SOCIAL } from '../shared/gbpProfile.ts';
import { CITY_SERVICE_META_DESCRIPTIONS, SERVICE_META_DESCRIPTIONS } from '../shared/metaDescriptions.ts';
import { CITY_SERVICE_COPY } from '../shared/content/cityServiceCopy.ts';
import { SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { resolveQuotedRange } from '../shared/costs/resolve.ts';
import {
  EMPTY_REFINEMENTS,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getSetRefinementKeys,
  type EstimateRefinements,
} from '../shared/estimateEngine.ts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Owner, 20 November 2026: the vanity URL of the same page.
const P5_FACEBOOK = 'https://www.facebook.com/p5homeco';
const P5_INSTAGRAM = 'https://www.instagram.com/p5_home_co';
const P5_MAPS = 'https://maps.google.com/?cid=11869148461693849141';
const P5_GOOGLE = 'https://www.google.com/search?kgmid=/g/11ntl1t7dc';
const P5_BBB = 'https://www.bbb.org/us/id/meridian/profile/general-contractor/p5-home-co-llc-1296-1000203624';
const RETIRED_FACEBOOK = 'profile.php?id=61592885025074';

test('the owner Facebook page and Google profile describe P5 Home Co, not this brand', () => {
  assert.equal(P5_SOCIAL.facebook, P5_FACEBOOK);
  assert.equal(P5_SOCIAL.google, P5_GOOGLE);
  // Owner decision A (1 November 2026): the one Google Business Profile is
  // P5 Home Co's, so it joins the Facebook page on the parent node only.
  assert.equal(P5_SOCIAL.bbb, P5_BBB);
  assert.deepEqual([...P5_PARENT_ORGANIZATION.sameAs], [P5_FACEBOOK, P5_INSTAGRAM, P5_GOOGLE, P5_MAPS, P5_BBB]);
  assert.doesNotMatch(JSON.stringify(P5_PARENT_ORGANIZATION), /rating|accreditation|grade/i);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_MAPS), false);
  assert.equal(GBP_SOCIAL.facebook, undefined);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_FACEBOOK), false);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_GOOGLE), false);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_BBB), false);
  for (const url of BUSINESS_INFO.sameAs) assert.doesNotMatch(url, /facebook\.com|kgmid|bbb\.org/);
});

test('the retired Facebook profile is gone and the footer labels the parent page', () => {
  for (const file of ['shared/gbpProfile.ts', 'lib/seo.ts', 'lib/schema.ts', 'components/Footer.tsx']) {
    assert.equal(readFileSync(file, 'utf8').includes(RETIRED_FACEBOOK), false, file);
  }
  // The footer is the shared family SiteFooter (Phase 2); the brand config hands it the
  // parent's page and its label, and the rendered link carries both.
  assert.equal(FAMILY_BRAND.parentFacebook.href, P5_SOCIAL.facebook);
  assert.equal(FAMILY_BRAND.parentFacebook.label, 'P5 Home Co on Facebook');
  const footer = renderToStaticMarkup(React.createElement(Footer));
  assert.match(footer, /<a href="https:\/\/www\.facebook\.com\/p5homeco" rel="noopener" target="_blank" data-testid="link-footer-facebook">P5 Home Co on Facebook<\/a>/);
  // Owner decision A: the parent's Google profile sits beside its Facebook page.
  assert.match(footer, /href="https:\/\/www\.google\.com\/search\?kgmid=\/g\/11ntl1t7dc"/);
  assert.match(footer, />P5 Home Co on Google</);
});

/*
 * Shop home pricing. From 1 November 2026 the site published this site's own
 * line-item engine's quoted range for 1,600 sq ft of living space with a 1,200
 * sq ft shop. Since 21 November 2026 (owner: "We should always base everything
 * off of the engine as long as you're getting the actual numbers from the
 * engine/cost book. I do not want to mislead people") shop home copy quotes
 * only the P5 instant estimator, the house and the shop separately
 * (tests/p5-published-figures.test.ts). The engine still prices shop home
 * requests for the team, so its example is computed here on the same path the
 * assistant and /api/consultation take, and must appear in no published copy.
 */
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function shopExample(finish: 'refresh' | 'mid-range') {
  const refinements = { ...EMPTY_REFINEMENTS, shopSize: 1200 } as EstimateRefinements;
  const maxFields = getMaxRefinementFields('shop-home');
  const detail = countVisibleUserRefinements('shop-home', getSetRefinementKeys(refinements));
  const range = resolveQuotedRange('shop-home', finish, 1600, refinements, maxFields > 0 ? detail / maxFields : 0);
  assert.ok(range);
  return range;
}

const SHOP_FILES = [
  'shared/content/wave2/shop-homes-and-barndominiums-idaho.ts',
  'shared/content/pillars/boise-home-building-cost-guide.ts',
  'shared/content/pillars/custom-home-design-guide.ts',
  'shared/content/cityServiceCopy.ts',
  'shared/seoContent.ts',
  'shared/gbpProfile.ts',
  'shared/metaDescriptions.ts',
  'shared/contentData.ts',
  'shared/resourcePdfContent.ts',
  'public/llms.txt',
  'public/llms-full.txt',
];

test('the line-item engine\'s shop home example is published nowhere', () => {
  // The engine's own numbers, unchanged (scripts/verify-new-construction.ts holds them too).
  const essential = shopExample('refresh');
  const signature = shopExample('mid-range');
  assert.deepEqual([essential.priceLow, essential.priceHigh], [385_000, 520_000]);
  assert.deepEqual([signature.priceLow, signature.priceHigh], [465_000, 630_000]);
  const engineFigures = [essential.priceLow, essential.priceHigh, signature.priceLow, signature.priceHigh].map(usd);
  for (const file of SHOP_FILES) {
    const text = readFileSync(file, 'utf8');
    for (const figure of engineFigures) assert.equal(text.includes(figure), false, `${file} still publishes ${figure}`);
    assert.doesNotMatch(text, /\$330,000|\$330k|\$55 (to|and|-) \$60/, file);
    assert.doesNotMatch(text, /our estimator (returns|puts|prices|gives|budgets)/, file);
  }
  const service = SERVICE_SEO_CONTENT['shop-homes-barndominiums'];
  assert.match(service.faqs[0].answer, /instant estimate/);
  assert.match(service.costGuidance!.paragraphs.join(' '), /instant estimate/);
  for (const [city, page] of Object.entries(CITY_SERVICE_COPY['shop-homes-barndominiums'])) {
    const answer = page.faqs[0].answer;
    assert.match(answer, /instant estimate/, city);
    assert.match(answer, /land/, city);
  }
});

test('no old shop home band or example survives anywhere it was published', () => {
  for (const file of SHOP_FILES) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\$1[45]0 (to|and) \$250|\$1[45]0.\$250|\$200 (on )?average/, file);
    assert.doesNotMatch(text, /\$420,000|\$560,000|\$265,000/, file);
  }
  // $500,000 and $700,000 also appear in unrelated copy (permit fee tiers, a
  // builder-choice guide), so those two are checked on the shop copy only.
  const shopOnly = [
    JSON.stringify(CITY_SERVICE_COPY['shop-homes-barndominiums']),
    JSON.stringify(SERVICE_SEO_CONTENT['shop-homes-barndominiums']),
    readFileSync('shared/content/wave2/shop-homes-and-barndominiums-idaho.ts', 'utf8'),
  ].join(' ');
  assert.doesNotMatch(shopOnly, /\$500,000|\$700,000/);
  const shopMeta = [
    SERVICE_META_DESCRIPTIONS['shop-homes-barndominiums'],
    ...Object.entries(CITY_SERVICE_META_DESCRIPTIONS)
      .filter(([key]) => key.startsWith('shop-homes-barndominiums/'))
      .map(([, value]) => value),
  ];
  for (const meta of shopMeta) assert.doesNotMatch(meta, /per sq ft/);
});

test('the estimate audit no longer carries a shop home band the site does not publish', async () => {
  const { PUBLISHED_PER_SF } = await import('../shared/plans/estimateAudit.ts');
  assert.equal(PUBLISHED_PER_SF['shop-home'], undefined);
});

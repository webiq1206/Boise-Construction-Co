import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const P5_FACEBOOK = 'https://www.facebook.com/1228704823655951';
const P5_GOOGLE = 'https://www.google.com/search?kgmid=/g/11ntl1t7dc';
const RETIRED_FACEBOOK = 'profile.php?id=61592885025074';

test('the owner Facebook page and Google profile describe P5 Home Co, not this brand', () => {
  assert.equal(P5_SOCIAL.facebook, P5_FACEBOOK);
  assert.equal(P5_SOCIAL.google, P5_GOOGLE);
  // Owner decision A (1 November 2026): the one Google Business Profile is
  // P5 Home Co's, so it joins the Facebook page on the parent node only.
  assert.deepEqual([...P5_PARENT_ORGANIZATION.sameAs], [P5_FACEBOOK, P5_GOOGLE]);
  assert.equal(GBP_SOCIAL.facebook, undefined);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_FACEBOOK), false);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_GOOGLE), false);
  for (const url of BUSINESS_INFO.sameAs) assert.doesNotMatch(url, /facebook\.com|kgmid/);
});

test('the retired Facebook profile is gone and the footer labels the parent page', () => {
  for (const file of ['shared/gbpProfile.ts', 'lib/seo.ts', 'lib/schema.ts', 'components/Footer.tsx']) {
    assert.equal(readFileSync(file, 'utf8').includes(RETIRED_FACEBOOK), false, file);
  }
  const footer = readFileSync('components/Footer.tsx', 'utf8');
  assert.match(footer, /href=\{P5_SOCIAL\.facebook\}/);
  assert.match(footer, /aria-label="P5 Home Co on Facebook"/);
  assert.match(footer, /href=\{P5_SOCIAL\.google\}/);
  assert.match(footer, /aria-label="P5 Home Co on Google"/);
});

/*
 * Shop home pricing, owner-approved fix of 1 November 2026. The site used to
 * publish a $150 to $250 per square foot band (about $200 average) and a
 * $420,000 to $700,000 example (about $560,000) that the estimator never
 * returned for the same inputs. The published example is now the estimator's
 * own quoted range per finish level, computed here on the same path the
 * assistant and /api/consultation take, and formatted the way the assistant
 * prints it. If a rate change moves these numbers, this fails until the copy
 * moves with it.
 */
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function shopExample(finish: 'refresh' | 'mid-range') {
  const refinements = { ...EMPTY_REFINEMENTS, shopSize: 1200 } as EstimateRefinements;
  const maxFields = getMaxRefinementFields('shop-home');
  const detail = countVisibleUserRefinements('shop-home', getSetRefinementKeys(refinements));
  const range = resolveQuotedRange('shop-home', finish, 1600, refinements, maxFields > 0 ? detail / maxFields : 0);
  assert.ok(range);
  return `${usd(range.priceLow)} to ${usd(range.priceHigh)}`;
}

const SHOP_FILES = [
  'shared/content/wave2/shop-homes-and-barndominiums-idaho.ts',
  'shared/content/pillars/boise-home-building-cost-guide.ts',
  'shared/content/pillars/custom-home-design-guide.ts',
  'shared/content/cityServiceCopy.ts',
  'shared/seoContent.ts',
  'shared/gbpProfile.ts',
  'shared/metaDescriptions.ts',
  'shared/resourcePdfContent.ts',
  'public/llms.txt',
  'public/llms-full.txt',
];

test('the published shop home example is the estimator output, per finish level', () => {
  const essential = shopExample('refresh');
  const signature = shopExample('mid-range');
  assert.equal(essential, '$385,000 to $520,000');
  assert.equal(signature, '$465,000 to $630,000');
  const pair = new RegExp(
    `${essential.replaceAll('$', '\\$')} (at|with|for|in) Essential finish(es)?,? (and|or) ${signature.replaceAll('$', '\\$')} (at|with|for|in) Signature finish`,
  );
  for (const file of [
    'shared/content/wave2/shop-homes-and-barndominiums-idaho.ts',
    'shared/content/pillars/boise-home-building-cost-guide.ts',
    'shared/content/pillars/custom-home-design-guide.ts',
    'shared/seoContent.ts',
    'shared/gbpProfile.ts',
  ]) {
    assert.match(readFileSync(file, 'utf8'), pair, file);
  }
  const service = SERVICE_SEO_CONTENT['shop-homes-barndominiums'];
  assert.match(service.faqs[0].answer, pair);
  assert.match(service.costGuidance!.paragraphs[0], pair);
  for (const [city, page] of Object.entries(CITY_SERVICE_COPY['shop-homes-barndominiums'])) {
    const answer = page.faqs[0].answer;
    assert.match(answer, pair, city);
    assert.match(answer, /1,600 square f(oo|ee)t/, city);
    assert.match(answer, /1,200 square foot shop/, city);
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

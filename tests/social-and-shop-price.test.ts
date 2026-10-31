import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { P5_PARENT_ORGANIZATION } from '../lib/schema.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { GBP_SOCIAL, P5_SOCIAL } from '../shared/gbpProfile.ts';
import { CITY_SERVICE_META_DESCRIPTIONS, SERVICE_META_DESCRIPTIONS } from '../shared/metaDescriptions.ts';
import { CITY_SERVICE_COPY } from '../shared/content/cityServiceCopy.ts';
import { SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';

const P5_FACEBOOK = 'https://www.facebook.com/1228704823655951';
const RETIRED_FACEBOOK = 'profile.php?id=61592885025074';

test('the owner Facebook page describes P5 Home Co, not this brand', () => {
  assert.equal(P5_SOCIAL.facebook, P5_FACEBOOK);
  assert.deepEqual([...P5_PARENT_ORGANIZATION.sameAs], [P5_FACEBOOK]);
  assert.equal(GBP_SOCIAL.facebook, undefined);
  assert.equal(BUSINESS_INFO.sameAs.includes(P5_FACEBOOK), false);
  for (const url of BUSINESS_INFO.sameAs) assert.doesNotMatch(url, /facebook\.com/);
});

test('the retired Facebook profile is gone and the footer labels the parent page', () => {
  for (const file of ['shared/gbpProfile.ts', 'lib/seo.ts', 'lib/schema.ts', 'components/Footer.tsx']) {
    assert.equal(readFileSync(file, 'utf8').includes(RETIRED_FACEBOOK), false, file);
  }
  const footer = readFileSync('components/Footer.tsx', 'utf8');
  assert.match(footer, /href=\{P5_SOCIAL\.facebook\}/);
  assert.match(footer, /aria-label="P5 Home Co on Facebook"/);
});

test('shop home pricing reads $150 to $250 per square foot everywhere', () => {
  const shopCopy = [
    SERVICE_META_DESCRIPTIONS['shop-homes-barndominiums'],
    ...Object.entries(CITY_SERVICE_META_DESCRIPTIONS)
      .filter(([key]) => key.startsWith('shop-homes-barndominiums/'))
      .map(([, value]) => value),
    ...Object.values(CITY_SERVICE_COPY['shop-homes-barndominiums']).flatMap((page) =>
      page.faqs.map((faq) => faq.answer),
    ),
    ...SERVICE_SEO_CONTENT['shop-homes-barndominiums'].faqs.map((faq) => faq.answer),
    JSON.stringify(SERVICE_SEO_CONTENT['shop-homes-barndominiums']),
  ].join(' ');
  assert.doesNotMatch(shopCopy, /\$140/);
  assert.match(shopCopy, /\$150 to \$250 per sq ft/);
  const cityFaqs = Object.values(CITY_SERVICE_COPY['shop-homes-barndominiums']).map((page) => page.faqs[0].answer);
  for (const answer of cityFaqs) {
    assert.match(answer, /\$150 to \$250/);
    assert.match(answer, /about \$200 on average/);
    assert.match(answer, /land, site work (and|or) permits/);
  }
});

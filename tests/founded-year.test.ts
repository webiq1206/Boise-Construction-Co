import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FoundingSeal } from '../components/brand/FoundingSeal.tsx';
import { BRAND_PAGE_IMAGE } from '../lib/brand-page-metadata.ts';
import { generateArticleSchema, generateLocalBusinessSchema, generateOrganizationSchema } from '../lib/schema.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { FOUNDED_YEAR, SHOW_FOUNDED_YEAR } from '../shared/foundedYear.ts';
import { GBP_DESCRIPTION, GBP_NAP } from '../shared/gbpProfile.ts';
import { HOMEPAGE_FAQS } from '../shared/homepageFaqs.ts';
import { PROOF_STATS, TRUST_ITEMS } from '../shared/siteContent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const PUBLISHED = /Est\. 2020|founded in 2020|since 2020|founded 2020|Founded: 2020|Founded in 2020|EST 2020/i;

test('the 2020 founding year stays on record and does not render', () => {
  assert.equal(SHOW_FOUNDED_YEAR, false);
  assert.equal(FOUNDED_YEAR, '2020');
  assert.equal(BUSINESS_INFO.founded, '2020');
  assert.equal(PROOF_STATS.established, '2020');
  assert.equal(GBP_NAP.founded, '2020');
  assert.match(read('scripts/brand/generate-brand-assets.mjs'), /EST 2020/);
  assert.match(read('shared/foundedYear.ts'), /founded in 2020/);
  assert.match(read('shared/foundedYear.ts'), /since 2020/);
  assert.match(read('scripts/generate-llms-txt.ts'), /founded \$\{FOUNDED_YEAR\}/);

  const local = generateLocalBusinessSchema();
  const org = generateOrganizationSchema();
  assert.equal(Object.hasOwn(local, 'foundingDate'), false);
  assert.equal(Object.hasOwn(org, 'foundingDate'), false);

  const rendered = [
    JSON.stringify(local),
    JSON.stringify(org),
    TRUST_ITEMS.join('\n'),
    HOMEPAGE_FAQS.map((faq) => `${faq.q}\n${faq.a}`).join('\n'),
    GBP_DESCRIPTION,
    read('app/about/page.tsx'),
    read('components/approved/ApprovedHome.tsx'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('public/brand/BRAND.md'),
    read('public/brand/brand-kit.html'),
  ].join('\n');

  assert.equal(PUBLISHED.test(rendered), false);
  assert.equal(rendered.includes('foundingDate'), false);
});

test('the seal component is not rendered while the founding year is hidden', () => {
  assert.equal(SHOW_FOUNDED_YEAR, false);
  assert.equal(renderToStaticMarkup(createElement(FoundingSeal)), '');
  assert.match(read('components/brand/FoundingSeal.tsx'), /boise-construction-co-seal-charcoal-accent\.svg/);
  assert.equal(fs.existsSync(path.join(root, 'public/brand/svg/seal/light/boise-construction-co-seal-charcoal-accent.svg')), true);
  assert.equal(fs.existsSync(path.join(root, 'public/brand/page-preview.png')), true);

  const brandKit = read('public/brand/brand-kit.html');
  assert.equal(/<img\b[^>]*seal/i.test(brandKit), false);
  assert.match(brandKit, /svg\/icon\/boise-construction-co-icon-accent\.svg/);

  const published = [
    JSON.stringify(generateLocalBusinessSchema()),
    JSON.stringify(generateOrganizationSchema()),
    JSON.stringify(generateArticleSchema({
      title: 'Example',
      description: 'Example',
      publishedAt: '2026-01-01',
      slug: 'example',
    })),
    BRAND_PAGE_IMAGE,
    read('app/layout.tsx'),
    read('public/site.webmanifest'),
  ].join('\n');
  assert.equal(published.includes('/brand/png/seal/'), false);
  assert.equal(published.includes('page-preview.png'), false);
  assert.equal(published.includes('svg/seal/'), false);
});

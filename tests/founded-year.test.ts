import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLocalBusinessSchema, generateOrganizationSchema } from '../lib/schema.ts';
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

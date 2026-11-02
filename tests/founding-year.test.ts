import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLocalBusinessSchema, generateOrganizationSchema } from '../lib/schema.ts';
import { HOMEPAGE_FAQS } from '../shared/homepageFaqs.ts';
import {
  FOUNDING,
  FOUNDING_YEAR_COPY,
  PUBLIC_MARK_PATH,
  SEAL_LOGO_PATH,
  SHOW_FOUNDING_YEAR,
  YEAR_FREE_ICON_PATH,
} from '../shared/publicFlags.ts';
import { TRUST_ITEMS } from '../shared/siteContent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const YEAR_PHRASES = [/since 2020/i, /founded in 2020/i, /EST 2020/i, /Est\. 2020/i, /founded 2020/i, /Founded: 2020/];

test('founding year copy stays in source and stays off the rendered site', () => {
  assert.equal(SHOW_FOUNDING_YEAR, false);
  assert.match(FOUNDING_YEAR_COPY.shown.idahoBuilder, /founded in 2020/);
  assert.match(FOUNDING_YEAR_COPY.shown.valleyWork, /since 2020/);
  assert.equal(FOUNDING_YEAR_COPY.shown.foundedLine, 'Founded: 2020');
  assert.equal(SEAL_LOGO_PATH.includes('seal'), true);

  const rendered = [
    FOUNDING.idahoBuilder,
    FOUNDING.valleyWork,
    FOUNDING.schemaDescription,
    FOUNDING.gbpFoundedSentence,
    FOUNDING.llmsFoundedClause,
    FOUNDING.llmsSinceClause,
    FOUNDING.foundedLine,
    ...HOMEPAGE_FAQS.map((faq) => `${faq.q} ${faq.a}`),
    ...TRUST_ITEMS,
    JSON.stringify(generateOrganizationSchema()),
    JSON.stringify(generateLocalBusinessSchema()),
    fs.readFileSync(path.join(root, 'public/llms.txt'), 'utf8'),
    fs.readFileSync(path.join(root, 'public/llms-full.txt'), 'utf8'),
  ].join('\n');

  for (const phrase of YEAR_PHRASES) {
    assert.equal(phrase.test(rendered), false, phrase.source);
  }

  const organization = generateOrganizationSchema();
  const localBusiness = generateLocalBusinessSchema();
  assert.equal('foundingDate' in organization, false);
  assert.equal('foundingDate' in localBusiness, false);
  assert.equal(PUBLIC_MARK_PATH, YEAR_FREE_ICON_PATH);
  const logo = organization.logo as { url: string };
  assert.match(logo.url, /boise-construction-co-icon-charcoal-512px\.png$/);
  assert.equal(logo.url.includes('/seal/'), false);
});

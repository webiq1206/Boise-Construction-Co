import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { landingFAQSchema } from '../lib/landing-schema.ts';
import { generateOrganizationSchema } from '../lib/schema.ts';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { AREA_PAGE_FAQS } from '../shared/seoContent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Published site source. Google Business Profile copy in shared/gbpProfile.ts
 * is operator-owned and is not part of this scan.
 */
const SOURCE_DIRS = ['app', 'components', 'lib', 'public', 'shared'];
const ALLOW = new Set(['shared/gbpProfile.ts']);
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.txt', '.md']);

const INSURED_FAQ_QUESTION = 'Are the P5 companies registered and insured?';
const INSURED_FAQ_ANSWER = 'Yes. P5 Home Co LLC, Idaho Registered Contractor #8381215. Insured; certificate on request.';

function sourceHits(): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = path.relative(root, full);
      if (ALLOW.has(rel) || !SOURCE_EXT.has(path.extname(entry.name))) continue;
      const text = fs.readFileSync(full, 'utf8');
      if (/\bbonded\b/i.test(text)) hits.push(rel);
    }
  };
  for (const dir of SOURCE_DIRS) walk(path.join(root, dir));
  return hits;
}

test('bonded does not reappear in published site source', () => {
  assert.deepEqual(sourceHits(), []);
});

test('area FAQ copy and FAQPage JSON-LD use the same insured answer', () => {
  assert.equal(AREA_PAGE_FAQS[1].question, INSURED_FAQ_QUESTION);
  assert.equal(AREA_PAGE_FAQS[1].answer, INSURED_FAQ_ANSWER);
  const shared = landingFAQSchema(AREA_PAGE_FAQS) as {
    mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
  };
  assert.equal(shared.mainEntity[1].name, AREA_PAGE_FAQS[1].question);
  assert.equal(shared.mainEntity[1].acceptedAnswer.text, AREA_PAGE_FAQS[1].answer);

  for (const slug of ['boise', 'meridian', 'nampa', 'eagle', 'kuna', 'caldwell', 'star', 'middleton', 'garden-city']) {
    const faqs = getAreaCityCopy(slug)?.faqs;
    assert.ok(faqs, slug);
    assert.equal(faqs[1].question, INSURED_FAQ_QUESTION, slug);
    assert.equal(faqs[1].answer, INSURED_FAQ_ANSWER, slug);
    const schema = landingFAQSchema(faqs) as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    assert.equal(schema.mainEntity[1].name, faqs[1].question, slug);
    assert.equal(schema.mainEntity[1].acceptedAnswer.text, faqs[1].answer, slug);
  }

  assert.equal(JSON.stringify(generateOrganizationSchema()).toLowerCase().includes('bonded'), false);
});

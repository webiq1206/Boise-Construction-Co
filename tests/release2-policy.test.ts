/**
 * Owner decisions, release 2 (Nov 8 2026).
 *
 * D1: the one-year workmanship warranty from documented Final Completion covers
 * work performed by our own team. Subcontractor work is covered by that
 * subcontractor's own warranty, and every project ends with a complete
 * subcontractor list with contact information. Manufacturer terms are separate.
 * D9: the terms page summarizes current policy and defers to the signed
 * agreement. R04: the custom-home FAQ and the cost guide state one basis.
 *
 * Run: node --import tsx --test tests/release2-policy.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { HOMEPAGE_FAQS } from '../shared/homepageFaqs';
import { boiseHomeBuildingCostGuide } from '../shared/content/pillars/boise-home-building-cost-guide';
import { SERVICE_SEO_CONTENT } from '../shared/seoContent';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const squash = (s: string) => s.replace(/\s+/g, ' ');

const OLD_SUB_SCOPE = [
  /covers work by our own team and our subcontractors/i,
  /including our subcontractors' work/i,
  /we or our subcontractors built/i,
  /workmanship by our subcontractors/i,
  /our subcontractors' work and our installation/i,
  /work by our subcontractors, and our installation/i,
  /subcontractors we hire/i,
];

const WARRANTY_SOURCES = [
  'app/warranty/page.tsx',
  'shared/homepageFaqs.ts',
  'app/about/page.tsx',
  'shared/content/wave2/new-home-walkthrough-and-warranty.ts',
  'shared/content/pillars/boise-home-building-process-guide.ts',
  'app/terms-of-service/page.tsx',
  'public/llms-full.txt',
];

test('D1: no warranty source says our coverage includes subcontractor work', () => {
  for (const file of WARRANTY_SOURCES) {
    const text = squash(read(file));
    for (const re of OLD_SUB_SCOPE) assert.doesNotMatch(text, re, `${file} still matches ${re}`);
  }
});

test('D1: warranty page states own-team scope, sub warranties, sub list and the help path', () => {
  const page = squash(read('app/warranty/page.tsx'));
  assert.match(page, /work performed by our own team/i);
  assert.match(page, /covered by that subcontractor's own warranty/);
  assert.match(page, /complete list of the subcontractors who worked on it, with their contact information/);
  assert.match(page, /point you to the right subcontractor from the list/);
  assert.match(page, /Manufacturer and product warranties are separate/);
  assert.match(page, /documented Final Completion/);
  assert.match(page, /id="get-help"/);
  // The contract-specific 10-year structural wording stays separate.
  assert.match(page, /Ask us whether a 10-year structural warranty applies to your contract/);
});

test('D1: homepage FAQ warranty answer uses the own-team scope', () => {
  const faq = HOMEPAGE_FAQS.find((f) => /workmanship warranty/i.test(f.q));
  assert.ok(faq);
  assert.match(faq.a, /work performed by our own team/i);
  assert.match(faq.a, /subcontractor's own warranty/);
  assert.match(faq.a, /complete list of the subcontractors/);
});

test('D9: terms page reflects current policy', () => {
  const terms = squash(read('app/terms-of-service/page.tsx'));
  assert.match(terms, /Last updated November 8, 2026/);
  assert.match(terms, /P5 Home Co LLC/);
  assert.match(terms, /signed agreement governs/);
  assert.match(terms, /milestones set out in the payment schedule in your signed agreement/);
  assert.match(terms, /24-hour advance notice/);
  assert.match(terms, /agreed in writing before the affected work/);
  assert.doesNotMatch(terms, /48 hours/);
  assert.doesNotMatch(terms, /due upon completion/i);
  assert.doesNotMatch(terms, /automatic billing|recurring service/i);
  assert.doesNotMatch(terms, /January 2024/);
});

test('R04: custom-home FAQ and cost guide state the same price basis', () => {
  const faq = SERVICE_SEO_CONTENT['custom-home-builder'].faqs?.find((f) => /not included in a per-square-foot/i.test(f.question));
  assert.ok(faq);
  const guide = boiseHomeBuildingCostGuide.content;
  const basis = /Site work, impact fees and utility connections are estimated separately/;
  assert.match(faq.answer, basis);
  assert.match(guide, basis);
  assert.match(faq.answer, /excluding land/);
  assert.match(guide, /excluding land/);
  assert.doesNotMatch(guide, /from the dirt up/);
  assert.doesNotMatch(faq.answer, /cover vertical construction/);
});

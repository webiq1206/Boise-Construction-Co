import test from 'node:test';
import assert from 'node:assert/strict';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { AREA_PAGE_FAQS, getAreaIntro } from '../shared/seoContent.ts';
import { getCityBySlug } from '../shared/contentData.ts';
import { landingFAQSchema } from '../lib/landing-schema.ts';
import { CITY_SEO_DATA } from '../lib/seo.ts';

const BATCH = ['boise', 'meridian', 'nampa', 'eagle', 'kuna', 'caldwell', 'star'] as const;

test('batch city pages use per-city intro and seven FAQs whose schema matches the visible text', () => {
  for (const slug of BATCH) {
    const city = getCityBySlug(slug);
    assert.ok(city, slug);
    const copy = getAreaCityCopy(slug);
    assert.ok(copy, slug);
    assert.equal(getAreaIntro(city), copy.intro);
    assert.equal(copy.faqs.length, 7);
    assert.equal(copy.faqs[0].question, 'What kinds of homes do you build?');
    assert.equal(copy.faqs[1].question, 'Are you licensed and insured?');
    assert.equal(copy.faqs[2].question, 'How do I start a project?');
    assert.equal(copy.faqs[3].question, `Do you build in ${city.name}, Idaho?`);
    assert.equal(copy.faqs[4].question, `Which county is ${city.name} in?`);
    assert.match(copy.faqs[1].answer, /licensed, bonded,? and insured|licensed, bonded, insured/i);
    assert.doesNotMatch(copy.intro + copy.faqs.map((f) => f.question + f.answer).join(' '), /Jared/);
    const schema = landingFAQSchema(copy.faqs) as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    assert.equal(schema.mainEntity.length, copy.faqs.length);
    copy.faqs.forEach((faq, i) => {
      assert.equal(schema.mainEntity[i].name, faq.question);
      assert.equal(schema.mainEntity[i].acceptedAnswer.text, faq.answer);
    });
  }
});

test('misplaced landmarks are corrected only on the city that listed them', () => {
  assert.deepEqual(CITY_SEO_DATA.Kuna.landmarks, ['Kuna Caves', 'Swan Falls Dam', 'Bernie Fisher Park']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.landmarks, ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park']);
  assert.deepEqual(CITY_SEO_DATA.Star.landmarks, ['Boise River', 'Star Riverfront Park', 'Freedom Park']);
  assert.ok(CITY_SEO_DATA.Eagle.landmarks.includes('Eagle Island State Park'));
  assert.ok(CITY_SEO_DATA.Caldwell.landmarks.includes('Indian Creek Plaza'));
  assert.equal(CITY_SEO_DATA.Kuna.neighborhoods.includes('Indian Creek'), true);
});

test('cities outside the batch keep the shared intro and shared FAQ questions', () => {
  const middleton = getCityBySlug('middleton');
  assert.ok(middleton);
  assert.equal(getAreaCityCopy('middleton'), undefined);
  assert.match(getAreaIntro(middleton), /throughout Canyon County/);
  assert.match(getAreaIntro(middleton), /one accountable team from feasibility through final walkthrough/);
  assert.equal(AREA_PAGE_FAQS.length, 3);
  assert.match(AREA_PAGE_FAQS[1].answer, /licensed, bonded, and insured/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { getCityServiceCopy } from '../shared/content/cityServiceCopy.ts';
import { AREA_PAGE_FAQS, getAreaIntro, getCityServiceSections, SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { getCityBySlug, getCountyLabel, SERVICES } from '../shared/contentData.ts';
import { landingFAQSchema } from '../lib/landing-schema.ts';
import { CITY_SEO_DATA, indianCreekDescription } from '../lib/seo.ts';
import { LOCATION_GUIDES } from '../shared/content/locationGuides.ts';

const BATCH = ['boise', 'meridian', 'nampa', 'eagle', 'kuna', 'caldwell', 'star', 'middleton', 'garden-city'] as const;

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
    assert.match(copy.faqs[1].answer, /licen[sc]ed|license/i);
    assert.match(copy.faqs[1].answer, /bond/i);
    assert.match(copy.faqs[1].answer, /insur/i);
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
  assert.deepEqual(CITY_SEO_DATA.Kuna.landmarks, ['Bernie Fisher Park']);
  assert.deepEqual(CITY_SEO_DATA.Kuna.neighborhoods, ['Crimson Point', 'Black Cat']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.landmarks, ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.neighborhoods, ['Lochsa Falls', 'Tuscany', 'Paramount', 'Meridian Ranch']);
  assert.ok(CITY_SEO_DATA.Eagle.landmarks.includes('Eagle Island State Park'));
  assert.equal(CITY_SEO_DATA.Meridian.landmarks.includes('Eagle Island State Park'), false);
  assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods, ['Banbury', 'Floating Feather']);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Shadow Valley'), false);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Hidden Springs'), false);
  assert.deepEqual(CITY_SEO_DATA.Star.neighborhoods, ['Star River Ranch', 'Star Crossing']);
  assert.deepEqual(CITY_SEO_DATA.Star.landmarks, ['Boise River', 'Star Riverwalk Park', 'Freedom Park']);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Hillsdale'), false);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Paramount'), false);
  assert.equal(CITY_SEO_DATA.Star.landmarks.includes('Celebration Park'), false);
  assert.deepEqual(CITY_SEO_DATA.Middleton.neighborhoods, ['Middleton Heights']);
  assert.deepEqual(CITY_SEO_DATA.Middleton.landmarks, ['Boise River']);
  assert.equal(CITY_SEO_DATA.Nampa.neighborhoods.includes('Columbia Village'), false);
  assert.deepEqual(CITY_SEO_DATA.Nampa.landmarks, ['Ford Idaho Center', 'Nampa Train Depot']);
  assert.ok(CITY_SEO_DATA.Caldwell.landmarks.includes('Indian Creek Plaza'));
  assert.equal(CITY_SEO_DATA.Kuna.neighborhoods.includes('Indian Creek'), false);
  assert.equal(CITY_SEO_DATA.Kuna.neighborhoods.includes('Ten Mile Creek'), false);
  assert.equal(CITY_SEO_DATA.Nampa.neighborhoods.includes('Indian Creek'), false);
  assert.equal(CITY_SEO_DATA.Caldwell.neighborhoods.includes('Indian Creek'), false);
  const creek = indianCreekDescription('Kuna');
  assert.equal(indianCreekDescription('Nampa'), creek);
  assert.equal(indianCreekDescription('Caldwell'), creek);
  assert.match(creek, /creek that flows through Kuna, Nampa, and Caldwell/);
  assert.match(creek, /Indian Creek Plaza is on that creek in downtown Caldwell/);
  assert.equal(indianCreekDescription('Boise'), '');
  assert.equal(indianCreekDescription('Meridian'), '');
  assert.equal(indianCreekDescription('Star'), '');
});

test('Hidden Springs is its own community on the Boise side, not an Eagle neighborhood', () => {
  const guide = LOCATION_GUIDES.find((g) => g.slug === 'hidden-springs-home-building-guide');
  assert.ok(guide);
  assert.deepEqual(guide.linkedCities, ['boise']);
  assert.equal(guide.tags?.includes('eagle'), false);
  assert.equal(guide.tags?.includes('boise'), true);
  assert.equal(guide.relatedLinks?.some((link) => link.url === '/areas/eagle'), false);
  assert.equal(guide.relatedLinks?.some((link) => link.url === '/areas/boise'), true);
  assert.doesNotMatch(guide.content, /areas\/eagle/);
});

test('The Estates is absent from Eagle pages', () => {
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('The Estates'), false);
  assert.equal(CITY_SEO_DATA.Eagle.landmarks.includes('The Estates'), false);
  assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods, ['Banbury', 'Floating Feather']);

  const eagle = getCityBySlug('eagle');
  assert.ok(eagle);
  const seo = CITY_SEO_DATA.Eagle;
  const county = getCountyLabel(eagle.county);
  const areaCopy = getAreaCityCopy('eagle');
  assert.ok(areaCopy);
  const areaPage = [
    getAreaIntro(eagle),
    `We serve ${eagle.name} homeowners across ${seo.neighborhoods.slice(0, 3).join(', ')}, and all of ${county}.`,
    `We build throughout ${eagle.name}, including ${seo.neighborhoods.join(', ')}.`,
    `landmarks like ${seo.landmarks.slice(0, 3).join(', ')}`,
    ...areaCopy.faqs.map((faq) => `${faq.question} ${faq.answer}`),
  ].join(' ');
  assert.doesNotMatch(areaPage, /The Estates/);
  assert.match(areaPage, /across Banbury, Floating Feather, and all of Ada County/);
  assert.match(areaPage, /including Banbury, Floating Feather\./);

  for (const service of SERVICES) {
    const content = SERVICE_SEO_CONTENT[service.slug];
    assert.ok(content, service.slug);
    const intro = getCityServiceCopy(service.slug, 'eagle')?.intro ?? '';
    const sections = getCityServiceSections(content, eagle, seo);
    const visible = [intro, ...sections.flatMap((section) => section.paragraphs ?? [])].join(' ');
    assert.doesNotMatch(visible, /The Estates/);
    assert.match(visible, /including Banbury, Floating Feather\./);
  }
});

test('cities outside the batch keep the shared intro and shared FAQ questions', () => {
  const other = { slug: 'unlisted', name: 'Unlisted', county: 'ada' as const, isPrimary: false };
  assert.equal(getAreaCityCopy('unlisted'), undefined);
  assert.match(getAreaIntro(other), /throughout Ada County/);
  assert.match(getAreaIntro(other), /one accountable team from feasibility through final walkthrough/);
  assert.equal(AREA_PAGE_FAQS.length, 3);
  assert.match(AREA_PAGE_FAQS[1].answer, /licensed, bonded, and insured/);
});

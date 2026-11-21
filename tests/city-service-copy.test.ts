import test from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, SERVICES, cityServiceBudgetQuestion, cityServiceCostQuestion } from '../shared/contentData.ts';
import { getCityServiceCopy } from '../shared/content/cityServiceCopy.ts';
import { getCityServiceFaqs, getCityServiceIntro, SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { landingFAQSchema } from '../lib/landing-schema.ts';
import { CITY_SEO_DATA, indianCreekDescription } from '../lib/seo.ts';
import { NOINDEX_CITY_SERVICE } from '../lib/page-metadata.ts';
import { CITY_SERVICE_MERGES } from '../shared/cityServiceRedirects.js';

const NOINDEX = [
  'lot-evaluation/kuna',
  'lot-evaluation/caldwell',
  'energy-efficient-homes/star',
  'home-additions/nampa',
  'custom-home-builder/kuna',
  'shop-homes-barndominiums/boise',
  'shop-homes-barndominiums/caldwell',
];

test('all 90 service-city pages use the draft intro and six FAQs, and schema matches the visible text', () => {
  assert.equal(SERVICES.length * CITIES.length, 90);
  for (const service of SERVICES) {
    const content = SERVICE_SEO_CONTENT[service.slug];
    assert.ok(content, service.slug);
    for (const city of CITIES) {
      const copy = getCityServiceCopy(service.slug, city.slug);
      assert.ok(copy, `${service.slug}/${city.slug}`);
      assert.equal(getCityServiceIntro(content, city, 'ignored local fact'), copy.intro);
      const faqs = getCityServiceFaqs(content, city);
      assert.equal(faqs.length, 6);
      assert.deepEqual(faqs, copy.faqs);
      assert.equal(faqs[0].question, cityServiceCostQuestion(service, city.name));
      assert.equal(faqs[3].question, `Do you build in ${city.name}?`);
      assert.equal(faqs[4].question, cityServiceBudgetQuestion(service, city.name));
      // SEO audit CON-T1: the questions read as English, never the title case service name.
      assert.doesNotMatch(faqs[0].question + faqs[4].question, /&|adus|build on your lot cost|homes cost/i);
      const visible = copy.intro + faqs.map((faq) => faq.question + faq.answer).join(' ');
      assert.doesNotMatch(visible, /Jared/);
      const schema = landingFAQSchema(faqs) as {
        mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
      };
      assert.equal(schema.mainEntity.length, faqs.length);
      faqs.forEach((faq, index) => {
        assert.equal(schema.mainEntity[index].name, faq.question);
        assert.equal(schema.mainEntity[index].acceptedAnswer.text, faq.answer);
      });
    }
  }
});

test('city-service FAQ questions use a grammatical noun (SEO audit CON-T1)', () => {
  const svc = (slug: string) => SERVICES.find((s) => s.slug === slug)!;
  assert.equal(cityServiceCostQuestion(svc('adu'), 'Boise'), 'How much does a detached ADU cost in Boise?');
  assert.equal(cityServiceCostQuestion(svc('home-plans-design'), 'Meridian'), 'How much do home design and plans cost in Meridian?');
  assert.equal(cityServiceBudgetQuestion(svc('build-on-your-lot'), 'Eagle'), 'How do I get a budget for building on your own lot in Eagle?');
  assert.equal(getCityServiceFaqs(SERVICE_SEO_CONTENT.adu, CITIES[0])[0].question, 'How much does a detached ADU cost in Boise?');
});

test('landmark lists and Indian Creek follow the approved corrections', () => {
  assert.deepEqual(CITY_SEO_DATA.Kuna.landmarks, ['Bernie Fisher Park']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.landmarks, ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park']);
  assert.deepEqual(CITY_SEO_DATA.Star.landmarks, ['Boise River', 'Star Riverwalk Park', 'Freedom Park']);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Hillsdale'), false);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Paramount'), false);
  assert.ok(CITY_SEO_DATA.Eagle.landmarks.includes('Eagle Island State Park'));
  assert.equal(CITY_SEO_DATA.Meridian.landmarks.includes('Eagle Island State Park'), false);
  assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods, ['Banbury']);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Shadow Valley'), false);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Hidden Springs'), false);
  for (const service of SERVICES) {
    const intro = getCityServiceCopy(service.slug, 'eagle')!.intro;
    assert.doesNotMatch(intro, /Shadow Valley|Hidden Springs/);
    assert.match(intro, /Banbury/);
  }
  assert.deepEqual(CITY_SEO_DATA.Nampa.landmarks, ['Ford Idaho Center', 'Nampa Train Depot']);
  assert.equal(CITY_SEO_DATA.Nampa.neighborhoods.includes('Columbia Village'), false);
  assert.ok(CITY_SEO_DATA.Caldwell.landmarks.includes('Indian Creek Plaza'));
  for (const city of ['Kuna', 'Nampa', 'Caldwell']) {
    assert.equal(CITY_SEO_DATA[city].neighborhoods.includes('Indian Creek'), false);
  }
  const creek = indianCreekDescription('Kuna');
  assert.equal(indianCreekDescription('Nampa'), creek);
  assert.equal(indianCreekDescription('Caldwell'), creek);
  assert.match(creek, /creek that flows through Kuna, Nampa, and Caldwell/);
  assert.match(creek, /Indian Creek Plaza is on that creek in downtown Caldwell/);
  assert.equal(indianCreekDescription('Boise'), '');
  const kunaIntro = getCityServiceCopy('semi-custom-homes', 'kuna')!.intro;
  assert.match(kunaIntro, /creek that flows through Kuna, Nampa, and Caldwell/);
  assert.doesNotMatch(kunaIntro, /in Indian Creek/i);
});

test('only the ADU city pages stay indexable after the 28 non-ADU merges', () => {
  assert.equal(CITY_SERVICE_MERGES.length, 28);
  assert.equal(NOINDEX_CITY_SERVICE.size, SERVICES.length * CITIES.length - 2);
  assert.equal(NOINDEX_CITY_SERVICE.has('adu/boise'), false);
  assert.equal(NOINDEX_CITY_SERVICE.has('adu/meridian'), false);
  for (const row of CITY_SERVICE_MERGES) assert.equal(NOINDEX_CITY_SERVICE.has(row.key), true, row.key);
  for (const key of NOINDEX) assert.equal(NOINDEX_CITY_SERVICE.has(key), true, key);
});

test('an unlisted service keeps the shared intro and FAQ generator', () => {
  const city = CITIES[0];
  const service = {
    slug: 'unlisted-service',
    name: 'Unlisted Service',
    headline: '',
    primaryKeyword: '',
    overview: '',
    benefits: [],
    inclusions: [],
    timeline: '',
    processSteps: [],
    faqs: [{ question: 'How much does an unlisted service cost?', answer: 'Shared answer.' }],
  };
  assert.equal(getCityServiceCopy('unlisted-service', city.slug), undefined);
  assert.match(getCityServiceIntro(service, city), /Planning unlisted service in Boise/);
  assert.equal(getCityServiceFaqs(service, city).length, 3);
});

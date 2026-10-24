import test from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { getCityServiceCopy } from '../shared/content/cityServiceCopy.ts';
import { getCityServiceFaqs, getCityServiceIntro, SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { landingFAQSchema } from '../lib/landing-schema.ts';
import { CITY_SEO_DATA, indianCreekDescription } from '../lib/seo.ts';
import { NOINDEX_CITY_SERVICE } from '../lib/page-metadata.ts';

const NOINDEX = [
  'lot-evaluation/kuna',
  'lot-evaluation/caldwell',
  'energy-efficient-homes/star',
  'home-additions/nampa',
  'custom-home-builder/kuna',
  'shop-homes-barndominiums/boise',
  'shop-homes-barndominiums/caldwell',
];
const INDEXED = [
  'custom-home-builder/boise',
  'semi-custom-homes/meridian',
  'build-on-your-lot/nampa',
  'design-build/eagle',
  'home-additions/boise',
  'shop-homes-barndominiums/eagle',
];

test('all 81 service-city pages use the draft intro and six FAQs, and schema matches the visible text', () => {
  assert.equal(SERVICES.length * CITIES.length, 81);
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
      assert.equal(faqs[0].question, `How much does ${service.name.toLowerCase()} cost in ${city.name}?`);
      assert.equal(faqs[3].question, `Do you build in ${city.name}?`);
      assert.equal(faqs[4].question, `How do I get a budget for ${service.name.toLowerCase()} in ${city.name}?`);
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

test('landmark lists and Indian Creek follow the approved corrections', () => {
  assert.deepEqual(CITY_SEO_DATA.Kuna.landmarks, ['Bernie Fisher Park']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.landmarks, ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park']);
  assert.deepEqual(CITY_SEO_DATA.Star.landmarks, ['Boise River', 'Star Riverwalk Park', 'Freedom Park']);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Hillsdale'), false);
  assert.equal(CITY_SEO_DATA.Star.neighborhoods.includes('Paramount'), false);
  assert.ok(CITY_SEO_DATA.Eagle.landmarks.includes('Eagle Island State Park'));
  assert.equal(CITY_SEO_DATA.Meridian.landmarks.includes('Eagle Island State Park'), false);
  assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods, ['Banbury', 'Floating Feather']);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Shadow Valley'), false);
  assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('Hidden Springs'), false);
  for (const service of SERVICES) {
    const intro = getCityServiceCopy(service.slug, 'eagle')!.intro;
    assert.doesNotMatch(intro, /Shadow Valley|Hidden Springs/);
    assert.match(intro, /Banbury|Floating Feather/);
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

test('only the 28 allowlisted city-service pages are indexable', () => {
  assert.equal(NOINDEX_CITY_SERVICE.size, SERVICES.length * CITIES.length - 28);
  for (const key of NOINDEX) assert.equal(NOINDEX_CITY_SERVICE.has(key), true, key);
  for (const key of INDEXED) assert.equal(NOINDEX_CITY_SERVICE.has(key), false, key);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { AREA_PAGE_FAQS, getAreaIntro } from '../shared/seoContent.ts';
import { getCityBySlug } from '../shared/contentData.ts';
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
    assert.equal(copy.faqs.length, slug === 'middleton' ? 9 : 7);
    if (slug === 'middleton') {
      assert.equal(copy.lead?.join(' '), copy.intro);
      assert.match(copy.intro, /Looking for a custom home builder in Middleton\?/);
      assert.match(copy.intro, /about 90% of occupied homes are owner-occupied/);
      assert.match(copy.intro, /\(47%\) has been built since 2010, per Census ACS 2020/);
      assert.doesNotMatch(copy.intro, /\$|warranty|10 to 14 months|525,000/i);
      assert.equal(copy.faqs[7].question, 'Do you build custom homes in Middleton?');
      assert.equal(copy.faqs[7].links?.[0]?.href, '/guides/middleton-home-building-guide');
      assert.match(copy.faqs[7].answer, /Middleton home building guide/);
      assert.equal(copy.faqs[8].question, 'Who is a custom home builder in Middleton for?');
      assert.match(copy.faqs[5].answer, /section 4-1-1/);
      assert.match(copy.faqs[6].answer, /5,550 heating degree days/);
    } else {
      assert.equal(copy.lead, undefined);
    }
    assert.equal(copy.faqs[0].question, 'What kinds of homes do you build?');
    assert.equal(copy.faqs[1].question, 'Are you a registered contractor and insured?');
    assert.equal(copy.faqs[2].question, 'How do I start a project?');
    assert.equal(copy.faqs[3].question, `Do you build in ${city.name}, Idaho?`);
    assert.equal(copy.faqs[4].question, `Which county is ${city.name} in?`);
    assert.match(copy.faqs[1].answer, /P5 Home Co LLC, Idaho Registered Contractor #8381215, bonded and insured/);
    assert.doesNotMatch(copy.faqs[1].answer, /(?:we(?:'|’)re|we are|the company is|fully) licensed|licensed, bonded|carries a license/i);
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
  assert.deepEqual(CITY_SEO_DATA.Kuna.neighborhoods, ['Crimson Point']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.landmarks, ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park']);
  assert.deepEqual(CITY_SEO_DATA.Meridian.neighborhoods, ['Lochsa Falls', 'Tuscany', 'Paramount', 'Meridian Ranch']);
  assert.ok(CITY_SEO_DATA.Eagle.landmarks.includes('Eagle Island State Park'));
  assert.equal(CITY_SEO_DATA.Meridian.landmarks.includes('Eagle Island State Park'), false);
  assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods, ['Banbury']);
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

test('Middleton guide title, meta, and intro keep live cost and warranty lines', () => {
  const guide = LOCATION_GUIDES.find((g) => g.slug === 'middleton-home-building-guide');
  assert.ok(guide);
  assert.equal(guide.title, 'Custom Home Building in Middleton');
  assert.equal(guide.seoTitle, 'Custom Home Building Guide for Middleton, ID');
  assert.equal(
    guide.metaDescription,
    'Guide for custom home builders and homeowners in Middleton: Canyon County vs city permits, subdivision vs acreage, site work ranges, and how a design-build team runs the project.',
  );
  assert.match(guide.content, /<strong>custom home builder in Middleton<\/strong>/);
  assert.match(guide.content, /href="\/areas\/middleton">Middleton area page<\/a>/);
  assert.match(guide.content, /href="\/services\/custom-home-builder">Treasure Valley custom home builder<\/a>/);
  assert.match(guide.content, /a one-year workmanship warranty after possession/);
  assert.match(guide.content, /\$225 to \$300 per finished square foot/);
  assert.match(guide.content, /\$250 to \$400 for custom/);
  assert.match(guide.content, /\$25,000 to \$50,000/);
  assert.match(guide.content, /\$80,000 to \$150,000/);
  assert.match(guide.content, /\$950 to \$3,500/);
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

test('cities outside the batch keep the shared intro and shared FAQ questions', () => {
  const other = { slug: 'unlisted', name: 'Unlisted', county: 'ada' as const, isPrimary: false };
  assert.equal(getAreaCityCopy('unlisted'), undefined);
  assert.match(getAreaIntro(other), /throughout Ada County/);
  assert.match(getAreaIntro(other), /one accountable team from feasibility through final walkthrough/);
  assert.equal(AREA_PAGE_FAQS.length, 3);
  assert.equal(AREA_PAGE_FAQS[1].question, 'Are you a registered contractor and insured?');
  assert.match(AREA_PAGE_FAQS[1].answer, /P5 Home Co LLC, Idaho Registered Contractor #8381215, bonded and insured/);
});

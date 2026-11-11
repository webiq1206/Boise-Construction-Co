import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHomePageSchemaGraph, generateLocalBusinessSchema, generateOrganizationSchema, generateReviewSchema, ORGANIZATION_DESCRIPTION } from '../lib/schema.ts';
import { BRAND_SAME_AS, P5_SAME_AS } from '../lib/seo.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { HOMEPAGE_FAQS, INITIAL_FAQ_COUNT } from '../shared/homepageFaqs.ts';

const BUSINESS_TYPES = ['HomeAndConstructionBusiness', 'GeneralContractor'];

type Node = Record<string, unknown>;

function typedNodes(value: unknown, acc: Node[] = []): Node[] {
  if (Array.isArray(value)) {
    for (const entry of value) typedNodes(entry, acc);
    return acc;
  }
  if (!value || typeof value !== 'object') return acc;
  const node = value as Node;
  if (node['@type']) acc.push(node);
  for (const entry of Object.values(node)) typedNodes(entry, acc);
  return acc;
}

function isBusiness(node: Node): boolean {
  const type = node['@type'];
  const types = Array.isArray(type) ? type : [type];
  return types.some((entry) => BUSINESS_TYPES.includes(String(entry)) || entry === 'LocalBusiness');
}

test('sitewide business node matches the P5 parent and Meridian service area', () => {
  const business = generateLocalBusinessSchema() as Node;
  const text = JSON.stringify(business);
  assert.deepEqual(JSON.parse(text), business);
  assert.deepEqual(business['@type'], BUSINESS_TYPES);
  assert.equal(business['@id'], 'https://boiseconstruction.co/#business');
  assert.equal(business.name, 'Boise Construction Co');
  assert.equal(business.url, 'https://boiseconstruction.co');
  assert.equal(business.telephone, '+1-208-477-1169');
  assert.match(String(business.logo), /^https:\/\/boiseconstruction\.co\/.+\.png$/);
  assert.match(String(business.image), /^https:\/\/boiseconstruction\.co\/.+\.webp$/);

  const parent = business.parentOrganization as Node;
  assert.equal(parent['@id'], 'https://p5homeco.com/#business');
  assert.equal(parent.name, 'P5 Home Co');
  assert.equal(parent.url, 'https://p5homeco.com');
  assert.deepEqual(parent.sameAs, [...P5_SAME_AS]);

  const address = business.address as Node;
  assert.equal(address['@type'], 'PostalAddress');
  assert.equal(address.addressLocality, 'Meridian');
  assert.equal(address.addressRegion, 'ID');
  assert.equal(address.addressCountry, 'US');
  assert.equal('streetAddress' in address, false);
  assert.equal('postalCode' in address, false);

  const areas = business.areaServed as Node[];
  assert.deepEqual(
    areas.slice(0, CITIES.length).map((area) => [area['@type'], area.name]),
    CITIES.map((city) => ['City', city.name]),
  );
  assert.deepEqual(areas.slice(CITIES.length), [
    { '@type': 'AdministrativeArea', name: 'Ada County' },
    { '@type': 'AdministrativeArea', name: 'Canyon County' },
  ]);

  assert.deepEqual(business.sameAs, [...BRAND_SAME_AS]);
  assert.equal(business.sameAs.includes('https://p5homeco.com'), true);
  for (const url of P5_SAME_AS) assert.equal(BRAND_SAME_AS.includes(url as (typeof BRAND_SAME_AS)[number]), false);

  const credential = business.hasCredential as Node;
  assert.equal(credential.identifier, '8381215');
  assert.equal((business.openingHoursSpecification as unknown[]).length, 6);

  const offers = (business.hasOfferCatalog as Node).itemListElement as Node[];
  const adu = offers.find((offer) => String(offer.url).endsWith('/services/adu'));
  assert.ok(adu);
  assert.equal(((adu.itemOffered as Node).name), 'ADUs & Guest Houses');
  assert.equal(offers.length, SERVICES.length);

  assert.equal('priceRange' in business, false);
  assert.equal('aggregateRating' in business, false);
  assert.equal('review' in business, false);
  assert.equal(text.includes('showroom'), false);
  assert.equal(text.includes('streetAddress'), false);
  assert.equal(text.includes('$'), false);
  assert.equal(text.includes('bbb.org') || text.includes('houzz.com') || text.includes('buildzoom.com'), false);
});

test('homepage JSON-LD is valid, has one business node, and does not repeat an @id', () => {
  const faqs = HOMEPAGE_FAQS.slice(0, INITIAL_FAQ_COUNT).map((faq) => ({ question: faq.q, answer: faq.a }));
  const blocks = [generateLocalBusinessSchema(), generateHomePageSchemaGraph(faqs)];
  for (const block of blocks) JSON.parse(JSON.stringify(block));

  const nodes = blocks.flatMap((block) => typedNodes(block));
  const businesses = nodes.filter(isBusiness);
  assert.equal(businesses.length, 1);
  assert.equal(businesses[0]['@id'], 'https://boiseconstruction.co/#business');

  const ids = nodes
    .map((node) => node['@id'])
    .filter((id): id is string => typeof id === 'string');
  assert.equal(new Set(ids).size, ids.length);

  const organization = generateOrganizationSchema();
  assert.equal(
    organization.description,
    'Design-build home builder serving the Treasure Valley. Custom homes, semi-custom homes, builds on client-owned land, and shop homes. Insured, with written line-item budgets before construction.',
  );
  assert.equal(organization.description, ORGANIZATION_DESCRIPTION);
  assert.equal(String(organization.description).includes('Bonded'), false);
  assert.equal(organization.hasCredential && (organization.hasCredential as { identifier?: string }).identifier, '8381215');
  assert.deepEqual(organization.parentOrganization, { '@id': 'https://p5homeco.com/#business' });
  const review = generateReviewSchema([{ author: 'Pat', rating: 5, text: 'Helpful' }]);
  assert.equal('aggregateRating' in review, false);
  assert.equal('review' in review, false);
});

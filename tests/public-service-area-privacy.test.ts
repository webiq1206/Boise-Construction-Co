import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateServiceSchema } from '../lib/schema.ts';
import { buildBusinessVCard } from '../lib/vcard.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { getCityServiceIntro, getCityServiceSections, SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { CITY_SEO_DATA } from '../lib/seo.ts';
import { GALLERY_PROJECTS } from '../shared/galleryData.ts';
import { contentImageAlt } from '../shared/imageAlts.ts';
import * as resources from '../shared/resourcePdfContent.ts';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InteriorHero } from '../components/approved/InteriorLayout.tsx';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const PRIVATE_OR_ADMIN = /4031\s+W\s+Wapoot|public representative|not a staffed storefront|streetAddress|43\.6515|-116\.4444/i;
const PRESENTATION_NOTE = /representative imag|concept design|concept (?:home|property|exterior)|(?:brand|its|that) site is coming|references from past clients/i;

test('public entity schema preserves service identity without exporting a private location', () => {
  const schemas = [generateLocalBusinessSchema(), generateOrganizationSchema(),
    ...SERVICES.flatMap(service => CITIES.map(city => generateServiceSchema(service.name, service.shortDescription, city.name)))];
  assert.equal(schemas.length, 92);
  for (const schema of schemas) {
    const text = JSON.stringify(schema);
    assert.doesNotMatch(text, PRIVATE_OR_ADMIN);
    assert.match(text, /Boise Construction Co/);
    assert.match(text, /8381215/);
    assert.match(text, /\+1-208-477-1169/);
  }
  const local = generateLocalBusinessSchema();
  assert.equal('address' in local, false);
  assert.equal('geo' in local, false);
  assert.equal((local.areaServed as unknown[]).length, CITIES.length);
  assert.equal((local.openingHoursSpecification as unknown[]).length, 6);
  assert.equal((generateOrganizationSchema().contactPoint as unknown[]).length, 1);
});

test('saved business contact retains useful contact details, hours and service geography', () => {
  const card = buildBusinessVCard().replace(/\r\n[ \t]/g, '');
  assert.doesNotMatch(card, PRIVATE_OR_ADMIN);
  assert.doesNotMatch(card, /(?:^|\n)(?:ADR|LABEL)[;:]/);
  assert.match(card, /FN:Boise Construction Co/);
  assert.match(card, /TEL;TYPE=WORK,VOICE:\+12084771169/);
  assert.match(card, /EMAIL;TYPE=WORK:hello@boiseconstruction.co/);
  assert.match(card, /https:\/\/boiseconstruction.co/);
  assert.match(card, /Treasure Valley.*Ada and Canyon County/);
  assert.match(card, /Hours: Monday 9:00 AM - 6:00 PM/);
  assert.match(card, /Idaho Registered Contractor #8381215/);
});

test('all city service copy and gallery titles use subjects rather than imagery or launch disclaimers', () => {
  for (const service of SERVICES) for (const city of CITIES) {
    const content = SERVICE_SEO_CONTENT[service.slug];
    const text = JSON.stringify({ intro: getCityServiceIntro(content, city), sections: getCityServiceSections(content, city, CITY_SEO_DATA[city.name]) });
    assert.doesNotMatch(text, PRESENTATION_NOTE, `${service.slug}/${city.slug}`);
    assert.doesNotMatch(text, PRIVATE_OR_ADMIN);
  }
  for (const project of GALLERY_PROJECTS) {
    assert.doesNotMatch(project.title, PRESENTATION_NOTE);
    assert.doesNotMatch(project.title, /our work|completed|recent projects|client/i);
    assert.equal(project.images.some(image => /before|after/i.test(image.label)), false);
    for (const image of project.images) {
      assert.ok(contentImageAlt(image.src), image.src);
      assert.doesNotMatch(contentImageAlt(image.src), PRESENTATION_NOTE);
    }
  }
  assert.doesNotMatch(JSON.stringify(resources), PRIVATE_OR_ADMIN);
});

test('a generated interior hero retains its meaningful image without an extra label', () => {
  const src = '/images/construction/custom-home-exterior.webp';
  const markup = renderToStaticMarkup(React.createElement(InteriorHero, {
    imageSrc: src, imageAlt: contentImageAlt(src), children: 'Plan your home',
  }));
  assert.match(markup, /src="\/images\/construction\/custom-home-exterior.webp"/);
  assert.match(markup, /alt="White board-and-batten house with a dark gable roof and a covered front porch"/);
  assert.match(markup, /Plan your home/);
  assert.doesNotMatch(markup, PRESENTATION_NOTE);
  assert.doesNotMatch(markup, /interior-hero-image-label/);
});

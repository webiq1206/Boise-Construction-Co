import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateServiceSchema, PUBLIC_POSTAL_ADDRESS } from '../lib/schema.ts';
import { buildBusinessVCard } from '../lib/vcard.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { CITIES, SERVICE_AREA_CITIES, SERVICE_AREA_COUNTIES, SERVICES } from '../shared/contentData.ts';
import { getCityServiceIntro, getCityServiceSections, SERVICE_SEO_CONTENT } from '../shared/seoContent.ts';
import { CITY_SEO_DATA } from '../lib/seo.ts';
import { GALLERY_PROJECTS } from '../shared/galleryData.ts';
import { contentImageAlt } from '../shared/imageAlts.ts';
import * as resources from '../shared/resourcePdfContent.ts';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InteriorHero } from '../components/approved/InteriorLayout.tsx';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// The residence street is assembled so this test does not store it, and still asserts it is absent.
const residenceStreet = ['40' + '31', 'W', 'Wa' + 'poot'].join('\\s+');
const PRIVATE_OR_ADMIN = new RegExp(`${residenceStreet}|public representative|not a staffed storefront|streetAddress|43\\.6515|-116\\.4444`, 'i');
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
  const organization = generateOrganizationSchema();
  const domain = new URL(SITE_CONFIG.siteUrl).hostname;
  assert.deepEqual(local.address, PUBLIC_POSTAL_ADDRESS);
  assert.deepEqual(organization.address, PUBLIC_POSTAL_ADDRESS);
  assert.deepEqual(PUBLIC_POSTAL_ADDRESS, {
    '@type': 'PostalAddress',
    addressLocality: 'Meridian',
    addressRegion: 'ID',
    postalCode: '83646',
    addressCountry: 'US',
  });
  assert.equal('streetAddress' in PUBLIC_POSTAL_ADDRESS, false);
  assert.equal('geo' in local, false);
  assert.equal('geo' in organization, false);
  assert.equal('streetAddress' in local, false);
  assert.equal('streetAddress' in organization, false);
  assert.equal(local.legalName, 'P5 Home Co LLC');
  assert.equal(organization.legalName, 'P5 Home Co LLC');
  assert.equal(local.name, 'Boise Construction Co');
  assert.equal(organization.name, 'Boise Construction Co');
  assert.equal((local.parentOrganization as { name: string }).name, 'P5 Home Co');
  assert.equal(local.telephone, '+1-208-477-1169');
  assert.equal(organization.telephone, '+1-208-477-1169');
  assert.equal(local.email, `hello@${domain}`);
  assert.equal(organization.email, `hello@${domain}`);
  assert.equal(SITE_CONFIG.phone, '(208) 477-1169');
  assert.equal(BUSINESS_INFO.phone, '(208) 477-1169');
  assert.equal(FAMILY_BRAND.phone.display, '(208) 477-1169');
  assert.equal(SITE_CONFIG.parentName, 'P5 Home Co');
  assert.doesNotMatch(JSON.stringify(local), /P5 Home Co\./);
  assert.doesNotMatch(JSON.stringify(organization), /P5 Home Co\./);
  const areas = local.areaServed as { '@type': string; name: string }[];
  assert.deepEqual(
    areas.map((area) => area.name),
    [...SERVICE_AREA_CITIES.map((city) => city.name), ...SERVICE_AREA_COUNTIES.map((county) => county.name)],
  );
  assert.deepEqual(areas.slice(0, SERVICE_AREA_CITIES.length).map((area) => area['@type']), SERVICE_AREA_CITIES.map(() => 'City'));
  assert.deepEqual(areas.slice(SERVICE_AREA_CITIES.length).map((area) => area['@type']), SERVICE_AREA_COUNTIES.map(() => 'AdministrativeArea'));
  assert.deepEqual(generateOrganizationSchema().areaServed, local.areaServed);
  assert.equal((local.openingHoursSpecification as unknown[]).length, 6);
  assert.equal((generateOrganizationSchema().contactPoint as unknown[]).length, 1);
  assert.equal(JSON.stringify(local).includes('Middleton'), false);
  assert.equal(JSON.stringify(local).includes('Garden City'), false);
});

test('saved business contact retains useful contact details, hours and service geography', () => {
  const card = buildBusinessVCard().replace(/\r\n[ \t]/g, '');
  assert.doesNotMatch(card, PRIVATE_OR_ADMIN);
  assert.doesNotMatch(card, /(?:^|\n)LABEL[;:]/);
  assert.match(card, /FN:Nick Perkins/);
  assert.match(card, /ORG:Boise Construction Co/);
  assert.match(card, /TEL;TYPE=WORK,VOICE:\+12084771169/);
  assert.match(card, /ADR;TYPE=WORK:;;;Meridian;ID;83646;USA/);
  assert.doesNotMatch(card, /ADR;TYPE=WORK:[^;]*;[^;]*;[^;]+;/);
  assert.match(card, /EMAIL;TYPE=WORK:hello@boiseconstruction.co/);
  assert.match(card, /is a DBA of P5 Home Co\./);
  assert.doesNotMatch(card, /P5 Home Co\.\s+[a-z]/);
  assert.doesNotMatch(card, /(?:FN|ORG):P5 Home Co/);
  const about = fs.readFileSync('app/about/page.tsx', 'utf8');
  assert.match(about, /trade name of \{SITE_CONFIG\.parentName\}/);
  assert.equal(about.includes('trade name of P5 Home Co LLC'), false);
  assert.match(card, /https:\/\/boiseconstruction.co/);
  assert.match(card, /Boise\\, Meridian\\, Nampa\\, Eagle\\, Kuna\\, Caldwell\\, and Star\\, in Ada County and Canyon County/);
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
  assert.match(markup, /alt="Two-story house with dark vertical siding, a wood-clad entry and a three-car garage, with dry foothills behind"/);
  assert.match(markup, /Plan your home/);
  assert.doesNotMatch(markup, PRESENTATION_NOTE);
  assert.doesNotMatch(markup, /interior-hero-image-label/);
});

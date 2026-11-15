import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { cities } from '../components/approved/family-content.ts';
import { businessAreaServed } from '../lib/schema.ts';
import { getAllSiteUrls } from '../lib/siteUrls.ts';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import {
  CITIES,
  SERVICE_AREA_CITIES,
  SERVICE_AREA_COUNTIES,
  SERVICE_AREA_LINE,
} from '../shared/contentData.ts';
import { GBP_SERVICE_AREAS } from '../shared/gbpProfile.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';

const SERVICE_NAMES = ['Boise', 'Meridian', 'Nampa', 'Eagle', 'Kuna', 'Caldwell', 'Star'];
const KEPT_PAGES = ['/areas/middleton', '/areas/garden-city'];

test('the service area is the seven profile cities, then Ada County and Canyon County', () => {
  assert.deepEqual(SERVICE_AREA_CITIES.map((city) => city.name), SERVICE_NAMES);
  assert.deepEqual(SERVICE_AREA_COUNTIES.map((county) => county.name), ['Ada County', 'Canyon County']);
  assert.equal(SERVICE_AREA_LINE, 'Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, and Star, in Ada County and Canyon County');
  assert.equal(SITE_CONFIG.address.serviceArea, SERVICE_AREA_LINE);
  assert.deepEqual(cities, SERVICE_NAMES);
  assert.deepEqual(
    GBP_SERVICE_AREAS,
    SERVICE_NAMES.map((name) => `${name}, ID`),
  );
  assert.deepEqual(
    FAMILY_BRAND.footer.areas.links.map((link) => link.href),
    SERVICE_AREA_CITIES.map((city) => `/areas/${city.slug}`),
  );

  const served = businessAreaServed();
  assert.equal(served.length, 9);
  assert.deepEqual(served.slice(0, 7).map((area) => area['@type']), Array(7).fill('City'));
  assert.deepEqual(served.slice(7).map((area) => area['@type']), ['AdministrativeArea', 'AdministrativeArea']);
  assert.equal(JSON.stringify(served).includes('streetAddress'), false);
});

test('town pages outside the service area stay published and are not redirected', () => {
  const paths = new Set(getAllSiteUrls().map((entry) => entry.path));
  for (const path of KEPT_PAGES) assert.equal(paths.has(path), true, path);
  assert.equal(CITIES.some((city) => city.slug === 'middleton'), true);
  assert.equal(CITIES.some((city) => city.slug === 'garden-city'), true);
  const redirects = readFileSync('next.config.js', 'utf8');
  assert.equal(redirects.includes('/areas/middleton'), false);
  assert.equal(redirects.includes('/areas/garden-city'), false);
  assert.equal(redirects.includes('/areas/emmett'), false);
});

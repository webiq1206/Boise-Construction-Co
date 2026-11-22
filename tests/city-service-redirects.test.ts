import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { NOINDEX_CITY_SERVICE } from '../lib/page-metadata.ts';
import { getAllSiteUrls, getXmlSitemapEntries } from '../lib/siteUrls.ts';
import { buildManifest, buildPages } from '../scripts/internal-links/lib.ts';
import { CITY_SERVICE_MERGES } from '../shared/cityServiceRedirects.js';

const require = createRequire(import.meta.url);
const nextConfig = require('../next.config.js');

test('the 28 non-ADU city pages 301 to the parent service in one hop', async () => {
  assert.equal(CITY_SERVICE_MERGES.length, 28);
  const redirects = await nextConfig.redirects();
  for (const row of CITY_SERVICE_MERGES) {
    assert.equal(row.source.includes('/adu/'), false, row.source);
    const rule = redirects.find((entry: { source: string }) => entry.source === row.source);
    assert.ok(rule, row.source);
    assert.equal(rule.destination, row.destination);
    assert.equal(rule.permanent, true);
    assert.equal(rule.destination.includes('/adu'), false);
  }
  assert.equal(redirects.some((entry: { source: string }) => entry.source === '/services/adu/boise'), false);
  assert.equal(redirects.some((entry: { source: string }) => entry.source === '/services/adu/meridian'), false);
  const legacy = redirects.find((entry: { source: string }) => entry.source === '/services/kitchen-remodel/boise');
  assert.equal(legacy?.destination, '/services/custom-home-builder');
  assert.equal(legacy?.permanent, true);
  const aduLegacy = redirects.find((entry: { source: string }) => entry.source === '/services/adu-builder/:city');
  assert.equal(aduLegacy?.destination, '/services/adu/:city');
});

test('merged city URLs leave both sitemaps, and the XML sitemap drops two utility paths', () => {
  const html = new Set(getAllSiteUrls().map((entry) => entry.path));
  const xml = new Set(getXmlSitemapEntries().map((entry) => entry.path));
  for (const row of CITY_SERVICE_MERGES) {
    assert.equal(html.has(row.source), false, row.source);
    assert.equal(xml.has(row.source), false, row.source);
    assert.equal(NOINDEX_CITY_SERVICE.has(row.key), true, row.key);
  }
  assert.equal(html.has('/services/adu/boise'), true);
  assert.equal(html.has('/services/adu/meridian'), true);
  assert.equal(xml.has('/services/adu/boise'), true);
  assert.equal(xml.has('/services/adu/meridian'), true);
  assert.equal(html.has('/instant-estimate'), true);
  assert.equal(html.has('/sitemap'), true);
  assert.equal(xml.has('/instant-estimate'), false);
  assert.equal(xml.has('/sitemap'), false);
});

test('the link manifest counts the city pages that remain', () => {
  const pages = buildPages().filter((page) => page.type === 'city-service');
  const manifest = buildManifest(buildPages());
  const listed = Object.values(manifest.pages).filter((page) => page.type === 'city-service');
  assert.equal(pages.length, 62);
  assert.equal(manifest.counts.cityService, pages.length);
  assert.equal(listed.length, pages.length);
});

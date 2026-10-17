import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_PAGE_IMAGE } from '../lib/brand-page-metadata.ts';
import { generateCityServiceDescription, generateMetaDescription } from '../lib/seo.ts';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateServiceSchema } from '../lib/schema.ts';
import { GBP_DESCRIPTION } from '../shared/gbpProfile.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { SHOW_FOUNDING_YEAR, SHOW_TRUST } from '../shared/publicFlags.ts';
import {
  CONTRACTOR_LICENSE_SEARCH_URL,
  CONTRACTOR_REGISTRATION_LABEL,
  CONTRACTOR_REGISTRATION_NUMBER,
} from '../shared/contractorRegistration.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('gbp description interpolates and does not keep a literal template', () => {
  assert.equal(GBP_DESCRIPTION.includes('${'), false);
  assert.equal(SHOW_FOUNDING_YEAR, false);
  assert.equal(GBP_DESCRIPTION.includes('Founded in 2020'), false);
  assert.match(read('shared/gbpProfile.ts'), /`[\s\S]*\$\{FOUNDING\.gbpFoundedSentence\}/);
});

test('share image uses the year-free card while the original file stays', () => {
  assert.equal(BRAND_PAGE_IMAGE.endsWith('/brand/page-preview-year-free.png'), true);
  assert.equal(fs.existsSync(path.join(root, 'public/brand/page-preview.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'public/brand/page-preview-year-free.png')), true);
  const original = fs.readFileSync(path.join(root, 'public/brand/page-preview.png'));
  const yearFree = fs.readFileSync(path.join(root, 'public/brand/page-preview-year-free.png'));
  assert.equal(original.equals(yearFree), false);
  assert.equal(read('public/brand/BRAND.md').includes('Est. 2020'), false);
  assert.match(read('scripts/brand/generate-brand-assets.mjs'), /Est\. 2020/);
});

test('trusted city descriptions stay in source and render as the city name', () => {
  assert.equal(SHOW_TRUST, false);
  const source = read('lib/seo.ts');
  for (const phrase of ["Kuna's trusted design-build", "Meridian's trusted", "Nampa's trusted", "Caldwell's trusted", "${city}'s trusted"]) {
    assert.equal(source.includes(phrase), true, phrase);
  }
  const trustedCities = ['Kuna', 'Meridian', 'Nampa', 'Caldwell', 'Garden City'];
  let count = 0;
  for (const service of SERVICES) {
    for (const city of CITIES) {
      if (!trustedCities.includes(city.name)) continue;
      count++;
      for (const text of [
        generateCityServiceDescription(service.name, city.name, service.shortDescription),
        generateMetaDescription({ serviceName: service.name, city: city.name }),
      ]) {
        assert.equal(/trusted/i.test(text), false, text);
        assert.equal(text.startsWith(`${city.name} `), true, text);
      }
    }
  }
  assert.equal(count, 45);
  assert.match(generateMetaDescription({ serviceName: 'Custom Home Building', city: 'Boise' }), /^Boise's design-build /);
  const subcontractor = read('app/subcontractor/page.tsx');
  assert.match(subcontractor, /trusted subcontractors/);
  assert.match(subcontractor, /network of subcontractors/);
  assert.equal(subcontractor.includes('SHOW_TRUST'), true);
});

function credentialId(schema: Record<string, unknown>): string {
  const credential = schema.hasCredential as { identifier?: string } | undefined;
  return credential?.identifier || '';
}

test('contractor registration is on the footer, plain on the estimator, and in schema', () => {
  assert.equal(CONTRACTOR_REGISTRATION_LABEL, 'Idaho Registered Contractor #8381215');
  assert.equal(CONTRACTOR_REGISTRATION_LABEL.includes('('), false);
  assert.equal(CONTRACTOR_LICENSE_SEARCH_URL, 'https://dopl.idaho.gov/license-search/');
  const footer = read('components/Footer.tsx');
  assert.equal(footer.includes('ContractorRegistrationLink'), true);
  const link = read('components/ContractorRegistration.tsx');
  assert.equal(link.includes('CONTRACTOR_LICENSE_SEARCH_URL'), true);
  assert.match(link, /function ContractorRegistrationPlain[\s\S]*<p /);
  assert.equal(link.slice(link.indexOf('function ContractorRegistrationPlain')).includes('dopl.idaho.gov'), false);
  const chrome = read('components/ConditionalFooter.tsx');
  assert.match(chrome, /isEstimatorPath\(pathname\)\) return <ContractorRegistrationPlain/);
  const css = read('components/ContractorRegistration.module.css');
  assert.match(css, /white-space:\s*normal/);
  assert.match(css, /overflow:\s*visible/);
  assert.equal(read('components/P5Estimator.tsx').includes('8381215'), false);
  assert.equal(credentialId(generateLocalBusinessSchema() as Record<string, unknown>), CONTRACTOR_REGISTRATION_NUMBER);
  assert.equal(credentialId(generateOrganizationSchema() as Record<string, unknown>), CONTRACTOR_REGISTRATION_NUMBER);
  const service = generateServiceSchema('Custom Home Building', 'Custom homes') as { provider?: Record<string, unknown> };
  assert.equal(credentialId(service.provider || {}), CONTRACTOR_REGISTRATION_NUMBER);
});

function filesUnder(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) filesUnder(full, acc);
    else if (/\.(html|rsc)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

test('built home and city pages include the registration number', () => {
  const appDir = path.join(root, '.next/server/app');
  if (process.env.REQUIRE_STATIC_GREP !== '1') return;
  if (!fs.existsSync(appDir)) assert.fail('missing .next/server/app; run next build first');
  const files = filesUnder(appDir);
  const hit = (predicate: (rel: string) => boolean) =>
    files.filter((file) => predicate(path.relative(appDir, file)) && fs.readFileSync(file, 'utf8').includes('8381215'));
  const home = hit((rel) => rel === 'index.html' || rel === 'index.rsc' || rel === 'page.html');
  const city = hit((rel) => /(^|\/)areas\/boise(\/index)?\.(html|rsc)$/.test(rel) || rel.includes(`${path.sep}boise`) || rel.includes('/boise'));
  assert.ok(home.length > 0, `8381215 missing from built home page. html/rsc files: ${files.length}`);
  assert.ok(city.length > 0, `8381215 missing from built Boise city page. html/rsc files: ${files.length}`);
});

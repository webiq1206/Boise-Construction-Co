import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_PAGE_IMAGE } from '../lib/brand-page-metadata.ts';
import { generateCityServiceDescription, generateMetaDescription } from '../lib/seo.ts';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateServiceSchema } from '../lib/schema.ts';
import { GBP_DESCRIPTION, GBP_QA_SEED } from '../shared/gbpProfile.ts';
import { AREA_PAGE_FAQS } from '../shared/seoContent.ts';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { getCityServiceCopy } from '../shared/content/cityServiceCopy.ts';
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

test('share image is the approved year-free family branding card at the public preview path', () => {
  assert.equal(BRAND_PAGE_IMAGE.endsWith('/brand/page-preview.png'), true);
  const file = path.join(root, 'public/brand/page-preview.png');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  // Pixel-reviewed 2026-10-28: approved lockup on charcoal, no founding year.
  // Retain the exact raster guard against unreviewed public image claims.
  assert.equal(hash, '941dc8eeaba976a82d316defc3c3bf65a5fe969d7a7874d67f908da4e8b62a6d');
  assert.equal(fs.existsSync(path.join(root, 'public/brand/page-preview-year-free.png')), false);
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

type Credential = {
  credentialCategory?: string;
  identifier?: string;
  recognizedBy?: { '@type'?: string; name?: string; url?: string };
};

function credentialOf(schema: Record<string, unknown>): Credential {
  return (schema.hasCredential || {}) as Credential;
}

function assertRegistrationCredential(credential: Credential) {
  assert.equal(credential.credentialCategory, 'registration');
  assert.equal(credential.identifier, CONTRACTOR_REGISTRATION_NUMBER);
  assert.equal(credential.recognizedBy?.['@type'], 'GovernmentOrganization');
  assert.equal(credential.recognizedBy?.name, 'Idaho Division of Occupational and Professional Licenses');
  assert.equal(credential.recognizedBy?.url, 'https://dopl.idaho.gov/con/');
}

const SELF_LICENSED = [
  /are you licensed/i,
  /(?:we(?:'|’)re|we are|the company is|boise construction co is|fully) licensed/i,
  /licensed,\s*bonded/i,
  /as your licensed/i,
  /carries a license/i,
  /\bis licensed\b/i,
];

function assertNoSelfLicensedClaim(text: string, where: string) {
  for (const pattern of SELF_LICENSED) {
    const match = text.match(pattern);
    assert.equal(match, null, `${where} still claims ${match?.[0]}`);
  }
}

test('contractor registration is on the footer, plain on the estimator, and in schema', () => {
  assert.equal(CONTRACTOR_REGISTRATION_LABEL, 'Idaho Registered Contractor #8381215');
  assert.equal(CONTRACTOR_REGISTRATION_LABEL.includes('('), false);
  assert.equal(CONTRACTOR_LICENSE_SEARCH_URL, 'https://edopl.idaho.gov/OnlineServices/?link=PubSearch');
  const footer = read('components/Footer.tsx');
  assert.equal(footer.includes('ContractorRegistrationLink'), true);
  const link = read('components/ContractorRegistration.tsx');
  assert.equal(link.includes('CONTRACTOR_LICENSE_SEARCH_URL'), true);
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /title="Look up registration 8381215 on Idaho DOPL"/);
  assert.match(link, /aria-label="Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"/);
  assert.match(link, /function ContractorRegistrationPlain[\s\S]*<p /);
  const plain = link.slice(link.indexOf('function ContractorRegistrationPlain'));
  assert.equal(plain.includes('edopl.idaho.gov'), false);
  assert.equal(plain.includes('target='), false);
  const chrome = read('components/ConditionalFooter.tsx');
  assert.match(chrome, /isEstimatorPath\(pathname\)\) return <ContractorRegistrationPlain/);
  const css = read('components/ContractorRegistration.module.css') + read('app/contractor-registration.css');
  assert.match(css, /white-space:\s*normal/);
  assert.match(css, /overflow:\s*visible/);
  assert.match(css, /data-layout="page"/);
  assert.equal(read('components/P5Estimator.tsx').includes('8381215'), false);
  assertRegistrationCredential(credentialOf(generateLocalBusinessSchema() as Record<string, unknown>));
  assertRegistrationCredential(credentialOf(generateOrganizationSchema() as Record<string, unknown>));
  const service = generateServiceSchema('Custom Home Building', 'Custom homes') as { provider?: Record<string, unknown> };
  assertRegistrationCredential(credentialOf(service.provider || {}));
  const gbp = GBP_QA_SEED.find((entry) => /registered contractor/i.test(entry.question));
  assert.ok(gbp);
  assert.equal(gbp.question, 'Are you a registered contractor and insured?');
  assert.match(gbp.answer, /an Idaho Registered Contractor #8381215, bonded, and insured/);
  assert.equal(AREA_PAGE_FAQS[1].question, 'Are you a registered contractor and insured?');
  assert.match(AREA_PAGE_FAQS[1].answer, /an Idaho Registered Contractor #8381215, bonded, and insured/);
  for (const slug of ['boise', 'meridian', 'nampa', 'eagle', 'kuna', 'caldwell', 'star', 'middleton', 'garden-city']) {
    const faq = getAreaCityCopy(slug)?.faqs[1];
    assert.equal(faq?.question, 'Are you a registered contractor and insured?', slug);
    assert.match(faq?.answer || '', /Idaho Registered Contractor #8381215, bonded, and insured/);
  }
  const designBuildBoise = getCityServiceCopy('design-build', 'boise');
  const designBuildStar = getCityServiceCopy('design-build', 'star');
  assert.match(designBuildBoise?.faqs.map((faq) => faq.answer).join(' ') || '', /Idaho Registered Contractor #8381215/);
  assert.match(designBuildStar?.faqs.map((faq) => faq.answer).join(' ') || '', /as your Idaho Registered Contractor/);
  assert.equal((designBuildStar?.faqs.map((faq) => faq.answer).join(' ') || '').includes('as your licensed contractor'), false);
  const garden = generateMetaDescription({ serviceName: 'Custom Home Building', city: 'Garden City' });
  assert.equal(SHOW_TRUST, false);
  assert.equal(garden.includes('Satisfaction guaranteed'), false);
  assert.match(garden, /Free planning consultation/);
  assert.match(read('lib/seo.ts'), /Satisfaction guaranteed/);
  assert.match(read('public/brand/brand-kit.html'), /<meta name="robots" content="noindex">/);
});

test('public copy does not call this company licensed', () => {
  const chunks = [
    JSON.stringify(generateLocalBusinessSchema()),
    JSON.stringify(generateOrganizationSchema()),
    JSON.stringify(generateServiceSchema('Custom Home Building', 'Custom homes')),
    JSON.stringify(GBP_QA_SEED),
    JSON.stringify(AREA_PAGE_FAQS),
    ...CITIES.flatMap((city) => {
      const area = getAreaCityCopy(city.slug);
      return [
        area ? JSON.stringify(area) : '',
        ...SERVICES.flatMap((service) => [
          JSON.stringify(getCityServiceCopy(service.slug, city.slug) || ''),
          generateMetaDescription({ serviceName: service.name, city: city.name }),
          generateCityServiceDescription(service.name, city.name, service.shortDescription),
        ]),
      ];
    }),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('shared/seoContent.ts'),
    read('shared/gbpProfile.ts'),
    ...sourceTexts(['shared/content', 'app']),
  ];
  chunks.forEach((text, index) => assertNoSelfLicensedClaim(text, `copy ${index}`));
  for (const service of SERVICES) {
    for (const city of CITIES) {
      const text = generateMetaDescription({ serviceName: service.name, city: city.name });
      assert.equal(/satisfaction guaranteed/i.test(text), false, text);
    }
  }
});

function sourceTexts(dirs: string[]): string[] {
  const texts: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|txt|html|md)$/.test(entry.name)) texts.push(fs.readFileSync(full, 'utf8'));
    }
  };
  for (const dir of dirs) walk(path.join(root, dir));
  return texts;
}

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
  for (const file of files) {
    assertNoSelfLicensedClaim(fs.readFileSync(file, 'utf8'), path.relative(appDir, file));
  }
});

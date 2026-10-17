import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLocalBusinessSchema } from '../lib/schema.ts';
import { BUSINESS_INFO, generateCityServiceDescription, generateMetaDescription } from '../lib/seo.ts';
import { IDAHO_REGISTERED_CONTRACTOR } from '../shared/contractorRegistration.ts';
import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from '../shared/siteContent.ts';
import { SHOW_UNPROVEN_TRUST, satisfactionGuaranteedCta, topRatedLabel } from '../shared/trustClaims.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('unproven trust claims stay in source and stay unpublished', () => {
  assert.equal(SHOW_UNPROVEN_TRUST, false);
  assert.equal(topRatedLabel(), null);
  assert.equal(satisfactionGuaranteedCta(), 'Free planning consultation');
  assert.equal(satisfactionGuaranteedCta() === 'Satisfaction guaranteed', false);

  const unknownCity = generateMetaDescription({ serviceName: 'Custom Homes', serviceSlug: 'custom-homes', city: 'Not A City' });
  assert.equal(unknownCity.includes('Satisfaction guaranteed'), false);
  assert.equal(unknownCity.includes('top-rated'), false);
  assert.equal(unknownCity.includes('top rated'), false);

  const terms = read('app/terms-of-service/page.tsx');
  assert.match(terms, /Satisfaction Guarantee/);
  assert.equal(terms.includes('SHOW_UNPROVEN_TRUST'), false);
  assert.equal(terms.includes('item.id !== "document-section-9"'), false);
});

test('the Idaho registration number is one constant and is published', () => {
  assert.equal(IDAHO_REGISTERED_CONTRACTOR, 'Idaho Registered Contractor #8381215');
  assert.deepEqual(BUSINESS_INFO.licenses, [IDAHO_REGISTERED_CONTRACTOR]);
  const footer = read('components/Footer.tsx');
  assert.match(footer, /IdahoRegistrationLine/);
  assert.equal(footer.includes('License details available upon request'), false);

  const line = read('components/IdahoRegistrationLine.tsx');
  assert.match(line, /href=\{DOPL_SEARCH_URL\}/);
  assert.match(line, /target="_blank"/);
  assert.match(line, /rel="noopener noreferrer"/);
  assert.match(line, /title="Look up registration 8381215 on Idaho DOPL"/);
  assert.match(line, /aria-label="Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"/);
  assert.match(line, /Verify with Idaho DOPL/);
  assert.match(read('app/about/page.tsx'), /IdahoRegistrationLine/);
  assert.equal(read('shared/seoContent.ts').includes('edopl.idaho.gov'), false);
  assert.equal(read('shared/gbpProfile.ts').includes('edopl.idaho.gov'), false);

  const local = generateLocalBusinessSchema();
  const credential = local.hasCredential as {
    '@type': string;
    credentialCategory: string;
    name: string;
    identifier: string;
    recognizedBy: { name: string; url: string };
  };
  assert.equal(credential['@type'], 'EducationalOccupationalCredential');
  assert.equal(credential.credentialCategory, 'registration');
  assert.equal(credential.name, 'Idaho Registered Contractor');
  assert.equal(credential.identifier, '8381215');
  assert.equal(credential.recognizedBy.name, 'Idaho Division of Occupational and Professional Licenses');
  assert.equal(credential.recognizedBy.url, 'https://dopl.idaho.gov/con/');
  assert.equal(JSON.stringify(local).includes('edopl.idaho.gov'), false);
});

test('How P5 works is the seven shared lines and city metas drop trusted', () => {
  assert.equal(HOW_P5_WORKS_TITLE, 'How P5 works');
  assert.deepEqual([...HOW_P5_WORKS], [
    'Own install crew',
    'Bonded & insured',
    'Manufacturer warranties passed through',
    'Install dates confirmed in writing',
    'Written update every week',
    'Free in-home consultation, no pressure',
    'Public representative: Nick Perkins',
  ]);
  assert.match(read('app/page.tsx'), /HowP5Works/);
  assert.match(read('app/about/page.tsx'), /HowP5Works/);
  assert.equal(read('shared/siteContent.ts').includes('Lead time'), false);

  const kuna = generateMetaDescription({ serviceName: 'Custom Homes', serviceSlug: 'custom-homes', city: 'Kuna' });
  assert.match(kuna, /Kuna design-build/);
  assert.equal(kuna.includes('trusted'), false);
  const unknown = generateMetaDescription({ serviceName: 'Custom Homes', serviceSlug: 'custom-homes', city: 'Not A City' });
  assert.equal(unknown.includes('trusted'), false);
  const cityService = generateCityServiceDescription('Custom Homes', 'Not A City', 'A short description of the work');
  assert.match(cityService, /^Local /);
  assert.equal(cityService.includes('trusted'), false);
});

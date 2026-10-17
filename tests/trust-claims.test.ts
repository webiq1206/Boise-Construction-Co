import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUSINESS_INFO, generateMetaDescription } from '../lib/seo.ts';
import { IDAHO_REGISTERED_CONTRACTOR } from '../shared/contractorRegistration.ts';
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
  assert.match(terms, /SHOW_UNPROVEN_TRUST/);
  assert.match(terms, /item\.id !== "document-section-9"/);
});

test('the Idaho registration number is one constant and is published', () => {
  assert.equal(IDAHO_REGISTERED_CONTRACTOR, 'Idaho Registered Contractor #8381215');
  assert.deepEqual(BUSINESS_INFO.licenses, [IDAHO_REGISTERED_CONTRACTOR]);
  const footer = read('components/Footer.tsx');
  assert.match(footer, /\{IDAHO_REGISTERED_CONTRACTOR\}/);
  assert.equal(footer.includes('License details available upon request'), false);
});

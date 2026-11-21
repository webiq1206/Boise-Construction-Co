import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CONTRACTOR_REGISTRATION_LABEL } from '../shared/contractorRegistration.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';

const PARENT_NAP =
  'P5 Home Co, Meridian, ID 83646 (service-area business, no public street). Phone (208) 477-1169. Web https://p5homeco.com.';
const BBB = 'https://www.bbb.org/us/id/meridian/profile/general-contractor/p5-home-co-llc-1296-1000203624';
const ADU_SHORT =
  '- [ADUs & Guest Houses](https://boiseconstruction.co/services/adu): New detached accessory dwellings and guest houses on the lot you already own, planned around setbacks, utilities, and how you will use the space.';
const ADU_FULL =
  '- ADUs & Guest Houses: /services/adu - New detached accessory dwellings and guest houses on the lot you already own, planned around setbacks, utilities, and how you will use the space.';

const LEGAL_FILES = [
  'shared/siteConfig.ts',
  'shared/contractorRegistration.ts',
  'shared/gbpProfile.ts',
  'lib/schema.ts',
  'lib/seo.ts',
  'app/terms-of-service/page.tsx',
  'shared/seoContent.ts',
  'shared/content/areaCopy.ts',
];

test('llms files carry the shared NAP, BBB, nine cities, and the unchanged ADU lines', () => {
  for (const name of ['public/llms.txt', 'public/llms-full.txt']) {
    const text = readFileSync(name, 'utf8');
    assert.ok(text.includes(PARENT_NAP), name);
    assert.ok(text.includes('Boise Construction Co: https://boiseconstruction.co.'), name);
    assert.ok(text.includes(BBB), name);
    assert.match(text, /Serving Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City/);
    assert.match(text, /Last updated: 2026-11-21/);
    assert.equal(text.includes('/services/general-contractor'), false, name);
    assert.equal(text.includes('streetAddress'), false, name);
    assert.doesNotMatch(text, /accredited|BBB rating|A\+ rating/i);
  }
  assert.ok(readFileSync('public/llms.txt', 'utf8').includes(ADU_SHORT));
  assert.ok(readFileSync('public/llms-full.txt', 'utf8').includes(ADU_FULL));
  assert.ok(readFileSync('public/llms.txt', 'utf8').includes(`[BBB](${BBB})`));
  assert.ok(readFileSync('public/llms-full.txt', 'utf8').includes(`BBB ${BBB}`));
});

test('schema, registration, FAQs and terms use P5 Home Co LLC, and the brand email stays', () => {
  assert.equal(BUSINESS_INFO.legalName, 'P5 Home Co LLC');
  assert.equal(SITE_CONFIG.legalName, 'P5 Home Co LLC');
  assert.equal(SITE_CONFIG.parentName, 'P5 Home Co');
  assert.equal(CONTRACTOR_REGISTRATION_LABEL, 'P5 Home Co LLC, Idaho Registered Contractor #8381215');
  assert.equal(SITE_CONFIG.email, 'hello@boiseconstruction.co');
  for (const file of LEGAL_FILES) {
    const text = readFileSync(file, 'utf8');
    assert.equal(text.includes('P5 Home Co, LLC'), false, file);
    assert.equal(text.includes('P5 Home Co. LLC'), false, file);
  }
  assert.match(readFileSync('app/terms-of-service/page.tsx', 'utf8'), /P5 Home Co LLC/);
});

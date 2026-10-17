import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { generateLocalBusinessSchema } from '../lib/schema.ts';
import { buildBusinessVCard } from '../lib/vcard.ts';
import { GBP_NAP } from '../shared/gbpProfile.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTACT_HOURS = 'Mon – Fri 9 am – 6 pm · Sat 9 am – 4 pm';

const WEEKDAY = '9:00 AM - 6:00 PM';
const SATURDAY = '9:00 AM - 4:00 PM';

test('LocalBusiness schema hours are Mon-Fri 9-6, Saturday 9-4, Sunday closed', () => {
  const expected = {
    monday: WEEKDAY,
    tuesday: WEEKDAY,
    wednesday: WEEKDAY,
    thursday: WEEKDAY,
    friday: WEEKDAY,
    saturday: SATURDAY,
    sunday: 'Closed',
  };
  assert.deepEqual(BUSINESS_INFO.hours, expected);
  assert.deepEqual({ ...GBP_NAP.hours }, expected);

  const specs = generateLocalBusinessSchema().openingHoursSpecification as {
    dayOfWeek: string;
    opens: string;
    closes: string;
  }[];
  const byDay = Object.fromEntries(specs.map((spec) => [spec.dayOfWeek, spec]));

  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    assert.equal(byDay[day]?.opens, '09:00', day);
    assert.equal(byDay[day]?.closes, '18:00', day);
  }
  assert.equal(byDay.Saturday?.opens, '09:00');
  assert.equal(byDay.Saturday?.closes, '16:00');
  assert.equal(byDay.Sunday, undefined);
  assert.equal(specs.length, 6);

  const contact = fs.readFileSync(path.join(root, 'app/contact/page.tsx'), 'utf8');
  assert.equal(contact.includes(`subtext="${CONTACT_HOURS}"`), true);
  assert.equal(contact.includes('7 am'), false);
  assert.equal(contact.includes('8 am'), false);

  const card = buildBusinessVCard().replace(/\r\n[ \t]/g, '');
  assert.match(
    card,
    /Hours: Monday 9:00 AM - 6:00 PM\\; Tuesday 9:00 AM - 6:00 PM\\; Wednesday 9:00 AM - 6:00 PM\\; Thursday 9:00 AM - 6:00 PM\\; Friday 9:00 AM - 6:00 PM\\; Saturday 9:00 AM - 4:00 PM\\; Sunday Closed/,
  );
  assert.equal(card.includes('7:00 AM'), false);
  assert.equal(card.includes('8:00 AM'), false);
});

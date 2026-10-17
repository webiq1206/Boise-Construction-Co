import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { generateLocalBusinessSchema } from '../lib/schema.ts';
import { GBP_NAP } from '../shared/gbpProfile.ts';

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
});

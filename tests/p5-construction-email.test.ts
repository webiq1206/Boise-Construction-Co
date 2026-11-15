/**
 * Boise Construction Co estimator mail. Renders HTML and text. Does not send.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';
import {legalIdentityLine} from '../lib/p5/brandIdentity.ts';
import {ESTIMATOR_FROM} from '../lib/p5/deliveryAdapter.ts';
import {
  ESTIMATE_DISCLAIMER,
  VALUE_TIERS,
  assertCopy,
  emailBrandFrom,
  estimatorTestMode,
  isRealHref,
  valueTier,
} from '../lib/p5/emailKit.ts';
import {
  CONSTRUCTION_FIXTURES,
  EMAIL_FROM,
  renderConstructionAlert,
  renderConstructionFixture,
  renderConstructionIntake,
  renderConstructionReview,
} from './construction-email-fixtures.ts';

const LOGO = 'https://boiseconstruction.co/brand/png/wordmark/light/boise-construction-co-wordmark-charcoal-accent-1200w.png';
const SHARED = ['emailKit.ts', 'estimateEmail.ts', 'intakeEmail.ts', 'outbox.ts', 'reviewRequest.ts'];

function money(amount: number) {
  return amount.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});
}

function withoutLegal(value: string) {
  return value.split(legalIdentityLine()).join(' ');
}

function assertThisBrand(html: string, text: string, options?: {phone?: boolean}) {
  const body = `${html}\n${text}`;
  assert.match(html, new RegExp(LOGO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /#C48D3F/i);
  assert.match(body, /Boise Construction Co/);
  assert.match(body, /boiseconstruction\.co/);
  if (options?.phone !== false) assert.match(body, /\(208\) 477-1169/);
  assert.doesNotMatch(withoutLegal(body), /P5 Home Co/);
  assert.doesNotMatch(body, /p5homeco\.com/);
  assert.doesNotMatch(body, /4031|Wapoot|showroom/i);
  assert.doesNotMatch(body, /[\u2013\u2014]/);
  assert.doesNotMatch(html, /<script>|undefined|\{\{/);
  assertCopy(html, text, {customerAddresses: ['100 Example Ave, Boise, ID 83702']});
}

test('shared mail reads this brand, and P5 Home Co is only the From header', () => {
  assert.equal(ESTIMATOR_BRAND.name, 'Boise Construction Co');
  assert.equal(ESTIMATOR_BRAND.domain, 'boiseconstruction.co');
  assert.equal(ESTIMATOR_BRAND.email, 'hello@boiseconstruction.co');
  assert.equal(ESTIMATOR_BRAND.phone, '(208) 477-1169');
  assert.equal(ESTIMATOR_BRAND.accent, '#C48D3F');
  assert.equal(ESTIMATOR_BRAND.ink, '#383837');
  assert.equal(ESTIMATOR_BRAND.cityLine, 'Meridian, ID 83646');
  assert.equal(ESTIMATOR_BRAND.logo, '/brand/png/wordmark/light/boise-construction-co-wordmark-charcoal-accent-1200w.png');
  assert.equal(ESTIMATOR_FROM, EMAIL_FROM);
  assert.equal(ESTIMATOR_FROM, 'P5 Home Co <hello@p5homeco.com>');
  assert.deepEqual(VALUE_TIERS, {smallUnder: 10_000, majorOver: 75_000});
  assert.equal(valueTier(6800), 'small');
  assert.equal(valueTier(10_000), 'standard');
  assert.equal(valueTier(75_000), 'standard');
  assert.equal(valueTier(75_001), 'major');
  assert.equal(isRealHref('https://qbo.intuit.com/app/estimate'), false);
  assert.equal(isRealHref('https://qbo.intuit.com/app/estimate?txnId=73'), true);
  for (const file of SHARED) {
    assert.doesNotMatch(readFileSync(new URL(`../lib/p5/${file}`, import.meta.url), 'utf8'), /P5 Home Co|p5homeco\.com|#ceb391/, file);
  }
  const outbox = readFileSync(new URL('../lib/p5/outbox.ts', import.meta.url), 'utf8');
  assert.match(outbox, /testInbox=brand\.email/);
  assert.match(outbox, /CRM_DELIVERY_ENABLED&&!testMode/);
  assert.equal(estimatorTestMode('[QA] Ada Small', {}), false);
  assert.equal(estimatorTestMode('TEST Ada', {}), true);
  assert.equal(estimatorTestMode('Ada', {ESTIMATOR_TEST_MODE: 'on'}), true);
  const brand = emailBrandFrom(ESTIMATOR_BRAND);
  assert.equal(brand.logoUrl, LOGO);
  assert.equal(brand.name, 'Boise Construction Co');
  assert.equal(brand.accent, '#C48D3F');
  assert.equal(brand.siteUrl, 'https://boiseconstruction.co');
  assert.equal(brand.cityLine, 'Meridian, ID 83646');
});

test('every construction fixture renders admin and customer mail from the stored range', () => {
  const roles = new Set<string>();
  for (const fixture of CONSTRUCTION_FIXTURES) {
    const rendered = renderConstructionFixture(fixture);
    assert.equal(rendered.tier, fixture.tier);
    for (const message of [rendered.admin, rendered.customer]) {
      assert.ok(message.html.startsWith('<!doctype html>'));
      assert.ok(message.text.trim().length > 0);
    }
    assertThisBrand(rendered.admin.html, rendered.admin.text, {phone: false});
    assertThisBrand(rendered.customer.html, rendered.customer.text);
    assert.match(rendered.customer.html, /Schedule now/);
    assert.ok(rendered.customer.text.includes(ESTIMATE_DISCLAIMER));
    assert.match(rendered.customer.html, /https:\/\/meetings-na2\.hubspot\.com\/client3/);
    assert.doesNotMatch(rendered.admin.html, /Open in QuickBooks/);
    assert.doesNotMatch(rendered.customer.html, /Open in QuickBooks/);
    if (fixture.range) {
      roles.add(fixture.tier);
      const low = money(fixture.range.low);
      const high = money(fixture.range.high);
      for (const part of [rendered.customer.html, rendered.customer.text, rendered.admin.html, rendered.admin.text]) {
        assert.ok(part.includes(low), `${fixture.id} missing ${low}`);
        assert.ok(part.includes(high), `${fixture.id} missing ${high}`);
      }
      if (fixture.directCost != null) {
        const internal = money(fixture.directCost);
        assert.ok(rendered.admin.text.includes(internal));
        assert.doesNotMatch(rendered.customer.html + rendered.customer.text, new RegExp(internal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    } else {
      roles.add('withheld');
      assert.match(rendered.customer.text, /Pricing pending review|not released|Withheld|closer look/i);
      assert.doesNotMatch(rendered.customer.text, /\$\d/);
    }
    if (fixture.uploads.length) assert.match(rendered.admin.html, /View uploaded files/);
    else assert.doesNotMatch(rendered.admin.html, /View uploaded files/);
    if (fixture.phone) assert.match(rendered.admin.html, new RegExp(`tel:\\+1${fixture.phone.replace(/\D/g, '')}`));
    else assert.doesNotMatch(rendered.admin.html, /Call \(208\) 555/);
    assert.doesNotMatch(rendered.customer.html, /<script>/);
  }
  assert.ok(roles.has('small') && roles.has('standard') && roles.has('major') && roles.has('withheld'));
});

test('intake, review and the delivery alert use this brand, and P5 Home Co stays in From', () => {
  const intake = renderConstructionIntake([{name: 'plans.pdf', size: 1200, url: 'https://boiseconstruction.co/files/plans.pdf', attached: true}]);
  const review = renderConstructionReview();
  const alert = renderConstructionAlert();
  for (const message of [intake.customer, intake.admin, review, alert]) assertThisBrand(message.html, message.text);
  assert.match(intake.customer.html, /Schedule now/);
  assert.match(intake.customer.text, /Meridian, ID 83646|boiseconstruction\.co/);
  assert.doesNotMatch(intake.admin.html, /Schedule now/);
  assert.match(review.html, /Meridian, ID 83646/);
  assert.match(alert.html, /Meridian, ID 83646/);
  assert.match(alert.html, /Open the estimator admin/);
  assert.match(alert.text, /does not resubmit|Do not resubmit/i);
  assert.equal(EMAIL_FROM.includes('P5 Home Co'), true);
  assert.equal(`${review.html}\n${alert.html}`.includes('P5 Home Co'), false);
});

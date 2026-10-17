import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GOOGLE_ADS_LEAD_LABEL,
  googleAdsUserData,
  trackGoogleAdsLeadConversion,
  type GoogleAdsUserInput,
} from '../lib/googleAdsConversion.ts';

const granted = {ad_storage: 'granted', ad_user_data: 'granted'};
const denied = {ad_storage: 'denied', ad_user_data: 'denied'};

function calls(consent: {ad_storage: string; ad_user_data: string} | undefined) {
  const events: unknown[][] = [];
  const storage = new Map<string, string>();
  const prior = (globalThis as {window?: unknown}).window;
  (globalThis as {window?: unknown}).window = {
    gtag: (...args: unknown[]) => events.push(args),
    p5Consent: consent,
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  };
  return {
    events,
    restore() {
      (globalThis as {window?: unknown}).window = prior;
    },
  };
}

const sample: GoogleAdsUserInput = {
  email: '  Ada@Example.COM ',
  phone: '(208) 555-0100',
  name: '  Ada   Lovelace ',
  postalCode: '83702',
};

test('email, phone, and name are normalized, and a street or description is not a field', () => {
  const data = googleAdsUserData(sample);
  assert.deepEqual(data, {
    email: 'ada@example.com',
    phone_number: '+12085550100',
    address: {
      first_name: 'Ada',
      last_name: 'Lovelace',
      postal_code: '83702',
      country: 'US',
    },
  });
  assert.equal(googleAdsPhone('+1 208-555-0100'), '+12085550100');
  assert.equal(googleAdsUserData({phone: '2085550100'})?.phone_number, '+12085550100');
  assert.equal(googleAdsUserData({phone: '555-0100'}), undefined);
  assert.equal(googleAdsUserData({phone: '442079460958'}), undefined);
  assert.equal(googleAdsUserData({phone: '02085550100'}), undefined);
  assert.equal(googleAdsUserData({email: '   '}), undefined);
  assert.deepEqual(googleAdsUserData({name: 'Ada'}).address, {first_name: 'Ada', country: 'US'});
  const street = googleAdsUserData({postalCode: '123 Main Street, Boise, ID 83702'});
  assert.equal(street, undefined);
  assert.equal(JSON.stringify(googleAdsUserData(sample)).includes('Main Street'), false);
  assert.equal(googleAdsUserData({}), undefined);
  assert.equal('address' in googleAdsUserData({email: 'ada@example.com'})!, false);
});

function googleAdsPhone(phone: string) {
  return googleAdsUserData({phone}).phone_number;
}

test('user_data is set only when the conversion fires and Ads consent already allows it', () => {
  const seen = calls(granted);
  try {
    assert.equal(trackGoogleAdsLeadConversion({user: sample, projectType: 'addition'}, 'conv_success'), true);
    assert.equal(trackGoogleAdsLeadConversion({user: sample}, 'conv_success'), false);
    assert.deepEqual(seen.events.map((event) => event[0]), ['set', 'event']);
    assert.equal(seen.events[0][1], 'user_data');
    assert.equal(seen.events[1][1], 'conversion');
    assert.equal((seen.events[1][2] as {transaction_id: string}).transaction_id, 'conv_success');
    assert.equal((seen.events[1][2] as {send_to: string}).send_to, GOOGLE_ADS_LEAD_LABEL);
    assert.equal(JSON.stringify(seen.events[1][2]).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(seen.events[1][2]).includes('street'), false);
  } finally {
    seen.restore();
  }
});

test('a denied Google tag still fires the conversion and does not set user_data', () => {
  const seen = calls(denied);
  try {
    assert.equal(trackGoogleAdsLeadConversion({user: sample}, 'conv_denied'), true);
    assert.deepEqual(seen.events.map((event) => [event[0], event[1]]), [['event', 'conversion']]);
    assert.equal((seen.events[0][2] as {transaction_id: string}).transaction_id, 'conv_denied');
  } finally {
    seen.restore();
  }
});

test('a conversion without contact fields does not set user_data', () => {
  const seen = calls(granted);
  try {
    assert.equal(trackGoogleAdsLeadConversion({projectType: 'addition'}, 'conv_empty'), true);
    assert.deepEqual(seen.events.map((event) => event[1]), ['conversion']);
  } finally {
    seen.restore();
  }
});

test('each lead form passes only its collected fields, after the server accepts the submit', () => {
  const consultation = fs.readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  const estimator = fs.readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  const successAt = consultation.indexOf('onSuccess:');
  const errorAt = consultation.indexOf('onError:');
  const userAt = consultation.indexOf('postalCode: deriveZip(variables.address)');
  assert.ok(successAt > 0 && userAt > successAt && userAt < errorAt);
  assert.match(consultation, /user:\s*\{[^}]*email:\s*variables\.email[^}]*phone:\s*variables\.phone[^}]*name:\s*variables\.name[^}]*postalCode:\s*deriveZip\(variables\.address\)/s);
  assert.doesNotMatch(consultation, /user:\s*\{[^}]*variables\.message/s);
  assert.doesNotMatch(consultation, /user:\s*\{[^}]*address:\s*variables\.address/s);

  const intakeGuard = estimator.indexOf('if(!response.ok)throw new Error');
  const intakeCall = estimator.indexOf('trackGoogleAdsLeadConversion({service:latest.answers.service,user:{name:latest.contact.name,email:latest.contact.email,phone:latest.contact.phone}}');
  const estimateCall = estimator.indexOf('trackGoogleAdsLeadConversion({service:d.answers.service,user:{name:d.contact.name,email:d.contact.email,phone:d.contact.phone}}');
  assert.ok(intakeGuard >= 0 && intakeCall > intakeGuard);
  assert.ok(estimateCall > intakeCall);
  assert.doesNotMatch(estimator, /user:\{[^}]*text:/);
  assert.doesNotMatch(estimator, /user:\{[^}]*postalCode/);

  const successTag = consultation.match(/<div[^>]*data-testid="consultation-success"[^>]*>/)?.[0] ?? '';
  assert.match(successTag, /data-testid="consultation-success"/);
  if (successTag.includes('data-clarity-mask')) assert.match(successTag, /data-clarity-mask="True"/);
  assert.doesNotMatch(consultation, /data-clarity-unmask/);
  assert.doesNotMatch(estimator, /data-clarity-unmask/);
  for (const mask of consultation.match(/data-clarity-mask="[^"]*"/g) ?? []) {
    assert.equal(mask, 'data-clarity-mask="True"');
  }
});

test('the privacy page uses Priya enhanced-conversions wording and keeps the blog-search clause', () => {
  const source = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /Last updated: October 17, 2026/);
  assert.match(source, /When you successfully submit a form or finish the estimator with your contact details, our site passes whichever of these you provide \(your email address, phone number, first name, last name and ZIP code\) to Google's advertising tag, which converts them into a scrambled code \(a SHA-256 hash\) before sending them to Google\. Google matches that code against its own records to tell us which of our ads lead to inquiries\. We do not send your street address or your project description to Google\. Google Analytics receives only the type of project you choose \(for example, an addition or an ADU\) when you use the estimator or send an inquiry, and the words you type into our blog search\. Google Ads receives a random reference number for your inquiry so each lead is counted only once\./);
  assert.doesNotMatch(source, /We do not currently send your name, email, phone number, address or project description to Google/);
  assert.doesNotMatch(source, /TODO \(pending Priya's enhanced-conversions wording\)/);
});

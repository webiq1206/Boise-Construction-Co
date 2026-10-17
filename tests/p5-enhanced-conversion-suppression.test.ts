import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {
  GOOGLE_ADS_LEAD_LABEL,
  trackGoogleAdsLeadConversion,
} from '../lib/googleAdsConversion.ts';
import {
  enhancedConversionsAllowed,
  normalizedSuppressionEmail,
  suppressionHash,
  suppressionHashes,
  withAllowEnhancedConversions,
} from '../lib/enhancedConversionSuppression.ts';

const granted = {ad_storage: 'granted', ad_user_data: 'granted'};
const email = '  Ada@Example.COM ';
const phone = '(208) 555-0100';
const emailHash = createHash('sha256').update('ada@example.com').digest('hex');
const phoneHash = createHash('sha256').update('+12085550100').digest('hex');

function calls() {
  const events: unknown[][] = [];
  const storage = new Map<string, string>();
  const prior = (globalThis as {window?: unknown}).window;
  (globalThis as {window?: unknown}).window = {
    gtag: (...args: unknown[]) => events.push(args),
    p5Consent: granted,
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

test('suppression stores a hash of the normalized email or phone and not the raw value', () => {
  assert.equal(normalizedSuppressionEmail(email), 'ada@example.com');
  assert.equal(suppressionHash('ada@example.com'), emailHash);
  const rows = suppressionHashes({email, phone});
  assert.deepEqual(rows, [
    {kind: 'email', valueHash: emailHash},
    {kind: 'phone', valueHash: phoneHash},
  ]);
  assert.equal(JSON.stringify(rows).includes('Ada@'), false);
  assert.equal(JSON.stringify(rows).includes('555'), false);
  assert.deepEqual(suppressionHashes({email: '   ', phone: '555-0100'}), []);
  const script = fs.readFileSync(new URL('../scripts/suppress-enhanced-conversion.ts', import.meta.url), 'utf8');
  assert.match(script, /addEnhancedConversionSuppression\(kind as SuppressionKind, raw\)/);
  assert.match(script, /suppressed \$\{saved\.kind\} \$\{saved\.valueHash\}/);
  assert.doesNotMatch(script, /INSERT INTO[^;]*raw/i);
});

test('a matching email or phone hash refuses enhanced conversions', async () => {
  const lookup = async (hashes: string[]) => hashes.includes(emailHash);
  assert.equal(await enhancedConversionsAllowed({email, phone: '2085550199'}, lookup), false);
  assert.equal(await enhancedConversionsAllowed({email: 'other@example.com', phone}, async (hashes) => hashes.includes(phoneHash)), false);
  assert.equal(await enhancedConversionsAllowed({email: 'other@example.com', phone: '2085550199'}, async () => false), true);
  const response = await withAllowEnhancedConversions(
    {accepted: true, inquiryKey: 'inq_1', conversionId: 'conv_1', result: {range: {low: 1, high: 2}}},
    {email, phone},
    async (hashes) => hashes.includes(emailHash),
  );
  assert.equal(response.allowEnhancedConversions, false);
  assert.equal(response.accepted, true);
  assert.equal(response.inquiryKey, 'inq_1');
  assert.equal(response.conversionId, 'conv_1');
  assert.deepEqual(response.result, {range: {low: 1, high: 2}});
});

test('a suppressed contact skips user_data and still fires the conversion', () => {
  const seen = calls();
  try {
    const user = {email, phone, name: 'Ada Lovelace', postalCode: '83702'};
    assert.equal(trackGoogleAdsLeadConversion({user, allowEnhancedConversions: false, projectType: 'addition'}, 'conv_suppressed'), true);
    assert.deepEqual(seen.events.map((event) => [event[0], event[1]]), [['event', 'conversion']]);
    const params = seen.events[0][2] as {transaction_id: string; send_to: string; value: number};
    assert.equal(params.transaction_id, 'conv_suppressed');
    assert.equal(params.send_to, GOOGLE_ADS_LEAD_LABEL);
    assert.equal(params.value, 300);
    assert.equal(JSON.stringify(params).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(params).includes('user_data'), false);
  } finally {
    seen.restore();
  }
});

test('submit responses carry the flag and the client checks it before user_data', () => {
  const consultationRoute = fs.readFileSync(new URL('../app/api/consultation/route.ts', import.meta.url), 'utf8');
  const consultation = fs.readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  const estimator = fs.readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  assert.match(consultationRoute, /allowEnhancedConversionsFlag\(\{ email: data\.email, phone: data\.phone \}\)/);
  assert.match(consultationRoute, /inquiryKey: intakeResult\.inquiryKey/);
  assert.match(consultation, /allowEnhancedConversions: response\.allowEnhancedConversions/);
  assert.doesNotMatch(estimator, /allowEnhancedConversions/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  const privacy = fs.readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(privacy, /opt out of enhanced conversions/i);
});

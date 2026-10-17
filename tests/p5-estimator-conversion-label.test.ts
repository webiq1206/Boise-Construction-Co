import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GOOGLE_ADS_ESTIMATOR_LABEL, GOOGLE_ADS_LEAD_LABEL, trackGoogleAdsLeadConversion} from '../lib/googleAdsConversion.ts';

function calls() {
  const events: unknown[][] = [];
  const storage = new Map<string, string>();
  const prior = (globalThis as {window?: unknown}).window;
  (globalThis as {window?: unknown}).window = {
    gtag: (...args: unknown[]) => events.push(args),
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

function sendTo(events: unknown[][]): string[] {
  return events.map((event) => (event[2] as {send_to: string}).send_to);
}

test('an estimator finish fires the estimator label and the form label once', () => {
  const seen = calls();
  try {
    assert.equal(trackGoogleAdsLeadConversion({service: 'new-build'}, 'estimator:draft-1'), true);
    assert.equal(trackGoogleAdsLeadConversion({service: 'new-build'}, 'estimator:draft-1'), false);
    assert.deepEqual(sendTo(seen.events), [GOOGLE_ADS_ESTIMATOR_LABEL, GOOGLE_ADS_LEAD_LABEL]);
    assert.equal((seen.events[0][2] as {transaction_id: string}).transaction_id, 'estimator:draft-1');
    assert.equal((seen.events[1][2] as {transaction_id: string}).transaction_id, 'estimator:draft-1');
    assert.equal((seen.events[1][2] as {value: number}).value, 300);
  } finally {
    seen.restore();
  }
});

test('an intake finish fires both labels once per key', () => {
  const seen = calls();
  try {
    assert.equal(trackGoogleAdsLeadConversion({}, 'intake:construction:project-1'), true);
    assert.equal(trackGoogleAdsLeadConversion({}, 'intake:construction:project-1'), false);
    assert.deepEqual(sendTo(seen.events), [GOOGLE_ADS_ESTIMATOR_LABEL, GOOGLE_ADS_LEAD_LABEL]);
  } finally {
    seen.restore();
  }
});

test('a form lead fires only the form label', () => {
  const seen = calls();
  try {
    assert.equal(trackGoogleAdsLeadConversion({projectType: 'Custom home'}, 'form-lead-1'), true);
    assert.equal(trackGoogleAdsLeadConversion({projectType: 'Custom home'}, 'form-lead-1'), false);
    assert.deepEqual(sendTo(seen.events), [GOOGLE_ADS_LEAD_LABEL]);
    assert.equal((seen.events[0][2] as {transaction_id: string}).transaction_id, 'form-lead-1');
  } finally {
    seen.restore();
  }
});

test('the shared estimator engine still calls the helper and does not name the new label', () => {
  const source = fs.readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  assert.match(source, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(source, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(source.includes('cEzmCPOagKAdEKzf-q9E'), false);
  assert.equal(source.includes('GOOGLE_ADS_ESTIMATOR_LABEL'), false);
});

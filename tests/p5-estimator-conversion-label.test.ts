import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GOOGLE_ADS_ESTIMATOR_LABEL, GOOGLE_ADS_LEAD_LABEL, GTAG_READY_ATTEMPTS, GTAG_READY_WAIT_MS, trackGoogleAdsLeadConversion} from '../lib/googleAdsConversion.ts';

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

test('a missing gtag retries for 5 seconds, then fires once inside try/catch', () => {
  assert.equal(GTAG_READY_ATTEMPTS * GTAG_READY_WAIT_MS, 5000);
  const events: unknown[][] = [];
  const storage = new Map<string, string>();
  const timers: Array<() => void> = [];
  const fake: {
    gtag?: (...args: unknown[]) => void;
    setTimeout: (fn: () => void, ms: number) => number;
    sessionStorage: {getItem: (key: string) => string | null; setItem: (key: string, value: string) => void};
  } = {
    setTimeout(fn, ms) {
      assert.equal(ms, GTAG_READY_WAIT_MS);
      timers.push(fn);
      return timers.length;
    },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  const prior = (globalThis as {window?: unknown}).window;
  (globalThis as {window?: unknown}).window = fake;
  try {
    assert.equal(trackGoogleAdsLeadConversion({}, 'form-wait-1'), false);
    assert.equal(events.length, 0);
    fake.gtag = (...args) => events.push(args);
    assert.equal(timers.length, 1);
    timers.shift()!();
    assert.deepEqual(sendTo(events), [GOOGLE_ADS_LEAD_LABEL]);
    assert.equal(trackGoogleAdsLeadConversion({}, 'form-wait-1'), false);
    assert.equal(events.length, 1);

    delete fake.gtag;
    assert.equal(trackGoogleAdsLeadConversion({}, 'form-expire-1'), false);
    for (let attempt = 0; attempt < GTAG_READY_ATTEMPTS; attempt += 1) {
      assert.equal(timers.length, 1);
      timers.shift()!();
    }
    assert.equal(timers.length, 0);
    assert.equal(events.length, 1);

    fake.gtag = () => {
      throw new Error('gtag blocked');
    };
    assert.doesNotThrow(() => trackGoogleAdsLeadConversion({}, 'form-throw-1'));
    assert.equal(trackGoogleAdsLeadConversion({}, 'form-throw-1'), false);
  } finally {
    (globalThis as {window?: unknown}).window = prior;
  }
});

test('the shared estimator engine still calls the helper and does not name the new label', () => {
  const source = fs.readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  assert.match(source, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(source, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(source.includes('cEzmCPOagKAdEKzf-q9E'), false);
  assert.equal(source.includes('GOOGLE_ADS_ESTIMATOR_LABEL'), false);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CITY_SERVICE_MERGES } from '../shared/cityServiceRedirects.js';
import { redirectIndexNowUrls } from '../scripts/indexnow-redirects.js';
import {
  buildSubmitPayload,
  patchIndexNowLog,
  runSubmission,
} from '../scripts/submit-indexnow-redirects.mjs';

const manifest = { sha: 'abc123', urls: ['https://boiseconstruction.co/'] };
const logReturn = 'return `[IndexNow] sha=${sha} submitted=${submitted} status=${status}`;';

test('the post-deploy payload includes the 28 redirected URLs and their targets', () => {
  assert.equal(CITY_SERVICE_MERGES.length, 28);
  const payload = buildSubmitPayload(manifest);
  for (const row of CITY_SERVICE_MERGES) {
    assert.equal(row.source.includes('/adu'), false, row.source);
    assert.equal(payload.urlList.includes(`https://boiseconstruction.co${row.source}`), true, row.source);
    assert.equal(payload.urlList.includes(`https://boiseconstruction.co${row.destination}`), true, row.destination);
  }
  assert.equal(payload.urlList.some((url) => url.includes('/adu')), false);
  assert.equal(payload.urlList.filter((url) => url.endsWith('/services/custom-home-builder/boise')).length, 1);
  assert.equal(payload.urlList.includes('https://boiseconstruction.co/'), true);
  assert.equal(payload.urlList.filter((url) => redirectIndexNowUrls().includes(url)).length, redirectIndexNowUrls().length);
});

test('a published deploy posts that payload and the log counts the redirects', async () => {
  const calls = [];
  const result = await runSubmission({
    env: { REPLIT_DEPLOYMENT: '1' },
    manifest,
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { status: 202 };
    },
  });
  assert.equal(result.posted, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(calls[0].body.urlList, buildSubmitPayload(manifest).urlList);
  assert.equal(
    result.log,
    `[IndexNow] sha=abc123 submitted=${calls[0].body.urlList.length} status=202 redirects=${redirectIndexNowUrls().length}`,
  );
});

test('the manifest submitter log line gains the same redirect count', () => {
  const source = `export function formatLog(sha, submitted, status) {\n  ${logReturn}\n}\n`;
  const patched = patchIndexNowLog(source, redirectIndexNowUrls().length);
  assert.match(patched, new RegExp(`redirects=${redirectIndexNowUrls().length}`));
  assert.equal(patchIndexNowLog(patched, 1), patched);
  assert.equal(patchIndexNowLog('no log here', 4), null);
});

test('the build and CI do not call the IndexNow API', async () => {
  const nextConfig = readFileSync('next.config.js', 'utf8');
  const prebuild = JSON.parse(readFileSync('package.json', 'utf8')).scripts.prebuild;
  const start = readFileSync('start.sh', 'utf8');
  assert.equal(nextConfig.includes('indexnow'), false);
  assert.equal(nextConfig.includes('api.indexnow.org'), false);
  assert.equal(prebuild.includes('api.indexnow.org'), false);
  assert.equal(prebuild.includes('submit-indexnow'), false);
  assert.equal(start.includes('(sleep 1 && node scripts/submit-indexnow-redirects.mjs) &'), true);
  assert.equal(start.includes('node scripts/submit-indexnow.mjs'), true);
  const result = await runSubmission({
    env: { CI: 'true', REPLIT_DEPLOYMENT: '1', GITHUB_ACTIONS: 'true' },
    manifest,
    fetchImpl: async () => {
      throw new Error('the build must not call IndexNow');
    },
  });
  assert.equal(result.posted, false);
  assert.match(result.log, /^\[IndexNow\] sha=abc123 submitted=0 status=skipped redirects=\d+$/);
});

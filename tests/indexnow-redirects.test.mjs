import assert from 'node:assert/strict';
import test from 'node:test';
import { CITY_SERVICE_MERGES } from '../shared/cityServiceRedirects.js';
import { addRedirectsToIndexNowManifest, redirectIndexNowUrls } from '../scripts/indexnow-redirects.js';

test('IndexNow gets the 28 redirected URLs and their parent targets', () => {
  assert.equal(CITY_SERVICE_MERGES.length, 28);
  const urls = redirectIndexNowUrls();
  for (const row of CITY_SERVICE_MERGES) {
    assert.equal(row.source.includes('/adu'), false, row.source);
    assert.equal(urls.includes(`https://boiseconstruction.co${row.source}`), true, row.source);
    assert.equal(urls.includes(`https://boiseconstruction.co${row.destination}`), true, row.destination);
  }
  assert.equal(urls.some((url) => url.includes('/adu')), false);
  const manifest = addRedirectsToIndexNowManifest({
    sha: 'abc123',
    urls: ['https://boiseconstruction.co/'],
  });
  assert.equal(manifest.sha, 'abc123');
  assert.equal(manifest.urls[0], 'https://boiseconstruction.co/');
  assert.equal(manifest.urls.includes('https://boiseconstruction.co/services/custom-home-builder/boise'), true);
  assert.equal(manifest.urls.includes('https://boiseconstruction.co/services/custom-home-builder'), true);
  assert.equal(manifest.urls.filter((url) => url.endsWith('/services/custom-home-builder/boise')).length, 1);
  const again = addRedirectsToIndexNowManifest(manifest);
  assert.equal(again.urls.length, manifest.urls.length);
});

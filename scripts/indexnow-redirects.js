/**
 * The 28 redirected city URLs for the post-deploy IndexNow submit.
 * scripts/submit-indexnow-redirects.mjs adds these to the manifest and posts
 * them when the server starts. Nothing here calls api.indexnow.org, and the
 * build does not load this file.
 */
const { CITY_SERVICE_MERGES } = require('../shared/cityServiceRedirects');

const HOST = 'https://boiseconstruction.co';

function redirectIndexNowUrls() {
  const urls = [];
  const seen = new Set();
  for (const row of CITY_SERVICE_MERGES) {
    for (const route of [row.source, row.destination]) {
      if (route.includes('/adu')) continue;
      const url = `${HOST}${route}`;
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function addRedirectsToIndexNowManifest(manifest) {
  const urls = Array.isArray(manifest && manifest.urls) ? [...manifest.urls] : [];
  const seen = new Set(urls);
  for (const url of redirectIndexNowUrls()) {
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return { sha: (manifest && manifest.sha) || 'unknown', urls };
}

module.exports = {
  redirectIndexNowUrls,
  addRedirectsToIndexNowManifest,
};

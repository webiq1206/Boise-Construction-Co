/**
 * The 28 redirected city URLs, added to the IndexNow manifest.
 *
 * scripts/prepare-indexnow.mjs writes public/indexnow-deploy.json at build
 * time, and scripts/submit-indexnow.mjs posts that file after a deploy and
 * logs `[IndexNow] sha=<sha> submitted=<n> status=<http>`. This step adds the
 * redirect sources and their parent-service targets to that same file, so the
 * post-deploy submit includes them. It never calls api.indexnow.org.
 */
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
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

function applyIndexNowRedirects(root) {
  const target = path.join(root, 'public', 'indexnow-deploy.json');
  let current = { sha: 'unknown', urls: [] };
  if (existsSync(target)) {
    try {
      current = JSON.parse(readFileSync(target, 'utf8'));
    } catch {
      current = { sha: 'unknown', urls: [] };
    }
  }
  const next = addRedirectsToIndexNowManifest(current);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

module.exports = {
  redirectIndexNowUrls,
  addRedirectsToIndexNowManifest,
  applyIndexNowRedirects,
};

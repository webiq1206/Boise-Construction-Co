#!/usr/bin/env node
/**
 * Post-deploy IndexNow for the 28 redirected city URLs.
 *
 * start.sh runs this a second after boot, before scripts/submit-indexnow.mjs
 * posts. When that submitter is the manifest reader, this adds
 * redirectIndexNowUrls() to the manifest and to its IndexNow log line, and
 * does not call the API itself. Otherwise this process posts that list, and
 * only on a published deploy. A build never loads this file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { addRedirectsToIndexNowManifest, redirectIndexNowUrls } = require('./indexnow-redirects.js');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '475ffad65ebe989b627307f7471c7897';
const HOST = process.env.HOST ?? 'boiseconstruction.co';
const KEY_LOCATION = process.env.KEY_LOCATION ?? `https://${HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_API = process.env.INDEXNOW_API ?? 'https://api.indexnow.org/indexnow';
const LOG_RETURN = 'return `[IndexNow] sha=${sha} submitted=${submitted} status=${status}`;';

export function formatLog(sha, submitted, status, redirects) {
  return `[IndexNow] sha=${sha} submitted=${submitted} status=${status} redirects=${redirects}`;
}

export function deploymentAllowsSubmit(env) {
  if (env.INDEXNOW_DISABLE === '1') return false;
  if (env.CI === 'true' || env.CI === '1') return false;
  if (env.GITHUB_ACTIONS === 'true') return false;
  if (env.GITHUB_EVENT_NAME === 'pull_request') return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return false;
  if (env.REPLIT_DEPLOYMENT === '1') return true;
  if (env.INDEXNOW_POST_DEPLOY === '1') return true;
  return false;
}

function fallbackDecide(env, manifest, alreadySubmittedSha) {
  const sha = manifest && manifest.sha ? String(manifest.sha) : '';
  const urls = manifest && Array.isArray(manifest.urls) ? manifest.urls.filter(Boolean) : [];
  if (!deploymentAllowsSubmit(env)) return { submit: false, sha, urls, reason: 'not-post-deploy' };
  if (!sha || sha === 'unknown') return { submit: false, sha, urls, reason: 'no-sha' };
  if (alreadySubmittedSha && alreadySubmittedSha === sha) return { submit: false, sha, urls, reason: 'already-submitted' };
  if (urls.length === 0) return { submit: false, sha, urls, reason: 'no-urls' };
  return { submit: true, sha, urls, reason: 'deploy' };
}

export function readManifest(env = process.env) {
  const candidates = [
    env.INDEXNOW_MANIFEST,
    path.join(root, 'public', 'indexnow-deploy.json'),
    path.join(root, '.next', 'standalone', 'public', 'indexnow-deploy.json'),
  ].filter(Boolean);
  for (const file of candidates) {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      // try the next location
    }
  }
  return null;
}

export function manifestForSubmit(env = process.env) {
  const current = readManifest(env) || { sha: '', urls: [] };
  if (!current.sha) current.sha = env.GIT_COMMIT || 'redirects';
  return addRedirectsToIndexNowManifest(current);
}

export function redirectCountIn(urls) {
  const wanted = new Set(redirectIndexNowUrls());
  return urls.filter((url) => wanted.has(url)).length;
}

export function buildSubmitPayload(manifest) {
  const enriched = addRedirectsToIndexNowManifest(manifest || { sha: 'redirects', urls: [] });
  return {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: enriched.urls,
  };
}

/** The post-deploy log line gains the redirect count. */
export function patchIndexNowLog(source, redirects) {
  if (source.includes('redirects=')) return source;
  if (!source.includes(LOG_RETURN)) return null;
  const patched = `return \`[IndexNow] sha=\${sha} submitted=\${submitted} status=\${status} redirects=${redirects}\`;`;
  return source.replace(LOG_RETURN, patched);
}

export function manifestPaths() {
  return [
    path.join(root, 'public', 'indexnow-deploy.json'),
    path.join(root, '.next', 'standalone', 'public', 'indexnow-deploy.json'),
  ];
}

export function writeManifest(manifest) {
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  const written = [];
  for (const file of manifestPaths()) {
    if (file.endsWith('/.next/standalone/public/indexnow-deploy.json') && !existsSync(path.dirname(file))) continue;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
    written.push(file);
  }
  return written;
}

export function usesManifestSubmitter() {
  return existsSync(path.join(root, 'scripts', 'indexnow-lib.mjs'));
}

export async function planSubmission(env, manifest, already = '') {
  const enriched = addRedirectsToIndexNowManifest(manifest || { sha: env.GIT_COMMIT || 'redirects', urls: [] });
  const redirects = redirectCountIn(enriched.urls);
  let decide = fallbackDecide;
  if (usesManifestSubmitter()) {
    const lib = await import('./indexnow-lib.mjs');
    decide = lib.decideSubmission;
  }
  const decision = decide(env, enriched, already);
  return { ...decision, redirects, enriched };
}

export async function runSubmission({ env, manifest, already = '', fetchImpl = fetch }) {
  const plan = await planSubmission(env, manifest, already);
  if (!plan.submit) {
    return {
      posted: false,
      log: formatLog(plan.sha || 'none', 0, 'skipped', plan.redirects),
      payload: null,
    };
  }
  const payload = buildSubmitPayload(plan.enriched);
  if (env.INDEXNOW_DRY_RUN === '1') {
    return {
      posted: false,
      log: formatLog(plan.sha, payload.urlList.length, 'dry-run', plan.redirects),
      payload,
    };
  }
  const res = await fetchImpl(INDEXNOW_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    posted: true,
    log: formatLog(plan.sha, payload.urlList.length, res.status, plan.redirects),
    payload,
  };
}

function applyLogPatch(redirects) {
  const file = path.join(root, 'scripts', 'indexnow-lib.mjs');
  const source = readFileSync(file, 'utf8');
  const patched = patchIndexNowLog(source, redirects);
  if (patched && patched !== source) writeFileSync(file, patched);
  return patched != null;
}

async function main() {
  const enriched = manifestForSubmit(process.env);
  const redirects = redirectCountIn(enriched.urls);
  if (usesManifestSubmitter()) {
    writeManifest(enriched);
    const patched = applyLogPatch(redirects);
    if (patched) return;
  }
  const result = await runSubmission({ env: process.env, manifest: enriched });
  console.log(result.log);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[IndexNow] Error: ${error.message}`);
    process.exitCode = 0;
  });
}

#!/usr/bin/env node
/**
 * Submit the build-time IndexNow manifest once the new deployment is serving.
 * Cold starts skip when this commit SHA was already submitted. CI and pull
 * request builds never call the network.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideSubmission, deploymentAllowsSubmit, formatLog, INDEXNOW_SETTINGS_KEY } from './indexnow-lib.mjs';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '475ffad65ebe989b627307f7471c7897';
const HOST = process.env.HOST ?? 'boiseconstruction.co';
const KEY_LOCATION = process.env.KEY_LOCATION ?? `https://${HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_API = process.env.INDEXNOW_API ?? 'https://api.indexnow.org/indexnow';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function markerPath(env) {
  return env.INDEXNOW_MARKER_PATH || '/tmp/indexnow-last-sha';
}

function readMarkerFile(env) {
  try {
    return readFileSync(markerPath(env), 'utf8').trim();
  } catch {
    return '';
  }
}

function writeMarkerFile(env, sha) {
  const file = markerPath(env);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${sha}\n`);
}

async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function databaseSha(databaseUrl, sha) {
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(databaseUrl);
  if (sha) {
    await sql`insert into site_settings (key, value, updated_by) values (${INDEXNOW_SETTINGS_KEY}, ${sha}, 'indexnow') on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = 'indexnow'`;
    return sha;
  }
  const rows = await sql`select value from site_settings where key = ${INDEXNOW_SETTINGS_KEY} limit 1`;
  return rows[0]?.value ? String(rows[0].value) : '';
}

function readManifest() {
  const candidates = [
    process.env.INDEXNOW_MANIFEST,
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

async function waitUntilServing(origin) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${origin}/`, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) return true;
    } catch {
      // the new process is not accepting requests yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function main() {
  const env = process.env;
  const manifest = readManifest();
  let already = readMarkerFile(env);
  if (deploymentAllowsSubmit(env) && env.DATABASE_URL) {
    try {
      const stored = await withTimeout(databaseSha(env.DATABASE_URL), 5000);
      if (stored) already = stored;
    } catch (error) {
      console.warn(`[IndexNow] marker read failed: ${error.message}`);
    }
  }
  const decision = decideSubmission(env, manifest, already);
  if (!decision.submit) {
    console.log(formatLog(decision.sha || 'none', 0, 'skipped'));
    return;
  }
  const origin = `https://${HOST}`;
  const serving = await waitUntilServing(origin);
  if (!serving) {
    console.log(formatLog(decision.sha, 0, 'unavailable'));
    return;
  }
  if (env.INDEXNOW_DRY_RUN === '1') {
    console.log(formatLog(decision.sha, decision.urls.length, 'dry-run'));
    return;
  }
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: decision.urls,
  };
  const res = await fetch(INDEXNOW_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log(formatLog(decision.sha, decision.urls.length, res.status));
  if (res.status === 200 || res.status === 202) {
    writeMarkerFile(env, decision.sha);
    if (env.DATABASE_URL) {
      try {
        await withTimeout(databaseSha(env.DATABASE_URL, decision.sha), 5000);
      } catch (error) {
        console.warn(`[IndexNow] marker write failed: ${error.message}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(`[IndexNow] Error: ${error.message}`);
  process.exitCode = 0;
});

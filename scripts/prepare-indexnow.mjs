#!/usr/bin/env node
/**
 * Build-time IndexNow manifest. Git is available here and is not available
 * in the running deployment, so the changed URLs are written into the build
 * output. This script never calls api.indexnow.org.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'https://boiseconstruction.co';

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

/** Map a changed source file to public paths. Bracket routes and ADU URLs are skipped. */
export function pathsForFile(file) {
  if (file.includes('/adu') || file.endsWith('/adu.ts') || file.includes('adu-cost')) return [];
  const blog = file.match(/^shared\/content\/wave2\/([^/]+)\.ts$/);
  if (blog) return [`/blog/${blog[1]}`];
  const guide = file.match(/^shared\/content\/pillars\/([^/]+)\.ts$/);
  if (guide) return [`/guides/${guide[1]}`];
  if (file === 'app/page.tsx' || file === 'lib/schema.ts' || file === 'shared/gbpProfile.ts') return ['/'];
  if (file === 'public/llms.txt') return ['/llms.txt'];
  if (file === 'public/llms-full.txt') return ['/llms-full.txt'];
  const page = file.match(/^app\/(.+)\/page\.tsx$/);
  if (page && !page[1].includes('[')) {
    if (page[1] === 'sitemap') return [];
    return [`/${page[1]}`];
  }
  return [];
}

export function buildManifest(sha, files) {
  const paths = new Set(['/']);
  for (const file of files) {
    for (const route of pathsForFile(file)) paths.add(route);
  }
  const urls = [...paths].filter((route) => !route.includes('/adu')).map((route) => `${HOST}${route}`);
  return { sha: sha || 'unknown', urls };
}

function main() {
  const sha = process.env.GIT_COMMIT || git('rev-parse HEAD') || 'unknown';
  const diff = git('diff --name-only HEAD~1 HEAD');
  const files = diff ? diff.split('\n').filter(Boolean) : [];
  const manifest = buildManifest(sha, files);
  const target = path.join(root, 'public', 'indexnow-deploy.json');
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[IndexNow] prepared sha=${manifest.sha} urls=${manifest.urls.length} (no submission)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

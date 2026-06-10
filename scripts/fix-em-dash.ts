/**
 * Pre-publish helper: auto-convert typographic em-dashes to plain hyphens.
 *
 * The build guard scripts/verify-no-em-dash.ts fails the build if a U+2014
 * em-dash (or its HTML-entity / unicode-escape equivalents) appears anywhere in
 * the source. This helper rewrites those forms to a hyphen "-" so the guard
 * passes. It mirrors the guard's scan rules (same extensions, same excluded
 * dirs) so that running this fixer guarantees the guard will pass afterward.
 *
 * Usage:
 *   npx tsx scripts/fix-em-dash.ts          # fix in place (default)
 *   npx tsx scripts/fix-em-dash.ts --check  # warn only, non-zero exit if found
 *
 * The deploy build runs this automatically (see build.sh) before `next build`,
 * so publishing no longer breaks on a stray em-dash. Run it locally anytime to
 * clean up before committing.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.svg',
  '.html',
]);

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  '.local',
  '.agents',
  '.config',
  '.cache',
  '.upm',
  '.swc',
  '.turbo',
  '.vercel',
  'coverage',
  'playwright-report',
  'test-results',
]);

// These files intentionally contain the patterns we search for, so never
// rewrite them or they would corrupt themselves.
const EXCLUDED_FILES = new Set([
  join('scripts', 'verify-no-em-dash.ts'),
  join('scripts', 'fix-em-dash.ts'),
]);

// Every render-equivalent form of an em-dash: the literal U+2014 character, the
// HTML entities, and the unicode-escape sequences (matched case-insensitively).
const PATTERN = /\u2014|&mdash;|&#8212;|&#x2014;|\\u2014|\\u\{2014\}/gi;

function collectFiles(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry)) continue;
      collectFiles(abs, out);
    } else {
      const rel = relative(ROOT, abs);
      if (EXCLUDED_FILES.has(rel)) continue;
      const dot = entry.lastIndexOf('.');
      const ext = dot === -1 ? '' : entry.slice(dot).toLowerCase();
      if (SCAN_EXTENSIONS.has(ext)) out.push(abs);
    }
  }
}

interface Hit {
  file: string;
  count: number;
}

function main(): void {
  const checkOnly = process.argv.includes('--check');

  const files: string[] = [];
  collectFiles(ROOT, files);

  const hits: Hit[] = [];
  let total = 0;

  for (const abs of files) {
    const content = readFileSync(abs, 'utf8');
    const matches = content.match(PATTERN);
    if (!matches || matches.length === 0) continue;
    total += matches.length;
    hits.push({ file: relative(ROOT, abs), count: matches.length });
    if (!checkOnly) {
      writeFileSync(abs, content.replace(PATTERN, '-'), 'utf8');
    }
  }

  if (total === 0) {
    console.log(`fix-em-dash: OK (scanned ${files.length} files, no em-dashes found)`);
    return;
  }

  if (checkOnly) {
    console.error(
      `fix-em-dash: found ${total} em-dash occurrence(s) in ${hits.length} file(s).\n` +
        `Run "npx tsx scripts/fix-em-dash.ts" to auto-convert them to hyphens.\n`,
    );
    for (const h of hits) {
      console.error(`  ${h.file}  (${h.count})`);
    }
    process.exit(1);
  }

  console.log(`fix-em-dash: converted ${total} em-dash occurrence(s) to hyphens in ${hits.length} file(s):`);
  for (const h of hits) {
    console.log(`  ${h.file}  (${h.count})`);
  }
}

main();

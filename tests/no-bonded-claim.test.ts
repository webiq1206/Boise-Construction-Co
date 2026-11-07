import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Repo GBP copy. Nothing in this scan is excluded. */
const TARGETS = ['shared/gbpProfile.ts', 'local-seo-audit'];
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.txt', '.md']);

function sourceHits(): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    const stat = fs.statSync(dir);
    if (stat.isFile()) {
      const rel = path.relative(root, dir);
      if (!SOURCE_EXT.has(path.extname(dir))) return;
      const text = fs.readFileSync(dir, 'utf8');
      if (/\bbonded\b/i.test(text)) hits.push(rel);
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(path.join(dir, entry.name));
    }
  };
  for (const target of TARGETS) walk(path.join(root, target));
  return hits;
}

test('bonded does not appear in repo GBP copy', () => {
  assert.deepEqual(sourceHits(), []);
});

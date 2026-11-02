import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GET } from '../app/api/testimonials/route.ts';
import {
  SHOW_TESTIMONIALS,
  getTestimonialsFor,
  getTestimonialsForCity,
} from '../shared/testimonialsData.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('the testimonials endpoint returns an empty list while the flag is off', async () => {
  assert.equal(SHOW_TESTIMONIALS, false);
  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  assert.deepEqual(getTestimonialsFor('custom-home-builder', 'kuna'), []);
  assert.deepEqual(getTestimonialsForCity('kuna'), []);

  const route = read('app/api/testimonials/route.ts');
  assert.match(route, /from\(testimonials\)/);
  assert.match(route, /NextResponse\.json\(TESTIMONIALS\)/);

  const published = [
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('app/feed.xml/route.ts'),
    read('app/sitemap.ts'),
  ].join('\n');
  assert.equal(published.includes('Lawn Care'), false);
  assert.equal(published.includes('Sarah M.'), false);
  assert.equal(published.includes('testimonials'), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

const REVIEW_NEEDLES = [
  'Lawn Care',
  'Lawn Care Kuna',
  'taking care of our yard',
  'never looked better',
  'Best Christmas light installation',
  'recommended them to all our neighbors',
  'beautiful patio in our backyard',
];

function filesUnder(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) filesUnder(full, acc);
    else acc.push(full);
  }
  return acc;
}

test('client source does not contain the other-business review text', () => {
  const roots = ['app', 'components', 'shared', 'lib', 'public'].map((dir) => path.join(root, dir));
  const hits: string[] = [];
  for (const dir of roots) {
    for (const file of filesUnder(dir)) {
      if (!/\.(ts|tsx|js|jsx|mjs|txt|html|json)$/.test(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const needle of REVIEW_NEEDLES) {
        if (text.includes(needle)) hits.push(`${path.relative(root, file)}: ${needle}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test('post-build client bundles omit Lawn Care and Kuna review strings', () => {
  const staticDir = path.join(root, '.next/static');
  if (!fs.existsSync(staticDir)) {
    if (process.env.REQUIRE_STATIC_GREP === '1') {
      assert.fail('missing .next/static; run next build before the bundle grep');
    }
    return;
  }
  const hits: string[] = [];
  for (const file of filesUnder(staticDir)) {
    if (!/\.(js|css|json|txt|html|map)$/.test(file)) continue;
    const text = fs.readFileSync(file);
    const decoded = text.toString('utf8');
    for (const needle of REVIEW_NEEDLES) {
      if (decoded.includes(needle)) hits.push(`${path.relative(root, file)}: ${needle}`);
    }
  }
  assert.deepEqual(hits, []);
});

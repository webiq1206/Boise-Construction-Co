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
});

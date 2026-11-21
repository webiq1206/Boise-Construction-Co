import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  ADA_COUNTY_CITY_LIST,
  CANYON_COUNTY_CITY_LIST,
  SERVICE_AREA_CITIES,
  SERVICE_AREA_CITY_LIST,
} from '../shared/contentData.ts';

const NAMES = ['Boise', 'Meridian', 'Nampa', 'Eagle', 'Kuna', 'Caldwell', 'Star', 'Middleton', 'Garden City'];
const SERVE_CUE = /we build in|we serve|serving boise|nobody building in|differ across boise|land prices across boise/i;

function contentFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) contentFiles(full, acc);
    else if (name.endsWith('.ts') && !name.toLowerCase().includes('adu')) acc.push(full);
  }
  return acc;
}

test('one shared list is the nine service-area cities', () => {
  assert.deepEqual(SERVICE_AREA_CITIES.map((city) => city.name), NAMES);
  assert.equal(SERVICE_AREA_CITY_LIST, 'Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City');
  assert.equal(ADA_COUNTY_CITY_LIST, 'Boise, Meridian, Eagle, Kuna, Star, and Garden City');
  assert.equal(CANYON_COUNTY_CITY_LIST, 'Nampa, Caldwell, and Middleton');
});

test('a we-serve list names all nine cities, and Ada lists include Garden City', () => {
  const files = contentFiles(path.join(process.cwd(), 'shared', 'content'));
  assert.ok(files.length > 10);
  for (const file of files) {
    const sentences = readFileSync(file, 'utf8').split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const listed = NAMES.filter((name) => sentence.includes(name));
      if (SERVE_CUE.test(sentence) && listed.length >= 6) {
        for (const name of NAMES) {
          assert.ok(sentence.includes(name), `${path.basename(file)} is missing ${name}`);
        }
      }
      if (sentence.includes('Boise, Meridian, Eagle, Kuna')) {
        assert.ok(sentence.includes(ADA_COUNTY_CITY_LIST), `${path.basename(file)} Ada list dropped a city`);
      }
      const canyon = sentence.split(/Canyon County (?:covers|includes)/)[1];
      if (canyon) {
        const clause = canyon.split(/[.;]/)[0];
        assert.equal(clause.includes('Garden City'), false, path.basename(file));
        assert.match(clause, /Nampa, Caldwell, and Middleton/);
      }
    }
  }
});

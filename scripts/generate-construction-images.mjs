/**
 * Generates the new construction hero photos that break the remaining shared
 * blog heroes, via the OpenAI Images API (same source as the existing library).
 *
 * Setup:
 *   export OPENAI_API_KEY=sk-...
 *
 * Usage:
 *   node scripts/generate-construction-images.mjs           # all
 *   node scripts/generate-construction-images.mjs <name>    # one
 *
 * Output: scripts/image-staging-new/{name}.png
 * Then:   node scripts/import-construction-images.mjs scripts/image-staging-new
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'image-staging-new');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const STYLE =
  'Photorealistic, professional editorial construction and real-estate photography, ' +
  'Treasure Valley Idaho, natural daylight, shallow depth of field, crisp high detail, ' +
  'no people, no readable text, no watermarks, no logos.';

const IMAGES = {
  'build-vs-buy-comparison':
    'A residential subdivision street with, on the left, an existing finished resale home with mature landscaping and a blank white yard sign, and on the right, a brand-new home still under wood framing with a dirt yard, side by side.',
  'building-permit-placard':
    'A yellow residential building-permit placard mounted on a wooden stake at the front of a new-home construction site, with a partially framed two-story house and stacked lumber behind it under a blue sky.',
  'construction-loan-draw':
    'A top-down desk scene of a construction loan draw schedule and bank statement paperwork with a calculator, a pen, a hard hat, and rolled house plans, a framed home softly visible through a window behind.',
  'builder-bid-spreadsheet':
    'A desk with an open laptop showing a generic bid-comparison spreadsheet of colored bars, next to two printed proposal folders and a notepad with a pen.',
  'cost-breakdown-variance':
    'A close-up desk scene of a detailed multi-line construction cost-breakdown printout with columns of numbers, a magnifying glass resting on it, and two colored highlighters.',
  'utility-connections-trench':
    'An open utility trench running water, sewer, and electrical conduit toward a new home concrete foundation on a subdivision dirt lot, with a gray utility meter pedestal and a stack of pipe nearby.',
  'framing-materials-onsite':
    'A new home under wood framing surrounded by neatly stacked dimensional lumber, roof trusses, and shrink-wrapped material pallets on the dirt job site.',
};

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const names = requested.length > 0 ? requested : Object.keys(IMAGES);
for (const n of names) {
  if (!IMAGES[n]) {
    console.error(`Unknown image: ${n}`);
    process.exit(1);
  }
}

fs.mkdirSync(outDir, { recursive: true });

async function generate(name, scene) {
  const prompt = `${scene} ${STYLE}`;
  console.log(`Generating ${name}...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'high',
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI error for ${name}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data for ${name}`);
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  console.log(`  wrote ${file}`);
}

for (const name of names) {
  await generate(name, IMAGES[name]);
}
console.log(`\nDone. ${names.length} image(s) in ${outDir}.`);

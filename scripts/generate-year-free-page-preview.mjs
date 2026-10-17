/**
 * Year-free share card. public/brand/page-preview.png keeps the EST 2020 seal.
 * Those letters are outlined paths on the seal SVG (bottom-arc glyphs whose
 * translate Y is above 900). This renders that SVG with and without them,
 * aligns the ochre ring to the ring on the photo, and copies only the pixels
 * that change. Output: public/brand/page-preview-year-free.png
 *
 * Usage: node scripts/generate-year-free-page-preview.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sealPath = path.join(root, 'public/brand/svg/seal/any/boise-construction-co-seal-on-charcoal-accent.svg');
const sourcePath = path.join(root, 'public/brand/page-preview.png');
const destPath = path.join(root, 'public/brand/page-preview-year-free.png');

function withoutYear(svg) {
  const next = svg.replace(/<path\b[^>]*\/>/g, (tag) => {
    const match = tag.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/);
    if (!match) return tag;
    return Number(match[2]) > 900 ? '' : tag;
  });
  if (next === svg) throw new Error('No bottom-arc year glyphs were removed from the seal SVG');
  return next;
}

function isOchre(r, g, b) {
  return Math.abs(r - 208) < 28 && Math.abs(g - 154) < 28 && Math.abs(b - 92) < 30 && r > g && g > b;
}

function ochreBox(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (!isOchre(data[i], data[i + 1], data[i + 2])) continue;
      count++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (count < 100) throw new Error('Ochre seal ring not found');
  return { minX, minY, maxX, maxY, count };
}

const svg = fs.readFileSync(sealPath, 'utf8');
const size = 1024;
const [original, yearFree] = await Promise.all(
  [svg, withoutYear(svg)].map((markup) =>
    sharp(Buffer.from(markup)).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ),
);
const ring = ochreBox(original.data, original.info.width, original.info.height, original.info.channels);
const photo = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const photoRing = ochreBox(photo.data, photo.info.width, photo.info.height, photo.info.channels);
const scaleX = (photoRing.maxX - photoRing.minX) / (ring.maxX - ring.minX);
const scaleY = (photoRing.maxY - photoRing.minY) / (ring.maxY - ring.minY);
const out = Buffer.from(photo.data);
let changed = 0;
const channels = original.info.channels;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const i = (y * size + x) * channels;
    if (
      original.data[i] === yearFree.data[i] &&
      original.data[i + 1] === yearFree.data[i + 1] &&
      original.data[i + 2] === yearFree.data[i + 2]
    ) {
      continue;
    }
    const px = Math.round(photoRing.minX + (x - ring.minX) * scaleX);
    const py = Math.round(photoRing.minY + (y - ring.minY) * scaleY);
    if (px < 0 || py < 0 || px >= photo.info.width || py >= photo.info.height) continue;
    const j = (py * photo.info.width + px) * photo.info.channels;
    out[j] = yearFree.data[i];
    out[j + 1] = yearFree.data[i + 1];
    out[j + 2] = yearFree.data[i + 2];
    out[j + 3] = 255;
    changed++;
  }
}
if (changed < 50) throw new Error(`Year glyphs did not land on the preview (${changed} pixels)`);
await sharp(out, { raw: { width: photo.info.width, height: photo.info.height, channels: photo.info.channels } })
  .png()
  .toFile(destPath);
console.log(
  `wrote ${path.relative(root, destPath)} changed ${changed}px ring photo ${photoRing.minX},${photoRing.minY}-${photoRing.maxX},${photoRing.maxY}`,
);

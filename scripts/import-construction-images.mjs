/**
 * Copies generated construction imagery into public/images/construction and
 * writes a webp beside each png.
 *
 * The site serves webp and keeps the png as the source of record, matching how
 * the existing service and area imagery is stored.
 *
 * Run: node scripts/import-construction-images.mjs <source-dir>
 */
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('Usage: node scripts/import-construction-images.mjs <source-dir>');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'public', 'images', 'construction');
mkdirSync(outDir, { recursive: true });

const files = readdirSync(src).filter((f) => f.endsWith('.png'));
if (files.length === 0) {
  console.error(`No png files in ${src}`);
  process.exit(1);
}

let count = 0;
for (const file of files) {
  const from = path.join(src, file);
  const toPng = path.join(outDir, file);
  copyFileSync(from, toPng);

  const toWebp = toPng.replace(/\.png$/, '.webp');
  await sharp(from).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(toWebp);
  count += 1;
  console.log(`  ${file} -> png + webp`);
}

console.log(`\nImported ${count} construction image(s) to public/images/construction.`);

/**
 * Replaces a marketing image in public/images with a new source file, writing
 * both the png of record and the webp the site actually serves.
 *
 * Run: node scripts/replace-marketing-image.mjs <source.png> <target-basename>
 */
import { copyFileSync, existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const [src, name] = process.argv.slice(2);
if (!src || !name || !existsSync(src)) {
  console.error('Usage: node scripts/replace-marketing-image.mjs <source.png> <target-basename>');
  process.exit(1);
}

const dir = path.join(process.cwd(), 'public', 'images');
const png = path.join(dir, `${name}.png`);
const webp = path.join(dir, `${name}.webp`);

copyFileSync(src, png);
await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webp);

console.log(`Replaced ${name}.png and ${name}.webp`);

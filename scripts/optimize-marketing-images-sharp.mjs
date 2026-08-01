/**
 * Compress marketing PNGs to WebP using sharp (no Python required).
 * Run: node scripts/optimize-marketing-images-sharp.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const imagesRoot = path.join(root, "public", "images");
const MAX_WIDTH = 1920;
const QUALITY = 80;

const TARGET_DIRS = [
  imagesRoot,
  path.join(imagesRoot, "gallery"),
  path.join(imagesRoot, "services"),
];

function collectPngs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((f) => f.endsWith(".png"))
    .map((f) => path.join(directory, f));
}

async function optimizeFile(inputPath) {
  const outputPath = inputPath.replace(/\.png$/i, ".webp");
  const before = fs.statSync(inputPath).size;

  let pipeline = sharp(inputPath);
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(outputPath);

  const after = fs.statSync(outputPath).size;
  console.log(
    `${path.relative(root, outputPath)}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`,
  );
}

const pngs = [...new Set(TARGET_DIRS.flatMap(collectPngs))];
if (pngs.length === 0) {
  console.log("No PNG files found to optimize.");
  process.exit(0);
}

console.log(`Optimizing ${pngs.length} PNG(s) to WebP...`);
for (const png of pngs) {
  await optimizeFile(png);
}
console.log("Done.");

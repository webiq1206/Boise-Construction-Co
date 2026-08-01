/**
 * Copy generated PNGs from a staging folder into public/images paths, then optimize.
 *
 * Drop files into scripts/image-staging/ using these exact names:
 *   hero-great-room.png
 *   gallery-kitchen-before.png  -> public/images/gallery/
 *   services/kitchen-remodel.png -> public/images/services/
 *
 * Usage:
 *   node scripts/install-marketing-pngs.mjs
 *   npm run images:optimize
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const staging = path.join(__dirname, "image-staging");
const imagesRoot = path.join(root, "public", "images");

function destPath(name) {
  if (name.startsWith("services/")) {
    return path.join(imagesRoot, "services", `${name.slice("services/".length)}.png`);
  }
  if (name.startsWith("gallery-")) {
    return path.join(imagesRoot, "gallery", `${name}.png`);
  }
  return path.join(imagesRoot, `${name}.png`);
}

if (!fs.existsSync(staging)) {
  fs.mkdirSync(staging, { recursive: true });
  console.log(`Created ${staging} - drop PNGs here and re-run.`);
  process.exit(0);
}

const files = fs.readdirSync(staging).filter((f) => f.endsWith(".png"));
if (files.length === 0) {
  console.log("No PNG files in image-staging.");
  process.exit(0);
}

let installed = 0;
for (const file of files) {
  const key = file.replace(/\.png$/i, "");
  const src = path.join(staging, file);
  const dest = destPath(key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Installed ${file} -> ${path.relative(root, dest)}`);
  installed++;
}

console.log(`Installed ${installed} file(s). Run: npm run images:optimize`);

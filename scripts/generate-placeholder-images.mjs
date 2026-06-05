import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "public", "images");

const files = [
  ["hero-remodel-interior.svg", "Hero - replace with project photo"],
  ["process-design-review.svg", "Design review - replace with project photo"],
  ["gallery/gallery-kitchen-before.svg", "Kitchen before"],
  ["gallery/gallery-kitchen-after.svg", "Kitchen after"],
  ["gallery/gallery-bathroom-before.svg", "Bathroom before"],
  ["gallery/gallery-bathroom-after.svg", "Bathroom after"],
  ["gallery/gallery-whole-home-before.svg", "Whole home before"],
  ["gallery/gallery-whole-home-after.svg", "Whole home after"],
  ["gallery/gallery-addition-before.svg", "Addition before"],
  ["gallery/gallery-addition-after.svg", "Addition after"],
  ["gallery/gallery-basement-before.svg", "Basement before"],
  ["gallery/gallery-basement-after.svg", "Basement after"],
  ["gallery/gallery-outdoor-before.svg", "Outdoor before"],
  ["gallery/gallery-outdoor-after.svg", "Outdoor after"],
];

function svg(label) {
  const safe = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" role="img" aria-label="${safe}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E8E4DE"/>
      <stop offset="100%" style="stop-color:#D4CFC6"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(#g)"/>
  <text x="800" y="580" text-anchor="middle" fill="#5A5F5C" font-family="system-ui,sans-serif" font-size="28" font-weight="300">${safe}</text>
  <text x="800" y="640" text-anchor="middle" fill="#8A8F88" font-family="system-ui,sans-serif" font-size="16">Boise Remodeling Co - drop your photo here</text>
</svg>`;
}

for (const [rel, label] of files) {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, svg(label));
}

console.log(`Wrote ${files.length} placeholder SVGs to public/images/`);

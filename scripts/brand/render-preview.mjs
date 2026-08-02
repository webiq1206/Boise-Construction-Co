/**
 * Render brand SVGs to PNG previews so the marks can be inspected visually.
 * Usage: node scripts/brand/render-preview.mjs <svg-path> [more-svg-paths...]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const outDir = path.join(root, "scripts", "brand", "preview");
fs.mkdirSync(outDir, { recursive: true });

for (const rel of process.argv.slice(2)) {
  const svg = fs.readFileSync(path.join(root, rel), "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1400 },
    background: "#F7F5F3",
  });
  const png = resvg.render().asPng();
  const out = path.join(outDir, path.basename(rel).replace(/\.svg$/, ".png"));
  fs.writeFileSync(out, png);
  console.log("wrote", path.relative(root, out));
}

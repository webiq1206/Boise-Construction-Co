/**
 * Compress marketing PNGs to WebP for faster page loads.
 * Run: python3 scripts/optimize-marketing-images.py
 * (Requires Pillow: pip install Pillow)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "optimize-marketing-images.py");
const result = spawnSync("python3", [script], { stdio: "inherit" });
process.exit(result.status ?? 1);


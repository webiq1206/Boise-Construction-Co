/**
 * Extracts the italic "Co." lockup from the legacy Boise Remodeling Co
 * wordmark and stores it, normalised, as reusable outline data.
 *
 * "Co." is unchanged by the rename, so reusing the original outlines keeps the
 * suffix pixel-faithful to the established identity and avoids re-rendering it
 * from the Fraunces variable font, which interpolates a stray terminal on the
 * capital C at display sizes.
 *
 * Output: scripts/brand/co-mark.json
 *   d          combined path data, origin at the ink's left edge on the baseline
 *   capHeight  cap height of the C in the normalised data
 *   width      ink width in the same units
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const svg = fs.readFileSync(
  path.join(root, "public/brand/logos/boise-remodeling-co-wordmark.svg"),
  "utf8",
);
const glyphs = svg.match(/<path d="([^"]+)" fill="#2C302F"/)[1].trim().split(/\s+(?=M)/);

// "BOISE REMODELING" is 15 caps; the italic C, o and full stop follow.
const co = glyphs.slice(15);
if (co.length !== 3) throw new Error(`expected 3 "Co." glyphs, found ${co.length}`);

const BASELINE = 132;
const CAP_TOP = 52.6067041015625; // top of the italic C in the source artwork

const numbers = (d) => (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const all = co.flatMap(numbers);
const xs = all.filter((_, i) => i % 2 === 0);
const originX = Math.min(...xs);

/** Shift every coordinate pair so the ink starts at 0 on a 0 baseline. */
function normalise(d) {
  let index = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (match) => {
    const value = parseFloat(match);
    const shifted = index % 2 === 0 ? value - originX : value - BASELINE;
    index += 1;
    return String(Number(shifted.toFixed(3)));
  });
}

const normalised = co.map(normalise);
const norm = normalised.flatMap(numbers);
const nxs = norm.filter((_, i) => i % 2 === 0);

const payload = {
  note: "Italic Co. lockup lifted from the original brand wordmark. Origin is the ink left edge on the baseline; y is negative above the baseline.",
  d: normalised.join(" "),
  capHeight: BASELINE - CAP_TOP,
  width: Math.max(...nxs),
};

fs.writeFileSync(
  path.join(root, "scripts/brand/co-mark.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
);

console.log(`capHeight ${payload.capHeight}  width ${payload.width.toFixed(2)}  bytes ${payload.d.length}`);

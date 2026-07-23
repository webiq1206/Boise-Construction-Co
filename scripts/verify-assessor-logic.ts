/**
 * Offline invariants for parcel address matching and parcel geometry.
 *
 * No network: this runs in prebuild, so it must be deterministic and fast.
 * Live source checks live in the admin assessor-health route instead.
 *
 * Both areas covered here caused real defects:
 *
 * - Address matching compared house numbers with a substring test, so the
 *   number 1386 matched the parcel at 11386 W GOLDENSPIRE DR and a lead could
 *   be attributed to the wrong house.
 * - The zoning and flood lookup point was the average of a parcel's vertices,
 *   which fell outside its own parcel on 3.8 percent of real Nampa parcels and
 *   returned a neighbour's zoning.
 */

import {
  MIN_ADDRESS_MATCH_SCORE,
  normalizeForCompare,
  pickBestAddressMatch,
  scoreAddressMatch,
} from "../lib/assessors/addressMatch";
import { pointInRings, pointOnSurface, ringsToSqFt, type Ring } from "../lib/assessors/geometry";

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string): void {
  checks++;
  if (!condition) {
    failures++;
    console.error(`  FAIL  ${label}${detail ? `: ${detail}` : ""}`);
  }
}

console.log("verify:assessor-logic");

/* ---------------------------------------------------------------- address */

check(
  "identical addresses score 100",
  scoreAddressMatch("1386 S NOVA LN", "1386 S Nova Ln") === 100
);

check(
  "case and punctuation are ignored",
  scoreAddressMatch("1386 S. Nova Ln.", "1386 S NOVA LN") === 100
);

// The regression that motivated this file.
check(
  "house number 1386 does NOT match 11386",
  scoreAddressMatch("11386 W GOLDENSPIRE DR", "1386 W GOLDENSPIRE DR") === 0,
  `got ${scoreAddressMatch("11386 W GOLDENSPIRE DR", "1386 W GOLDENSPIRE DR")}`
);

check(
  "house number 925 does NOT match 9251",
  scoreAddressMatch("9251 ELVISTON ST", "925 ELVISTON ST") === 0
);

check(
  "different house number on the same street is rejected",
  scoreAddressMatch("1388 S NOVA LN", "1386 S NOVA LN") === 0
);

check(
  "a different street with the same number is rejected",
  scoreAddressMatch("1386 W FRANKLIN RD", "1386 S NOVA LN") === 0
);

check(
  "similar street names are not conflated",
  scoreAddressMatch("1386 S NOVA RIDGE WAY", "1386 S NOVA LN") === 0,
  `got ${scoreAddressMatch("1386 S NOVA RIDGE WAY", "1386 S NOVA LN")}`
);

check(
  "unit suffixes still match the base address",
  scoreAddressMatch("123 MAIN ST APT 4", "123 MAIN ST") >= MIN_ADDRESS_MATCH_SCORE,
  `got ${scoreAddressMatch("123 MAIN ST APT 4", "123 MAIN ST")}`
);

check("empty input scores 0", scoreAddressMatch("", "1386 S NOVA LN") === 0);
check("empty target scores 0", scoreAddressMatch("1386 S NOVA LN", "") === 0);

check(
  "scores never exceed 100",
  ["1386 S NOVA LN", "123 MAIN ST APT 4", "1 A ST"].every(
    (a) => scoreAddressMatch(a, a) <= 100
  )
);

const candidates = [
  { address: "11386 W GOLDENSPIRE DR" },
  { address: "1386 S NOVA LN" },
  { address: "1386 W FRANKLIN RD" },
];

check(
  "best match picks the genuinely correct parcel",
  pickBestAddressMatch(candidates, "1386 S Nova Ln", (c) => c.address)?.address ===
    "1386 S NOVA LN"
);

check(
  "best match returns null rather than the wrong house",
  pickBestAddressMatch(
    [{ address: "11386 W GOLDENSPIRE DR" }],
    "1386 W Someplace St",
    (c) => c.address
  ) === null
);

check("normalizeForCompare collapses whitespace", normalizeForCompare("  a   b  ") === "A B");

/* --------------------------------------------------------------- geometry */

// 100ft x 100ft square, closed ring as ArcGIS returns it.
const square: Ring[] = [
  [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
    [0, 0],
  ],
];

check("square area is exact", ringsToSqFt(square) === 10000, `got ${ringsToSqFt(square)}`);

// Same square with a 50x50 hole wound the opposite way.
const withHole: Ring[] = [
  square[0],
  [
    [10, 10],
    [10, 60],
    [60, 60],
    [60, 10],
    [10, 10],
  ],
];
check(
  "interior rings subtract instead of adding",
  ringsToSqFt(withHole) === 7500,
  `got ${ringsToSqFt(withHole)}`
);

check("degenerate ring yields no area", ringsToSqFt([[[0, 0], [1, 1], [0, 0]]]) === undefined);
check("empty rings yield no area", ringsToSqFt([]) === undefined);

check("point inside the square is detected", pointInRings(50, 50, square));
check("point outside the square is detected", !pointInRings(150, 50, square));
check("point inside the hole reads as outside", !pointInRings(30, 30, withHole));

// L-shaped parcel. Its area centroid lands at about (3.56, 3.56), which is in
// the notch and therefore outside the parcel. This is the concave case that
// broke the vertex-average approach.
const lShape: Ring[] = [
  [
    [0, 0],
    [10, 0],
    [10, 3],
    [3, 3],
    [3, 10],
    [0, 10],
    [0, 0],
  ],
];

const lPoint = pointOnSurface(lShape);
check("pointOnSurface returns a point for a concave parcel", lPoint !== undefined);
check(
  "pointOnSurface lands INSIDE a concave parcel",
  !!lPoint && pointInRings(lPoint.x, lPoint.y, lShape),
  lPoint ? `got (${lPoint.x.toFixed(2)}, ${lPoint.y.toFixed(2)})` : "no point"
);

const squarePoint = pointOnSurface(square);
check(
  "pointOnSurface uses the centroid for a convex parcel",
  !!squarePoint && Math.abs(squarePoint.x - 50) < 0.001 && Math.abs(squarePoint.y - 50) < 0.001
);

const holePoint = pointOnSurface(withHole);
check(
  "pointOnSurface avoids the hole",
  !!holePoint && pointInRings(holePoint.x, holePoint.y, withHole)
);

check("pointOnSurface tolerates empty input", pointOnSurface([]) === undefined);

/* ----------------------------------------------------------------- result */

if (failures > 0) {
  console.error(`\nverify:assessor-logic FAILED (${failures} of ${checks} checks)`);
  process.exit(1);
}
console.log(`verify:assessor-logic: OK (${checks} checks)`);

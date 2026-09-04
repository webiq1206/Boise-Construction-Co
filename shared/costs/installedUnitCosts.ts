import type { FinishLevel, ProjectType } from "@/shared/estimateEngine";

/**
 * Installed unit costs (materials AND labor in one number), by finish level.
 *
 * WHY THIS EXISTS
 * The estimator used to look a price up in PRICE_MATRIX and then divide that
 * total across components by fixed share percentages, back-calculating each
 * "unit cost" as cost / quantity. The breakdown a buyer read was a percentage
 * split of a hardcoded number, not a build-up of the work. This table is the
 * other direction: real costs per unit, so a total can be summed from the
 * scope the visitor actually selected.
 *
 * WHERE THE NUMBERS COME FROM
 * Anchored to shared/costs/lineItemCatalog.ts - P5's own 209 line items, which
 * carry separate Materials and Labor rows. An installed cost is the pair added
 * together, e.g. Cabinets 250/LF material + 200/LF labor = 450/LF, Framing
 * 6/SF + 10/SF = 16/SF. Where a heading spans several catalog rows (the
 * "framing" line carries the lumber package, trusses, beams and the crew) the
 * figure is the Boise-market installed cost for that whole scope at that
 * finish level, built from those rows rather than from any single one.
 *
 * WHAT CHANGED AND WHY IT MATTERS
 * The retired PRICE_MATRIX implied unit costs 40-60% above the catalog's own
 * installed rates - roofing at 8.50/SF against a catalog 6.00, flatwork at
 * 17.71 against 12.00, framing at 38.96 against 26.00. A mid-range 2,400 SF
 * custom home priced at 354/SF, which is the top of the Boise custom band
 * wearing a mid-range label. Built up from the catalog it lands near 309/SF,
 * inside that band where the tier name says it should be.
 *
 * LABOR IS NEVER A SEPARATE LINE
 * Every number here is labor-inclusive by construction. Crew time, trade labor
 * and installation are inside the unit cost, so no client-facing line ever
 * reads "labor". Overhead, profit, project management and contingency are
 * handled the same way - carried as a percentage on top of direct cost and
 * folded proportionally into the visible lines, never itemised for the buyer.
 *
 * TUPLE ORDER IS THE FINISH LADDER: [refresh, mid-range, high-end, luxury].
 */
export const FINISH_ORDER = ["refresh", "mid-range", "high-end", "luxury"] as const;

export type InstalledCostTuple = readonly [number, number, number, number];

/**
 * Direct cost as a share of the customer price. The soft costs in
 * costCatalog.ts - project management 8%, permits 2%, contingency 5%,
 * overhead and profit 13% - sum to 28% of the price, so the direct work is
 * the remaining 72%. A build-up of direct cost is divided by this to reach
 * the number the buyer sees.
 */
export const DIRECT_COST_SHARE = 0.72;

export const INSTALLED_UNIT_COSTS: Record<
  ProjectType,
  Record<string, InstalledCostTuple>
> = {
  /*
   * CUSTOM HOME - the reference specification. Every other new-construction
   * type is written out in full below rather than derived from this one by a
   * multiplier, because the differences are not uniform: a semi-custom home
   * pours the same foundation and stands the same framing as a custom home,
   * and saves its money on cabinetry, trim and exterior selections.
   */
  "custom-home": {
    framing: [26, 32, 42, 58],                 // lumber package, trusses, beams, crane, crew
    foundation: [21, 26, 34, 46],              // cut, footings, stem, slab, waterproofing, radon
    "drywall-paint": [14, 19, 27, 39],         // luxury is level-5 smooth wall
    "cabinetry-countertops": [480, 850, 1600, 2900],
    "site-work": [22000, 32000, 47000, 72000],
    "exterior-finishes": [9.5, 13, 21, 34],    // catalog siding 9/SF at the entry tier
    "flooring-tile": [8, 12, 20, 33],          // catalog LVP 10/SF sits between entry and mid
    plumbing: [8.5, 11, 16, 24],
    electrical: [8.5, 11, 16.5, 25],
    roofing: [5.6, 7, 10.5, 17],               // catalog 6/SF asphalt; luxury is tile or standing seam
    "windows-doors": [950, 1300, 2200, 3900],
    hvac: [7, 9, 13, 20],                      // luxury carries zoning and an HRV
    "interior-trim": [18, 27, 44, 75],
    "fixtures-hardware": [5, 7.5, 12.5, 21],
    insulation: [2.5, 3.2, 4.3, 5.8],          // catalog 1.50/SF batt; blown attic and air sealing on top
    flatwork: [12, 15, 20, 28],                // catalog 12/SF flatwork is the entry tier exactly
    landscape: [9000, 14000, 22000, 36000],
    "final-clean": [3.3, 4.5, 6.5, 9.5],
  },
  /*
   * SEMI-CUSTOM. Same structure, cheaper selections. Foundation, drywall,
   * insulation, flatwork and landscape are identical to a custom home because
   * the work is identical. The savings are concentrated in the lines a plan
   * program actually standardises: cabinetry, interior trim, windows, exterior
   * elevation, and a platted lot whose utility runs are short.
   */
  "semi-custom-home": {
    framing: [25, 31, 41, 56],
    foundation: [21, 26, 34, 46],
    "drywall-paint": [14, 19, 27, 39],
    "cabinetry-countertops": [410, 720, 1360, 2470],
    "site-work": [17500, 25500, 37500, 57500], // platted subdivision lot, short service runs
    "exterior-finishes": [8.4, 11.5, 18.5, 30],
    "flooring-tile": [7.2, 10.8, 18, 29.5],
    plumbing: [7.9, 10.2, 14.9, 22.3],
    electrical: [7.9, 10.2, 15.3, 23.3],
    roofing: [5.3, 6.65, 10, 16.2],
    "windows-doors": [835, 1145, 1935, 3430],
    hvac: [6.5, 8.4, 12.1, 18.6],
    "interior-trim": [15.3, 23, 37.4, 63.8],
    "fixtures-hardware": [4.4, 6.6, 11, 18.5],
    insulation: [2.5, 3.2, 4.3, 5.8],
    flatwork: [12, 15, 20, 28],
    landscape: [9000, 14000, 22000, 36000],
    "final-clean": [3.3, 4.5, 6.5, 9.5],
  },
  /*
   * BUILD ON YOUR LOT. Custom construction on land the client already owns,
   * so the house is priced as a custom home and only the two lines that the
   * land actually changes move: site work rises sharply (raw ground, long
   * service runs, sometimes well and septic) and front-yard landscape falls,
   * because a rural parcel is not a subdivision frontage.
   */
  "build-on-your-lot": {
    framing: [26, 32, 42, 58],
    foundation: [21, 26, 34, 46],
    "drywall-paint": [14, 19, 27, 39],
    "cabinetry-countertops": [480, 850, 1600, 2900],
    "site-work": [32000, 46500, 68000, 104000], // raw ground, long runs, well and septic possible
    "exterior-finishes": [9.5, 13, 21, 34],
    "flooring-tile": [8, 12, 20, 33],
    plumbing: [8.5, 11, 16, 24],
    electrical: [8.5, 11, 16.5, 25],
    roofing: [5.6, 7, 10.5, 17],
    "windows-doors": [950, 1300, 2200, 3900],
    hvac: [7, 9, 13, 20],
    "interior-trim": [18, 27, 44, 75],
    "fixtures-hardware": [5, 7.5, 12.5, 21],
    insulation: [2.5, 3.2, 4.3, 5.8],
    flatwork: [12, 15, 20, 28],
    landscape: [6800, 10500, 16500, 27000],    // rural frontage, not a platted front yard
    "final-clean": [3.3, 4.5, 6.5, 9.5],
  },
  /*
   * SHOP HOME. These unit costs price the LIVING half only - the shop is sized
   * and priced separately by its own refinement. Simple single-level massing
   * and a gable roof pull framing, roofing and the exterior down; the site is
   * usually acreage, so site work carries a rural premium and the approach
   * flatwork is longer than a subdivision driveway.
   */
  "shop-home": {
    framing: [23.5, 29, 38, 52],
    foundation: [18, 22, 29, 39],              // slab on grade, no daylight basement
    "drywall-paint": [13, 17.5, 25, 36],
    "cabinetry-countertops": [395, 700, 1310, 2380],
    "site-work": [26500, 38500, 56500, 86500], // acreage, rural service runs
    "exterior-finishes": [6.8, 9.4, 15, 24.5], // metal and simple lap, little stone
    "flooring-tile": [7.2, 10.8, 18, 29.5],
    plumbing: [7.8, 10.1, 14.7, 22],
    electrical: [7.8, 10.1, 15.2, 23],
    roofing: [5, 6.3, 9.5, 15.3],              // simple gable, often metal
    "windows-doors": [855, 1170, 1980, 3510],
    hvac: [6.4, 8.3, 12, 18.4],
    "interior-trim": [14.4, 21.6, 35, 60],
    "fixtures-hardware": [4.5, 6.75, 11.25, 19],
    insulation: [2.5, 3.2, 4.3, 5.8],
    flatwork: [13, 16.5, 22, 31],              // longer approach to the shop doors
    landscape: [6800, 10500, 16500, 27000],
    "final-clean": [3.1, 4.3, 6.2, 9],
  },
  kitchen: {
    cabinetry: [160, 450, 900, 1400],
    countertops: [40, 85, 180, 280],
    backsplash: [20, 28, 55, 90],
    flooring: [8, 14, 24, 34],
    "plumbing-fixtures": [750, 1600, 4500, 9000],
    "plumbing-labor": [1000, 2200, 4500, 7000],
    electrical: [200, 350, 700, 1100],
    "drywall-paint-trim": [8, 14, 26, 38],
    demolition: [900, 1600, 3200, 4800],
    "hardware-misc": [500, 1300, 3500, 6500],
  },
  bathroom: {
    "shower-tub": [2200, 4500, 9500, 17000],
    "tile-work": [20, 28, 52, 85],
    "vanity-storage": [220, 450, 900, 1500],
    "plumbing-fixtures": [900, 1800, 4200, 8000],
    "plumbing-labor": [1200, 2400, 4800, 7500],
    "electrical-vent": [600, 1200, 2600, 4500],
    "drywall-paint-trim": [8, 14, 26, 38],
    demolition: [700, 1200, 2400, 3800],
    flooring: [6, 8, 14, 22],
    waterproofing: [8, 12, 20, 30],
  },
  "whole-home": {
    "kitchen-scope": [18000, 42000, 92000, 155000],
    "bathroom-scope": [13000, 31000, 68000, 115000],
    flooring: [8, 14, 24, 34],
    "interior-paint-trim": [6, 10, 17, 26],
    electrical: [9000, 18000, 38000, 62000],
    plumbing: [8000, 16000, 33000, 55000],
    hvac: [9000, 16000, 32000, 52000],
    "drywall-repair": [9, 14, 24, 36],
    demolition: [4500, 9000, 18000, 30000],
  },
  addition: {
    framing: [13, 16, 21, 28],
    "roofing-exterior": [12, 15, 20, 27],
    foundation: [21, 25, 32, 42],
    "insulation-drywall": [11, 14, 18, 24],
    "flooring-finishes": [10, 14, 21, 30],
    "windows-doors": [1900, 2500, 3600, 5200],
    "interior-trim-paint": [7, 9, 13, 19],
    electrical: [25, 32, 45, 62],
    "hvac-extension": [22, 30, 41, 57],
    "plumbing-rough": [15, 19, 27, 37],
  },
  adu: {
    framing: [13, 16, 21, 28],
    "roofing-exterior": [12, 15, 20, 27],
    foundation: [21, 25, 32, 42],
    "utility-connections": [14000, 18000, 24000, 32000],
    "insulation-drywall": [11, 14, 18, 24],
    kitchenette: [15000, 20000, 28000, 39000],
    bathroom: [14000, 19000, 26000, 36000],
    "windows-doors": [1900, 2500, 3600, 5200],
    electrical: [20, 26, 35, 48],
    hvac: [17, 22, 30, 42],
    plumbing: [16, 21, 28, 40],
  },
  basement: {
    "framing-insulation": [9, 11, 15, 20],
    "drywall-finish": [8, 10, 14, 19],
    flooring: [6, 8, 13, 19],
    electrical: [300, 400, 560, 800],
    "interior-trim-paint": [5, 6, 9, 13],
    "egress-window": [3600, 4500, 6200, 8600],
    "hvac-extension": [3400, 4500, 6200, 8600],
    "doors-millwork": [780, 1000, 1400, 2000],
    "demolition-prep": [1900, 2500, 3500, 4900],
  },
};

/** Installed unit cost for one component at one finish level. */
export function installedUnitCost(
  project: ProjectType,
  componentId: string,
  finish: FinishLevel
): number | undefined {
  const row = INSTALLED_UNIT_COSTS[project]?.[componentId];
  if (!row) return undefined;
  const i = FINISH_ORDER.indexOf(finish as (typeof FINISH_ORDER)[number]);
  return i >= 0 ? row[i] : undefined;
}

/**
 * Inherent uncertainty of each project type, as a fraction either side of the
 * centre. These are the spreads the old PRICE_MATRIX carried, averaged across
 * its tiers - the matrix's LEVELS were wrong (owner, 2026-09-03) but the width
 * of its ranges reflected real variance in each kind of work, so the spread is
 * kept while the level is now built up. New construction quoted from a plan
 * carries a wider band than a remodel of known rooms. The band still tightens
 * from here as the visitor supplies detail; see calculateEstimate.
 */
export const NATURAL_BAND: Record<ProjectType, number> = {
  "custom-home": 0.2,
  "semi-custom-home": 0.21,
  "build-on-your-lot": 0.2,
  "shop-home": 0.23,
  kitchen: 0.21,
  bathroom: 0.22,
  "whole-home": 0.23,
  addition: 0.16,
  adu: 0.17,
  basement: 0.22,
};

/**
 * Scope rules for new residential construction.
 *
 * These are kept separate from the remodel rule sets in scopeRules.ts because
 * almost nothing transfers. A remodel prices a disturbance to an existing house
 * and spends much of its budget on demolition, protection and working around
 * what is already there. A new home prices a complete building: every division
 * in the catalog is in play exactly once, at full quantity, and the quantities
 * come from whole-house geometry rather than a room.
 *
 * QUANTITIES COME FROM `d.house`, NOT `d.floorArea`. The room fields on
 * Dimensions treat the entire house as one large room, which halves nothing for
 * a second storey and would double the foundation and roof on a two-storey plan.
 * Every rule here reads the HouseDimensions block; `house!` is safe because the
 * engine attaches it for exactly these project keys (NEW_CONSTRUCTION_PROJECTS).
 *
 * WHICH "SF" A CATALOG RATE MEANS. This is the thing to get right, and getting it
 * wrong is silent. The source workbooks publish two different kinds of per-SF
 * rate and do not distinguish them:
 *
 *   PER SF OF FINISHED FLOOR AREA - a whole-dwelling average. Drywall at
 *   $12.50, interior paint at $6.00, plumbing at $10.00, windows at $8.60.
 *   These are budgeting rates for a house of a given size. Drywall at $12.50 is
 *   $30,000 on a 2,400 sq ft home, which is right; applied instead to the 9,120
 *   sq ft of board such a house actually hangs it produces $114,000, which is
 *   roughly triple the market and was this rule set's first bug.
 *
 *   PER SF OF THE ACTUAL SURFACE - a trade rate. Roofing at $6.00 per square of
 *   roof, siding at $9.00 per square of wall, hardwood at $20.00 per square of
 *   floor laid, slab at $12.00 per square of concrete poured.
 *
 * Every SF rule below states which basis it uses. The test for it: divide the
 * resulting line by finished area and ask whether a builder would recognise the
 * number as a per-square-foot budget figure for that trade.
 *
 * WHAT IS DELIBERATELY EXCLUDED. Land is never priced here: it is bought, not
 * built, and folding it into a per-square-foot figure is the single most
 * misleading thing a builder's estimator can do. Appliances and window coverings
 * are excluded to match the company's stated position that those are
 * client-supplied. Furnishings and staging are excluded outright.
 */
import type { ScopeRule, ScopeSelections } from "./engine";

/* ----------------------------------------------------------------- schedule */

/**
 * Months on site for a new home, by finished area. Anchored to the 7 to 11
 * months of construction quoted in the site's own FAQ and service content, with
 * the same sublinear growth the remodel schedule uses: a house twice the size
 * does not take twice as long because trades overlap.
 */
const BASELINE_NEW_BUILD_SQFT = 2400;
const BASELINE_NEW_BUILD_MONTHS = 9;

export function newBuildMonths(sqft: number): number {
  return (
    BASELINE_NEW_BUILD_MONTHS *
    Math.pow(Math.max(sqft, 1) / BASELINE_NEW_BUILD_SQFT, 0.3)
  );
}

/**
 * Supervision hours per week on an active new-build site. A dedicated project
 * manager is not on one site full time; ten hours a week of scheduling,
 * inspections, subcontractor coordination and client updates is what a build of
 * this size actually consumes.
 */
const TEAM_HOURS_PER_WEEK = 10;

/* ------------------------------------------------------------------ helpers */

const house = (d: { house?: unknown }) =>
  (d as { house: NonNullable<import("./engine").Dimensions["house"]> }).house;

const isRural = (s: ScopeSelections) => s.wellSeptic === true;

/** How much extra earthwork the site costs beyond a flat, serviced lot. */
const SITE_DIFFICULTY_FACTOR: Record<string, number> = {
  simple: 1,
  moderate: 1.6,
  steep: 2.8,
};

const siteFactor = (s: ScopeSelections) =>
  SITE_DIFFICULTY_FACTOR[s.siteDifficulty ?? "simple"] ?? 1;

/* ------------------------------------------------- pre-construction services */

/**
 * Design and engineering on a custom home are real, substantial line items, and
 * they are priced per square foot of finished area in the source catalog.
 * Semi-custom carries a fraction of this because the plan already exists.
 */
function designRules(designShare: number): ScopeRule[] {
  return [
    {
      code: "01-00-06", // Architecture (schematic), SF
      qty: (d) => house(d).finishedArea * designShare,
      assumption:
        "Schematic design priced across finished area. A semi-custom plan carries a fraction of this because the drawings already exist.",
    },
    {
      code: "02-00-01", // Architecture (design development + construction docs), SF
      qty: (d) => house(d).finishedArea * designShare,
    },
    {
      code: "02-00-02", // Schematic MEPs, EA
      qty: () => 1,
    },
    {
      code: "02-00-03", // Engineering, HR
      qty: (d) => 12 + house(d).finishedArea / 400,
      assumption:
        "Structural engineering scales with the plan: roughly twelve hours plus an hour per 400 square feet.",
    },
    {
      code: "02-00-05", // Plan approvals, EA
      qty: () => 1,
    },
    {
      code: "01-00-03", // Location analysis, EA
      qty: () => 1,
      assumption:
        "Lot feasibility: utilities, setbacks, soils and access, checked before design is committed.",
    },
  ];
}

/* --------------------------------------------------------- site and overhead */

function siteAndOverheadRules(): ScopeRule[] {
  return [
    {
      code: "03-01-01", // Permitting fees, EA
      qty: () => 1,
      assumption: "A full new-dwelling building permit, not a fraction of one.",
    },
    {
      code: "03-01-02", // Builder's risk insurance, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
    },
    {
      code: "03-02-01", // Temp utilities, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
      assumption:
        "A new build has no power or water of its own until late in the schedule, so temporary services run almost the whole job.",
    },
    {
      code: "03-02-02", // Temp restroom, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
    },
    {
      code: "03-02-05", // Site storage, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
    },
    {
      code: "03-02-06", // Dumpster, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
    },
    {
      code: "03-02-07", // Daily clean, MO
      qty: (_d, s) => newBuildMonths(s.sqft),
    },
    {
      code: "03-03-01", // BMPs (erosion control), MO
      qty: (_d, s) => newBuildMonths(s.sqft),
      assumption: "Stormwater and erosion control required for the duration of an open site.",
    },
    {
      code: "03-03-06", // Construction staking, EA
      qty: () => 1,
    },
    {
      code: "03-03-05", // Grading, SF
      qty: (d, s) => house(d).foundationArea * 2.5 * siteFactor(s),
      assumption:
        "Rough and finish grading across a working area about 2.5x the building footprint, multiplied by site difficulty.",
    },
    {
      code: "03-03-08", // Permanent water + sewer/septic, EA
      qty: (_d, s) => (isRural(s) ? 9 : 1),
      assumption:
        "The catalog's $3,000 EA is a connection to city water and sewer at the street. A rural parcel instead needs a drilled well ($15,000 to $25,000) and an engineered septic system ($10,000 to $20,000), which is roughly nine times that connection cost and the single largest site-cost swing in a Treasure Valley build.",
    },
    {
      code: "03-03-09", // Permanent gas + electrical, EA
      qty: (_d, s) => (isRural(s) ? 2.2 : s.utilitiesAtLot === false ? 1.8 : 1),
      assumption:
        "Rural power runs are longer, often need transformers or additional poles, and frequently replace natural gas with propane. A city-serviced lot where power and gas have not yet been brought to the lot line carries a similar (slightly smaller) extension allowance.",
    },
    {
      code: "L-03-00", // Design-build team labor, HR
      qty: (_d, s) => newBuildMonths(s.sqft) * 4.345 * TEAM_HOURS_PER_WEEK,
      assumption: `Project management and supervision at ${TEAM_HOURS_PER_WEEK} hours per week for the full construction period.`,
    },
  ];
}

/* ---------------------------------------------------------------- structure */

function shellRules(): ScopeRule[] {
  return [
    {
      code: "03-04-01", // Excavation + backfill, SF of excavated area
      qty: (d, s) =>
        house(d).foundationArea *
        (house(d).basementSqft > 0 ? 1 : 0.35) *
        siteFactor(s),
      assumption:
        "The catalog's $9 per SF is a basement excavation rate. A slab-on-grade home strips, over-excavates and backfills rather than digging a hole, so it carries about 35% of it; a basement carries the full rate.",
    },
    {
      code: "03-04-02", // Footings, LF
      qty: (d) => house(d).foundationPerimeter,
    },
    {
      code: "03-04-03", // Slab / flatwork, SF of concrete poured
      qty: (d) => house(d).foundationArea + house(d).basementSqft,
      assumption:
        "Slab across the ground-floor footprint and garage, plus a basement floor where there is one.",
    },
    {
      code: "03-04-04", // Waterproofing + drains, SF
      qty: (d) => house(d).foundationArea + house(d).basementSqft,
    },
    {
      code: "03-04-06", // Foundation insulation, SF
      qty: (d) => house(d).foundationPerimeter * 8,
      assumption: "Perimeter foundation insulation to an 8ft stem wall or basement wall height.",
    },
    {
      code: "03-04-05", // Radon mitigation, EA
      qty: () => 1,
      assumption: "Passive radon system, standard on new construction in this region.",
    },
    {
      code: "03-05-02", // Framing, SF
      qty: (d) =>
        house(d).finishedArea + house(d).garageSqft + house(d).coveredOutdoorSqft * 0.6,
      assumption:
        "Framed area covers every finished floor, the garage, and covered outdoor space at 60% (roof and posts, no walls).",
    },
    {
      code: "03-05-03", // Trusses, SF
      qty: (d) => house(d).foundationArea + house(d).coveredOutdoorSqft,
      assumption: "Trusses follow the roofed footprint, not the finished area.",
    },
    {
      code: "03-05-01", // Structural steel, SF
      qty: (d, s) =>
        house(d).footprint * (s.quality === "high-end" || s.quality === "luxury" ? 0.12 : 0.05),
      assumption:
        "Beams and posts for longer spans. Higher finish levels open up more of the plan and carry more steel.",
    },
    {
      code: "03-06-01", // House wrap / dry-in, SF
      qty: (d) => house(d).exteriorWallArea,
    },
  ];
}

/* ----------------------------------------------------------------- envelope */

function envelopeRules(): ScopeRule[] {
  return [
    {
      code: "03-11-01", // Roofing, SF
      qty: (d) => house(d).roofArea + house(d).coveredOutdoorSqft * 1.25,
    },
    {
      code: "03-11-03", // Gutters, LF
      qty: (d) => house(d).foundationPerimeter,
    },
    {
      code: "03-11-06", // Exterior siding + trim, SF
      qty: (d, s) =>
        house(d).cladArea * (s.quality === "high-end" || s.quality === "luxury" ? 0.6 : 0.85),
      assumption:
        "Siding covers most of the wall on standard homes. Higher finish levels give more of the elevation to stone and timber, so the siding share drops.",
    },
    {
      code: "03-11-07", // Exterior brick / stone, SF
      qty: (d, s) =>
        (house(d).cladArea - house(d).shopWallArea) *
        (s.quality === "high-end" || s.quality === "luxury" ? 0.35 : 0.12),
      assumption:
        "Stone or brick accent on standard homes, a major elevation material above that. Applied to the living elevation only: the shop end of a shop home is clad in the same metal or siding as the rest of the box.",
    },
    {
      code: "03-11-05", // Timbers + accents, SF
      qty: (d, s) => (s.quality === "luxury" ? house(d).cladArea * 0.08 : 0),
      when: (s) => s.quality === "luxury",
    },
    {
      code: "03-07-03", // Windows: PER SF OF FINISHED AREA (whole-dwelling average)
      qty: (d) => house(d).finishedArea,
      assumption:
        "The catalog's $8.60 is a per-finished-square-foot window budget, not a price per square foot of glass: a 15 SF window does not cost $129. It yields about $20,600 of windows on a 2,400 sq ft home, which is the right order.",
    },
    {
      code: "03-07-02", // Exterior doors, EA
      qty: () => 3,
      assumption: "Front door, rear or patio door, and a garage-to-house service door.",
    },
    {
      code: "03-07-04", // Sliders / accordion doors, EA
      qty: (_d, s) => (s.quality === "high-end" || s.quality === "luxury" ? 2 : 1),
    },
    {
      code: "03-07-01", // Garage doors, EA
      qty: (d) => (house(d).garageSqft >= 600 ? 2 : house(d).garageSqft > 0 ? 1 : 0),
      assumption: "One door up to a two-bay garage, two doors on three-bay and larger.",
    },
    {
      code: "03-07-05", // Window wells, EA
      qty: (d) => (house(d).basementSqft > 0 ? 3 : 0),
      assumption: "Egress wells for a basement; none without one.",
    },
    {
      code: "03-12-01", // Insulation + foam, SF
      qty: (d) =>
        house(d).exteriorWallArea - house(d).shopWallArea * 0.5 + house(d).footprint,
      assumption:
        "Walls plus the attic plane above the top storey. A shop is insulated to keep it workable rather than to living-space standard, so it carries half the wall rate.",
    },
  ];
}

/* ------------------------------------------------------------------ systems */

function systemsRules(): ScopeRule[] {
  return [
    {
      code: "03-08-01", // HVAC system, EA
      qty: (d) => 1 + (house(d).finishedArea > 3200 ? 0.6 : 0),
      assumption:
        "One system, with a second zone or unit added above 3,200 square feet where a single system cannot serve the plan.",
    },
    {
      code: "03-08-02", // Exhaust ducting, EA
      qty: (d) => house(d).bathrooms + 1,
      assumption: "One per bathroom plus the range hood.",
    },
    {
      code: "03-09-08-L", // Electrical labor, SF
      qty: (d) => house(d).finishedArea + house(d).garageSqft * 0.3,
    },
    {
      code: "03-09-04-M", // Standard interior fixtures, SF
      qty: (d) => house(d).finishedArea,
      when: (s) => s.quality === "refresh" || s.quality === "mid-range",
    },
    {
      code: "03-09-06-M", // Decorative interior fixtures, SF
      qty: (d) => house(d).finishedArea,
      when: (s) => s.quality === "high-end" || s.quality === "luxury",
    },
    {
      code: "03-09-05-M", // Standard exterior fixtures, SF
      qty: (d) => house(d).footprint * 0.3,
    },
    {
      code: "03-09-01", // Data + cabling, SF
      qty: (d) => house(d).finishedArea,
    },
    {
      code: "03-10-03", // Plumbing fixtures + labor, SF
      qty: (d) => house(d).finishedArea,
      assumption:
        "The catalog's plumbing rate is published as a whole-dwelling average, which is exactly what a new home is.",
    },
    {
      code: "03-10-01", // Water heater, EA
      qty: (d) => (house(d).finishedArea > 3500 ? 2 : 1),
    },
    {
      code: "03-10-02", // Gas lines, LF
      qty: (d) => 60 + house(d).finishedArea / 60,
      assumption: "Runs to the furnace, water heater, range, fireplace and a patio stub.",
    },
  ];
}

/* --------------------------------------------------------- interior finishes */

function interiorRules(): ScopeRule[] {
  return [
    {
      code: "03-13-01", // Drywall: PER SF OF FINISHED AREA (whole-dwelling average)
      qty: (d) => house(d).finishedArea + house(d).garageSqft * 0.35,
      assumption:
        "Drywall priced on the catalog's whole-dwelling basis of $12.50 per finished square foot, about $30,000 on a 2,400 sq ft home. A garage is boarded to a lower standard and carries 35%.",
    },
    {
      code: "03-14-01", // Interior paint: PER SF OF FINISHED AREA
      qty: (d) => house(d).finishedArea + house(d).garageSqft * 0.35,
    },
    {
      code: "03-14-02", // Exterior paint, SF
      qty: (d) => house(d).cladArea * 0.7,
      assumption: "Painted siding and trim; stone and brick areas are not painted.",
    },
    {
      code: "03-18-02", // Trim, LF
      qty: (d) => house(d).trimLf,
    },
    {
      code: "03-18-01", // Interior doors, EA
      qty: (d) => house(d).interiorDoors,
    },
    {
      code: "03-19-04", // Door hardware, EA
      qty: (d) => house(d).interiorDoors + 3,
    },
    {
      code: "03-19-05", // Exterior hardware, EA
      qty: () => 3,
    },
    {
      code: "03-18-03", // Closets, EA
      qty: (d) => Math.max(2, Math.round(house(d).finishedArea / 700)),
      assumption: "Built closet systems in the bedrooms and entry.",
    },
    {
      code: "03-21-01", // Interior railings, LF
      qty: (d) => (house(d).stories > 1 ? 28 : 0),
      when: (s) => (s.stories ?? 1) > 1,
      assumption: "Stair and landing railing, only where there is a second storey.",
    },
    {
      code: "03-21-03", // Custom staircase, EA
      qty: (d) => (house(d).stories > 1 ? 1 : 0),
      when: (s) => (s.stories ?? 1) > 1,
    },
    {
      code: "03-21-05", // Fireplace insert, EA
      qty: (_d, s) => (s.quality === "refresh" ? 0 : 1),
      when: (s) => s.quality !== "refresh",
    },
    {
      code: "03-21-04", // Mantle + floating shelves, LF
      qty: (_d, s) => (s.quality === "refresh" ? 0 : 8),
      when: (s) => s.quality !== "refresh",
    },
  ];
}

/* ------------------------------------------------------------------ flooring */

/**
 * Flooring is split by product rather than priced as one blended rate, because
 * the mix is what finish level actually changes: a standard home is mostly LVP
 * and carpet, a luxury home is mostly hardwood and tile.
 */
function flooringRules(): ScopeRule[] {
  const hardwoodShare = (s: ScopeSelections) =>
    s.quality === "luxury" ? 0.55 : s.quality === "high-end" ? 0.35 : 0.05;
  const tileShare = (s: ScopeSelections) =>
    s.quality === "luxury" ? 0.2 : s.quality === "high-end" ? 0.15 : 0.1;
  const carpetShare = (s: ScopeSelections) =>
    s.quality === "luxury" ? 0.15 : s.quality === "high-end" ? 0.25 : 0.35;

  return [
    {
      code: "03-15-01", // Hardwood, SF
      qty: (d, s) => house(d).finishedArea * hardwoodShare(s),
      assumption:
        "Flooring is priced as a mix rather than one blended rate: standard homes are mostly LVP and carpet, luxury homes mostly hardwood and tile.",
    },
    {
      code: "03-16-01", // Tile, SF
      qty: (d, s) => house(d).finishedArea * tileShare(s) + house(d).bathrooms * 90,
      assumption: "Floor tile plus roughly 90 SF of wet-wall tile per bathroom.",
    },
    {
      code: "03-15-05", // Carpet, SF
      qty: (d, s) => house(d).finishedArea * carpetShare(s),
    },
    {
      code: "03-15-02", // LVP, SF
      qty: (d, s) =>
        house(d).finishedArea *
        Math.max(0, 1 - hardwoodShare(s) - tileShare(s) - carpetShare(s)),
    },
  ];
}

/* ------------------------------------------------------- kitchen and baths */

function kitchenAndBathRules(): ScopeRule[] {
  return [
    {
      code: "03-17-01", // Cabinets, LF
      qty: (d) => house(d).kitchenCabinetLf,
    },
    {
      code: "03-17-02", // Countertops, LF
      qty: (d) => house(d).countertopLf + house(d).bathrooms * 5,
    },
    {
      code: "03-17-03", // Vanities, LF
      qty: (d) => house(d).bathrooms * 5,
    },
    {
      code: "03-19-02", // Cabinet + vanity hardware, LF
      qty: (d) => house(d).kitchenCabinetLf + house(d).bathrooms * 5,
    },
    {
      code: "03-19-01", // Bath hardware, EA
      qty: (d) => house(d).bathrooms * 4,
    },
    {
      code: "03-19-06", // Shower glass, EA
      qty: (d) => Math.max(1, house(d).bathrooms - 1),
      assumption: "Glass to every bathroom except a powder room.",
    },
    {
      code: "03-19-07", // Mirrors, EA
      qty: (d) => house(d).bathrooms,
    },
    {
      code: "03-17-05", // Custom closets, LF
      qty: (d, s) =>
        s.quality === "high-end" || s.quality === "luxury" ? house(d).finishedArea / 200 : 0,
      when: (s) => s.quality === "high-end" || s.quality === "luxury",
    },
    {
      code: "03-17-04", // Custom built-ins, LF
      qty: (d, s) => (s.quality === "luxury" ? house(d).finishedArea / 250 : 0),
      when: (s) => s.quality === "luxury",
    },
    {
      code: "03-21-06", // Custom vent hood, EA
      qty: (_d, s) => (s.quality === "high-end" || s.quality === "luxury" ? 1 : 0),
      when: (s) => s.quality === "high-end" || s.quality === "luxury",
    },
    // NO APPLIANCE LINE. The company's published position is that appliances are
    // client-supplied, and the remodel rule sets exclude them for the same
    // reason. Adding the catalog's $10,000 package here would contradict the
    // site's own FAQ answer.
  ];
}

/* ------------------------------------------------- site finishes and closeout */

function closeoutRules(): ScopeRule[] {
  return [
    {
      code: "03-22-01", // Flatwork (driveway, walks), SF
      // When the visitor told us the driveway length, take it off at a 12 ft
      // width plus a 150 SF walk allowance instead of the fixed 400 SF
      // subdivision assumption. The garage apron term stays either way.
      qty: (d, s) =>
        ((s.drivewayLengthFt != null && s.drivewayLengthFt > 0
          ? s.drivewayLengthFt * 12 + 150
          : 400) +
          house(d).garageSqft * 1.5) *
        siteFactor(s),
      assumption:
        "Driveway, approach and walks. Uses the stated driveway length at a 12 ft width when given, otherwise a short subdivision driveway; a steeper site carries proportionally more.",
    },
    // LANDSCAPE IS FRONT-YARD ONLY, and that is a real exclusion rather than an
    // oversight. Builders here typically finish the front to satisfy the
    // subdivision or the certificate of occupancy and leave the rear yard to the
    // owner, because a fully landscaped rear yard is a $30,000 to $60,000 scope
    // that has nothing to do with building the house. Carrying it here would
    // inflate every quote and then lose to builders who scope it honestly.
    {
      code: "03-22-04", // Topsoil + fine grading, SF
      qty: (d) => house(d).foundationArea * 0.9,
      assumption:
        "Front-yard topsoil and fine grading. Rear-yard landscaping is excluded and quoted separately.",
    },
    {
      code: "03-22-03", // Irrigation, EA
      qty: () => 1,
    },
    {
      code: "03-22-08", // Sod, SF
      qty: (d) => house(d).foundationArea * 0.6,
    },
    {
      code: "03-22-09", // Plantings, EA
      qty: () => 1,
    },
    {
      code: "03-22-10", // Deck, SF
      qty: (d) => house(d).coveredOutdoorSqft,
      when: (s) => (s.coveredOutdoorSqft ?? 0) > 0,
    },
    {
      code: "03-23-01", // Fit + finish, SF
      qty: (d) => house(d).finishedArea,
    },
    {
      code: "03-23-02", // Final clean, SF
      qty: (d) => house(d).finishedArea,
    },
  ];
}

/* --------------------------------------------------------------- shop homes */

/**
 * What a working shop adds on top of the house.
 *
 * The shared rule sets above already carry the shop through everything it
 * genuinely shares with the house, because `shopSqft` is folded into
 * `foundationArea`: the slab, the excavation, the footings, the trusses, the
 * roof and the wall envelope all size themselves correctly for a barndominium
 * without a special case. Two of them are deliberately net of the shop instead
 * (stone veneer and full-depth insulation), for the reasons stated there.
 *
 * What is left is what a shop has that a house does not, and it is short:
 * structure over a clear span, doors big enough to drive through, a slab thick
 * enough to park on, and power for tools.
 *
 * These rules are keyed off `house.shopSqft`, which is zero on every project
 * except a shop home, so including them in another rule set would price nothing.
 * They are kept out of the shared builders anyway, because a reader of
 * `shellRules()` should not have to know what a barndominium is.
 */
function shopRules(): ScopeRule[] {
  return [
    {
      code: "03-05-02", // Framing, SF
      qty: (d) => house(d).shopSqft * 0.45,
      when: (s) => (s.shopSqft ?? 0) > 0,
      assumption:
        "Post-frame or steel shop structure at about 45% of the stick-framing rate per square foot. A clear-span shop has posts on 8ft centers and girts between them rather than studs at 16 inches, no interior partitions, and no second floor to carry.",
    },
    {
      code: "03-04-03", // Slab / flatwork, SF of concrete poured
      qty: (d) => house(d).shopSqft * 0.35,
      when: (s) => (s.shopSqft ?? 0) > 0,
      assumption:
        "A shop slab is thicker and more heavily reinforced than a house slab so it can carry vehicles and equipment. Priced as a 35% uplift on the shop's share of the pour, which is already counted once at house rate.",
    },
    {
      code: "03-07-01", // Overhead doors, EA
      qty: (d) => Math.max(1, Math.round(house(d).shopSqft / 800)),
      when: (s) => (s.shopSqft ?? 0) > 0,
      assumption:
        "One overhead door per 800 SF of shop, minimum one. Shop doors are taller and wider than a residential garage door, which offsets the smaller count.",
    },
    {
      code: "03-09-08-L", // Electrical labor, SF
      qty: (d) => house(d).shopSqft * 0.4,
      when: (s) => (s.shopSqft ?? 0) > 0,
      assumption:
        "Shop power: a subpanel, 240V circuits for equipment, outlets on the walls and high-bay lighting. Well below a house rate per square foot because there are no devices in partitions and no finish fixtures.",
    },
    {
      code: "03-09-04-M", // Standard interior fixtures, SF
      qty: (d) => house(d).shopSqft * 0.4,
      when: (s) => (s.shopSqft ?? 0) > 0,
      assumption: "High-bay shop lighting, outlets and switches.",
    },
  ];
}

/* ------------------------------------------------------------- assembled sets */

/** A fully custom home: design from a blank page, every division at full scope. */
export const CUSTOM_HOME_RULES: ScopeRule[] = [
  ...designRules(1),
  ...siteAndOverheadRules(),
  ...shellRules(),
  ...envelopeRules(),
  ...systemsRules(),
  ...interiorRules(),
  ...flooringRules(),
  ...kitchenAndBathRules(),
  ...closeoutRules(),
];

/**
 * Semi-custom: the same building, a fraction of the design work. The plan and
 * its engineering already exist, so schematic and construction-document effort
 * drops to about a third while the build itself is unchanged.
 */
export const SEMI_CUSTOM_HOME_RULES: ScopeRule[] = [
  ...designRules(0.35),
  ...siteAndOverheadRules(),
  ...shellRules(),
  ...envelopeRules(),
  ...systemsRules(),
  ...interiorRules(),
  ...flooringRules(),
  ...kitchenAndBathRules(),
  ...closeoutRules(),
];

/**
 * Build on the client's own lot. Structurally identical to a custom home; the
 * difference is that site conditions are a known input rather than an
 * assumption, which the site-difficulty and well/septic selections carry.
 */
export const BUILD_ON_YOUR_LOT_RULES: ScopeRule[] = [
  ...designRules(0.7),
  ...siteAndOverheadRules(),
  ...shellRules(),
  ...envelopeRules(),
  ...systemsRules(),
  ...interiorRules(),
  ...flooringRules(),
  ...kitchenAndBathRules(),
  ...closeoutRules(),
];

/**
 * A shop home or barndominium: finished living space and a working shop under
 * one roof, on one slab.
 *
 * The living half is built and priced exactly like a house, because it is one.
 * What makes the blended per-square-foot figure land near half a custom home's
 * is not a cheaper house, it is that a large fraction of the square footage is
 * shop, and shop square footage costs a fraction of living square footage. That
 * falls out of the geometry rather than being asserted: `shopSqft` sits in the
 * foundation and roof but never in `finishedArea`, so nothing that prices living
 * space ever sees it.
 *
 * Design sits between semi-custom and custom. These are rarely stock plans, but
 * they are simple rectangles with a straightforward roof, so the drawings and
 * engineering are less work than a custom home on a hillside.
 */
export const SHOP_HOME_RULES: ScopeRule[] = [
  ...designRules(0.55),
  ...siteAndOverheadRules(),
  ...shellRules(),
  ...envelopeRules(),
  ...systemsRules(),
  ...interiorRules(),
  ...flooringRules(),
  ...kitchenAndBathRules(),
  ...closeoutRules(),
  ...shopRules(),
];

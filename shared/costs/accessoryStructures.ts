/**
 * ADDITIONAL BUILDINGS, PRICED AS BUILDINGS.
 *
 * A shop is not 1,600 square feet of house. A pole barn is not a wing. The main
 * takeoff in engine.ts derives everything from one finished-area figure and a
 * storey count, so anything folded into that figure inherits house rates:
 * drywall over every surface, a full HVAC load, interior trim, the lot. Running
 * a 2,400 SF barn through it produces a barn that costs more than the home.
 *
 * So accessory structures are priced here instead, from their own square-foot
 * rates, and returned as CostLines in their own division. That placement is the
 * point: they join the same `lines` array the rules produce, so contingency,
 * the margin guard, the trade rollup and the admin view all pick them up with
 * no special-casing, and an admin reads "Accessory Structures" as one parent
 * category beside Framing and Electrical rather than as a mystery adjustment.
 *
 * EVERY RATE BELOW IS INTERNAL COST, not a price. Margin is applied once, later,
 * in pricing.ts. Adding a marked-up number here would compound margin on margin
 * and quietly push these structures above the market ceiling.
 *
 * PROVENANCE, AND THE ONE THING TO CHECK BEFORE TRUSTING THESE NUMBERS.
 *
 * Every other rate in this engine traces to the owner's cost catalog (the 2025
 * "Updated Cost Codes" workbook, 147 priced codes, mirrored in
 * lineItemCatalog.ts). That catalog contains NO accessory-structure scope: no
 * shop, barn, ADU, guest house or detached garage line items, at any code. It
 * prices components - slab at $12/SF, deck materials at $15/SF - not whole
 * outbuildings.
 *
 * So the per-structure rates below are market figures for the Treasure Valley,
 * not owner-calibrated ones, and they are the least evidenced numbers in the
 * engine. They are deliberately in one small table so the owner can price a
 * shop they have actually built and correct them in a single place. Until that
 * happens, treat an accessory-heavy estimate as a conversation starter rather
 * than a figure to defend.
 *
 * What IS validated: garage areas, against two real plan sets. A two-car garage
 * measured 488 SF and a three-car 736 SF, against GARAGE_BAY_SQFT's 480 and 720.
 */
import type { CostLine } from "./engine";
import {
  ACCESSORY_STRUCTURE_LABELS,
  type AccessoryStructure,
  type AccessoryStructureKind,
  type FinishLevel,
} from "../estimateEngine";

/** The division every line here rolls up under. */
export const ACCESSORY_DIVISION = "Accessory Structures";

/**
 * Base internal cost per square foot, Treasure Valley, 2026.
 *
 * Read these as "a finished, code-compliant shell of this type at a standard
 * specification, on a flat serviced site, excluding plumbing, power and
 * conditioning" - each of those is added separately below, because they are the
 * things clients actually vary and burying them in one rate makes the estimate
 * impossible to explain.
 *
 * The spread between them is the whole reason this table exists: habitable
 * space (ADU, guest house) carries a full residential envelope, interior
 * finish, and its own kitchen and bath, and lands near main-house rates. A shop
 * or barn is a slab, a clear-span frame, a skin and a door.
 */
const BASE_COST_PER_SF: Record<AccessoryStructureKind, number> = {
  adu: 165,
  "guest-house": 170,
  "pool-house": 130,
  "detached-garage": 62,
  "rv-garage": 68,
  shop: 42,
  barn: 28,
  // Deliberately mid-scale. "Something else" cannot be priced properly from a
  // checkbox, and the consultation resolves it; a low guess would understate
  // the budget and a high one would scare off a lead over a structure nobody
  // has described yet.
  other: 90,
};

/**
 * Whether finish level should move this structure's rate much.
 *
 * A luxury ADU really does cost multiples of a builder-grade one: same framing,
 * far more inside it. A luxury pole barn is mostly still a pole barn. Applying
 * the habitable tier ladder to a barn overstated it badly, so non-habitable
 * structures get a damped version of the same curve.
 */
const HABITABLE: ReadonlySet<AccessoryStructureKind> = new Set<AccessoryStructureKind>([
  "adu",
  "guest-house",
  "pool-house",
]);

/**
 * Finish tier against the mid-range anchor.
 *
 * Mirrors the direction of the main engine's quality ladder rather than its
 * exact factors: this table scales a blended cost per square foot, whereas
 * engine.ts scales material, labour and subcontract rates separately.
 */
const FINISH_FACTOR: Record<FinishLevel, number> = {
  refresh: 0.82,
  "mid-range": 1,
  "high-end": 1.28,
  luxury: 1.62,
};

/** How much of the finish swing a non-habitable structure actually sees. */
const NON_HABITABLE_FINISH_DAMPING = 0.4;

/**
 * Conditioning a structure: insulation, air sealing, and a heat source.
 *
 * Charged per square foot because that is how it scales. A heated 2,400 SF shop
 * is a materially different building from a cold one, and it is one of the
 * commonest sources of a shop budget coming in low.
 */
const HEATED_COST_PER_SF = 14;

/**
 * Getting water and waste to a detached building.
 *
 * Mostly fixed rather than per square foot: the trench, the connection and the
 * fixtures dominate, and a bigger shop does not need a longer sewer lateral.
 * Habitable structures carry more because an ADU needs a kitchen and a full
 * bath, not a utility sink.
 */
const PLUMBING_FIXED_HABITABLE = 18500;
const PLUMBING_FIXED_UTILITY = 9500;

/** Power service, by how much of it the structure needs. */
const POWER_FIXED: Record<AccessoryStructure["power"], number> = {
  none: 0,
  standard: 3800,
  // A sub-panel, a trench, and the circuits a working shop actually uses:
  // welder, compressor, lift, dust collection.
  heavy: 11000,
};

/**
 * What a detached structure carries that an attached one does not.
 *
 * Its own footings and slab edge, its own roof tie-in, a separate utility
 * trench, and its own approach or apron. Modelled as a discount for attaching
 * rather than a premium for detaching, because detached is the normal case and
 * attaching is the exception that saves money.
 */
const ATTACHED_SAVING = 11000;

/** Attaching cannot save more than this share of the structure's own cost. */
const ATTACHED_SAVING_CAP = 0.25;

/**
 * Site work for a detached building: pad, approach, drainage, and getting a
 * concrete truck to it. Scales with footprint, not with finish.
 */
const DETACHED_SITE_COST_PER_SF = 7;

function finishFactorFor(
  kind: AccessoryStructureKind,
  finish: FinishLevel,
): number {
  const raw = FINISH_FACTOR[finish];
  if (HABITABLE.has(kind)) return raw;
  return 1 + (raw - 1) * NON_HABITABLE_FINISH_DAMPING;
}

function line(
  code: string,
  description: string,
  type: CostLine["type"],
  uom: CostLine["uom"],
  quantity: number,
  unitCost: number,
  assumption?: string,
): CostLine {
  return {
    code,
    division: ACCESSORY_DIVISION,
    description,
    type,
    uom,
    quantity,
    unitCost,
    cost: quantity * unitCost,
    assumption,
  };
}

/**
 * Price one structure into its constituent cost lines.
 *
 * `houseFinish` is used when the structure's own finish is null, which the UI
 * uses to mean "match the house" rather than "unknown".
 */
export function accessoryStructureLines(
  structure: AccessoryStructure,
  houseFinish: FinishLevel,
  index: number,
): CostLine[] {
  const meta = ACCESSORY_STRUCTURE_LABELS[structure.kind];
  const sqft = Math.max(0, structure.sqft);
  if (sqft <= 0) return [];

  const finish = structure.finish ?? houseFinish;
  const attached = structure.attached && meta.canAttach;
  // Unique per structure so two shops do not collide in the engine's byCode map,
  // which keeps the larger of any duplicate and would silently drop the second.
  const id = `AS-${index + 1}-${structure.kind}`;
  const rate = BASE_COST_PER_SF[structure.kind] * finishFactorFor(structure.kind, finish);

  const lines: CostLine[] = [
    line(
      `${id}-SHELL`,
      `${meta.label} shell and finish (${finish})`,
      "Subcontractor",
      "SF",
      sqft,
      rate,
      `${Math.round(sqft).toLocaleString("en-US")} SF ${meta.label.toLowerCase()}, ${attached ? "attached" : "detached"}, ${finish} specification.`,
    ),
  ];

  if (structure.heated) {
    lines.push(
      line(
        `${id}-HVAC`,
        `${meta.label} insulation and conditioning`,
        "Subcontractor",
        "SF",
        sqft,
        HEATED_COST_PER_SF,
        "Insulated, air sealed and heated rather than a cold shell.",
      ),
    );
  }

  if (structure.plumbing) {
    const fixed = HABITABLE.has(structure.kind)
      ? PLUMBING_FIXED_HABITABLE
      : PLUMBING_FIXED_UTILITY;
    lines.push(
      line(
        `${id}-PLUMB`,
        `${meta.label} plumbing rough-in and fixtures`,
        "Subcontractor",
        "EA",
        1,
        fixed,
        HABITABLE.has(structure.kind)
          ? "Kitchen and full bath, with water and sewer run to the structure."
          : "Utility sink or half bath, with water and waste run to the structure.",
      ),
    );
  }

  if (POWER_FIXED[structure.power] > 0) {
    lines.push(
      line(
        `${id}-ELEC`,
        `${meta.label} electrical service (${structure.power})`,
        "Subcontractor",
        "EA",
        1,
        POWER_FIXED[structure.power],
        structure.power === "heavy"
          ? "Sub-panel and dedicated circuits for shop equipment."
          : "Lighting, receptacles and a feed from the main panel.",
      ),
    );
  }

  if (!attached) {
    lines.push(
      line(
        `${id}-SITE`,
        `${meta.label} site work, pad and approach`,
        "Subcontractor",
        "SF",
        sqft,
        DETACHED_SITE_COST_PER_SF,
        "Detached: own pad, drainage, approach and utility trench.",
      ),
    );
  } else {
    const gross = lines.reduce((s, l) => s + l.cost, 0);
    const saving = -Math.min(ATTACHED_SAVING, gross * ATTACHED_SAVING_CAP);
    if (saving < 0) {
      lines.push(
        line(
          `${id}-ATTACH`,
          `${meta.label} shared foundation and wall credit`,
          "Subcontractor",
          "EA",
          1,
          saving,
          "Attached: shares footings, a wall and utility runs with the house.",
        ),
      );
    }
  }

  return lines;
}

/**
 * Every accessory structure on a project, as cost lines.
 *
 * Returns an empty array for null (never asked) and for an empty array (asked,
 * none wanted). Those two states differ for reporting, not for price.
 */
export function accessoryStructureCostLines(
  structures: AccessoryStructure[] | null | undefined,
  houseFinish: FinishLevel,
): CostLine[] {
  if (!structures || structures.length === 0) return [];
  return structures.flatMap((s, i) => accessoryStructureLines(s, houseFinish, i));
}

/** Plain-language summary of the structures, for assumptions and admin. */
export function describeAccessoryStructures(
  structures: AccessoryStructure[] | null | undefined,
): string[] {
  if (!structures || structures.length === 0) return [];
  return structures.map((s) => {
    const meta = ACCESSORY_STRUCTURE_LABELS[s.kind];
    const bits = [
      `${Math.round(s.sqft).toLocaleString("en-US")} SF`,
      s.attached && meta.canAttach ? "attached" : "detached",
    ];
    if (s.heated) bits.push("heated");
    if (s.plumbing) bits.push("plumbed");
    if (s.power === "heavy") bits.push("heavy power");
    return `${meta.label}: ${bits.join(", ")}.`;
  });
}

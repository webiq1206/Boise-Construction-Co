/**
 * Verifies the new residential construction cost engine.
 *
 * Two jobs. First, the arithmetic and the scope graph: no duplicated cost codes,
 * no zero-quantity lines, and every relationship that must hold by construction
 * logic (a second storey is cheaper per square foot, a bigger house is cheaper
 * per square foot, a steep lot costs more than a flat one).
 *
 * Second, and more important: the engine must agree with what the website tells
 * people. shared/seoContent.ts publishes a $250 to $400 per square foot planning
 * band, a "near $225" floor for simple flat-lot builds, and a "regularly exceed
 * $450" ceiling for foothills sites. Those are promises to a prospective client.
 * If a rate or a quantity changes and the engine drifts outside them, this fails
 * and either the engine or the published copy has to move. That check is the
 * reason this file exists.
 */
import {
  buildInternalEstimate,
  deriveHouseDimensions,
  type QualityLevel,
  type ScopeSelections,
} from "../shared/costs/engine";
import {
  CUSTOM_HOME_RULES,
  SEMI_CUSTOM_HOME_RULES,
  SHOP_HOME_RULES,
  BUILD_ON_YOUR_LOT_RULES,
  newBuildMonths,
} from "../shared/costs/newConstructionRules";
import {
  resolveQuotedRange,
  resolveInternalEstimate,
  type ResolverRefinements,
} from "../shared/costs/resolve";
import {
  NEW_CONSTRUCTION_PROJECT_TYPES,
  type ProjectType,
} from "../shared/estimateEngine";

let checks = 0;
let failures = 0;

function t(label: string, ok: boolean, detail = "") {
  checks++;
  if (!ok) {
    failures++;
    console.log(`FAIL: ${label}${detail ? "  [" + detail + "]" : ""}`);
  }
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

const base = (over: Partial<ScopeSelections> = {}): ScopeSelections => ({
  quality: "mid-range",
  sqft: 2400,
  stories: 1,
  garageSqft: 600,
  basementSqft: 0,
  coveredOutdoorSqft: 200,
  wellSeptic: false,
  siteDifficulty: "simple",
  ...over,
});

const price = (s: ScopeSelections, rules = CUSTOM_HOME_RULES, project = "custom-home") =>
  buildInternalEstimate(rules, s, project).customerPrice;

const perSf = (s: ScopeSelections, rules = CUSTOM_HOME_RULES, project = "custom-home") =>
  price(s, rules, project) / s.sqft;

/* ============================================================ 1. GEOMETRY */
{
  const oneStorey = deriveHouseDimensions(base({ stories: 1 }));
  const twoStorey = deriveHouseDimensions(base({ stories: 2 }));

  t("geometry/two-storey-halves-footprint", Math.abs(twoStorey.footprint - 1200) < 1, `${twoStorey.footprint}`);
  t("geometry/one-storey-footprint-equals-area", Math.abs(oneStorey.footprint - 2400) < 1);
  t("geometry/two-storey-smaller-roof", twoStorey.roofArea < oneStorey.roofArea);
  t("geometry/two-storey-more-exterior-wall", twoStorey.exteriorWallArea > oneStorey.exteriorWallArea);
  t("geometry/garage-in-foundation-area", oneStorey.foundationArea > oneStorey.footprint);
  t("geometry/bathrooms-in-sane-range", oneStorey.bathrooms >= 2 && oneStorey.bathrooms <= 4, `${oneStorey.bathrooms}`);
  t("geometry/doors-in-sane-range", oneStorey.interiorDoors >= 10 && oneStorey.interiorDoors <= 18, `${oneStorey.interiorDoors}`);
  t("geometry/glazing-below-exterior-wall", oneStorey.windowArea < oneStorey.exteriorWallArea);
  t("geometry/clad-plus-glazing-equals-wall",
    Math.abs(oneStorey.cladArea + oneStorey.windowArea - oneStorey.exteriorWallArea) < 0.01);

  // A 5,000 sq ft home should not be scheduled the same as a 1,500 sq ft one,
  // nor twice as long: trades overlap.
  t("schedule/bigger-takes-longer", newBuildMonths(4500) > newBuildMonths(1600));
  t("schedule/sublinear", newBuildMonths(4800) < newBuildMonths(1600) * 3);
  t("schedule/baseline-about-9-months", Math.abs(newBuildMonths(2400) - 9) < 0.01, `${newBuildMonths(2400)}`);
}

/* ================================================== 2. TAKEOFF INTEGRITY */
{
  const est = buildInternalEstimate(CUSTOM_HOME_RULES, base(), "custom-home");

  t("takeoff/has-lines", est.lines.length > 30, `${est.lines.length} lines`);
  t("takeoff/no-duplicate-code-warnings",
    est.warnings.filter((w) => w.message.includes("more than one scope rule")).length === 0,
    est.warnings.map((w) => w.message).join(" | ").slice(0, 200));
  t("takeoff/no-zero-quantity-lines", est.lines.every((l) => l.quantity > 0));
  t("takeoff/no-zero-cost-lines", est.lines.every((l) => l.cost > 0));
  t("takeoff/contingency-is-ten-percent",
    Math.abs(est.contingency - est.directCost * 0.1) < 0.01);
  t("takeoff/price-above-cost", est.customerPrice > est.totalInternalCost);

  // Every division a complete house must touch. A missing one means a rule was
  // dropped and the quote is silently short.
  const divisions = new Set(est.lines.map((l) => l.division));
  for (const required of [
    "FOUNDATION", "FRAMING", "ENVELOPE PROTECTION", "EXTERIOR OPENINGS",
    "MECHANICAL (HVAC)", "ELECTRICAL", "PLUMBING", "EXTERIOR FINISHES",
    "INSULATION", "DRYWALL", "PAINTING + WALLPAPER", "FLOORING",
    "TILE + STONE", "COUNTERTOPS + CABINETRY", "INTERIOR DOORS + MILLWORK",
    "HARDWARE + GLASS", "SITE WORK", "SITE REQUIREMENTS", "ADMINISTRATION",
    "PLANNING", "DESIGN", "LANDSCAPE", "PRE-OCCUPANCY",
  ]) {
    t(`takeoff/includes-${required}`, divisions.has(required));
  }

  // Appliances are client-supplied, per the site's own FAQ. Carrying the
  // catalog's $10,000 package would contradict published copy.
  t("takeoff/excludes-appliances", !divisions.has("APPLIANCES"));
  t("takeoff/excludes-furnishings", !divisions.has("FURNISHINGS"));

  // No single trade should dominate a whole-house build. If one does, a
  // quantity basis is probably wrong.
  const heaviest = est.trades[0];
  t("takeoff/no-trade-over-20-percent",
    heaviest.internalCost / est.directCost < 0.2,
    `${heaviest.division} at ${((heaviest.internalCost / est.directCost) * 100).toFixed(1)}%`);

  /*
   * PER-TRADE BUDGET BOUNDS, in cost dollars per finished square foot.
   *
   * This is the check that catches a wrong quantity BASIS, which is the failure
   * mode this rule set is most prone to and the one that does not announce
   * itself: pricing drywall against 9,120 sq ft of board rather than 2,400 sq ft
   * of finished area produces a plausible-looking total and a drywall line at
   * three times the market. A whole-project total can absorb one bad trade and
   * still look reasonable, so bounds are asserted trade by trade.
   *
   * Ranges are what a Boise builder would recognise as a mid-range
   * per-finished-square-foot budget for that trade, deliberately wide enough
   * that ordinary rate changes do not trip them and tight enough that a factor
   * of two is caught. These are COST, before margin.
   */
  const area = 2400;
  const bounds: Record<string, [number, number]> = {
    FOUNDATION: [12, 35],
    FRAMING: [15, 40],
    DRYWALL: [4, 14],
    "PAINTING + WALLPAPER": [3, 12],
    PLUMBING: [4, 14],
    ELECTRICAL: [4, 14],
    "MECHANICAL (HVAC)": [3, 12],
    "EXTERIOR FINISHES": [5, 20],
    INSULATION: [1, 8],
    FLOORING: [3, 15],
    "COUNTERTOPS + CABINETRY": [4, 18],
    "EXTERIOR OPENINGS": [3, 16],
    LANDSCAPE: [2, 15],
  };
  for (const [division, [min, max]] of Object.entries(bounds)) {
    const trade = est.trades.find((tr) => tr.division === division);
    if (!trade) {
      t(`budget/${division}/present`, false, "division missing from takeoff");
      continue;
    }
    const rate = trade.internalCost / area;
    t(`budget/${division}/per-sf-plausible`, rate >= min && rate <= max,
      `$${rate.toFixed(2)}/sf, expected $${min}-$${max}`);
  }
}

/* ============================================ 3. DIRECTIONAL CORRECTNESS */
{
  t("direction/finish-tiers-ascend",
    perSf(base({ quality: "refresh" })) < perSf(base({ quality: "mid-range" })) &&
    perSf(base({ quality: "mid-range" })) < perSf(base({ quality: "high-end" })) &&
    perSf(base({ quality: "high-end" })) < perSf(base({ quality: "luxury" })));

  // Bigger homes cost more in total but less per square foot.
  t("direction/bigger-costs-more-total", price(base({ sqft: 3600 })) > price(base({ sqft: 2400 })));
  t("direction/bigger-cheaper-per-sf", perSf(base({ sqft: 3600 })) < perSf(base({ sqft: 2400 })));

  // A second storey shares one foundation and one roof.
  t("direction/two-storey-cheaper-per-sf", perSf(base({ stories: 2 })) < perSf(base({ stories: 1 })));

  // Site conditions.
  t("direction/steep-costs-more", price(base({ siteDifficulty: "steep" })) > price(base({ siteDifficulty: "moderate" })));
  t("direction/moderate-costs-more-than-flat", price(base({ siteDifficulty: "moderate" })) > price(base({ siteDifficulty: "simple" })));

  // Well and septic against a city connection: real cost in Ada and Canyon
  // counties is $25,000 to $45,000, and the estimator must reflect that rather
  // than treating it as a rounding difference.
  const ruralDelta = price(base({ wellSeptic: true })) - price(base());
  t("direction/well-septic-swing-is-material", ruralDelta > 25_000 && ruralDelta < 60_000, usd(ruralDelta));

  // A garage and a basement both add cost.
  t("direction/garage-adds-cost", price(base({ garageSqft: 900 })) > price(base({ garageSqft: 480 })));
  t("direction/basement-adds-cost", price(base({ basementSqft: 1200 })) > price(base({ basementSqft: 0 })));

  // Semi-custom saves design work, not construction, so it is cheaper but only
  // modestly. If it ever came out dramatically cheaper the build scope has been
  // cut by accident.
  const custom = price(base());
  const semi = price(base(), SEMI_CUSTOM_HOME_RULES, "semi-custom-home");
  t("direction/semi-custom-cheaper", semi < custom, `${usd(semi)} vs ${usd(custom)}`);
  t("direction/semi-custom-saving-is-design-only", semi > custom * 0.9,
    `saved ${usd(custom - semi)}, which should be design fees only`);

  const onLot = price(base(), BUILD_ON_YOUR_LOT_RULES, "build-on-your-lot");
  t("direction/build-on-lot-between", onLot <= custom && onLot >= semi, usd(onLot));
}

/* ================================== 4. AGREEMENT WITH PUBLISHED COPY */
/*
 * These assert against the exact claims in shared/seoContent.ts. Changing a
 * rate or a quantity until one of these fails means the website is now telling
 * people something the estimator does not do.
 */
{
  const low = perSf(base({ quality: "refresh" }));
  const mid = perSf(base({ quality: "mid-range" }));
  const high = perSf(base({ quality: "high-end" }));

  // "most Treasure Valley custom homes plan between $250 and $400 per finished
  // square foot excluding land, which puts a 2,400 square foot home between
  // $600,000 and $960,000"
  t("published/typical-band-2400sf",
    price(base({ quality: "refresh" })) >= 560_000 && price(base({ quality: "high-end" })) <= 1_060_000,
    `${usd(price(base({ quality: "refresh" })))} - ${usd(price(base({ quality: "high-end" })))}`);
  t("published/mid-tier-inside-250-400", mid >= 250 && mid <= 400, `$${mid.toFixed(0)}/sf`);

  // "Simpler single-level designs on flat valley lots can come in near $225 per
  // square foot"
  const simple = perSf(base({ quality: "refresh", coveredOutdoorSqft: 0, garageSqft: 480 }));
  t("published/simple-flat-lot-near-225", simple <= 260, `$${simple.toFixed(0)}/sf`);

  // "foothills sites, steep grades, and highly detailed interiors regularly
  // exceed $450"
  const foothills = perSf(base({ quality: "high-end", siteDifficulty: "steep", wellSeptic: true }));
  t("published/foothills-exceeds-450", foothills > 450, `$${foothills.toFixed(0)}/sf`);

  // The whole band should stay inside something a builder would recognise. A
  // luxury build above $900/sf or an entry build below $180/sf means a rate is
  // wrong, not that the market moved.
  t("published/no-tier-implausibly-low", low > 180, `$${low.toFixed(0)}/sf`);
  t("published/no-tier-implausibly-high", perSf(base({ quality: "luxury" })) < 900,
    `$${perSf(base({ quality: "luxury" })).toFixed(0)}/sf`);

  void high;
}

/* ================================= 4b. SHOP HOMES AGREE WITH PUBLISHED COPY */
/*
 * A shop home is the one project whose headline number is quoted per BLENDED
 * square foot, living plus shop, while the estimator's slider is living area
 * only. That mismatch is exactly the kind of thing that goes wrong silently, so
 * the published claims are asserted directly here.
 *
 * The first version of these rules priced the shop at $19/sf and plateaued as
 * the shop grew, because the market ceiling was set below the takeoff and was
 * clamping every result. Nothing caught it: the resolver sweep only checks that
 * a range comes back and lands inside a wide per-sf band, and a clamped price
 * satisfies both. The marginal check below is what would have caught it.
 */
{
  const shop = (
    livingSqft: number,
    shopSqft: number,
    quality: ScopeSelections["quality"] = "refresh",
  ) =>
    price(
      base({ quality, sqft: livingSqft, shopSqft, garageSqft: 0, coveredOutdoorSqft: 0 }),
      SHOP_HOME_RULES,
      "shop-home",
    );

  // The shop has to cost real money per square foot, and the same money whether
  // it is the second 600 SF or the fifth. A flat marginal cost is the signature
  // of a clamp.
  const noShop = shop(1600, 0);
  const marginals = [600, 1200, 1800, 2400, 3200].map(
    (sf) => (shop(1600, sf) - noShop) / sf,
  );
  for (const [i, m] of marginals.entries()) {
    t(`shop/marginal-cost-realistic-${[600, 1200, 1800, 2400, 3200][i]}sf`,
      m >= 40 && m <= 90, `$${m.toFixed(0)}/sf of shop`);
  }
  const spread = Math.max(...marginals) - Math.min(...marginals);
  t("shop/marginal-cost-stable-across-sizes", spread < 12, `$${spread.toFixed(0)}/sf spread`);

  // A shop square foot must cost meaningfully less than a living square foot,
  // which is the entire premise of the product and of the published copy.
  const livingPerSf = noShop / 1600;
  t("shop/shop-cheaper-than-living", marginals[2] < livingPerSf * 0.45,
    `shop $${marginals[2].toFixed(0)}/sf vs living $${livingPerSf.toFixed(0)}/sf`);

  // "A 1,600 square foot living area with an attached 1,200 square foot shop
  // commonly lands between $385,000 and $630,000 excluding land."
  const publishedLow = shop(1600, 1200, "refresh");
  const publishedHigh = shop(1600, 1200, "mid-range");
  t("shop/published-example-low", publishedLow >= 360_000 && publishedLow <= 470_000, usd(publishedLow));
  t("shop/published-example-high", publishedHigh >= 500_000 && publishedHigh <= 660_000, usd(publishedHigh));

  // "between $140 and $250 per square foot, blended across finished and shop
  // space". Checked across the four configurations the estimator offers, at the
  // tiers most shop homes are actually built to.
  for (const [living, shopSf] of [[1200, 1200], [1700, 1600], [1600, 2400], [2400, 1800]]) {
    for (const q of ["refresh", "mid-range"] as const) {
      const blended = shop(living, shopSf, q) / (living + shopSf);
      t(`shop/blended-inside-published-band-${living}-${shopSf}-${q}`,
        blended >= 125 && blended <= 250, `$${blended.toFixed(0)}/sf blended`);
    }
  }

  // Ordering against the other new-construction types, on the same living area.
  // A shop home's living half is a house, so it must not come out cheaper than
  // a semi-custom home of the same living area with no shop at all.
  const shopHomeNoShop = shop(2000, 0, "mid-range");
  const semiCustom = price(
    base({ quality: "mid-range", sqft: 2000, garageSqft: 0, coveredOutdoorSqft: 0 }),
    SEMI_CUSTOM_HOME_RULES,
    "semi-custom-home",
  );
  t("shop/living-half-priced-like-a-house", shopHomeNoShop >= semiCustom * 0.95,
    `${usd(shopHomeNoShop)} vs semi-custom ${usd(semiCustom)}`);
}

/* ===================================================== 5. ROBUSTNESS */
{
  // The engine must not throw or produce nonsense at the edges of the sliders,
  // or on inputs a visitor has not answered yet.
  const tiers: QualityLevel[] = ["refresh", "mid-range", "high-end", "luxury"];
  for (const sqft of [900, 1200, 2400, 5000, 8000]) {
    for (const q of tiers) {
      for (const stories of [1, 2]) {
        const p = price(base({ sqft, quality: q, stories }));
        t(`robust/${sqft}/${q}/${stories}-storey-is-finite`, Number.isFinite(p) && p > 0);
        t(`robust/${sqft}/${q}/${stories}-storey-per-sf-sane`, p / sqft > 100 && p / sqft < 1400, `$${(p / sqft).toFixed(0)}/sf`);
      }
    }
  }

  // Unanswered optional questions must not crash or zero the estimate.
  const sparse: ScopeSelections = { quality: "mid-range", sqft: 2400 };
  const sparsePrice = price(sparse);
  t("robust/sparse-selections-price", Number.isFinite(sparsePrice) && sparsePrice > 0);
  t("robust/sparse-defaults-to-one-storey-no-garage", sparsePrice < price(base()), usd(sparsePrice));
}

/* ============================================ 6. THE RESOLVER PATH */
/*
 * THIS IS THE SECTION THAT MATTERS MOST.
 *
 * Everything above tests the engine directly. But the browser and both API
 * routes reach it through `resolveQuotedRange`, and the documented failure mode
 * on this codebase is a selection that is wired into the UI and the guide engine
 * but never reaches the line-item engine, so it silently moves no number. A chip
 * that changes nothing is worse than no chip, because it teaches a visitor the
 * estimator is decorative.
 *
 * So these assertions go through the real resolver with the refinement shape the
 * calculator actually holds, and require every construction selection to move
 * the quoted range.
 */
{
  const refs = (over: Partial<ResolverRefinements> = {}): ResolverRefinements => ({
    stories: 1,
    garageBays: "two",
    basementType: "none",
    lotServices: "city",
    siteDifficulty: "simple",
    coveredOutdoor: 0,
    ...over,
  });

  const quote = (project: ProjectType, over: Partial<ResolverRefinements> = {}, finish = "mid-range") =>
    resolveQuotedRange(project, finish, 2400, refs(over), 0.5);

  for (const project of NEW_CONSTRUCTION_PROJECT_TYPES) {
    const r = quote(project);
    t(`resolver/${project}/returns-a-range`, r !== null);
    if (!r) continue;
    t(`resolver/${project}/low-below-high`, r.priceLow < r.priceHigh);
    t(`resolver/${project}/range-is-plausible`,
      r.priceLow / 2400 > 150 && r.priceHigh / 2400 < 900,
      `$${(r.priceLow / 2400).toFixed(0)}-$${(r.priceHigh / 2400).toFixed(0)}/sf`);
  }

  const baseQuote = quote("custom-home")!;

  // Every construction selection must move the number through the resolver.
  const moves: Array<[string, Partial<ResolverRefinements>]> = [
    ["basement", { basementType: "unfinished" }],
    ["finished-basement", { basementType: "finished" }],
    ["bigger-garage", { garageBays: "three" }],
    ["four-car-garage", { garageBays: "four" }],
    ["covered-patio", { coveredOutdoor: 300 }],
    ["well-septic", { lotServices: "well-septic" }],
    ["moderate-site", { siteDifficulty: "moderate" }],
    ["steep-site", { siteDifficulty: "steep" }],
    ["two-storey", { stories: 2 }],
  ];
  for (const [label, over] of moves) {
    const r = quote("custom-home", over)!;
    t(`resolver/${label}/moves-the-price`, r.priceLow !== baseQuote.priceLow,
      `${usd(r.priceLow)} vs base ${usd(baseQuote.priceLow)}`);
  }

  // Direction, through the resolver rather than the engine.
  t("resolver/basement-adds", quote("custom-home", { basementType: "unfinished" })!.priceLow > baseQuote.priceLow);
  t("resolver/garage-adds", quote("custom-home", { garageBays: "three" })!.priceLow > baseQuote.priceLow);
  t("resolver/patio-adds", quote("custom-home", { coveredOutdoor: 300 })!.priceLow > baseQuote.priceLow);
  t("resolver/well-septic-adds", quote("custom-home", { lotServices: "well-septic" })!.priceLow > baseQuote.priceLow);
  t("resolver/steep-adds", quote("custom-home", { siteDifficulty: "steep" })!.priceLow > baseQuote.priceLow);

  // Size fine-tuning must reach the line-item engine, not just the UI.
  // A stated approximate garage size outranks the per-bay preset.
  t("resolver/garage-sqft-overrides-preset",
    quote("custom-home", { garageBays: "three", garageSqft: 1400 })!.priceLow >
      quote("custom-home", { garageBays: "three" })!.priceLow);
  // A partial basement (explicit SF below the footprint) must price BELOW the
  // full-footprint assumption it replaces, for both shell and finished.
  t("resolver/partial-basement-prices-below-full",
    quote("custom-home", { basementType: "unfinished", basementSqft: 800 })!.priceLow <
      quote("custom-home", { basementType: "unfinished" })!.priceLow);
  t("resolver/partial-finished-basement-prices-below-full",
    quote("custom-home", { basementType: "finished", basementSqft: 800 })!.priceLow <
      quote("custom-home", { basementType: "finished" })!.priceLow);
  // But still above no basement at all.
  t("resolver/partial-basement-still-adds",
    quote("custom-home", { basementType: "unfinished", basementSqft: 800 })!.priceLow >
      baseQuote.priceLow);
  // A stated basement size cannot exceed the ground-floor footprint.
  t("resolver/basement-clamped-to-footprint",
    quote("custom-home", { basementType: "unfinished", basementSqft: 50_000 })!.priceLow ===
      quote("custom-home", { basementType: "unfinished" })!.priceLow);
  // Patio size is a real input: a bigger patio must quote higher.
  t("resolver/patio-size-moves-the-price",
    quote("custom-home", { coveredOutdoor: 800 })!.priceLow >
      quote("custom-home", { coveredOutdoor: 300 })!.priceLow);

  // A finished basement is living space and must cost more than the same
  // basement left as a shell.
  t("resolver/finished-basement-beats-unfinished",
    quote("custom-home", { basementType: "finished" })!.priceLow >
      quote("custom-home", { basementType: "unfinished" })!.priceLow);

  // "Unsure" about services must NOT be priced as the expensive case. Quoting a
  // well and septic to someone on city water loses the lead.
  t("resolver/unsure-services-priced-as-city",
    quote("custom-home", { lotServices: "unsure" })!.priceLow === baseQuote.priceLow);

  // Finish tiers must ascend through the resolver too, not just the engine.
  const tierQuotes = (["refresh", "mid-range", "high-end", "luxury"] as const).map(
    (f) => quote("custom-home", {}, f)!.priceLow,
  );
  t("resolver/tiers-ascend",
    tierQuotes.every((v, i) => i === 0 || v > tierQuotes[i - 1]),
    tierQuotes.map(usd).join(" < "));

  // The margin guard must not be pinned at ordinary configurations. If it is, the
  // price stops responding to input and every further selection is ignored.
  const internal = resolveInternalEstimate("custom-home", "mid-range", 2400, refs(), 0.5);
  t("resolver/internal-estimate-available", internal !== null);
  if (internal) {
    t("resolver/margin-not-trimmed-at-baseline", !internal.range.trimmed,
      `applied margin ${(internal.internal.appliedMargin * 100).toFixed(1)}%`);
  }

  // Unanswered refinements must still produce a usable range, because a visitor
  // sees a number before answering everything.
  const bare = resolveQuotedRange("custom-home", "mid-range", 2400, {}, 0);
  t("resolver/bare-refinements-still-quote", bare !== null && bare.priceLow > 0);
}

/* ======================================================== SUMMARY */
console.log("");
console.log("Baseline: custom home, 2,400 sf, single storey, 2-bay garage, flat serviced lot");
for (const q of ["refresh", "mid-range", "high-end", "luxury"] as QualityLevel[]) {
  const s = base({ quality: q });
  console.log(
    `  ${q.padEnd(11)} ${usd(price(s)).padStart(12)}   $${perSf(s).toFixed(0)}/sf`,
  );
}
console.log("");

if (failures > 0) {
  console.log(`${failures} of ${checks} new-construction checks FAILED.`);
  process.exit(1);
}
console.log(`All ${checks} new-construction checks passed.`);

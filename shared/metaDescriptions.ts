/**
 * Authored meta descriptions for the generated landing pages: the ten service
 * parents, the nine area pages and the indexable city x service pages.
 *
 * Rules (enforced by scripts/verify-meta-descriptions.ts, which runs in
 * prebuild): the page's search phrase comes first, 140 to 155 characters, no
 * phone number, no exclamation mark, no filler adjectives, and no figure
 * (price, $/SF, count) that the page's own content does not already state.
 *
 * Pages missing here fall back to the keyword-first generator in lib/seo.ts,
 * which follows the same rules, so a new service or city cannot reintroduce
 * the old "Call (208) 477-1169 for a free consultation!" formula.
 */

/** Keyed by service slug. */
export const SERVICE_META_DESCRIPTIONS: Record<string, string> = {
  'custom-home-builder':
    'Custom home builder for Boise and the Treasure Valley. We design, engineer and build from a blank page, with a line-item budget before we break ground.',
  'semi-custom-homes':
    'Semi-custom homes in Boise and the Treasure Valley. Start from a proven floor plan, personalize it, and build on a shorter timeline with a tighter budget.',
  'build-on-your-lot':
    'Build on your lot in Idaho with one team. You own the land; we handle feasibility, design, permits and construction, with site costs shown separately.',
  'design-build':
    'Design-build home builder for Boise and the Treasure Valley: design and construction under one contract, so the drawings and the budget never drift apart.',
  'home-plans-design':
    'Custom home plans and design in Idaho: architectural design, engineering and permit-ready drawings for a home built to your site, as a standalone service.',
  'home-additions':
    'Structural home additions in Boise and the Treasure Valley: new footprint or a second story, planned around the structure and utilities already in place.',
  adu: 'Detached ADU builder in Boise, Idaho. We plan and build new accessory dwellings and guest houses on your lot, from setbacks and utilities to the handover.',
  'lot-evaluation':
    'Lot evaluation and feasibility in Idaho before you buy: soils, utilities, access, setbacks and slope reviewed in a written report, starting from $950.',
  'shop-homes-barndominiums':
    'Barndominium and shop home builder in Idaho: post-frame and steel homes with finished living space and real shop space, at $140 to $250 a square foot.',
  'energy-efficient-homes':
    'Energy-efficient home builder in Idaho: high-performance envelopes, tight ducts and blower-door testing, so low operating costs are verified, not promised.',
};

/** Keyed by city slug. */
export const AREA_META_DESCRIPTIONS: Record<string, string> = {
  boise:
    'Home builder in Boise, Idaho for infill lots and foothills parcels. City of Boise permits, setbacks and site costs handled under one design-build contract.',
  meridian:
    'Home builder in Meridian, Idaho for subdivision lots and HOA design review. Feasibility, design, permits and construction from one team, line by line.',
  eagle:
    'Home builder in Eagle, Idaho for valley-floor acreage and foothills sites with strict design review. One team from lot evaluation to the final walkthrough.',
  nampa:
    'Home builder in Nampa, Idaho for serviced subdivision lots and nearby acreage. Canyon County and city permits, with site costs itemized before we build.',
  kuna: 'Home builder in Kuna, Idaho for acreage parcels with well, septic and irrigation laterals. Rural site work is priced separately so the budget holds.',
  star: 'Home builder in Star, Idaho for new subdivisions and working acreage. Jurisdiction, utilities and site costs are checked before anyone draws a plan.',
  middleton:
    'Custom home builder in Middleton, Idaho for city lots and Canyon County acreage. Lot evaluation, design, permits and construction under one contract.',
  caldwell:
    'Home builder in Caldwell, Idaho for serviced city lots and agricultural acreage with irrigation easements. Canyon County and city permits handled.',
  'garden-city':
    'Home builder in Garden City, Idaho for custom, semi-custom and own-lot homes, with design compliance and floodplain review planned before you apply.',
};

/** Keyed as `${serviceSlug}/${citySlug}`; the indexable combinations. */
export const CITY_SERVICE_META_DESCRIPTIONS: Record<string, string> = {
  'custom-home-builder/boise':
    'Custom home building in Boise, Idaho, on infill lots inside the grid and foothills parcels above the bench, with a line-item budget and permits handled.',
  'custom-home-builder/meridian':
    'Custom home building in Meridian, Idaho, from Lochsa Falls to Paramount. Subdivision design review, permits and a line-item budget under one contract.',
  'custom-home-builder/eagle':
    'Custom home building in Eagle, Idaho, where design review is strict and foothills sites cost more per square foot. One team from feasibility to the keys.',
  'custom-home-builder/nampa':
    'Custom home building in Nampa, Idaho, on serviced subdivision lots and nearby acreage. Canyon County and city permits, with site costs itemized first.',
  'semi-custom-homes/boise':
    'Semi-custom homes in Boise, Idaho. Start from a proven plan, adapt it to a tight infill envelope or a foothills lot, and build on a shorter timeline.',
  'semi-custom-homes/meridian':
    'Semi-custom homes in Meridian, Idaho. A proven floor plan adapted to your subdivision lot and HOA guidelines, with selections settled before framing.',
  'semi-custom-homes/eagle':
    'Semi-custom homes in Eagle, Idaho. Adapt a proven plan for an acreage or foothills parcel, clear Eagle design review, and keep the budget tighter.',
  'semi-custom-homes/nampa':
    'Semi-custom homes in Nampa, Idaho. Adapt a proven plan to a serviced Canyon County lot, settle selections early, and build on a shorter timeline.',
  'build-on-your-lot/boise':
    'Build on your lot in Boise, Idaho. We check setbacks, coverage and utilities on your parcel first, then design, permit and build to a line-item budget.',
  'build-on-your-lot/meridian':
    'Build on your lot in Meridian, Idaho. Feasibility, HOA and city review, design, permits and construction from one team, with site costs kept separate.',
  'build-on-your-lot/eagle':
    'Build on your lot in Eagle, Idaho, whether it is valley-floor acreage or a foothills site with slope and access to solve. Site work is always priced first.',
  'build-on-your-lot/nampa':
    'Build on your lot in Nampa, Idaho. We confirm jurisdiction, utilities and fees for your Canyon County parcel, then design and build to a line-item budget.',
  'design-build/boise':
    'Design-build homes in Boise, Idaho. Drawings, engineering, permits and construction under one contract, with design and budget reconciled before we build.',
  'design-build/meridian':
    'Design-build homes in Meridian, Idaho. One contract for design and construction, HOA and city review handled, and every change priced in writing first.',
  'design-build/eagle':
    'Design-build homes in Eagle, Idaho. Design, engineering, Eagle design review, permits and construction with one accountable team and an itemized budget.',
  'design-build/nampa':
    'Design-build homes in Nampa, Idaho. Drawings and budget developed together, Canyon County or city permits handled, and a written update every week.',
  'home-plans-design/boise':
    'Custom home plans in Boise, Idaho: design, engineering and permit-ready drawings fitted to an infill lot or a foothills site, standalone or design-build.',
  'home-plans-design/meridian':
    'Custom home plans in Meridian, Idaho: design, engineering and permit-ready drawings that clear subdivision design review, standalone or in a design-build.',
  'home-additions/boise':
    'Structural home additions in Boise, Idaho: new footprint or a second story on an older house, with structure, utilities and city permits planned first.',
  'home-additions/meridian':
    'Structural home additions in Meridian, Idaho: new footprint or a second story tied into the house you have, with HOA review and city permits handled.',
  'adu/boise':
    'Detached ADUs and guest houses in Boise, Idaho, built as new structures on your lot. Setbacks, utilities and Boise or Ada County rules are checked first.',
  'adu/meridian':
    'Detached ADU builder in Meridian, Idaho. New backyard dwellings and guest houses planned around setbacks, utilities and city rules by one accountable team.',
  'lot-evaluation/boise':
    'Building lot evaluation in Boise, Idaho before you buy: setbacks, coverage, utilities, soils and slope on infill or foothills lots, in writing, from $950.',
  'lot-evaluation/meridian':
    'Building lot evaluation in Meridian, Idaho: utilities, access, setbacks, HOA constraints and jurisdiction confirmed in a written report before you buy.',
  'shop-homes-barndominiums/meridian':
    'Barndominium builder in Meridian, Idaho. Shop homes pairing living space with real shop space, planned at $140 to $250 per square foot blended.',
  'shop-homes-barndominiums/eagle':
    'Barndominium builder in Eagle, Idaho for acreage parcels. Post-frame and steel shop homes with finished living wings, sized to your lot and your budget.',
  'shop-homes-barndominiums/nampa':
    'Barndominium builder in Nampa, Idaho. Shop homes on Canyon County acreage with the shop and the house planned together, and permits handled for you.',
  'shop-homes-barndominiums/kuna':
    'Barndominium builder in Kuna, Idaho for rural lots with well, septic and irrigation to solve. Shop homes planned at $140 to $250 per square foot blended.',
  'energy-efficient-homes/boise':
    'Energy-efficient homes in Boise, Idaho: tight envelopes, ducts inside, right-sized HVAC and blower-door testing, built to cut operating costs for years.',
  'energy-efficient-homes/meridian':
    'Energy-efficient homes in Meridian, Idaho. Air sealing, insulation and window specs chosen with the budget, verified by a blower-door test before move-in.',
};

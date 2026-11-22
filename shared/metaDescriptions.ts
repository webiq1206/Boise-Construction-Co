/**
 * Authored meta descriptions for the generated landing pages: the ten service
 * parents, the nine area pages, and the ADU city pages that stay indexable.
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
    'Design-build home builder for Boise and the Treasure Valley: design and construction from one accountable company, so drawings and budget stay aligned.',
  'home-plans-design':
    'Custom home plans and design in Idaho: architectural design, engineering and permit-ready drawings for a home built to your site, as a standalone service.',
  'home-additions':
    'Structural home additions in Boise and the Treasure Valley: new footprint or a second story, planned around the structure and utilities already in place.',
  adu: 'Detached ADU builder in Boise, Idaho. We plan and build new accessory dwellings and guest houses on your lot, from setbacks and utilities to the handover.',
  'lot-evaluation':
    'Lot evaluation and feasibility in Idaho before you buy: soils, utilities, access, setbacks and slope reviewed in a written report priced for the parcel.',
  'shop-homes-barndominiums':
    'Barndominium and shop home builder in Idaho: post-frame and steel homes with living and shop space, priced from a line-item budget after a lot walkthrough.',
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
    'Custom home builder in Middleton, Idaho for city lots and Canyon County acreage. Lot evaluation, design, permits and construction from one company.',
  caldwell:
    'Home builder in Caldwell, Idaho for serviced city lots and agricultural acreage with irrigation easements. Canyon County and city permits handled.',
  'garden-city':
    'Home builder in Garden City, Idaho for custom, semi-custom and own-lot homes, with design compliance and floodplain review planned before you apply.',
};

/**
 * Keyed as `${serviceSlug}/${citySlug}`. Only the ADU city pages stay indexable.
 * The other former city pages 301 to the parent service and are not described here.
 */
export const CITY_SERVICE_META_DESCRIPTIONS: Record<string, string> = {
  'adu/boise':
    'Detached ADUs and guest houses in Boise, Idaho, built as new structures on your lot. Setbacks, utilities and Boise or Ada County rules are checked first.',
  'adu/meridian':
    'Detached ADU builder in Meridian, Idaho. New backyard dwellings and guest houses planned around setbacks, utilities and city rules by one accountable team.',
};

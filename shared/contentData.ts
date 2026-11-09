// Content Data for Boise Construction Co
// Serves the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton

export interface ServiceData {
  slug: string;
  name: string;
  shortDescription: string;
  /**
   * Planning starting point (a floor, not a bid or a wide range). Rendered as
   * "Planning from $X" to give price context without committing to a spread -
   * the real number comes from the estimator + in-home visit. Sourced from the
   * published GBP starting figures (shared/gbpProfile.ts).
   */
  planningFrom: string;
  /**
   * Secondary services expand keyword coverage (lot evaluation, shop homes,
   * high-performance builds). They get full service + city pages, nav, and
   * sitemap entries, but are kept off the homepage grid so the primary five
   * stay front-and-center. Shown in full on /services.
   */
  secondary?: boolean;
}

export interface CityData {
  slug: string;
  name: string;
  county: 'ada' | 'canyon';
  isPrimary: boolean;
}

/**
 * Each service maps to a distinct buyer intent rather than a keyword variation,
 * so the service and service+city pages do not compete with each other. Generic
 * "new home construction {city}" intent is carried by the location pages, which
 * is why there is no separate generic new-construction service page.
 *
 * planningFrom figures are budget floors for a modest build of that type in the
 * Treasure Valley, derived from the 2026 local range of roughly $225 to $400
 * per finished square foot excluding land (checked 2026-11-09 against the owner's
 * P5 price book at P5 margin policy). They are deliberately conservative:
 * the real number comes from the estimator and a site visit.
 */
export const SERVICES: ServiceData[] = [
  {
    slug: 'custom-home-builder',
    name: 'Custom Home Building',
    shortDescription: 'A home drawn from a blank page around your lot, your budget, and how you actually live.',
    planningFrom: '$525k',
  },
  {
    slug: 'semi-custom-homes',
    name: 'Semi-Custom Homes',
    shortDescription: 'Start from a proven floor plan and personalize it, for a shorter timeline and a tighter budget range.',
    planningFrom: '$425k',
  },
  {
    slug: 'build-on-your-lot',
    name: 'Build on Your Lot',
    shortDescription: 'You already own the land. We handle feasibility, design, permits, and construction from there.',
    planningFrom: '$475k',
  },
  {
    slug: 'design-build',
    name: 'Design-Build',
    shortDescription: 'Design and construction with one accountable company, so the drawings and the budget never drift apart.',
    planningFrom: '$525k',
  },
  {
    slug: 'home-plans-design',
    name: 'Home Design & Plans',
    shortDescription: 'Architectural design, engineering, and permit-ready drawings for a home built to your site.',
    planningFrom: '$9k',
  },
  {
    slug: 'home-additions',
    name: 'Home Additions',
    shortDescription: 'New footprint or a second story added to the home you already live in, planned around the structure, utilities, and daily life already there.',
    planningFrom: 'Priced after an in-home review',
  },
  {
    slug: 'adu',
    name: 'ADUs & Guest Houses',
    shortDescription: 'New detached accessory dwellings and guest houses on the lot you already own, planned around setbacks, utilities, and how you will use the space.',
    planningFrom: 'Priced after a site review',
  },
  {
    slug: 'lot-evaluation',
    name: 'Lot Evaluation & Feasibility',
    shortDescription: 'Soils, utilities, access, setbacks, and slope reviewed before you commit to a parcel.',
    planningFrom: '$950',
    secondary: true,
  },
  {
    slug: 'shop-homes-barndominiums',
    name: 'Shop Homes & Barndominiums',
    shortDescription: 'Post-frame and steel-framed homes that pair finished living space with real working shop square footage.',
    planningFrom: '$330k',
    secondary: true,
  },
  {
    slug: 'energy-efficient-homes',
    name: 'Energy-Efficient Homes',
    shortDescription: 'High-performance envelopes, tight ducts, and low operating costs verified by blower-door testing.',
    planningFrom: '$575k',
    secondary: true,
  },
];

/**
 * Sentence-case display labels for headings, cards, breadcrumbs and menus
 * (owner decision C, 1 November 2026: same words as `name`, only letter case
 * changes; acronyms keep their capitals). `name` stays the title-case identity
 * used for title tags, schema and the keyed maps in lib/seo.ts.
 */
export const SERVICE_LABELS: Record<string, string> = {
  'custom-home-builder': 'Custom home building',
  'semi-custom-homes': 'Semi-custom homes',
  'build-on-your-lot': 'Build on your lot',
  'design-build': 'Design-build',
  'home-plans-design': 'Home design & plans',
  'home-additions': 'Home additions',
  adu: 'ADUs & guest houses',
  'lot-evaluation': 'Lot evaluation & feasibility',
  'shop-homes-barndominiums': 'Shop homes & barndominiums',
  'energy-efficient-homes': 'Energy-efficient homes',
};

/** Sentence-case label for a service, by slug; falls back to its name. */
export function serviceLabel(service: { slug: string; name: string }): string {
  return SERVICE_LABELS[service.slug] ?? service.name;
}

// Alias so existing imports stay compatible
export const PRIORITY_SERVICES = SERVICES;

export const CITIES: CityData[] = [
  { slug: 'boise', name: 'Boise', county: 'ada', isPrimary: true },
  { slug: 'meridian', name: 'Meridian', county: 'ada', isPrimary: false },
  { slug: 'eagle', name: 'Eagle', county: 'ada', isPrimary: false },
  { slug: 'nampa', name: 'Nampa', county: 'canyon', isPrimary: false },
  { slug: 'kuna', name: 'Kuna', county: 'ada', isPrimary: false },
  { slug: 'star', name: 'Star', county: 'ada', isPrimary: false },
  { slug: 'middleton', name: 'Middleton', county: 'canyon', isPrimary: false },
  { slug: 'caldwell', name: 'Caldwell', county: 'canyon', isPrimary: false },
  { slug: 'garden-city', name: 'Garden City', county: 'ada', isPrimary: false },
];

export const TREASURE_VALLEY_CITIES = CITIES.map((c) => c.name).join(', ');

/**
 * True when planningFrom is a figure ("$525k", "$950") rather than a sentence
 * such as "Priced after an in-home review". Only a figure takes the
 * "Planning from" label; a sentence reads on its own.
 */
export function hasPlanningFigure(planningFrom: string): boolean {
  return /^\$/.test(planningFrom.trim());
}

/** "Planning from $525k", or the sentence alone when there is no figure. */
export function planningLabel(planningFrom: string): string {
  return hasPlanningFigure(planningFrom) ? `Planning from ${planningFrom}` : planningFrom;
}

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCountyLabel(county: CityData['county']): string {
  return county === 'ada' ? 'Ada County' : 'Canyon County';
}


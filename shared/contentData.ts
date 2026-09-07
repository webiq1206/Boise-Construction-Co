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
 * per finished square foot excluding land. They are deliberately conservative:
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
    shortDescription: 'Design and construction under one contract, so the drawings and the budget never drift apart.',
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
    shortDescription: 'Useful new space added to the home you already live in, planned around the structure, utilities, and daily life already there.',
    planningFrom: 'Talk with us',
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

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCountyLabel(county: CityData['county']): string {
  return county === 'ada' ? 'Ada County' : 'Canyon County';
}


// Content Data for Boise Construction Co
// Service area: Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton
// and Garden City, plus Ada County and Canyon County (SEO audit CON-S1; owner
// answer, 20 November 2026: the official list is these nine cities).

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
 * planningFrom is a sentence unless an engine backs a figure (owner, 21
 * November 2026: published prices come from the instant estimator). Homes,
 * design-build and energy-efficient homes open the instant estimate, which
 * gives a range for the size and finish a visitor enters, so they carry no
 * floor. The instant estimate has no shop home project, so shop homes carry
 * no figure either: they are priced from a line-item budget after a lot
 * walkthrough.
 */
export const SERVICES: ServiceData[] = [
  {
    slug: 'custom-home-builder',
    name: 'Custom Home Building',
    shortDescription: 'A home drawn from a blank page around your lot, your budget, and how you actually live.',
    planningFrom: 'Preliminary range in our instant estimate',
  },
  {
    slug: 'semi-custom-homes',
    name: 'Semi-Custom Homes',
    shortDescription: 'Start from a proven floor plan and personalize it, for a shorter timeline and a tighter budget range.',
    planningFrom: 'Preliminary range in our instant estimate',
  },
  {
    slug: 'build-on-your-lot',
    name: 'Build on Your Lot',
    shortDescription: 'You already own the land. We handle feasibility, design, permits, and construction from there.',
    planningFrom: 'Preliminary range in our instant estimate',
  },
  {
    slug: 'design-build',
    name: 'Design-Build',
    shortDescription: 'Design and construction with one accountable company, so the drawings and the budget never drift apart.',
    planningFrom: 'Preliminary range in our instant estimate',
  },
  {
    slug: 'home-plans-design',
    name: 'Home Design & Plans',
    shortDescription: 'Architectural design, engineering, and permit-ready drawings for a home built to your site.',
    planningFrom: 'Priced after a design consultation',
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
    planningFrom: 'Priced for the parcel',
    secondary: true,
  },
  {
    slug: 'shop-homes-barndominiums',
    name: 'Shop Homes & Barndominiums',
    shortDescription: 'Post-frame and steel-framed homes that pair finished living space with real working shop square footage.',
    planningFrom: 'Priced after a lot walkthrough',
    secondary: true,
  },
  {
    slug: 'energy-efficient-homes',
    name: 'Energy-Efficient Homes',
    shortDescription: 'High-performance envelopes, tight ducts, and low operating costs verified by blower-door testing.',
    planningFrom: 'Preliminary range in our instant estimate',
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

/**
 * The noun a city-service FAQ question uses for each service, so the question
 * reads as English ("How much does a detached ADU cost in Boise?") instead of
 * the title ("How much does adus & guest houses cost"). SEO audit CON-T1,
 * 20 November 2026. `plural` takes "do" in the cost question.
 */
export const SERVICE_FAQ_NOUNS: Record<string, { noun: string; plural?: boolean }> = {
  'custom-home-builder': { noun: 'a custom home' },
  'semi-custom-homes': { noun: 'a semi-custom home' },
  'build-on-your-lot': { noun: 'building on your own lot' },
  'design-build': { noun: 'design-build' },
  'home-plans-design': { noun: 'home design and plans', plural: true },
  'home-additions': { noun: 'a home addition' },
  adu: { noun: 'a detached ADU' },
  'lot-evaluation': { noun: 'a lot evaluation' },
  'shop-homes-barndominiums': { noun: 'a shop home or barndominium' },
  'energy-efficient-homes': { noun: 'an energy-efficient home' },
};

function faqNoun(service: { slug: string; name: string }) {
  return SERVICE_FAQ_NOUNS[service.slug] ?? { noun: service.name.toLowerCase() };
}

/** "How much does a custom home cost in Boise?" */
export function cityServiceCostQuestion(service: { slug: string; name: string }, cityName: string): string {
  const { noun, plural } = faqNoun(service);
  return `How much ${plural ? 'do' : 'does'} ${noun} cost in ${cityName}?`;
}

/** "How do I get a budget for a custom home in Boise?" */
export function cityServiceBudgetQuestion(service: { slug: string; name: string }, cityName: string): string {
  return `How do I get a budget for ${faqNoun(service).noun} in ${cityName}?`;
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

/** Published town pages, all nine of which are in the service area. */
export const TREASURE_VALLEY_CITIES = CITIES.map((c) => c.name).join(', ');

/**
 * Service area cities: the seven in Google Business Profile order (owner
 * decision, 15 November 2026), then Middleton and Garden City, which the owner
 * added on 20 November 2026 (SEO audit CON-S1: the official list is nine
 * cities). Visible
 * town lists, the footer and schema City nodes use this.
 */
export const SERVICE_AREA_SLUGS = [
  'boise',
  'meridian',
  'nampa',
  'eagle',
  'kuna',
  'caldwell',
  'star',
  'middleton',
  'garden-city',
] as const;

export const SERVICE_AREA_CITIES: CityData[] = SERVICE_AREA_SLUGS.map((slug) => {
  const city = CITIES.find((item) => item.slug === slug);
  if (!city) throw new Error(`Missing service area city: ${slug}`);
  return city;
});

/**
 * Neighboring service-area towns, nearest first, for the "Nearby areas" cards
 * on each /areas/{city} page (SEO audit CON-S1: Garden City and Middleton are
 * linked from the towns beside them, not only from the site map).
 */
export const NEARBY_CITY_SLUGS: Record<string, readonly string[]> = {
  boise: ['garden-city', 'meridian', 'eagle', 'kuna'],
  meridian: ['boise', 'eagle', 'kuna', 'nampa'],
  eagle: ['star', 'garden-city', 'boise', 'meridian'],
  nampa: ['caldwell', 'middleton', 'meridian', 'kuna'],
  kuna: ['meridian', 'nampa', 'boise'],
  star: ['eagle', 'middleton', 'meridian', 'nampa'],
  middleton: ['star', 'caldwell', 'nampa', 'eagle'],
  caldwell: ['middleton', 'nampa', 'star'],
  'garden-city': ['boise', 'eagle', 'meridian', 'star'],
};

/** Counties on the same profile. Administrative areas, not city pages. */
export const SERVICE_AREA_COUNTIES = [
  { name: 'Ada County', sameAs: 'https://en.wikipedia.org/wiki/Ada_County,_Idaho' },
  { name: 'Canyon County', sameAs: 'https://en.wikipedia.org/wiki/Canyon_County,_Idaho' },
] as const;

function joinWithAnd(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** "Boise, Meridian, ... and Garden City". Full "we serve" sentences use this. */
export const SERVICE_AREA_CITY_LIST = joinWithAnd(SERVICE_AREA_CITIES.map((city) => city.name));

/** Ada County cities in service-area order, Garden City included. */
export const ADA_COUNTY_CITY_LIST = joinWithAnd(
  SERVICE_AREA_CITIES.filter((city) => city.county === 'ada').map((city) => city.name),
);

/** Canyon County cities: Nampa, Caldwell, and Middleton. */
export const CANYON_COUNTY_CITY_LIST = joinWithAnd(
  SERVICE_AREA_CITIES.filter((city) => city.county === 'canyon').map((city) => city.name),
);

/** Cities, then the two counties, as one natural phrase. */
export const SERVICE_AREA_LINE = `${SERVICE_AREA_CITY_LIST}, in Ada County and Canyon County`;

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


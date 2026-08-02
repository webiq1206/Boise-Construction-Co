/**
 * Topical authority registry - single source of truth for hubs and content manifest.
 *
 * Rebuilt for new residential construction. The previous registry carried ten
 * remodeling hubs, four of which (kitchen, bathroom, whole-home, ROI) describe
 * work this company no longer performs, and twenty-two template-generated
 * cluster posts that differed from one another only in their nouns. Those are
 * retired rather than reworded: near-duplicate pages are a liability on a site
 * that has to re-earn its topical authority under a new subject.
 *
 * What replaced them is six hubs covering the questions someone actually asks
 * before building a house, including one - land and lots - that has no
 * remodeling equivalent at all and is the single most common reason a
 * Treasure Valley build never starts.
 *
 * Retired slugs must be redirected. See CONTENT_REDIRECTS in
 * shared/content/contentRedirects.ts, which next.config.js consumes.
 */

export type ContentType = 'pillar' | 'cluster' | 'location' | 'neighborhood' | 'master';
export type ContentStatus = 'planned' | 'draft' | 'published';

/** Default status for manifest entries - all hubs finalized */
const PUBLISHED: ContentStatus = 'published';
export type ContentRoute = 'guide' | 'blog';

export interface ContentHub {
  hubSlug: string;
  title: string;
  categoryLabel: string;
  pillarSlug: string;
  pillarRoute: ContentRoute;
  description: string;
  priorityTier: 1 | 2 | 3 | 4 | 5;
  serviceSlugs: string[];
}

export interface ContentManifestEntry {
  slug: string;
  title: string;
  hubSlug: string;
  contentType: ContentType;
  route: ContentRoute;
  status: ContentStatus;
  replacesSlug?: string;
  primaryKeyword?: string;
}

export const CONTENT_HUBS: ContentHub[] = [
  {
    hubSlug: 'home-building-costs',
    title: 'Home Building Costs',
    categoryLabel: 'Home Building Costs',
    pillarSlug: 'boise-home-building-cost-guide',
    pillarRoute: 'guide',
    description:
      'What it costs to build a house in the Treasure Valley, what moves the number, and how to set a budget that survives contact with a real bid.',
    priorityTier: 1,
    serviceSlugs: ['custom-home-builder', 'semi-custom-homes', 'build-on-your-lot'],
  },
  {
    hubSlug: 'choosing-a-builder',
    title: 'Choosing a Builder',
    categoryLabel: 'Choosing a Builder',
    pillarSlug: 'choose-home-builder-boise',
    pillarRoute: 'guide',
    description:
      'How to vet a Treasure Valley home builder, read a bid properly, and tell the difference between a low price and a short scope.',
    priorityTier: 1,
    serviceSlugs: ['custom-home-builder', 'design-build'],
  },
  {
    hubSlug: 'home-building-process',
    title: 'The Building Process',
    categoryLabel: 'The Building Process',
    pillarSlug: 'boise-home-building-process-guide',
    pillarRoute: 'guide',
    description:
      'Every stage from first drawing to final walkthrough, including Ada and Canyon County permitting, inspections, and what happens when.',
    priorityTier: 2,
    serviceSlugs: ['design-build', 'custom-home-builder'],
  },
  {
    hubSlug: 'land-and-lots',
    title: 'Land & Lots',
    categoryLabel: 'Land & Lots',
    pillarSlug: 'buying-land-to-build-boise',
    pillarRoute: 'guide',
    description:
      'Buying a buildable parcel in Ada and Canyon County: utilities, well and septic, soils, slope, access, setbacks, and what a lot really costs to build on.',
    priorityTier: 1,
    serviceSlugs: ['lot-evaluation', 'build-on-your-lot'],
  },
  {
    hubSlug: 'home-design-and-plans',
    title: 'Design & Floor Plans',
    categoryLabel: 'Design & Floor Plans',
    pillarSlug: 'custom-home-design-guide',
    pillarRoute: 'guide',
    description:
      'Floor plans, room programming, finish selections, and performance decisions that are cheap on paper and expensive after framing.',
    priorityTier: 2,
    serviceSlugs: ['home-plans-design', 'custom-home-builder', 'energy-efficient-homes'],
  },
  {
    hubSlug: 'treasure-valley-locations',
    title: 'Treasure Valley Locations',
    categoryLabel: 'Treasure Valley Locations',
    pillarSlug: 'treasure-valley-home-building-guide',
    pillarRoute: 'guide',
    description:
      'City and neighborhood guides to building a new home across Ada and Canyon County.',
    priorityTier: 1,
    serviceSlugs: ['custom-home-builder', 'semi-custom-homes', 'build-on-your-lot'],
  },
];

export const TREASURE_VALLEY_CITIES = [
  'Boise',
  'Meridian',
  'Eagle',
  'Kuna',
  'Star',
  'Middleton',
  'Nampa',
  'Caldwell',
] as const;

function hubPillar(hubSlug: string): Pick<ContentManifestEntry, 'hubSlug' | 'contentType' | 'route'> {
  const hub = CONTENT_HUBS.find((h) => h.hubSlug === hubSlug)!;
  return {
    hubSlug,
    contentType: 'pillar',
    route: hub.pillarRoute,
  };
}

function cluster(
  slug: string,
  title: string,
  hubSlug: string,
  status: ContentStatus = PUBLISHED,
  replacesSlug?: string,
): ContentManifestEntry {
  return {
    slug,
    title,
    hubSlug,
    contentType: 'cluster',
    route: 'blog',
    status,
    replacesSlug,
  };
}

function guide(
  slug: string,
  title: string,
  hubSlug: string,
  contentType: ContentType,
  status: ContentStatus = PUBLISHED,
): ContentManifestEntry {
  const hub = CONTENT_HUBS.find((h) => h.hubSlug === hubSlug)!;
  return {
    slug,
    title,
    hubSlug,
    contentType,
    route: 'guide',
    status,
  };
}

/**
 * Full content manifest.
 *
 * `replacesSlug` records the remodeling page a construction page inherits from,
 * where one existed. It is documentation of the migration, not a redirect
 * source - redirects live in shared/content/contentRedirects.ts, because many
 * retired slugs have no successor of their own and point at a hub instead.
 */
export const CONTENT_MANIFEST: ContentManifestEntry[] = [
  // Hub 1 - Costs
  { slug: 'boise-home-building-cost-guide', title: 'Boise Home Building Cost Guide', ...hubPillar('home-building-costs'), status: PUBLISHED },
  cluster('cost-to-build-a-house-boise', 'How Much Does It Cost to Build a House in Boise?', 'home-building-costs', PUBLISHED, 'whole-home-remodel-cost-boise'),
  cluster('custom-home-cost-per-square-foot-boise', 'Custom Home Cost Per Square Foot in Boise', 'home-building-costs', PUBLISHED, 'remodel-cost-per-square-foot-boise'),
  cluster('what-drives-home-building-costs-boise', 'What Actually Drives Home Building Costs in Boise', 'home-building-costs', PUBLISHED, 'what-impacts-remodeling-costs-boise'),
  cluster('how-to-budget-a-new-home-boise', 'How to Budget for a New Home in Boise', 'home-building-costs', PUBLISHED, 'how-to-budget-remodel-boise'),
  cluster('luxury-home-building-cost-boise', 'What a Luxury Home Costs to Build in Boise', 'home-building-costs', PUBLISHED, 'luxury-remodel-cost-boise'),
  cluster('build-vs-buy-boise', 'Building vs Buying a Home in the Treasure Valley', 'home-building-costs', PUBLISHED, 'remodeling-vs-moving'),
  cluster('construction-loan-basics-idaho', 'How Construction Loans Work in Idaho', 'home-building-costs'),
  cluster('allowances-explained-new-home', 'How Allowances Work in a New Home Contract', 'home-building-costs'),

  // Hub 2 - Choosing a builder
  { slug: 'choose-home-builder-boise', title: 'How to Choose a Home Builder in Boise', ...hubPillar('choosing-a-builder'), status: PUBLISHED },
  cluster('questions-to-ask-a-home-builder', 'Questions to Ask a Home Builder Before You Sign', 'choosing-a-builder', PUBLISHED, 'questions-to-ask-remodeling-contractor'),
  cluster('home-builder-red-flags', 'Home Builder Red Flags', 'choosing-a-builder', PUBLISHED, 'remodeling-contractor-red-flags'),
  cluster('design-build-vs-general-contractor', 'Design-Build vs General Contractor', 'choosing-a-builder'),
  cluster('how-to-compare-builder-bids', 'How to Compare Home Builder Bids', 'choosing-a-builder', PUBLISHED, 'how-to-compare-remodeling-estimates'),
  cluster('why-home-building-bids-vary', 'Why Home Building Bids Vary So Much', 'choosing-a-builder', PUBLISHED, 'why-remodeling-bids-vary'),
  cluster('fixed-price-vs-cost-plus', 'Fixed Price vs Cost Plus', 'choosing-a-builder'),
  cluster('production-vs-custom-home-builder', 'Production Builder vs Custom Builder', 'choosing-a-builder'),

  // Hub 3 - Process
  { slug: 'boise-home-building-process-guide', title: 'The Boise Home Building Process', ...hubPillar('home-building-process'), status: PUBLISHED },
  cluster('how-long-does-it-take-to-build-a-house-boise', 'How Long Does It Take to Build a House in Boise?', 'home-building-process', PUBLISHED, 'whole-home-remodel-timeline'),
  cluster('boise-building-permit-guide', 'Building Permits in Boise: What a New Home Needs', 'home-building-process', PUBLISHED, 'boise-permit-guide'),
  cluster('ada-vs-canyon-county-permit-timelines', 'Ada vs Canyon County Permit Timelines', 'home-building-process'),
  cluster('stages-of-building-a-house', 'The Stages of Building a House, in Order', 'home-building-process', PUBLISHED, 'construction-phase-guide'),
  cluster('choosing-finishes-for-a-new-home', 'Choosing Finishes for a New Home', 'home-building-process', PUBLISHED, 'material-selection-guide'),
  cluster('new-home-walkthrough-and-warranty', 'The Final Walkthrough and What the Warranty Covers', 'home-building-process', PUBLISHED, 'punch-list-guide'),
  cluster('first-meeting-with-a-home-builder', 'What Happens at Your First Meeting With a Builder', 'home-building-process', PUBLISHED, 'consultation-process-remodeling'),

  // Hub 4 - Land and lots
  { slug: 'buying-land-to-build-boise', title: 'Buying Land to Build On in the Treasure Valley', ...hubPillar('land-and-lots'), status: PUBLISHED },
  cluster('how-to-buy-a-buildable-lot-boise', 'How to Tell If a Lot Is Actually Buildable', 'land-and-lots'),
  cluster('well-and-septic-cost-idaho', 'What a Well and Septic System Costs in Idaho', 'land-and-lots'),
  cluster('lot-evaluation-checklist', 'Lot Evaluation Checklist: 14 Things to Check Before You Buy', 'land-and-lots'),
  cluster('building-in-the-boise-foothills', 'What It Costs to Build in the Boise Foothills', 'land-and-lots'),
  cluster('impact-fees-and-utility-connections', 'Impact Fees and Utility Connections in Ada and Canyon County', 'land-and-lots'),

  // Hub 5 - Design and plans
  { slug: 'custom-home-design-guide', title: 'Designing a Custom Home in the Treasure Valley', ...hubPillar('home-design-and-plans'), status: PUBLISHED },
  cluster('custom-home-floor-plan-ideas-boise', 'Floor Plan Ideas That Work in Treasure Valley Homes', 'home-design-and-plans', PUBLISHED, 'kitchen-layout-ideas-boise-homes'),
  cluster('single-story-vs-two-story-home', 'Single Story vs Two Story: Cost, Lot, and Livability', 'home-design-and-plans'),
  cluster('adu-cost-boise', 'ADU Cost in Boise', 'home-design-and-plans'),
  cluster('multigenerational-home-design', 'Designing a Home for Multiple Generations', 'home-design-and-plans', PUBLISHED, 'multigenerational-living-remodels'),
  cluster('aging-in-place-home-design', 'Building a Home You Can Age In', 'home-design-and-plans', PUBLISHED, 'aging-in-place-bathroom-design'),
  cluster('energy-efficient-home-building-boise', 'Building an Energy-Efficient Home in Boise', 'home-design-and-plans', PUBLISHED, 'energy-efficiency-roi'),
  cluster('shop-homes-and-barndominiums-idaho', 'Shop Homes and Barndominiums in Idaho', 'home-design-and-plans'),
  cluster('covered-outdoor-living-new-home', 'Designing Covered Outdoor Living Into a New Home', 'home-design-and-plans', PUBLISHED, 'covered-patios-boise'),

  // Hub 6 - Locations
  guide('treasure-valley-home-building-guide', 'Treasure Valley Home Building Guide', 'treasure-valley-locations', 'master', PUBLISHED),
  guide('boise-home-building-guide', 'Building a Home in Boise', 'treasure-valley-locations', 'location', PUBLISHED),
  guide('meridian-home-building-guide', 'Building a Home in Meridian', 'treasure-valley-locations', 'location'),
  guide('eagle-home-building-guide', 'Building a Home in Eagle', 'treasure-valley-locations', 'location'),
  guide('kuna-home-building-guide', 'Building a Home in Kuna', 'treasure-valley-locations', 'location'),
  guide('star-home-building-guide', 'Building a Home in Star', 'treasure-valley-locations', 'location'),
  guide('middleton-home-building-guide', 'Building a Home in Middleton', 'treasure-valley-locations', 'location'),
  guide('nampa-home-building-guide', 'Building a Home in Nampa', 'treasure-valley-locations', 'location'),
  guide('caldwell-home-building-guide', 'Building a Home in Caldwell', 'treasure-valley-locations', 'location'),
  guide('eagle-foothills-home-building-guide', 'Building in the Eagle Foothills', 'treasure-valley-locations', 'neighborhood'),
  guide('hidden-springs-home-building-guide', 'Building in Hidden Springs', 'treasure-valley-locations', 'neighborhood'),
  guide('harris-ranch-home-building-guide', 'Building in Harris Ranch', 'treasure-valley-locations', 'neighborhood'),
];

export function getHubBySlug(hubSlug: string): ContentHub | undefined {
  return CONTENT_HUBS.find((h) => h.hubSlug === hubSlug);
}

export function getManifestBySlug(slug: string): ContentManifestEntry | undefined {
  return CONTENT_MANIFEST.find((e) => e.slug === slug);
}

export function getPublishedManifest(route?: ContentRoute): ContentManifestEntry[] {
  return CONTENT_MANIFEST.filter(
    (e) => e.status === 'published' && (route === undefined || e.route === route),
  );
}

export function getClustersForHub(hubSlug: string, publishedOnly = false): ContentManifestEntry[] {
  return CONTENT_MANIFEST.filter(
    (e) =>
      e.hubSlug === hubSlug &&
      e.contentType === 'cluster' &&
      (!publishedOnly || e.status === 'published'),
  );
}

export function getHubPillarSlug(hubSlug: string): string {
  return getHubBySlug(hubSlug)?.pillarSlug ?? '';
}

export function guidePath(slug: string): string {
  return `/guides/${slug}`;
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

export function categoryHubPath(hubSlug: string): string {
  return `/blog/category/${hubSlug}`;
}

/** Minimum published cluster count before category hub is indexable */
export const CATEGORY_HUB_MIN_POSTS = 3;

export function isCategoryHubIndexable(hubSlug: string, publishedClusterCount: number): boolean {
  return publishedClusterCount >= CATEGORY_HUB_MIN_POSTS;
}

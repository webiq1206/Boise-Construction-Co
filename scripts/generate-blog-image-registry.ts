/**
 * Generates shared/blogImageRegistry.ts from the content layer.
 *
 * The previous version of this script hard-coded a slug-to-image map that had
 * to be edited by hand every time a post was added, which is how it ended up
 * describing a set of articles that no longer existed. This one reads the
 * actual posts and guides and assigns each an image by topic, so the registry
 * cannot drift from the content again.
 *
 * Assignment is by explicit slug override first, then by hub. Several posts
 * legitimately share an image: there are more articles than there are distinct
 * things worth photographing about building a house, and a topically correct
 * shared photograph is better than a unique wrong one. verify:images reports
 * shared heroes as a quality note rather than an error for that reason.
 *
 * Run: npx tsx scripts/generate-blog-image-registry.ts
 */
import fs from 'fs';
import path from 'path';
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import { CONTENT_HUBS } from '../shared/contentHubs';

const root = path.join(__dirname, '..');

const img = (name: string) => `/images/construction/${name}.webp`;

/** The construction image library, with the alt text each image warrants. */
const LIBRARY = {
  customHome: {
    src: img('custom-home-exterior'),
    alt: 'Newly completed custom home with board-and-batten siding and a covered porch on a Treasure Valley lot',
  },
  semiCustom: {
    src: img('semi-custom-home'),
    alt: 'Newly built single-story semi-custom home on a serviced subdivision lot in Meridian, Idaho',
  },
  framing: {
    src: img('home-under-framing'),
    alt: 'New house under construction with wall framing and roof trusses in place on an Idaho building site',
  },
  foundation: {
    src: img('foundation-and-excavation'),
    alt: 'Freshly poured concrete foundation and stem walls outlining a new home on a flat valley lot',
  },
  roughIn: {
    src: img('mechanical-rough-in'),
    alt: 'Open stud walls with plumbing, electrical, and ductwork roughed in before drywall in a new home',
  },
  insulation: {
    src: img('insulation-and-air-sealing'),
    alt: 'Wall cavities insulated and air sealed in a new Idaho home before drywall goes up',
  },
  interior: {
    src: img('new-home-interior'),
    alt: 'Finished great room in a new custom home with vaulted ceiling, stone fireplace, and foothills views',
  },
  kitchen: {
    src: img('new-home-kitchen'),
    alt: 'Newly completed kitchen in a custom home with a quartz island and full-height tile backsplash',
  },
  lot: {
    src: img('buildable-lot'),
    alt: 'Vacant buildable lot on the Treasure Valley floor with a survey stake, power line, and irrigation ditch',
  },
  foothills: {
    src: img('foothills-building-site'),
    alt: 'Terraced building pad cut into a Boise foothills hillside with a boulder retaining wall and access road',
  },
  ruralSite: {
    src: img('rural-site-work'),
    alt: 'Well drilling rig and septic drainfield excavation underway on a rural Idaho building site',
  },
  plans: {
    src: img('plans-and-selections'),
    alt: 'Residential floor plan and elevation drawings laid out with flooring, countertop, and paint samples',
  },
  budget: {
    src: img('line-item-budget'),
    alt: 'Line-item construction budget and draw schedule on a desk beside a wooden architectural model',
  },
  meeting: {
    src: img('site-meeting'),
    alt: 'Builder reviewing plans with homeowners in front of a partially framed house on an Idaho site',
  },
  outdoor: {
    src: img('covered-outdoor-living'),
    alt: 'Deep covered patio with a timber ceiling and outdoor kitchen attached to a newly built Idaho home',
  },
  shopHome: {
    src: img('shop-home-barndominium'),
    alt: 'Shop home combining a finished living wing with an attached shop under one metal roof on Idaho acreage',
  },
} as const;

type LibraryKey = keyof typeof LIBRARY;

/** Fallback per hub, used for any slug without an explicit assignment. */
const HUB_DEFAULT: Record<string, LibraryKey> = {
  'home-building-costs': 'budget',
  'choosing-a-builder': 'meeting',
  'home-building-process': 'framing',
  'land-and-lots': 'lot',
  'home-design-and-plans': 'plans',
  'treasure-valley-locations': 'customHome',
};

/**
 * Slug-level assignments. Anything not listed here falls back to its hub
 * default, which is why only the posts with a genuinely better-matched image
 * need to appear.
 */
const BY_SLUG: Record<string, LibraryKey> = {
  // Costs
  'cost-to-build-a-house-boise': 'customHome',
  'custom-home-cost-per-square-foot-boise': 'framing',
  'what-drives-home-building-costs-boise': 'foundation',
  'luxury-home-building-cost-boise': 'interior',
  'build-vs-buy-boise': 'semiCustom',
  'allowances-explained-new-home': 'kitchen',

  // Choosing a builder
  'questions-to-ask-a-home-builder': 'plans',
  'design-build-vs-general-contractor': 'customHome',
  'production-vs-custom-home-builder': 'semiCustom',
  'fixed-price-vs-cost-plus': 'budget',

  // Process
  'stages-of-building-a-house': 'foundation',
  'boise-building-permit-guide': 'plans',
  'ada-vs-canyon-county-permit-timelines': 'plans',
  'choosing-finishes-for-a-new-home': 'kitchen',
  'new-home-walkthrough-and-warranty': 'interior',
  'first-meeting-with-a-home-builder': 'meeting',
  'how-long-does-it-take-to-build-a-house-boise': 'roughIn',

  // Land and lots
  'well-and-septic-cost-idaho': 'ruralSite',
  'building-in-the-boise-foothills': 'foothills',
  'impact-fees-and-utility-connections': 'ruralSite',

  // Design and plans
  'single-story-vs-two-story-home': 'semiCustom',
  'energy-efficient-home-building-boise': 'insulation',
  'shop-homes-and-barndominiums-idaho': 'shopHome',
  'covered-outdoor-living-new-home': 'outdoor',
  'custom-home-floor-plan-ideas-boise': 'plans',
  'aging-in-place-home-design': 'interior',
  'multigenerational-home-design': 'customHome',
  'adu-cost-boise': 'semiCustom',

  // Pillars
  'boise-home-building-cost-guide': 'budget',
  'choose-home-builder-boise': 'meeting',
  'boise-home-building-process-guide': 'framing',
  'buying-land-to-build-boise': 'lot',
  'custom-home-design-guide': 'plans',
  'treasure-valley-home-building-guide': 'customHome',

  // Location guides
  'boise-home-building-guide': 'customHome',
  'meridian-home-building-guide': 'semiCustom',
  'eagle-home-building-guide': 'interior',
  'kuna-home-building-guide': 'ruralSite',
  'star-home-building-guide': 'lot',
  'middleton-home-building-guide': 'foundation',
  'nampa-home-building-guide': 'semiCustom',
  'caldwell-home-building-guide': 'lot',
  'eagle-foothills-home-building-guide': 'foothills',
  'hidden-springs-home-building-guide': 'customHome',
  'harris-ranch-home-building-guide': 'interior',
};

const HUB_HERO: Record<string, LibraryKey> = HUB_DEFAULT;

interface Entry {
  hero: string;
  alt: string;
  topicTags: string[];
  hubSlug: string;
}

const entries: Record<string, Entry> = {};
const unmatched: string[] = [];

function add(slug: string, hubSlug: string, tags: string[]) {
  const key = BY_SLUG[slug] ?? HUB_DEFAULT[hubSlug];
  if (!key) {
    unmatched.push(`${slug} (hub ${hubSlug})`);
    return;
  }
  const image = LIBRARY[key];
  entries[slug] = {
    hero: image.src,
    alt: image.alt,
    // Tags are the post's own plus the hub, which is what the relevance check
    // in verify:images compares against.
    topicTags: Array.from(new Set([...tags, hubSlug.split('-')[0]])).slice(0, 5),
    hubSlug,
  };
}

for (const post of BLOG_POSTS) add(post.slug, post.hubSlug, post.tags);
for (const guide of GUIDE_PAGES) add(guide.slug, guide.hubSlug, guide.tags);

if (unmatched.length > 0) {
  console.error('No image assignment for:');
  unmatched.forEach((u) => console.error(`  - ${u}`));
  process.exit(1);
}

// Every referenced file must actually exist, or the site ships broken images.
const missing = new Set<string>();
for (const entry of Object.values(entries)) {
  const filePath = path.join(root, 'public', entry.hero.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) missing.add(entry.hero);
}
for (const key of Object.values(HUB_HERO)) {
  const filePath = path.join(root, 'public', LIBRARY[key].src.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) missing.add(LIBRARY[key].src);
}
if (missing.size > 0) {
  console.error('Referenced image files do not exist:');
  missing.forEach((m) => console.error(`  - ${m}`));
  process.exit(1);
}

const registryBody = Object.entries(entries)
  .map(
    ([slug, e]) => `  '${slug}': {
    hero: '${e.hero}',
    alt: '${e.alt.replace(/'/g, "\\'")}',
    topicTags: ${JSON.stringify(e.topicTags)},
    source: 'construction',
  },`,
  )
  .join('\n');

const hubBody = CONTENT_HUBS.map(
  (h) => `  '${h.hubSlug}': '${LIBRARY[HUB_HERO[h.hubSlug]].src}',`,
).join('\n');

const ts = `/**
 * Per-slug hero imagery for blog posts and guides.
 *
 * Generated by scripts/generate-blog-image-registry.ts from the content layer.
 * Do not hand-edit. Change the assignment table in that script and re-run
 * \`npm run images:blog\`.
 */

export type BlogImageSource = 'construction';

export interface BlogImageEntry {
  hero: string;
  thumbnail?: string;
  alt: string;
  topicTags: string[];
  source: BlogImageSource;
}

export const BLOG_IMAGE_REGISTRY: Record<string, BlogImageEntry> = {
${registryBody}
};

export const HUB_HERO_IMAGES: Record<string, string> = {
${hubBody}
};

/** Retained for the setup script's interface; nothing is copied any more. */
export const BLOG_ASSET_COPY_MAP: Record<string, string> = {};
`;

fs.writeFileSync(path.join(root, 'shared', 'blogImageRegistry.ts'), ts);
console.log(
  `Wrote blogImageRegistry.ts: ${Object.keys(entries).length} entries, ${CONTENT_HUBS.length} hub heroes.`,
);

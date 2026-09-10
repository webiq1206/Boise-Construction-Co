import {
  BLOG_IMAGE_REGISTRY,
  HUB_HERO_IMAGES,
  type BlogImageEntry,
} from './blogImageRegistry';
import { SITE_IMAGES } from './siteImages';

const DEFAULT_BLOG_IMAGE = SITE_IMAGES.hero;

export function getBlogImageEntry(slug: string): BlogImageEntry | undefined {
  return BLOG_IMAGE_REGISTRY[slug];
}

export function getBlogImageForSlug(
  slug: string,
  variant: 'hero' | 'thumbnail' = 'hero',
  override?: string,
): string {
  if (override) return override;
  const entry = BLOG_IMAGE_REGISTRY[slug];
  if (!entry) return DEFAULT_BLOG_IMAGE;
  if (variant === 'thumbnail' && entry.thumbnail) return entry.thumbnail;
  return entry.hero;
}

export function getBlogImageAlt(slug: string): string {
  return BLOG_IMAGE_REGISTRY[slug]?.alt ?? 'Boise Construction Co new home construction';
}

export function getBlogHeroImage(
  slug: string,
  override?: string,
): string {
  return getBlogImageForSlug(slug, 'hero', override);
}

export function getBlogThumbnail(
  slug: string,
  override?: string,
): string {
  return getBlogImageForSlug(slug, 'thumbnail', override);
}

export function getHubHeroImage(hubSlug: string): string {
  return HUB_HERO_IMAGES[hubSlug] ?? DEFAULT_BLOG_IMAGE;
}

/** True for cost guides, cost hub articles, and slug/topic-tagged cost content. */
export function isCostRelatedContent(slug: string, hubSlug?: string): boolean {
  if (hubSlug === 'home-building-costs') return true;
  const entry = BLOG_IMAGE_REGISTRY[slug];
  if (entry?.topicTags.includes('cost')) return true;
  return slug.includes('cost');
}

export function getAbsoluteImageUrl(path: string, baseUrl: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface ArticleInlineFigurePlacement {
  afterSectionIndex: number;
  src: string;
  alt: string;
  caption?: string;
}

/**
 * Editorial inline figures for long articles - inserted after key H2 sections
 * to break up text-heavy content (Phase 4).
 */
const INLINE_HUB_ALTS: Record<string, string> = {
  "home-building-costs": "Representative line-item home building budget and plans",
  "choosing-a-builder": "Representative Boise Construction Co builder meeting homeowners at a framed home",
  "home-building-process": "Representative new home during wood framing",
  "land-and-lots": "Representative open residential building lot",
  "home-design-and-plans": "Home plans and finish samples arranged for design review",
  "treasure-valley-locations": "Representative custom home exterior with Treasure Valley foothills"
};

export function getArticleInlineFigures(
  slug: string,
  sectionCount: number,
  hubSlug?: string,
): ArticleInlineFigurePlacement[] {
  if (sectionCount < 4) return [];

  const entry = BLOG_IMAGE_REGISTRY[slug];
  const primarySrc = entry?.hero ?? DEFAULT_BLOG_IMAGE;

  // The article hero already establishes the setting. Avoid repeating it in the body.
  const figures: ArticleInlineFigurePlacement[] = [];

  if (sectionCount >= 6 && hubSlug) {
    const hubHero = getHubHeroImage(hubSlug);
    if (hubHero !== primarySrc) {
      figures.push({
        afterSectionIndex: Math.floor(sectionCount / 2),
        src: hubHero,
        alt: Object.values(BLOG_IMAGE_REGISTRY).find((image) => image.hero === hubHero)?.alt
          ?? INLINE_HUB_ALTS[hubSlug] ?? `Representative ${hubSlug.replace(/-/g, ' ')} imagery`,
        caption: 'Representative imagery for this guide.',
      });
    }
  }

  return figures;
}

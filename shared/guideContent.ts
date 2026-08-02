/**
 * Guide pages: the six hub pillars plus the twelve city and neighborhood
 * guides under the locations hub.
 *
 * Pillars are hand-written, one file per pillar in ./content/pillars, and
 * collected by a generated barrel. Location guides are assembled in
 * ./content/locationGuides from per-place prose.
 */
import { PILLAR_GUIDES } from './content/pillars';
import { LOCATION_GUIDES } from './content/locationGuides';

export type GuideType = 'hub-pillar' | 'location' | 'neighborhood' | 'master';

export interface GuidePageData {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  author: string;
  hubSlug: string;
  guideType: GuideType;
  tags: string[];
  publishedAt: string;
  /** Last substantive revision date (ISO). Feeds Article dateModified. */
  updatedAt?: string;
  heroImage?: string;
  quickAnswer?: string;
  keyTakeaways?: string[];
  faqs: Array<{ question: string; answer: string }>;
  linkedClusterSlugs?: string[];
  linkedServices?: string[];
  linkedCities?: string[];
  relatedLinks?: Array<{ url: string; anchor?: string }>;
  primaryKeyword?: string;
}


export const GUIDE_PAGES: GuidePageData[] = [...PILLAR_GUIDES, ...LOCATION_GUIDES];

export function getGuideBySlug(slug: string): GuidePageData | undefined {
  return GUIDE_PAGES.find((g) => g.slug === slug);
}
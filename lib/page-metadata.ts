import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/shared/siteConfig';
import {
  generateCityServiceDescription,
  generateCityServiceTitle,
  generateMetaDescription,
  generatePageTitle,
  generateSafePageTitle,
  getBaseUrl,
  getDefaultOgImage,
} from './seo';


export type PageMetaKind =
  | 'home'
  | 'service'
  | 'area'
  | 'city-service'
  | 'about'
  | 'contact'
  | 'blog'
  | 'blog-post';

export interface PageMetaInput {
  kind: PageMetaKind;
  serviceName?: string;
  serviceSlug?: string;
  cityName?: string;
  citySlug?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  path: string;
  /**
   * When true, emit `robots: { index: false, follow: true }`. Used for
   * doorway-risk city x service combos that lack defensible local content or
   * proof (see seo-audit/doorway-page-analysis.md). The page stays crawlable
   * and keeps its internal-link value but is kept out of the index until it
   * earns unique local substance.
   */
  noindex?: boolean;
}

/**
 * City x service combos flagged as doorway risk. These are secondary services
 * in the smallest markets, where the copy is most generic and there is no local
 * proof or pillar support, plus shop homes in Boise proper where lot sizes and
 * zoning make the service largely implausible. Toggle entries off here once a
 * combo earns unique local content. Keyed as `${serviceSlug}/${citySlug}`.
 */
export const NOINDEX_CITY_SERVICE = new Set<string>([
  'lot-evaluation/kuna',
  'lot-evaluation/star',
  'lot-evaluation/middleton',
  'lot-evaluation/caldwell',
  'energy-efficient-homes/kuna',
  'energy-efficient-homes/star',
  'energy-efficient-homes/middleton',
  'energy-efficient-homes/caldwell',
  'shop-homes-barndominiums/boise',
]);

export function isCityServiceNoindex(serviceSlug: string, citySlug: string): boolean {
  return NOINDEX_CITY_SERVICE.has(`${serviceSlug}/${citySlug}`);
}

export function buildCanonical(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Both the current brand and the pre-rebrand one. The old name is still in the
 * list because a title override that predates the rebrand would otherwise slip
 * the wrong brand into a rendered <title> alongside the appended right one.
 */
const BRAND_SUFFIXES = [SITE_CONFIG.name, 'Boise Remodeling Co'];

/**
 * Site-wide feed discovery. Declared beside the canonical because Next replaces
 * the whole `alternates` object per page, so a root-only declaration would be
 * dropped on every page that sets its own canonical.
 */
export const FEED_ALTERNATES = {
  'application/rss+xml': [
    { url: '/feed.xml', title: `${SITE_CONFIG.name} | Home Building Guides and Insights` },
  ],
};

/**
 * Remove a trailing brand suffix (one or more times) from a title. The root
 * layout template appends the brand exactly once, so child titles must not
 * carry it themselves or it doubles in the rendered <title>.
 */
export function stripBrandSuffix(title: string): string {
  let result = title.trim();
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const brand of BRAND_SUFFIXES) {
      const suffix = `| ${brand}`;
      if (result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length).trim();
        stripped = true;
      }
    }
  }
  return result;
}

/**
 * Concise, intentional service-parent titles. Each is <= 36 chars so the final
 * rendered title (after the layout appends " | Boise Construction Co", 24
 * characters) stays <= 60.
 *
 * Without an override these fall back to "<name> in the Treasure Valley",
 * which overruns the title budget and word-truncates to "... in the".
 */
const SERVICE_TITLE_OVERRIDES: Record<string, string> = {
  'custom-home-builder': 'Treasure Valley Custom Home Builder',
  'semi-custom-homes': 'Treasure Valley Semi-Custom Homes',
  'build-on-your-lot': 'Build on Your Lot in Idaho',
  'design-build': 'Treasure Valley Design-Build Homes',
  'home-plans-design': 'Custom Home Plans & Design, Idaho',
  'home-additions': 'Home Additions in the Treasure Valley',
  'lot-evaluation': 'Lot Evaluation & Feasibility, Idaho',
  'shop-homes-barndominiums': 'Idaho Shop Homes & Barndominiums',
  'energy-efficient-homes': 'Energy-Efficient Homes in Idaho',
};

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const base = getBaseUrl();
  const canonical = buildCanonical(input.path);

  let title: string;
  let description: string;

  switch (input.kind) {
    case 'home':
      title = generatePageTitle({ serviceName: '', serviceSlug: '', isHomePage: true });
      description = generateMetaDescription({ serviceName: '', serviceSlug: '', isHomePage: true });
      break;
    case 'service':
      // Intentional, full titles (no truncation/ellipsis). Each stays <= 60
      // chars once the layout template appends " | Boise Construction Co" (24).
      title =
        SERVICE_TITLE_OVERRIDES[input.serviceSlug ?? ''] ??
        generateSafePageTitle(`${input.serviceName} in the Treasure Valley`);
      description = generateMetaDescription({
        serviceName: input.serviceName!,
        serviceSlug: input.serviceSlug!,
      });
      break;
    case 'area':
      // "Home Builder in Middleton, Idaho" is the longest at 32 chars, so no
      // city name pushes this past the 36-char budget or triggers truncation.
      title = generateSafePageTitle(`Home Builder in ${input.cityName}, Idaho`);
      description = generateMetaDescription({
        serviceName: '',
        serviceSlug: '',
        city: input.cityName,
        citySlug: input.citySlug,
      });
      break;
    case 'city-service':
      title = generateCityServiceTitle(input.serviceName!, input.cityName!);
      description = generateCityServiceDescription(
        input.serviceName!,
        input.cityName!,
      );
      break;
    case 'about':
      title = 'About Us';
      description =
        `Learn about ${SITE_CONFIG.name}, a Treasure Valley design-build home builder. Bonded, insured, and committed to line-item budgets and clear communication.`;
      break;
    case 'contact':
      title = 'Contact Us';
      description =
        `Contact ${SITE_CONFIG.name} for a free planning consultation. Call ${SITE_CONFIG.phone} or schedule online. Serving Boise, Meridian, Eagle & the Treasure Valley.`;
      break;
    case 'blog':
      title = 'Home Building Insights & Ideas';
      description =
        `Honest home building advice for Idaho: budgets, lot selection, permits, timelines, and design-build guidance from ${SITE_CONFIG.name}.`;
      break;
    default:
      title = input.titleOverride || SITE_CONFIG.name;
      description = input.descriptionOverride || '';
  }

  if (input.titleOverride) title = input.titleOverride;
  if (input.descriptionOverride) description = input.descriptionOverride;

  // The root layout template appends the brand; ensure the child title never
  // carries it itself (prevents a duplicated brand in the rendered <title>).
  title = stripBrandSuffix(title);

  const ogImage = getDefaultOgImage();

  return {
    title,
    description,
    alternates: { canonical, types: FEED_ALTERNATES },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * SEO Utilities for Boise Construction Co
 * Generates optimized meta tags, titles, and descriptions
 * for service and location pages
 */

import { SITE_CONFIG } from '@/shared/siteConfig';
import { CITIES, SERVICES } from '@/shared/contentData';
import {
  AREA_META_DESCRIPTIONS,
  CITY_SERVICE_META_DESCRIPTIONS,
  SERVICE_META_DESCRIPTIONS,
} from '@/shared/metaDescriptions';
import { GBP_SOCIAL, getExternalProfileUrls } from '@/shared/gbpProfile';

interface SEOMetaData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
}

interface ServiceSEOParams {
  serviceName: string;
  serviceSlug: string;
  city?: string;
  citySlug?: string;
  isHomePage?: boolean;
}

/**
 * Intelligently truncate service name while keeping key words
 * Works on whole words to avoid breaking legitimate terms
 */
function truncateServiceName(serviceName: string, maxLength: number): string {
  if (serviceName.length <= maxLength) return serviceName;
  
  // Split into words
  const words = serviceName.split(' ');
  
  // Remove low-value filler words first (whole word removal only)
  const fillerWords = ['&', 'and', 'or', 'the', 'of', 'for', 'with', 'in', 'a', 'an'];
  let importantWords = words.filter(word => !fillerWords.includes(word.toLowerCase()));
  
  // Rebuild and check length
  let shortened = importantWords.join(' ');
  if (shortened.length <= maxLength) return shortened;
  
  // If still too long, remove words from end until it fits
  while (importantWords.length > 1 && shortened.length > maxLength) {
    importantWords.pop();
    shortened = importantWords.join(' ');
  }
  
  // If single word is too long, truncate it cleanly
  if (shortened.length > maxLength) {
    return shortened.substring(0, maxLength);
  }
  
  return shortened;
}

/** Brand suffix used in title budgeting; read from config so it stays in sync. */
const BRAND = SITE_CONFIG.name;

/**
 * Generate SEO-optimized page title
 * Format: "[Service] in [City], ID | Boise Construction Co | Free Quotes"
 * Max 60 characters for optimal Google display
 * GUARANTEED ≤60 chars through intelligent truncation
 */
export function generatePageTitle(params: ServiceSEOParams): string {
  const { serviceName, city, isHomePage } = params;

  if (isHomePage) {
    return `${BRAND} | Custom Home Builder`;
  }

  if (city && serviceName) {
    // Full formula: "[Service] in [City], ID | Boise Construction Co | Free Quotes"
    const fullTitle = `${serviceName} in ${city}, ID | ${BRAND} | Free Quotes`;

    if (fullTitle.length <= 60) {
      return fullTitle;
    }

    // Level 2: Drop "Free Quotes"
    const mediumTitle = `${serviceName} in ${city}, ID | ${BRAND}`;
    if (mediumTitle.length <= 60) {
      return mediumTitle;
    }

    // Level 3: Shorten brand
    const shortTitle = `${serviceName} in ${city}, ID | Home Builder`;
    if (shortTitle.length <= 60) {
      return shortTitle;
    }

    const maxServiceLength = 60 - ` in ${city}, ID | Home Builder`.length;
    const truncatedService = truncateServiceName(serviceName, maxServiceLength);
    return `${truncatedService} in ${city}, ID | Home Builder`;
  }

  if (city) {
    const fullTitle = `Home Builder in ${city}, ID | ${BRAND}`;
    if (fullTitle.length <= 60) {
      return fullTitle;
    }
    return `Home Builder in ${city}, ID`;
  }

  // Service-only title (defaults to Kuna as home base)
  if (!serviceName) {
    return `${BRAND} | Custom Home Builder`;
  }

  const fullTitle = `${serviceName} | ${BRAND} | Free Quotes`;
  if (fullTitle.length <= 60) {
    return fullTitle;
  }

  const mediumTitle = `${serviceName} | ${BRAND}`;
  if (mediumTitle.length <= 60) {
    return mediumTitle;
  }

  // Truncate service name intelligently
  const maxServiceLength = 60 - ` | ${BRAND}`.length;
  const truncatedService = truncateServiceName(serviceName, maxServiceLength);
  return `${truncatedService} | ${BRAND}`;
}

/**
 * Lowercase a service name for use mid-sentence while keeping acronyms intact:
 * "ADUs & Guest Houses" -> "ADUs & guest houses", never "adus & guest houses".
 */
export function serviceNameInSentence(name: string): string {
  return name
    .split(' ')
    .map((word) => (/^[A-Z]{2,}s?$/.test(word) ? word : word.toLowerCase()))
    .join(' ');
}

/** Capitalize the first letter so a description never starts lowercase. */
function sentenceStart(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Meta description budget. Google shows roughly 155 to 160 characters on
 * desktop; 155 keeps the closing words visible. 140 is the floor for authored
 * descriptions so the snippet carries the keyword and a reason to click.
 * scripts/verify-meta-descriptions.ts enforces both in prebuild.
 */
export const META_DESCRIPTION_MIN = 140;
export const META_DESCRIPTION_MAX = 155;

/**
 * First candidate inside the 140 to 155 band, else the longest one that fits
 * 155, else the shortest. Generated descriptions never carry a phone number or
 * an exclamation mark: the verifier fails the build if one does.
 */
export function fitMetaDescription(candidates: string[]): string {
  const clean = candidates.map((c) => c.replace(/\s+/g, ' ').trim());
  const inBand = clean.find((c) => c.length >= META_DESCRIPTION_MIN && c.length <= META_DESCRIPTION_MAX);
  if (inBand) return inBand;
  const fitting = clean.filter((c) => c.length <= META_DESCRIPTION_MAX).sort((a, b) => b.length - a.length);
  if (fitting.length) return fitting[0];
  return [...clean].sort((a, b) => a.length - b.length)[0];
}

function serviceSlugFor(serviceName: string): string | undefined {
  return SERVICES.find((s) => s.name === serviceName)?.slug;
}

function citySlugFor(cityName: string): string | undefined {
  return CITIES.find((c) => c.name === cityName)?.slug;
}

/** Service phrase as searched: "Detached ADUs and guest houses", "Structural home additions". */
const SERVICE_SEARCH_PHRASES: Record<string, string> = {
  adu: 'Detached ADUs and guest houses',
  'home-additions': 'Structural home additions',
  'shop-homes-barndominiums': 'Barndominium and shop homes',
  'lot-evaluation': 'Building lot evaluation',
};

function serviceSearchPhrase(serviceName: string): string {
  const slug = serviceSlugFor(serviceName);
  return (slug && SERVICE_SEARCH_PHRASES[slug]) || sentenceStart(serviceNameInSentence(serviceName).replace(/ & /g, ' and '));
}

/**
 * Meta description for a service parent, an area page or (with both a service
 * and a city) a city x service page. Authored copy in
 * shared/metaDescriptions.ts wins; anything not listed there gets a
 * keyword-first sentence built from the service's own short description, so a
 * new service or city can never fall back to a phone-number formula.
 */
export function generateMetaDescription(params: ServiceSEOParams): string {
  const { serviceName, city } = params;

  if (params.isHomePage) {
    return fitMetaDescription([
      `Custom home builder in Boise, Idaho. ${BRAND} designs and builds custom and semi-custom homes across the Treasure Valley, with a line-item budget first.`,
    ]);
  }

  if (city && serviceName) return generateCityServiceDescription(serviceName, city);

  if (city) {
    const authored = AREA_META_DESCRIPTIONS[citySlugFor(city) ?? ''];
    if (authored) return authored;
    return fitMetaDescription([
      `Home builder in ${city}, Idaho: custom homes, semi-custom plans and homes on land you already own, with lot evaluation, permits and site costs checked first.`,
      `Home builder in ${city}, Idaho: custom homes, semi-custom plans and homes on land you already own, with site costs and permits checked before design.`,
      `Home builder in ${city}, Idaho: custom and semi-custom homes and builds on your own lot, with one design-build team from the lot to the keys.`,
    ]);
  }

  if (!serviceName) {
    return fitMetaDescription([
      `New home builder in Boise and the Treasure Valley. ${BRAND} designs and builds custom and semi-custom homes, with a line-item budget before we build.`,
    ]);
  }

  const authored = SERVICE_META_DESCRIPTIONS[serviceSlugFor(serviceName) ?? ''];
  if (authored) return authored;
  const service = serviceSearchPhrase(serviceName);
  const detail = SERVICES.find((s) => s.name === serviceName)?.shortDescription ?? '';
  return fitMetaDescription([
    `${service} in Boise and the Treasure Valley. ${detail} One design-build team, with a line-item budget before we build.`,
    `${service} in Boise and the Treasure Valley. ${detail} One design-build team from start to finish.`,
    `${service} in Boise and the Treasure Valley. ${detail}`,
    `${service} in Boise and the Treasure Valley from one design-build team, with a line-item budget before we break ground and a written update every week.`,
  ]);
}

/**
 * Generate varied city-service title (used for page metadata title field)
 * Does NOT include brand name since layout template appends "| Boise Construction Co"
 * Target: under 36 chars so final rendered title stays under 60 chars
 */

/**
 * Keyword-bearing short names, used only when even "{full name}, {City}"
 * cannot fit. Each keeps the term people actually search: the old ladder cut
 * "Energy-Efficient Homes" to "Efficient Homes" (lost "energy"), "Shop Homes &
 * Barndominiums" to "Shop Homes" (lost "barndominium"), "Home Design & Plans"
 * to "Home Plans" and "Custom Home Building" to "Custom Homes". Every name not
 * listed here fits at some rung of the ladder with its full name.
 * Keyed by the `name` values in shared/contentData.ts.
 */
const SERVICE_KEYWORD_NAMES: Record<string, string> = {
  'Lot Evaluation & Feasibility': 'Lot Evaluation',
  'Shop Homes & Barndominiums': 'Barndominium Builder',
  'Home Additions': 'Home Additions',
};

/**
 * Title names that state which part of the ADU and additions split this site
 * owns: new detached ADUs and structural additions (new footprint, second
 * stories). Garage or basement ADU conversions and work inside the existing
 * footprint belong to Boise Remodeling Co. Used in place of the service name
 * in city x service titles and H1s.
 */
export const SERVICE_CITY_TITLE_NAMES: Record<string, string> = {
  'ADUs & Guest Houses': 'Detached ADU Builder',
  'Home Additions': 'Structural Home Additions',
};

/** H1 name for city x service pages (see SERVICE_CITY_TITLE_NAMES). */
export const SERVICE_CITY_H1_NAMES: Record<string, string> = {
  'ADUs & Guest Houses': 'Detached ADUs & Guest Houses',
  'Home Additions': 'Structural Home Additions',
};

/** Budget after the layout template appends " | Boise Construction Co" (24). */
export const CITY_SERVICE_TITLE_BUDGET = 36;

/**
 * `avoid` is the parent service title: /services/adu is "Detached ADU Builder
 * in Boise, Idaho", so the Boise child takes the H1 name instead of repeating
 * the parent's title word for word.
 */
export function generateCityServiceTitle(serviceName: string, cityName: string, avoid?: string): string {
  const keyword = SERVICE_KEYWORD_NAMES[serviceName];
  for (const titleName of [SERVICE_CITY_TITLE_NAMES[serviceName], SERVICE_CITY_H1_NAMES[serviceName]]) {
    if (!titleName || titleName === serviceName) continue;
    // "Detached ADU Builder in Boise, ID" would only shorten the parent's
    // "... in Boise, Idaho"; take the next name instead.
    if (avoid?.startsWith(`${titleName} in ${cityName}`)) continue;
    const named = [`${titleName} in ${cityName}, Idaho`, `${titleName} in ${cityName}, ID`, `${titleName} in ${cityName}`, `${titleName}, ${cityName} ID`, `${titleName}, ${cityName}`];
    const fit = named.find((c) => c.length <= CITY_SERVICE_TITLE_BUDGET && c !== avoid);
    if (fit) return fit;
  }

  // Degrade the location part, never the searched term: "Idaho" becomes "ID",
  // then the keyword-bearing short name (where one exists) gets the readable
  // "in {City}" form, and only then does the "in" go.
  const inCity = (name: string) => [`${name} in ${cityName}, Idaho`, `${name} in ${cityName}, ID`];
  const commaCity = (name: string) => [`${name}, ${cityName} ID`, `${name}, ${cityName}`];
  const candidates = [
    ...inCity(serviceName),
    ...(keyword ? inCity(keyword) : []),
    ...commaCity(serviceName),
    ...(keyword ? commaCity(keyword) : []),
  ];

  return (
    candidates.find((c) => c.length <= CITY_SERVICE_TITLE_BUDGET) ??
    candidates[candidates.length - 1]
  );
}

/**
 * City x service meta description: authored copy for the indexable
 * combinations, otherwise a keyword-first sentence that names the service and
 * the city, then the service's own short description. 155 characters at most,
 * no phone number, no exclamation mark.
 */
export function generateCityServiceDescription(
  serviceName: string,
  cityName: string,
  shortDescription?: string,
): string {
  const serviceSlug = serviceSlugFor(serviceName);
  const citySlug = citySlugFor(cityName);
  const authored = CITY_SERVICE_META_DESCRIPTIONS[`${serviceSlug}/${citySlug}`];
  if (authored) return authored;
  const service = serviceSearchPhrase(serviceName);
  const detail = shortDescription ?? SERVICES.find((s) => s.name === serviceName)?.shortDescription ?? '';
  return fitMetaDescription([
    `${service} in ${cityName}, Idaho. ${detail} One design-build team, line-item budget first.`,
    `${service} in ${cityName}, Idaho. ${detail} One accountable design-build team.`,
    `${service} in ${cityName}, Idaho. ${detail} Line-item budget first.`,
    `${service} in ${cityName}, Idaho. ${detail}`,
    `${service} in ${cityName}, Idaho, from one design-build team: feasibility, design, permits and construction, with a line-item budget before we build.`,
    `${service} in ${cityName}, Idaho, from one design-build team, with feasibility, permits and a line-item budget settled first.`,
  ]);
}

/** Keep complete authored titles; an optional secondary label may be omitted. */
export function generateSafePageTitle(primary: string, suffix?: string): string {
  const title = primary.replace(/\s+/g, ' ').trim();
  const detail = suffix?.replace(/\s+/g, ' ').trim();
  if (detail) {
    const candidate = title + ' | ' + detail;
    if (candidate.length + (' | ' + SITE_CONFIG.name).length <= 60) return candidate;
  }
  // Preserve the authored topic, including dates and qualifiers. A display
  // length preference must not become a broken title in the document itself.
  return title;
}

/**
 * Default Open Graph / Twitter image path used as a site-wide fallback so every
 * page emits an og:image. Pages with their own hero (blog posts, guides) override
 * this with a more specific image.
 * Purpose-built 1200x630 dark social card: reverse wordmark + Maker's Seal on #1C1F1E.
 */
export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.png';

/**
 * Absolute URL for the default Open Graph image.
 */
export function getDefaultOgImage(): string {
  return `${getBaseUrl().replace(/\/$/, '')}${DEFAULT_OG_IMAGE_PATH}`;
}

/**
 * Get base URL based on environment
 */
export function getBaseUrl(): string {
  // In Next.js, check for environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Use current origin in development, production domain in production
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
      return window.location.origin;
    }
  }
  // Default to production URL for SSR/build time
  return SITE_CONFIG.siteUrl;
}

/**
 * Generate SEO-optimized alt tag for logo/icon featured image
 * Creates page-specific alt text that includes relevant keywords
 */
export function generateLogoAltTag(params: ServiceSEOParams): string {
  const { serviceName, city, isHomePage } = params;
  
  if (isHomePage) {
    return `${BRAND} logo - Design-build home builder in Boise, Idaho`;
  }
  
  if (city && serviceName) {
    // City-specific alt tag with service context
    return `${BRAND} logo - ${serviceName} in ${city} Idaho - Bonded and insured home builder`;
  }
  
  if (city) {
    // City page alt tag without service
    return `${BRAND} logo - New home construction in ${city} Idaho`;
  }
  
  if (!serviceName) {
    // Fallback for pages without service
    return `${BRAND} logo - Design-build home builder serving the Treasure Valley, Idaho`;
  }
  
  // Service-specific alt tag
  return `${BRAND} logo - ${serviceName.toLowerCase()} in the Treasure Valley, Idaho`;
}

/**
 * Generate complete SEO metadata object for a page
 */
export function generateSEOMetadata(params: ServiceSEOParams): SEOMetaData {
  const title = generatePageTitle(params);
  const description = generateMetaDescription(params);
  
  // Environment-aware canonical URL
  const baseUrl = getBaseUrl();
  let canonical = baseUrl;
  
  if (!params.isHomePage) {
    if (params.citySlug && params.serviceSlug) {
      canonical = `${baseUrl}/services/${params.serviceSlug}/${params.citySlug}`;
    } else if (params.citySlug && !params.serviceSlug) {
      canonical = `${baseUrl}/areas/${params.citySlug}`;
    } else if (params.serviceSlug) {
      canonical = `${baseUrl}/services/${params.serviceSlug}`;
    }
  }
  
  // Open Graph defaults to meta tags
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${baseUrl}/images/og-default.png`,
    twitterCard: 'summary_large_image',
  };
}

/**
 * City-specific data for local SEO
 */
export const CITY_SEO_DATA: Record<string, {
  population: string;
  founded: string;
  zipCodes: string[];
  neighborhoods: string[];
  landmarks: string[];
  climate: string;
  coordinates: { lat: number; lng: number };
}> = {
  Kuna: {
    population: '24,011',
    founded: '1992',
    zipCodes: ['83634'],
    neighborhoods: ['Crimson Point'],
    // Kuna Caves and Swan Falls Dam sit south of the city. The City of Kuna
    // map marks both "down the road," and the city tells visitors to drive out
    // to Swan Falls. Bernie Fisher Park is a city park at Main and Linder.
    landmarks: ['Bernie Fisher Park'],
    climate: 'semi-arid high desert climate with hot summers and cold winters',
    coordinates: { lat: 43.4913, lng: -116.4201 },
  },
  Boise: {
    population: '235,421',
    founded: '1863',
    zipCodes: ['83702', '83703', '83704', '83705', '83706', '83709', '83712', '83713', '83714', '83716'],
    neighborhoods: ['North End', 'Bench', 'Downtown', 'East End', 'Southwest Boise'],
    landmarks: ['Idaho State Capitol', 'Boise River Greenbelt', 'Table Rock', 'Hyde Park'],
    climate: 'semi-arid climate with four distinct seasons',
    coordinates: { lat: 43.6150, lng: -116.2023 },
  },
  Meridian: {
    population: '117,635',
    founded: '1893',
    zipCodes: ['83642', '83646'],
    neighborhoods: ['Lochsa Falls', 'Tuscany', 'Paramount', 'Meridian Ranch'],
    landmarks: ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park'],
    climate: 'semi-arid with hot, dry summers and cold winters',
    coordinates: { lat: 43.6121, lng: -116.3915 },
  },
  Eagle: {
    population: '30,346',
    founded: '1864',
    zipCodes: ['83616'],
    // Shadow Valley is Boise 83714 / unincorporated Ada County, not Eagle.
    neighborhoods: ['Banbury'],
    landmarks: ['Eagle Island State Park', 'Heritage Park', 'Eagle Hills Golf Course'],
    climate: 'semi-arid with distinct four seasons',
    coordinates: { lat: 43.6954, lng: -116.3540 },
  },
  Star: {
    population: '12,701',
    founded: '1907',
    zipCodes: ['83669'],
    // Hillsdale and Paramount are Meridian subdivisions. The riverside city
    // park is Star Riverwalk Park (1000 S. Main Street), not "Star Riverfront Park."
    neighborhoods: ['Star River Ranch', 'Star Crossing'],
    landmarks: ['Boise River', 'Star Riverwalk Park', 'Freedom Park'],
    climate: 'semi-arid climate with hot summers and cool winters',
    coordinates: { lat: 43.6921, lng: -116.4939 },
  },
  Middleton: {
    population: '10,141',
    founded: '1909',
    zipCodes: ['83644'],
    // Purple Sage Golf Course is in Caldwell. Middleton's city parks are
    // Middleton Place, Piccadilly, and Roadside, not "Middleton City Park."
    neighborhoods: ['Middleton Heights'],
    landmarks: ['Boise River'],
    climate: 'semi-arid high desert climate with warm summers and cool winters',
    coordinates: { lat: 43.7068, lng: -116.6209 },
  },
  Nampa: {
    population: '108,188',
    founded: '1886',
    zipCodes: ['83651', '83653', '83686', '83687'],
    neighborhoods: ['Downtown Nampa'],
    // Lake Lowell is Deer Flat National Wildlife Refuge, outside Nampa city limits.
    landmarks: ['Ford Idaho Center', 'Nampa Train Depot'],
    climate: 'semi-arid with hot summers and cold winters',
    coordinates: { lat: 43.5407, lng: -116.5635 },
  },
  Caldwell: {
    population: '65,359',
    founded: '1883',
    zipCodes: ['83605', '83607'],
    neighborhoods: ['Wilson'],
    landmarks: ['Indian Creek Plaza', 'Caldwell Night Rodeo', 'College of Idaho'],
    climate: 'semi-arid high desert with four distinct seasons',
    coordinates: { lat: 43.6629, lng: -116.6874 },
  },
};

/**
 * Indian Creek is a stream, not a neighborhood. Idaho DEQ's Indian Creek
 * Subbasin Assessment (December 2001) says it "flows through Elmore, Ada and
 * Canyon counties and the cities of Kuna, Nampa and Caldwell, Idaho."
 * Indian Creek Plaza is on that creek in downtown Caldwell.
 * https://www2.deq.idaho.gov/admin/LEIA/api/document/download/11724
 */
export function indianCreekDescription(cityName: string): string {
  if (cityName !== 'Kuna' && cityName !== 'Nampa' && cityName !== 'Caldwell') return '';
  return 'Indian Creek is the creek that flows through Kuna, Nampa, and Caldwell. Indian Creek Plaza is on that creek in downtown Caldwell.';
}

/**
 * Business information for NAP consistency
 */
export const BUSINESS_INFO = {
  name: SITE_CONFIG.name,
  legalName: SITE_CONFIG.legalName,
  alternateName: ['Boise Construction', 'BCC'],
  /**
   * No named individual is published on the site by request. Left empty so the
   * Organization schema omits the `founder` Person entity (the emit is gated on
   * this being non-empty). Set a name here only if the owner opts in later.
   */
  founderName: '',
  phone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  // Canonical NAP sourced from SITE_CONFIG. Street + ZIP feed structured data
  // and off-site citations; locality (Meridian, Idaho) stays consistent.
  address: {
    street: SITE_CONFIG.address.street,
    city: SITE_CONFIG.address.city,
    state: 'Idaho',
    postalCode: SITE_CONFIG.address.postalCode,
    country: 'United States',
  },
  hours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '9:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
  founded: '2020',
  serviceArea: ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Middleton', 'Caldwell', 'Garden City'],
  serviceRadius: '35 miles',
  licenses: ['Idaho Registered Contractor #8381215'],
  certifications: ['Design-Build Home Building', 'Bonded & Insured'],
  // The registration number is published in the footer and in hasCredential.
  insurance: 'Bonded & Insured',
  rating: 0,
  reviewCount: 0,
  yearlyServicesCompleted: 0,
  // This brand has no social profile of its own. The owner's Facebook page
  // belongs to P5 Home Co, so it sits on the parentOrganization node in
  // lib/schema.ts, not here. GBP_SOCIAL stays the slot for a brand profile.
  sameAs: [
    ...(GBP_SOCIAL.facebook ? [GBP_SOCIAL.facebook] : []),
    ...getExternalProfileUrls(),
  ],
};

export type { SEOMetaData, ServiceSEOParams };

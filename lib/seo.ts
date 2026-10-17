/**
 * SEO Utilities for Boise Construction Co
 * Generates optimized meta tags, titles, and descriptions
 * for service and location pages
 */

import { SITE_CONFIG } from '@/shared/siteConfig';
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

const CITY_DESCRIPTION_VARIANTS: Record<string, string> = {
  Kuna: "Kuna's trusted design-build",
  Boise: "Boise's design-build",
  Meridian: "Meridian's trusted",
  Eagle: "Eagle's preferred",
  Star: "Star's reliable",
  Middleton: "Middleton's expert",
  Nampa: "Nampa's trusted",
  Caldwell: "Caldwell's trusted",
};

const CITY_CTA_VARIANTS: Record<string, string> = {
  Kuna: "Free planning consultation",
  Boise: "Treasure Valley design-build",
  Meridian: "Bonded & insured",
  Eagle: "Line-item budget upfront",
  Star: "Weekly written updates",
  Middleton: "Workmanship warranty",
  Nampa: "Ada & Canyon County permits",
  Caldwell: "Design-build home building",
};

/**
 * Generate SEO-optimized meta description
 * 150-160 characters with phone number, CTA, and unique value prop
 * Phone: (208) 477-1169
 */
export function generateMetaDescription(params: ServiceSEOParams): string {
  const { serviceName, city } = params;
  const phone = SITE_CONFIG.phone;
  
  if (params.isHomePage) {
    return `Design-build home builder serving Boise, Meridian, Eagle & the Treasure Valley. Bonded, insured, line-item budgets. Call ${phone} for a free planning consultation!`;
  }
  
  if (city && serviceName) {
    const serviceLC = serviceName.toLowerCase();
    const cityVariant = CITY_DESCRIPTION_VARIANTS[city] || `${city}'s trusted`;
    const ctaVariant = CITY_CTA_VARIANTS[city] || "Satisfaction guaranteed";
    return `${cityVariant} ${serviceLC} team. Bonded & insured. ${ctaVariant}. Call ${phone} for a free consultation!`;
  }
  
  if (city) {
    return `Home builder in ${city}, Idaho. Bonded, insured & locally owned. Call ${phone} for a free planning consultation in ${city}!`;
  }
  
  if (!serviceName) {
    return `New home builder in Boise & the Treasure Valley. Bonded, insured, design-build. Call ${phone} for a free planning consultation and a realistic budget band!`;
  }
  
  const serviceLC = serviceName.toLowerCase();
  return `${serviceLC} in Boise & the Treasure Valley. Bonded, insured, with a line-item budget before we build. Call ${phone} for a free consultation!`;
}

/**
 * Generate varied city-service title (used for page metadata title field)
 * Does NOT include brand name since layout template appends "| Boise Construction Co"
 * Target: under 36 chars so final rendered title stays under 60 chars
 */

/**
 * Shorter display names for the longest services, used only when the full name
 * would push a city-service title past the budget. Keyed by the `name` values
 * in shared/contentData.ts.
 */
const SERVICE_SHORT_NAMES: Record<string, string> = {
  'Custom Home Building': 'Custom Homes',
  'Lot Evaluation & Feasibility': 'Lot Evaluation',
  'Shop Homes & Barndominiums': 'Shop Homes',
  'Home Design & Plans': 'Home Plans',
  'Energy-Efficient Homes': 'Efficient Homes',
};

/** Budget after the layout template appends " | Boise Construction Co" (24). */
const CITY_SERVICE_TITLE_BUDGET = 36;

export function generateCityServiceTitle(serviceName: string, cityName: string): string {
  const short = SERVICE_SHORT_NAMES[serviceName] ?? serviceName;

  // Degrade in steps rather than truncating mid-word: full name with "Idaho",
  // then the short name, then the "ID" abbreviation. Every service/city pair in
  // the current matrix resolves at one of these levels.
  const candidates = [
    `${serviceName} in ${cityName}, Idaho`,
    `${short} in ${cityName}, Idaho`,
    `${short} in ${cityName}, ID`,
    `${short}, ${cityName}`,
  ];

  return (
    candidates.find((c) => c.length <= CITY_SERVICE_TITLE_BUDGET) ??
    candidates[candidates.length - 1]
  );
}

/**
 * Generate varied city-service meta description
 * Guaranteed under 160 characters
 */
export function generateCityServiceDescription(
  serviceName: string,
  cityName: string,
  shortDescription?: string,
): string {
  const phone = SITE_CONFIG.phone;
  const serviceLC = serviceName.toLowerCase();
  const cityVariant = CITY_DESCRIPTION_VARIANTS[cityName] || `${cityName}'s trusted`;
  const cityData = CITY_SEO_DATA[cityName as keyof typeof CITY_SEO_DATA];
  const neighborhood = cityData?.neighborhoods?.[0];

  if (neighborhood) {
    const withNeighborhood = `${cityVariant} ${serviceLC}. Serving ${neighborhood} & all ${cityName}. Bonded & insured. Call ${phone}!`;
    if (withNeighborhood.length <= 160) return withNeighborhood;
  }

  if (shortDescription) {
    const desc = `${cityVariant} ${serviceLC}. ${shortDescription}. Bonded & insured. Call ${phone}!`;
    if (desc.length <= 160) return desc;
  }

  const base = `${cityVariant} ${serviceLC} in ${cityName}, ID. Bonded & insured. Call ${phone} for a free consultation!`;
  if (base.length <= 160) return base;

  return `${serviceLC} in ${cityName}, ID. Bonded & insured builder. Call ${phone} for a free consultation!`;
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
 * Purpose-built 1200x630 dark social card: reverse wordmark only. It does not
 * draw the maker's seal.
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
    neighborhoods: ['Crimson Point', 'Black Cat'],
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
    neighborhoods: ['Banbury', 'The Estates', 'Floating Feather'],
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
    neighborhoods: ['Downtown Nampa', 'Karcher', 'Greenhurst'],
    // Lake Lowell is Deer Flat National Wildlife Refuge, outside Nampa city limits.
    landmarks: ['Ford Idaho Center', 'Nampa Train Depot'],
    climate: 'semi-arid with hot summers and cold winters',
    coordinates: { lat: 43.5407, lng: -116.5635 },
  },
  Caldwell: {
    population: '65,359',
    founded: '1883',
    zipCodes: ['83605', '83607'],
    neighborhoods: ['Wilson', 'Ustick', 'Cleveland Blvd'],
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
  licenses: ['License details available upon request'],
  certifications: ['Design-Build Home Building', 'Bonded & Insured'],
  // Kept consistent with GBP and the `licenses` field above: the business
  // publishes bonded/insured status and provides registration details on
  // request, so nothing here should assert a specific license.
  insurance: 'Bonded & Insured',
  rating: 0,
  reviewCount: 0,
  yearlyServicesCompleted: 0,
  // Instagram is intentionally omitted: it is being dropped from the site
  // alongside the footer, and its handle still carries the old slug. Facebook
  // stays as the one confirmed profile.
  sameAs: [
    GBP_SOCIAL.facebook,
    ...getExternalProfileUrls(),
  ],
};

export type { SEOMetaData, ServiceSEOParams };

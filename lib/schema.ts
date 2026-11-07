import {schemaTime} from './schemaTime';
/**
 * JSON-LD Schema Markup Generators
 * Creates structured data for Google rich snippets and search features
 */

import { BUSINESS_INFO, getBaseUrl, P5_SAME_AS } from './seo';
import { CITIES, SERVICES } from '@/shared/contentData';
import { FOUNDING, PUBLIC_MARK_PATH, SHOW_FOUNDING_YEAR } from '@/shared/publicFlags';
import { CONTRACTOR_REGISTRATION_NUMBER } from '@/shared/contractorRegistration';
import { SITE_CONFIG } from '@/shared/siteConfig';

/** Idaho registers contractors. The same credential is on LocalBusiness, Organization, and Service. */
const CONTRACTOR_CREDENTIAL = {
  '@type': 'EducationalOccupationalCredential',
  credentialCategory: 'registration',
  name: 'Idaho Registered Contractor',
  identifier: CONTRACTOR_REGISTRATION_NUMBER,
  recognizedBy: {
    '@type': 'GovernmentOrganization',
    name: 'Idaho Division of Occupational and Professional Licenses',
    url: 'https://dopl.idaho.gov/con/',
  },
};

interface SchemaContext {
  '@context': string;
  '@type'?: string | string[];
  [key: string]: unknown;
}

// Get the base URL for schema markup
const baseUrl = getBaseUrl();

/**
 * Stable entity identifiers for a connected @graph. Using fragment-based @ids
 * lets Organization, WebSite, and LocalBusiness reference each other instead of
 * existing as disconnected nodes, and prevents the previous @id collision where
 * every per-city LocalBusiness reused `baseUrl` with different coordinates.
 */
export const ORG_ID = `${baseUrl}/#organization`;
export const BUSINESS_ID = `${baseUrl}/#business`;
export const LOCALBUSINESS_ID = BUSINESS_ID;
export const WEBSITE_ID = `${baseUrl}/#website`;

/**
 * Parent entity. Boise Construction Co is a brand of P5 Home Co LLC.
 * The @id is the P5 business node. Directory listings live on this parent
 * (one listing per directory) and stay out of this brand's sameAs.
 */
const P5_ORIGIN = 'https://p5homeco.com';
export const P5_BUSINESS_ID = `${P5_ORIGIN}/#business`;
export const P5_PARENT_ORGANIZATION = {
  '@type': 'Organization' as const,
  '@id': P5_BUSINESS_ID,
  name: 'P5 Home Co',
  url: P5_ORIGIN,
  sameAs: P5_SAME_AS,
};

/**
 * Public business type. HomeAndConstructionBusiness is the primary type;
 * GeneralContractor stays as an additional type so existing classification
 * is not dropped.
 */
export const BUSINESS_TYPES = ['HomeAndConstructionBusiness', 'GeneralContractor'] as const;

/**
 * Schema telephone in E.164 ("+1-208-477-1169"), the same string Remodeling,
 * Handyman, Cabinet and P5 publish, so the NAP matches across the family and
 * GBP. The display string "(208) 477-1169" stays on the page.
 */
export const SCHEMA_TELEPHONE = SITE_CONFIG.phoneE164;

/** Business contact details, without a personal administrative label. */
export const PUBLIC_CONTACT_POINT = {
  '@type': 'ContactPoint',
  telephone: SCHEMA_TELEPHONE,
  contactType: 'Customer Service',
  areaServed: 'US-ID',
  availableLanguage: 'English',
} as const;
// Organization logo for knowledge-panel / rich-result use. The approved seal on
// a charcoal disc (bone lettering, ochre ring) is square and stays legible on
// any background, unlike the reverse wordmark which vanished on Google's white
// panels. Served at its native 512px with explicit dimensions. While
// SHOW_FOUNDING_YEAR is off, the public mark is the year-free icon; the seal
// path stays in shared/publicFlags.ts.
const LOGO_URL = `${baseUrl}${PUBLIC_MARK_PATH}`;
const LOGO_SIZE = 512;

/**
 * Generate LocalBusiness schema for homepage and location pages
 */
/**
 * Wikipedia URLs for areaServed city disambiguation (entity resolution for
 * knowledge graphs and generative engines). Keys match CITY_SEO_DATA.
 */
const CITY_WIKIPEDIA: Record<string, string> = {
  Boise: 'https://en.wikipedia.org/wiki/Boise',
  Meridian: 'https://en.wikipedia.org/wiki/Meridian,_Idaho',
  Eagle: 'https://en.wikipedia.org/wiki/Eagle,_Idaho',
  Nampa: 'https://en.wikipedia.org/wiki/Nampa,_Idaho',
  Kuna: 'https://en.wikipedia.org/wiki/Kuna,_Idaho',
  Star: 'https://en.wikipedia.org/wiki/Star,_Idaho',
  Middleton: 'https://en.wikipedia.org/wiki/Middleton,_Idaho',
  Caldwell: 'https://en.wikipedia.org/wiki/Caldwell,_Idaho',
  'Garden City': 'https://en.wikipedia.org/wiki/Garden_City,_Idaho',
};

/**
 * Cities the site already lists, then the two counties those cities sit in.
 * Counties are AdministrativeArea nodes, not extra cities.
 */
function areaServedPlaces() {
  return [
    ...CITIES.map((city) => ({
      '@type': 'City' as const,
      name: city.name,
      ...(CITY_WIKIPEDIA[city.name] ? { sameAs: CITY_WIKIPEDIA[city.name] } : {}),
    })),
    { '@type': 'AdministrativeArea' as const, name: 'Ada County' },
    { '@type': 'AdministrativeArea' as const, name: 'Canyon County' },
  ];
}

/**
 * Service-area business. Public locality only.
 * streetAddress pending owner approval. No postalCode until that decision.
 */
function publicPostalAddress() {
  return {
    '@type': 'PostalAddress' as const,
    addressLocality: SITE_CONFIG.address.city,
    addressRegion: SITE_CONFIG.address.state,
    addressCountry: 'US' as const,
  };
}

export function generateLocalBusinessSchema(city?: string): SchemaContext {
  // Public geography is expressed through areaServed. The optional city
  // customizes the description without implying a customer-facing location.
  return {
    '@context': 'https://schema.org',
    '@type': [...BUSINESS_TYPES],
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    description: `Design-build home builder serving ${city || 'Boise'} and the Treasure Valley, Idaho. Custom homes, semi-custom homes, build-on-your-lot, and shop homes.`,
    image: `${baseUrl}/images/hero-great-room.webp`,
    logo: LOGO_URL,
    '@id': LOCALBUSINESS_ID,
    url: baseUrl,
    // The business is a DBA of P5 Home Co LLC: its parent is P5 (the same
    // node the Organization schema and the P5 graph use), stated in full so
    // it resolves on every page, not only where the Organization node renders.
    parentOrganization: P5_PARENT_ORGANIZATION,
    telephone: SCHEMA_TELEPHONE,
    email: BUSINESS_INFO.email,
    hasCredential: CONTRACTOR_CREDENTIAL,
    contactPoint: PUBLIC_CONTACT_POINT,
    address: publicPostalAddress(),
    openingHoursSpecification: Object.entries(BUSINESS_INFO.hours).map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
      opens: hours === 'Closed' ? undefined : schemaTime(hours.split(' - ')[0]),
      closes: hours === 'Closed' ? undefined : schemaTime(hours.split(' - ')[1]),
    })).filter(spec => spec.opens),
    areaServed: areaServedPlaces(),
    ...(SHOW_FOUNDING_YEAR ? { foundingDate: BUSINESS_INFO.founded } : {}),
    slogan: 'Boise\'s Design-Build Home Builder',
    paymentAccepted: 'Cash, Credit Card, Check, Financing',
    currenciesAccepted: 'USD',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Home Building Services',
      // Existing service pages only, including ADUs. No prices on the offers.
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        url: `${baseUrl}/services/${s.slug}`,
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          description: s.shortDescription,
        },
      })),
    },
    ...(BUSINESS_INFO.sameAs.length ? { sameAs: BUSINESS_INFO.sameAs } : {}),
  };
}

/**
 * WebSite schema for homepage entity graph
 */
export function generateWebSiteSchema(): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: BUSINESS_INFO.name,
    url: baseUrl,
    description:
      'Design-build home builder serving Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and the Treasure Valley, Idaho.',
    publisher: { '@id': ORG_ID },
    // NOTE: SearchAction intentionally omitted. The previous target
    // (/blog?q={search_term_string}) had no search handler, which advertised a
    // sitelinks search box that does not work. Re-add only when on-site search
    // is implemented.
  };
}

/**
 * Generate Service schema for individual service pages
 */
export function generateServiceSchema(serviceName: string, serviceDescription: string, city?: string): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    provider: {
      '@type': [...BUSINESS_TYPES],
      '@id': LOCALBUSINESS_ID,
      name: BUSINESS_INFO.name,
      telephone: SCHEMA_TELEPHONE,
      email: BUSINESS_INFO.email,
      hasCredential: CONTRACTOR_CREDENTIAL,
      contactPoint: PUBLIC_CONTACT_POINT,
    },
    // The page city is the area served, not a second PostalAddress.
    areaServed: city ? {
      '@type': 'City',
      name: city,
      addressCountry: 'US',
      addressRegion: 'ID',
    } : areaServedPlaces(),
    serviceType: serviceName,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`,
    })),
  };
}

/**
 * Generate Organization schema for brand identity
 */
export function generateOrganizationSchema(): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    // The full parent node, including its @id, is on the sitewide business.
    // A second copy here would duplicate that @id on the homepage.
    parentOrganization: { '@id': P5_BUSINESS_ID },
    ...(BUSINESS_INFO.alternateName.length
      ? { alternateName: BUSINESS_INFO.alternateName }
      : {}),
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    },
    description: FOUNDING.schemaDescription,
    hasCredential: CONTRACTOR_CREDENTIAL,
    ...(SHOW_FOUNDING_YEAR ? { foundingDate: BUSINESS_INFO.founded } : {}),
    // founder is gated: only emitted once a real named founder is supplied in
    // BUSINESS_INFO.founderName (see seo-audit/trust-signal-map.md).
    ...(BUSINESS_INFO.founderName
      ? {
          founder: {
            '@type': 'Person',
            name: BUSINESS_INFO.founderName,
            url: `${baseUrl}/about#team`,
          },
        }
      : {}),
    telephone: SCHEMA_TELEPHONE,
    email: BUSINESS_INFO.email,
    knowsAbout: [
      'custom home building',
      'semi-custom home building',
      'build on your lot',
      'design-build construction',
      'residential home design',
      'lot evaluation and feasibility',
      'shop homes and barndominiums',
      'energy-efficient home construction',
      'construction-to-permanent financing',
      'Ada County building permits',
      'Canyon County building permits',
    ],
    ...(BUSINESS_INFO.sameAs.length ? { sameAs: BUSINESS_INFO.sameAs } : {}),
    contactPoint: [PUBLIC_CONTACT_POINT],
  };
}

/**
 * Generate Review schema for testimonials
 */
export function generateReviewSchema(_reviews: Array<{
  author: string;
  rating: number;
  text: string;
  /** Optional ISO date. Omitted from output when not provided. */
  date?: string;
}>): SchemaContext {
  // There are no first-party reviews. Do not emit Review or AggregateRating.
  return {
    '@context': 'https://schema.org',
    '@type': [...BUSINESS_TYPES],
    '@id': LOCALBUSINESS_ID,
    name: BUSINESS_INFO.name,
  };
}

/**
 * Generate FAQPage schema for FAQ sections
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  publishedAt: string;
  /** Last revision date; falls back to publishedAt. */
  updatedAt?: string;
  /**
   * Author name. When this is a real person (not the organization name), the
   * author is emitted as a Person entity linked to /about#team for E-E-A-T.
   * When omitted or equal to the org name, the Organization is the author.
   */
  author?: string;
  authorUrl?: string;
  image?: string;
  slug: string;
  /** Defaults to /blog/ */
  pathPrefix?: 'blog' | 'guides' | 'resources';
}): SchemaContext {
  const prefix = article.pathPrefix ?? 'blog';
  const isPersonAuthor =
    !!article.author && article.author.trim() !== BUSINESS_INFO.name;
  const author = isPersonAuthor
    ? {
        '@type': 'Person',
        name: article.author,
        url: article.authorUrl ?? `${baseUrl}/about#team`,
      }
    : { '@type': 'Organization', '@id': ORG_ID, name: BUSINESS_INFO.name };

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author,
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: BUSINESS_INFO.name,
      logo: { '@type': 'ImageObject', url: LOGO_URL, width: LOGO_SIZE, height: LOGO_SIZE },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${prefix}/${article.slug}`,
    },
  };
}

/**
 * Generate HowTo schema for step-by-step process pages
 */
export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  url: string;
  steps: Array<{ name: string; text: string }>;
}): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    url: `${baseUrl}${howTo.url}`,
    step: howTo.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function generateCollectionPageSchema(page: {
  title: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
}): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    url: `${baseUrl}${page.url}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: page.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: `${baseUrl}${item.url}`,
      })),
    },
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(page: {
  title: string;
  description: string;
  url: string;
  /** Adds SpeakableSpecification on this node instead of a second WebPage node for the same URL. */
  speakable?: boolean;
}): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `${baseUrl}${page.url}`,
    ...(page.speakable
      ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ["[data-speakable='summary']"] } }
      : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: BUSINESS_INFO.name,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS_INFO.name,
    },
  };
}

/**
 * Generate SpeakableSpecification schema for AI assistants and voice search
 */
export function generateSpeakableSchema(page: {
  name: string;
  url?: string;
  path?: string;
}): SchemaContext {
  const pagePath = page.url ?? page.path ?? '/';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.name,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ["[data-speakable='summary']"],
    },
    url: `${baseUrl}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`,
  };
}

function stripSchemaContext(schema: SchemaContext): Record<string, unknown> {
  const { '@context': _context, ...rest } = schema;
  return rest;
}

/**
 * Consolidated @graph for the homepage. The business node is NOT in this graph:
 * the root layout already emits it on every page (including /), and a second
 * copy under the same `#business` @id would put two business nodes on the
 * homepage. Organization and WebSite reference the parent and the publisher
 * by @id, which resolves to the layout node.
 */
export function generateHomePageSchemaGraph(
  faqs: Array<{ question: string; answer: string }>,
): SchemaContext {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      stripSchemaContext(generateOrganizationSchema()),
      stripSchemaContext(generateWebSiteSchema()),
      stripSchemaContext(generateFAQSchema(faqs)),
      stripSchemaContext(
        generateSpeakableSchema({
          path: '/',
          name: 'Boise Construction Co, Design-Build Home Builder in the Treasure Valley',
        }),
      ),
    ],
  };
}

export type { SchemaContext };

/**
 * Google Business Profile copy and configuration.
 * Single source of truth for GBP fields, services, products, Q&A, posts, and sync data.
 * Operator checklists: local-seo-audit/02-gbp-plan.md
 */

import { SITE_CONFIG } from '@/shared/siteConfig';
import { CITIES } from '@/shared/contentData';

const SITE = SITE_CONFIG.siteUrl.replace(/\/$/, '');

/** Canonical NAP - use verbatim on GBP and all citations. */
export const GBP_NAP = {
  name: 'Boise Construction Co',
  legalName: 'Boise Construction Co LLC',
  phone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  website: SITE,
  publicLocality: SITE_CONFIG.address.cityState,
  serviceAreaLabel: SITE_CONFIG.address.serviceArea,
  founded: '2020',
  hours: {
    monday: '7:00 AM - 6:00 PM',
    tuesday: '7:00 AM - 6:00 PM',
    wednesday: '7:00 AM - 6:00 PM',
    thursday: '7:00 AM - 6:00 PM',
    friday: '7:00 AM - 6:00 PM',
    saturday: '8:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
} as const;

export const GBP_SERVICE_AREAS = [
  'Boise, ID',
  'Meridian, ID',
  'Eagle, ID',
  'Nampa, ID',
  'Kuna, ID',
  'Star, ID',
  'Middleton, ID',
  'Caldwell, ID',
] as const;

// Primary category drives which local pack a listing competes in. "Home
// builder" is the category for new residential construction; "Remodeler" would
// keep the profile ranking for the wrong intent.
export const GBP_CATEGORIES = {
  primary: 'Home builder',
  secondary: [
    'Custom home builder',
    'Construction company',
    'General contractor',
    'Home designer',
    'Building consultant',
  ],
} as const;

export const GBP_DESCRIPTION =
  'Boise Construction Co is a design-build home builder serving Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho. One accountable team handles feasibility, design, Ada and Canyon County permits, and construction for custom homes, semi-custom homes, builds on land you already own, and shop homes. Every project includes a line-item budget before construction, a dedicated project manager, weekly written cost and schedule updates, and a written workmanship warranty. We also offer lot evaluation and permit-ready home design as standalone services. Founded in 2020. Bonded and insured. Book a free planning consultation and leave with a realistic budget band and clear next steps.';

export const GBP_LINKS = {
  website: SITE,
  appointment: `${SITE}/contact`,
  estimator: `${SITE}/#calculator`,
  resources: `${SITE}/resources`,
  review: `${SITE}/review`,
} as const;

/**
 * Canonical social profiles. These feed `sameAs` in the LocalBusiness schema,
 * where a wrong URL actively misidentifies the business to search engines, so
 * they must point at profiles that genuinely belong to the company.
 *
 * NEEDS OWNER CONFIRMATION: these still use the legacy `boiseremodeling`
 * handles. If the profiles are renamed as part of the rebrand, update both
 * URLs here and nowhere else - the footer and schema both read from this.
 */
export const GBP_SOCIAL = {
  facebook: 'https://www.facebook.com/boiseremodeling',
  instagram: 'https://www.instagram.com/boiseremodeling',
} as const;

export const GBP_ATTRIBUTES = {
  onlineEstimates: true,
  onsiteServices: true,
  payments: ['Cash', 'Check', 'Credit cards', 'Financing available'],
  planning: 'Appointment required (for consultations)',
  serviceOptions: 'Free estimates (planning consultation + online estimator)',
} as const;

export const GBP_MESSAGING = {
  welcomeMessage:
    'Thanks for reaching out to Boise Construction Co. We respond within one business day. For faster help, call (208) 477-1169 or book a planning consultation at boiseremodeling.co/contact',
} as const;

export interface GbpService {
  name: string;
  description: string;
  startingPrice?: string;
}

export const GBP_SERVICES: GbpService[] = [
  {
    name: 'Custom home building',
    description:
      'Fully custom homes designed from a blank page around your lot and budget. Line-item budget, permits, and weekly updates included.',
    startingPrice: '$525,000',
  },
  {
    name: 'Semi-custom home building',
    description:
      'Start from a proven engineered floor plan and personalize it. Shorter timeline and a tighter budget range than fully custom.',
    startingPrice: '$425,000',
  },
  {
    name: 'Build on your lot',
    description:
      'You own the land. We handle feasibility, site design, permits, and construction, with site costs priced before design begins.',
    startingPrice: '$475,000',
  },
  {
    name: 'Design-build home construction',
    description:
      'Design and construction under one contract, with the design priced continuously so the drawings never outrun the budget.',
    startingPrice: '$525,000',
  },
  {
    name: 'Custom home design and plans',
    description:
      'Permit-ready architectural drawings with structural engineering and Idaho energy compliance. You own the plans.',
    startingPrice: '$9,000',
  },
  {
    name: 'Lot evaluation and site feasibility',
    description:
      'Soils, utilities, access, setbacks, and slope reviewed before you buy. Written site cost summary. Credited toward design.',
    startingPrice: '$950',
  },
  {
    name: 'Shop homes and barndominiums',
    description:
      'Post-frame and steel-framed homes pairing finished living space with working shop square footage on rural acreage.',
    startingPrice: '$330,000',
  },
  {
    name: 'Energy-efficient home building',
    description:
      'High-performance envelopes with blower-door verified air tightness and sealed ducts inside conditioned space.',
    startingPrice: '$575,000',
  },
  {
    name: 'New construction permit management',
    description:
      'Ada and Canyon County building permits, plan review, and impact fees handled in-house, including septic and well permitting.',
  },
  {
    name: 'Home building consultation',
    description:
      'Free planning consultation. Leave with a realistic budget band and clear next steps. No obligation.',
  },
];

export interface GbpProduct {
  category: string;
  name: string;
  price: string;
  url: string;
  description: string;
}

export const GBP_PRODUCT_CATEGORIES = [
  'Home Building Services',
  'Free Planning Resources',
  'Consultation & Tools',
  'Areas We Serve',
] as const;

export const GBP_PRODUCTS: GbpProduct[] = [
  {
    category: 'Home Building Services',
    name: 'Custom Home Building',
    price: 'From $525,000',
    url: `${SITE}/services/custom-home-builder`,
    description:
      'Fully custom homes designed around your lot and budget. Line-item budget before construction. Free planning consultation.',
  },
  {
    category: 'Home Building Services',
    name: 'Semi-Custom Homes',
    price: 'From $425,000',
    url: `${SITE}/services/semi-custom-homes`,
    description:
      'Proven engineered plans adapted to your lot. Shorter timeline and a tighter budget range than fully custom.',
  },
  {
    category: 'Home Building Services',
    name: 'Build on Your Lot',
    price: 'From $475,000',
    url: `${SITE}/services/build-on-your-lot`,
    description:
      'Already own land? We handle feasibility, design, permits, and construction, with site costs priced before design begins.',
  },
  {
    category: 'Home Building Services',
    name: 'Design-Build',
    price: 'From $525,000',
    url: `${SITE}/services/design-build`,
    description:
      'Design and construction under one contract. The design is priced as it develops, so it never outruns your budget.',
  },
  {
    category: 'Home Building Services',
    name: 'Home Design & Plans',
    price: 'From $9,000',
    url: `${SITE}/services/home-plans-design`,
    description:
      'Permit-ready drawings with structural engineering and Idaho energy compliance. You own the plans.',
  },
  {
    category: 'Home Building Services',
    name: 'Lot Evaluation',
    price: 'From $950',
    url: `${SITE}/services/lot-evaluation`,
    description:
      'Soils, utilities, access, and setbacks reviewed before you buy. Written site cost summary, credited toward design.',
  },
  {
    category: 'Home Building Services',
    name: 'Shop Homes & Barndominiums',
    price: 'From $330,000',
    url: `${SITE}/services/shop-homes-barndominiums`,
    description:
      'Post-frame and steel-framed homes pairing finished living space with working shop square footage.',
  },
  {
    category: 'Free Planning Resources',
    name: 'New Home Budget Worksheet',
    price: 'Free',
    url: `${SITE}/downloads/new-home-budget-worksheet.pdf`,
    description:
      'Printable 2026 Treasure Valley build ranges, budget buckets, and the site costs most people forget.',
  },
  {
    category: 'Free Planning Resources',
    name: 'Lot Evaluation Checklist',
    price: 'Free',
    url: `${SITE}/downloads/lot-evaluation-checklist.pdf`,
    description:
      'What to check on a parcel before you make an offer: soils, utilities, access, setbacks, and slope.',
  },
  {
    category: 'Free Planning Resources',
    name: 'Ada vs Canyon Permit Guide',
    price: 'Free',
    url: `${SITE}/downloads/ada-canyon-permit-guide.pdf`,
    description:
      'One-page reference: jurisdiction map, when permits apply, and timeline bands.',
  },
  {
    category: 'Free Planning Resources',
    name: 'Permit Flow Guide (Interactive)',
    price: 'Free',
    url: `${SITE}/resources/ada-canyon-permit-flow`,
    description:
      'Visual walkthrough of Ada vs Canyon County permit paths and inspection milestones.',
  },
  {
    category: 'Consultation & Tools',
    name: 'Free Planning Consultation',
    price: 'Free',
    url: `${SITE}/contact`,
    description:
      'Talk through your lot, your program, and a realistic budget band. No pressure, no obligation.',
  },
  {
    category: 'Consultation & Tools',
    name: 'New Home Construction Estimator',
    price: 'Free',
    url: `${SITE}/#calculator`,
    description:
      'Instant planning range for a new build. Size, finish level, and site conditions. Not a bid - a starting point for conversation.',
  },
  {
    category: 'Consultation & Tools',
    name: 'Home Building Resources Hub',
    price: 'Free',
    url: `${SITE}/resources`,
    description: 'All free PDFs and guides in one place.',
  },
  // Generated from the canonical city list so GBP area products cannot drift
  // out of sync with the /areas routes.
  ...CITIES.map((city) => ({
    category: 'Areas We Serve',
    name: `Home Builder in ${city.name}, ID`,
    price: 'Free consultation',
    url: `${SITE}/areas/${city.slug}`,
    description: `Design-build home builder serving ${city.name}, Idaho. Custom homes, semi-custom homes, builds on your lot, and shop homes.`,
  })),
];

export interface GbpQaEntry {
  question: string;
  answer: string;
}

export const GBP_QA_SEED: GbpQaEntry[] = [
  {
    question: 'Do you provide free estimates?',
    answer: `Yes. We offer a free planning consultation where we talk through your lot, your program, and a realistic budget band - no pressure, no obligation. You can also get an instant planning range online at ${SITE}/#calculator`,
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho - all of Ada and Canyon County in the Treasure Valley.',
  },
  {
    question: 'How much does it cost to build a house in Boise?',
    answer: `As of 2026, most Treasure Valley new homes plan $225–$400 per finished square foot excluding land. A 2,400 square foot custom home commonly runs $600,000–$960,000, with site work budgeted separately. These are planning ranges, not bids.`,
  },
  {
    question: 'Do you handle permits?',
    answer: `Yes. We pull Ada and Canyon County building permits in-house, manage plan review, and coordinate inspections through your project manager. On rural parcels that includes septic through Central District Health and well permitting through IDWR. Permit guide: ${SITE}/resources/ada-canyon-permit-flow`,
  },
  {
    question: 'How long does it take to build a new home?',
    answer: `Plan on 10–14 months for a custom home and 7–10 months for a semi-custom home, measured from the start of design to move-in. County plan review is the most common source of delay.`,
  },
  {
    question: 'Do I need to own land before I contact you?',
    answer: `No, and it is often better if you have not bought yet. We evaluate candidate lots for soils, utilities, access, and setbacks before you commit, because the parcel drives a large share of the budget: ${SITE}/services/lot-evaluation`,
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      'Yes. Boise Construction Co is bonded and insured for residential construction across the Treasure Valley. Idaho contractor registration details are available upon request.',
  },
  {
    question: 'Can you build on land I already own?',
    answer: `Yes. That is one of our core services. We start with a lot walkthrough and a written summary of site work and permitting costs before any design work begins: ${SITE}/services/build-on-your-lot`,
  },
  {
    question: 'What is the difference between custom and semi-custom?',
    answer: `A custom home starts from a blank page. A semi-custom home starts from a proven engineered plan and adapts it to your lot. Semi-custom is typically 2–4 months faster with a narrower budget range; custom gives you full control over layout and massing.`,
  },
  {
    question: 'Do you build barndominiums or shop homes?',
    answer: `Yes - post-frame and steel-framed homes pairing finished living space with working shop square footage, mostly on rural Ada and Canyon County acreage. Planning from $150–$250 per square foot blended: ${SITE}/services/shop-homes-barndominiums`,
  },
  {
    question: 'What is design-build?',
    answer: `Design and construction sit under one contract with one company, and the design is priced continuously as it develops rather than bid after it is finished. That prevents the most expensive failure in home building: a completed design that comes in far over budget. Learn more: ${SITE}/about`,
  },
  {
    question: 'How do I get started?',
    answer: `Call (208) 477-1169, text us at the same number, or book online: ${SITE}/contact. We respond within one business day.`,
  },
];

export interface GbpPost {
  week: number;
  headline: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  photoHint: string;
}

export const GBP_POSTS_STARTER: GbpPost[] = [
  {
    week: 1,
    headline: 'Custom home building in Boise',
    body: 'Line-item budget before construction, weekly written cost and schedule updates, and a written workmanship warranty.',
    buttonLabel: 'Learn more',
    buttonUrl: `${SITE}/services/custom-home-builder/boise`,
    photoHint: 'Best completed home exterior',
  },
  {
    week: 2,
    headline: '2026 Treasure Valley build costs',
    body: 'Most new homes plan $225–$400 per finished square foot excluding land. Use our estimator to get a planning range in about a minute.',
    buttonLabel: 'Get a range',
    buttonUrl: `${SITE}/#calculator`,
    photoHint: 'Estimator screenshot or budget worksheet',
  },
  {
    week: 3,
    headline: 'Thinking about a lot? Check it first.',
    body: 'Soils, utilities, access, and setbacks reviewed before you buy. Written site cost summary from $950, credited toward design.',
    buttonLabel: 'Lot evaluation',
    buttonUrl: `${SITE}/services/lot-evaluation`,
    photoHint: 'Site walkthrough or raw lot photo',
  },
  {
    week: 4,
    headline: 'Free planning consultation',
    body: 'Talk through your lot, your program, and a realistic budget band. One team from feasibility to final walkthrough.',
    buttonLabel: 'Book a consultation',
    buttonUrl: `${SITE}/contact`,
    photoHint: 'Team or consultation photo',
  },
];

export const GBP_PHOTO_CHECKLIST = [
  { type: 'Logo', spec: 'Square, 720×720+', filename: 'boise-construction-co-logo.jpg' },
  {
    type: 'Cover',
    spec: 'Landscape 1200×900+',
    filename: 'custom-home-builder-treasure-valley-cover.jpg',
  },
  {
    type: 'Completed homes (10+)',
    spec: 'Exteriors and interiors, captioned by city + home type',
    filename: 'custom-home-eagle-idaho-exterior.jpg',
  },
  {
    type: 'Team/founder',
    spec: 'Team member at job site or office',
    filename: 'team-project-manager-boise.jpg',
  },
  {
    type: 'Work-in-progress',
    spec: 'Framing, envelope detailing, or blower-door testing',
    filename: 'framing-envelope-detail-meridian.jpg',
  },
  {
    type: 'Trust',
    spec: 'Branded vehicle or job site signage',
    filename: 'boise-construction-co-vehicle.jpg',
  },
] as const;

export const GBP_CITATION_FIXES = [
  {
    platform: 'Yelp',
    action: 'Claim listing; set phone to (208) 477-1169; service-area model; no street address',
    url: 'https://www.yelp.com',
  },
  {
    platform: 'ProMatcher',
    action: 'Correct or delete profile - remove Lake Fork address and old phone (208) 405-8425',
    url: 'https://www.promatcher.com/profile/BoiseRemodelingCo',
  },
  {
    platform: 'Facebook',
    action: 'Confirm NAP matches canonical record',
    url: GBP_SOCIAL.facebook,
  },
  {
    platform: 'Instagram',
    action: 'Confirm NAP in bio matches canonical record',
    url: GBP_SOCIAL.instagram,
  },
  {
    platform: 'MapQuest',
    action: 'Submit correction after Yelp is fixed',
    url: 'https://www.mapquest.com',
  },
] as const;

export const GBP_PARALLEL_LISTINGS = [
  { platform: 'Bing Places', url: 'https://www.bingplaces.com', category: 'Home builder / General Contractor' },
  {
    platform: 'Apple Business Connect',
    url: 'https://businessconnect.apple.com',
    category: 'Home Improvement',
  },
] as const;

export const GBP_MONTHLY_SYNC = [
  'Publish 1 Google Post with deep link (see GBP_POSTS_STARTER rotation)',
  'Upload 2–4 new project photos with city + project type captions',
  'Respond to all reviews within 48 hours',
  'Check Q&A for new homeowner questions',
  'Verify NAP on Facebook, Instagram, Bing, Apple still matches GBP_NAP',
  'Update BUSINESS_INFO.rating/reviewCount in lib/seo.ts if review count changed',
] as const;

export const GBP_QUARTERLY_SYNC = [
  'Search "Boise Remodeling Co" - the old brand should resolve to Boise Construction Co',
  'Audit for duplicate GBP listings',
  'Update product/post links if new guides publish',
  'Append new citation URLs to BUSINESS_INFO.sameAs via env vars',
] as const;

/** GBP short review link from dashboard - set NEXT_PUBLIC_GBP_REVIEW_URL in production. */
export function getGbpReviewUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_GBP_REVIEW_URL?.trim();
  return url || undefined;
}

/** GBP Maps listing URL - set NEXT_PUBLIC_GBP_URL after verification. */
export function getGbpProfileUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_GBP_URL?.trim();
  return url || undefined;
}

/** Optional third-party profile URLs for schema sameAs (set via env after listings go live). */
export function getExternalProfileUrls(): string[] {
  const keys = [
    'NEXT_PUBLIC_GBP_URL',
    'NEXT_PUBLIC_BING_PLACES_URL',
    'NEXT_PUBLIC_APPLE_BUSINESS_URL',
    'NEXT_PUBLIC_YELP_URL',
    'NEXT_PUBLIC_HOUZZ_URL',
  ] as const;

  return keys
    .map((key) => process.env[key]?.trim())
    .filter((url): url is string => Boolean(url));
}

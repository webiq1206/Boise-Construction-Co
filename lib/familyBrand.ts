/**
 * Boise Construction Co configuration for the shared family chrome.
 *
 * BRAND-OWNED: this is the one file where this site differs from its siblings.
 * The components in components/family/ and the styles in styles/family-*.css are
 * synced byte-identical across the P5 Home Co family (lib/family/manifest.json);
 * they read everything brand-specific from FAMILY_BRAND below.
 *
 * Kept free of heavy imports on purpose: the header and bottom bar are client
 * components, so whatever this module imports ships to every page. Guide bodies
 * (shared/guideContent) stay out; tests/family-chrome.test.ts pins that every
 * pillar linked below is a published guide.
 */
import type { FamilyBrand } from '@/lib/family/types';
import {
  CONTRACTOR_LICENSE_SEARCH_URL,
  CONTRACTOR_REGISTRATION_LABEL,
} from '@/shared/contractorRegistration';
import { CONTENT_HUBS } from '@/shared/contentHubs';
import { CITIES, SERVICES, serviceLabel } from '@/shared/contentData';
import { P5_SOCIAL } from '@/shared/gbpProfile';
import { SITE_CONFIG } from '@/shared/siteConfig';

/** public/brand/approved-lockup-*.svg: viewBox 445.47 x 50. */
const LOCKUP = { width: 445, height: 50 };

/** The first three pillar guides, as the footer has always listed them. */
const PILLAR_GUIDES = CONTENT_HUBS.filter((hub) => hub.priorityTier <= 2)
  .slice(0, 3)
  .map((hub) => ({ label: hub.title, href: `/guides/${hub.pillarSlug}` }));

export const FAMILY_BRAND: FamilyBrand = {
  id: 'construction',
  name: SITE_CONFIG.name,
  domain: SITE_CONFIG.siteUrl.replace(/\/$/, ''),
  lockupLabel: `${SITE_CONFIG.name}, a P5 Home Company`,
  lockup: {
    onDark: { src: '/brand/approved-lockup-light.svg', ...LOCKUP },
    onLight: { src: '/brand/approved-lockup-dark.svg', ...LOCKUP },
  },
  // Ochre, the approved Construction accent, and its AA ink on paper.
  accent: '#c48d3f',
  accentInk: '#78531e',
  header: {
    // The homepage opens on a full-bleed photograph; interior pages open on paper and stone.
    darkOn: ['/'],
    // The approved C7 check (scripts/verify-p5-mobile-seo.mjs) keeps the bottom bar on screen
    // below 1180px, and the header has always switched to the full navigation at 1180.
    desktopFrom: 1180,
    phoneActions: ['call', 'text', 'chat'],
  },
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'Areas', href: '/areas' },
    { label: 'About', href: '/about' },
    { label: 'Guides', href: '/guides' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  // One label, one destination: the quote wizard. verify-p5-mobile-seo pins exactly one
  // a[href="/estimate"] in the bar.
  cta: { label: 'Request a quote', href: '/estimate' },
  phone: { display: SITE_CONFIG.phone, telHref: SITE_CONFIG.phoneHref, smsHref: SITE_CONFIG.phoneSmsHref },
  chat: { enabled: true, label: 'Chat', openEvent: 'p5:assistant-open', hiddenOn: ['/estimate*', '/admin*', '/subcontractor*'] },
  bar: {
    // Approved C7 decision: the bar is on the first screen, over the hero.
    showOverHero: true,
    callLabel: 'Call',
    // The /estimate quote wizard and the estimator own the bottom of the screen.
    hiddenOn: ['/estimate/*'],
    // lib/mobileNavBar.ts (modals, the inline estimate bar) and the P5 estimator set these.
    yieldToBodyFlags: ['hideMobileNavBar', 'p5EstimatorActive'],
  },
  // The same GA4 event name the header, menu and bar sent before.
  analytics: { ctaEvent: 'cta_click', barCtaEvent: 'cta_click' },
  // Same path as BUSINESS_VCARD_PATH in lib/vcard.ts (that module pulls in the SEO data).
  saveContactHref: '/contact.vcf',
  email: SITE_CONFIG.email,
  // SITE_TAGLINE in shared/siteContent (not imported: that module carries icon components).
  tagline: 'Treasure Valley home building, built on clarity and craftsmanship.',
  parentLine: 'A P5 Home Co company',
  footer: {
    groups: [
      {
        title: 'Services',
        links: [
          ...SERVICES.map((service) =>
            service.slug === 'adu'
              ? { label: 'ADUs (Boise ADU Co)', href: 'https://p5homeco.com/quote/adu' }
              : { label: serviceLabel(service), href: `/services/${service.slug}` },
          ),
          { label: 'All services', href: '/services' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Why choose us', href: '/#why-choose-us' },
          { label: 'How we build', href: '/#how-we-build' },
          { label: 'Warranty', href: '/warranty' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Home building guides', href: '/guides' },
          { label: 'Planning downloads', href: '/resources' },
          { label: 'Blog', href: '/blog' },
          ...PILLAR_GUIDES,
        ],
      },
    ],
    areas: {
      label: 'Service areas',
      href: '/areas',
      links: CITIES.map((city) => ({ label: `${city.name}, Idaho`, href: `/areas/${city.slug}` })),
    },
    legal: [
      { label: 'Site map', href: '/sitemap' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Terms of service', href: '/terms-of-service' },
      { label: 'Subcontractor login', href: '/api/login', rel: 'nofollow' },
    ],
    // Required parent-company disclosure: this brand is a DBA of P5 Home Co LLC.
    disclosure: { before: `${SITE_CONFIG.name} is a DBA of `, linkLabel: SITE_CONFIG.legalName, href: 'https://p5homeco.com', after: '' },
    copyrightName: SITE_CONFIG.name,
  },
  // Detached ADUs are offered through this company's existing service pages.
  family: {
    label: 'The P5 Home Co family',
    companies: [
      { name: 'P5 Home Co', href: 'https://p5homeco.com' },
      { name: 'Boise Construction Co', href: 'https://boiseconstruction.co' },
      { name: 'Boise Remodeling Co', href: 'https://boiseremodeling.co' },
      { name: 'Boise Handyman Co', href: 'https://boisehandyman.co' },
      { name: 'Boise Cabinet Co', href: 'https://boisecabinet.co' },
    ],
  },
  nap: {
    line: 'Serving Boise and the Treasure Valley',
  },
  hours: 'Hours: Mon to Fri 9 to 6, Sat 9 to 4 Mountain. Closed Sunday.',
  registration: {
    text: CONTRACTOR_REGISTRATION_LABEL,
    href: CONTRACTOR_LICENSE_SEARCH_URL,
    title: 'Idaho contractor registration details',
    ariaLabel: `${CONTRACTOR_REGISTRATION_LABEL}, opens in a new tab`,
    rel: 'noopener noreferrer',
  },
  // P5 Home Co's Facebook page (shared/gbpProfile); nothing renders until its URL exists.
  parentFacebook: { href: P5_SOCIAL.facebook, label: 'P5 Home Co on Facebook' },
  // P5 Home Co's Google Business Profile (owner decision A, 1 November 2026): the owner's one
  // profile, category General contractor, knowledge graph id /g/11ntl1t7dc. It belongs to the
  // parent, so the footer lists it beside the parent's Facebook page and it never joins this
  // brand's own sameAs.
  parentGoogle: { href: P5_SOCIAL.google, label: 'P5 Home Co on Google' },
};

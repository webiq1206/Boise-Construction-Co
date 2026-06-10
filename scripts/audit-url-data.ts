/**
 * One-shot data extractor for the local-seo-audit URL matrix.
 * Dumps every indexable URL with title, word count, FAQ count, and hub/city/service
 * metadata as JSON to stdout. Read-only; not part of the build.
 *
 * Run: npx tsx scripts/audit-url-data.ts > /tmp/audit-url-data.json
 */
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import { CITIES, SERVICES } from '../shared/contentData';
import { CONTENT_HUBS, categoryHubPath, guidePath, isCategoryHubIndexable } from '../shared/contentHubs';

function words(html: string | undefined): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

type Row = {
  url: string;
  pageType: string;
  title: string;
  city?: string;
  service?: string;
  hub?: string;
  wordCount?: number;
  faqCount?: number;
  publishedAt?: string;
};

const rows: Row[] = [];

rows.push({ url: '/', pageType: 'homepage', title: 'Boise Remodeling Co | Remodeling & Design' });

const staticPages: Array<[string, string]> = [
  ['/about', 'About Us'],
  ['/areas', 'Service Areas'],
  ['/contact', 'Contact Us'],
  ['/testimonials', 'Testimonials'],
  ['/blog', 'Blog Index'],
  ['/guides', 'Guides Index'],
  ['/resources', 'Resources Index'],
  ['/resources/ada-canyon-permit-flow', 'Ada vs Canyon Permit Flow'],
  ['/privacy-policy', 'Privacy Policy'],
  ['/terms-of-service', 'Terms of Service'],
];
for (const [url, title] of staticPages) rows.push({ url, pageType: 'static', title });

for (const s of SERVICES) {
  rows.push({ url: `/services/${s.slug}`, pageType: 'service', title: s.name, service: s.slug });
}

for (const c of CITIES) {
  rows.push({ url: `/areas/${c.slug}`, pageType: 'area', title: `Remodeling in ${c.name}`, city: c.slug });
}

for (const s of SERVICES) {
  for (const c of CITIES) {
    rows.push({
      url: `/services/${s.slug}/${c.slug}`,
      pageType: 'city-service',
      title: `${s.name} in ${c.name}`,
      service: s.slug,
      city: c.slug,
    });
  }
}

for (const g of GUIDE_PAGES) {
  const anyG = g as Record<string, unknown>;
  rows.push({
    url: guidePath(g.slug),
    pageType: `guide:${(anyG.guideType as string) ?? 'guide'}`,
    title: g.title,
    hub: (anyG.hubSlug as string) ?? undefined,
    wordCount: words((anyG.bodyHtml as string) ?? (anyG.content as string)),
    faqCount: Array.isArray(anyG.faqs) ? (anyG.faqs as unknown[]).length : 0,
    publishedAt: g.publishedAt,
  });
}

for (const p of BLOG_POSTS) {
  const anyP = p as Record<string, unknown>;
  rows.push({
    url: `/blog/${p.slug}`,
    pageType: 'blog',
    title: p.title,
    hub: (anyP.hubSlug as string) ?? undefined,
    wordCount: words((anyP.content as string) ?? (anyP.bodyHtml as string)),
    faqCount: Array.isArray(anyP.faqs) ? (anyP.faqs as unknown[]).length : 0,
    publishedAt: p.publishedAt,
  });
}

for (const hub of CONTENT_HUBS) {
  const count = BLOG_POSTS.filter((p) => (p as Record<string, unknown>).hubSlug === hub.hubSlug).length;
  if (!isCategoryHubIndexable(hub.hubSlug, count)) continue;
  rows.push({
    url: categoryHubPath(hub.hubSlug),
    pageType: 'hub',
    title: hub.title ?? hub.hubSlug,
    hub: hub.hubSlug,
    wordCount: count,
  });
}

console.log(JSON.stringify(rows, null, 1));

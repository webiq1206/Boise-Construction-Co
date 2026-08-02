import { BLOG_POSTS } from '@/shared/blogContent';
import { GUIDE_PAGES } from '@/shared/guideContent';
import { guidePath } from '@/shared/contentHubs';
import { getBaseUrl } from '@/lib/seo';
import { SITE_CONFIG } from '@/shared/siteConfig';

/**
 * RSS 2.0 feed covering the guides and blog library.
 *
 * Feeds remain a primary discovery channel for aggregators, newsreaders, and
 * the crawlers behind AI answer engines: a single polled URL that reports what
 * changed and when, without re-crawling the whole site. Guides are listed
 * first because they are the citation-worthy pillar content.
 */
export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RSS requires RFC-822 dates; an invalid date is dropped rather than emitted. */
function toRfc822(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

interface FeedItem {
  title: string;
  url: string;
  description: string;
  published: string;
  author: string;
  category: string;
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/$/, '');

  const guideItems: FeedItem[] = GUIDE_PAGES.map((guide) => ({
    title: guide.title,
    url: `${baseUrl}${guidePath(guide.slug)}`,
    description: guide.excerpt,
    published: guide.updatedAt || guide.publishedAt,
    author: guide.author,
    category: 'Guide',
  }));

  const postItems: FeedItem[] = BLOG_POSTS.map((post) => ({
    title: post.title,
    url: `${baseUrl}/blog/${post.slug}`,
    description: post.excerpt,
    published: post.updatedAt || post.publishedAt,
    author: post.author,
    category: post.category,
  }));

  const items = [...guideItems, ...postItems]
    .filter((item) => toRfc822(item.published) !== null)
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  const lastBuildDate = items.length
    ? toRfc822(items[0].published)
    : new Date().toUTCString();

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <pubDate>${toRfc822(item.published)}</pubDate>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_CONFIG.name)} | Home Building Guides and Insights</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Home building guides, cost breakdowns, lot evaluation, and permitting guidance for Boise and the Treasure Valley.</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

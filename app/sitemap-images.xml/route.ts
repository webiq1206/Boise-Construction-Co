import { BLOG_POSTS } from '@/shared/blogContent';
import { GUIDE_PAGES } from '@/shared/guideContent';
import { GALLERY_PROJECTS } from '@/shared/galleryData';
import { guidePath } from '@/shared/contentHubs';
import { getBlogHeroImage, getBlogImageAlt } from '@/shared/blogImages';
import { getBaseUrl } from '@/lib/seo';

/**
 * Google image sitemap. Image discovery is otherwise dependent on the crawler
 * parsing every page's markup; declaring images against the page they live on
 * gets the before/after project work and guide imagery indexed for Google
 * Images and gives AI systems captioned, attributable visual assets.
 *
 * Only images that genuinely appear on the referenced page are listed, and each
 * page appears exactly once with its images nested, per the sitemap spec.
 *
 * Hero images MUST be resolved through getBlogHeroImage(), not read off
 * post.heroImage / guide.heroImage directly. Those fields are optional
 * per-item OVERRIDES and are currently unset on all 52 posts and guides; the
 * image each page actually renders comes from BLOG_IMAGE_REGISTRY, keyed by
 * slug. Reading the raw field skipped every single entry, which is how this
 * sitemap shipped as an empty <urlset> - it served HTTP 200 with valid XML, so
 * nothing failed loudly, and Google Search Console reported only "Couldn't
 * fetch" against 0 discovered pages. app/blog/[slug] and app/guides/[slug]
 * both call the resolver, so going through it is also what keeps the sitemap
 * agreeing with the rendered page and with the Article schema's `image`.
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

interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

function absolute(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const byPage = new Map<string, SitemapImage[]>();

  const add = (pageUrl: string, image: SitemapImage) => {
    if (!image.loc) return;
    const existing = byPage.get(pageUrl) ?? [];
    // Guard against the same asset being declared twice for one page.
    if (existing.some((entry) => entry.loc === image.loc)) return;
    existing.push(image);
    byPage.set(pageUrl, existing);
  };

  // Before/after project work, declared on the service page that shows it.
  for (const project of GALLERY_PROJECTS) {
    const pageUrl = `${baseUrl}/services/${project.serviceType}`;
    add(pageUrl, {
      loc: absolute(project.afterImageUrl, baseUrl),
      title: `${project.title} (after)`,
      caption: project.description,
    });
    add(pageUrl, {
      loc: absolute(project.beforeImageUrl, baseUrl),
      title: `${project.title} (before)`,
      caption: project.description,
    });
  }

  for (const guide of GUIDE_PAGES) {
    add(`${baseUrl}${guidePath(guide.slug)}`, {
      loc: absolute(getBlogHeroImage(guide.slug, guide.heroImage), baseUrl),
      title: guide.title,
      // The registry alt describes the photograph; the excerpt describes the
      // article. <image:caption> is about the image, so the alt text is the
      // honest value here and the one already shown to assistive tech.
      caption: getBlogImageAlt(guide.slug),
    });
  }

  for (const post of BLOG_POSTS) {
    add(`${baseUrl}/blog/${post.slug}`, {
      loc: absolute(getBlogHeroImage(post.slug, post.heroImage), baseUrl),
      title: post.title,
      caption: getBlogImageAlt(post.slug),
    });
  }

  const urlXml = [...byPage.entries()]
    .map(([pageUrl, images]) => {
      const imageXml = images
        .map(
          (image) => `    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>${
        image.title ? `\n      <image:title>${escapeXml(image.title)}</image:title>` : ''
      }${
        image.caption ? `\n      <image:caption>${escapeXml(image.caption)}</image:caption>` : ''
      }
    </image:image>`
        )
        .join('\n');
      return `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
${imageXml}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlXml}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

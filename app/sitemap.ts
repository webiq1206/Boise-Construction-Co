import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { getXmlSitemapEntries } from '@/lib/siteUrls';

/**
 * Rendered from lib/siteUrls.ts. The HTML sitemap uses the full list.
 * sitemap.xml omits /sitemap and /instant-estimate, and any merged city URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return getXmlSitemapEntries().map((e) => ({
    url: e.path === '/' ? baseUrl : `${baseUrl}${e.path}`,
    // Static pages carry no lastModified: a build timestamp is not a content change.
    ...(e.lastModified ? { lastModified: e.lastModified } : {}),
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}

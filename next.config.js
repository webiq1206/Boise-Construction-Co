const path = require('path');
const {
  BLOG_REDIRECTS,
  GUIDE_REDIRECTS,
  HUB_REDIRECTS,
  SERVICE_SLUG_REDIRECTS,
} = require('./shared/content/contentRedirects');

process.env.WS_NO_BUFFER_UTIL = '1';
process.env.WS_NO_UTF_8_VALIDATE = '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  images: {
    // Optimization runs on the standalone Node server (output: 'standalone'),
    // so the optimizer stays enabled for responsive sizes (better LCP/CLS).
    //
    // AVIF is deliberately OFF. Encoding AVIF is many times more CPU-expensive
    // than WebP, and on the small Replit instance that made every uncached
    // image slow to first paint. Every source in public/images is already WebP,
    // so WebP output is close to a passthrough and AVIF bought almost nothing.
    formats: ['image/webp'],
    // Next defaults to 8 device widths x 8 image widths, so a single photo can
    // spawn a large matrix of on-demand encodes and cache misses. These trimmed
    // sets still cover phone / tablet / laptop / retina while cutting the number
    // of variants the server has to generate and keep warm.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [96, 256, 384],
    // Next defaults this to 60 SECONDS, so optimized variants expired and were
    // re-encoded about once a minute - the main reason images felt slow again
    // and again. Optimized URLs are keyed by src + width + quality, so a long
    // TTL is safe: changing an image changes its URL.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  trailingSlash: false,
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/shared': path.resolve(__dirname, 'shared'),
      '@shared': path.resolve(__dirname, 'shared'),
    };
    return config;
  },

  async redirects() {
    const r = (source, destination) => [
      { source, destination, permanent: true },
      { source: source + '/', destination, permanent: true },
    ];

    const redirects = [];

    // www.boiseconstruction.co answers 200 with the same content as the apex host. The
    // canonical tag already points at the apex, but a single host is cleaner
    // for crawlers and analytics, so the www variant redirects permanently.
    redirects.push({
      source: '/:path*',
      has: [{ type: 'host', value: 'www.boiseconstruction.co' }],
      destination: 'https://boiseconstruction.co/:path*',
      permanent: true,
    });

    // Legacy page aliases → canonical BRC routes
    const pageAliases = {
      '/about-us': '/about',
      '/our-story': '/',
      '/meet-the-team': '/',
      '/contact-us': '/contact',
      '/get-in-touch': '/#consult',
      '/get-quote': '/#consult',
      '/free-quote': '/#consult',
      // Estimator intent resolves to /estimate, which is a real page carrying
      // the calculator, its own metadata and canonical, and sitemap priority
      // 0.9. It used to be listed here as a redirect source itself, pointing at
      // the homepage anchor. redirects() runs before filesystem routes, so the
      // page was shadowed by its own alias and never served: the footer CTA,
      // the contact page and the RE-10 page all bounced to /#calculator, and
      // the sitemap advertised a URL that 301'd.
      '/free-estimate': '/estimate',
      '/request-quote': '/#consult',
      '/request-estimate': '/estimate',
      '/get-estimate': '/estimate',
      '/get-a-quote': '/#consult',
      '/get-a-free-quote': '/#consult',
      '/quote': '/#consult',
      // The gallery and testimonials both described fabricated remodels and
      // were retired with the repositioning. Until real finished homes exist to
      // show, every "see your work" intent resolves to the services index,
      // which is the closest honest answer.
      '/portfolio': '/services',
      '/gallery': '/services',
      '/our-work': '/services',
      '/projects': '/services',
      '/testimonials': '/about',
      '/reviews': '/about',
      '/our-reviews': '/about',
      '/our-services': '/#services',
      '/all-services': '/',
      '/pricing': '/estimate',
      '/our-pricing': '/estimate',
      '/rates': '/estimate',
      '/faq': '/',
      '/frequently-asked-questions': '/',
      '/commercial': '/',
      '/commercial-services': '/',
      '/seasonal': '/',
      '/seasonal-services': '/',
      '/seasonal-guide': '/',
      '/news': '/blog',
      '/privacy': '/privacy-policy',
      '/terms': '/terms-of-service',
      '/terms-and-conditions': '/terms-of-service',
      '/home': '/',
      '/index': '/',
      '/index.html': '/',
      '/index.php': '/',
      '/site-map': '/sitemap',
      '/careers': '/',
      '/jobs': '/',
      '/employment': '/',
      '/wp-admin': '/',
      '/wp-login': '/',
      '/wp-login.php': '/',
    };

    for (const [source, destination] of Object.entries(pageAliases)) {
      redirects.push(...r(source, destination));
    }

    // Remodeling-to-construction repositioning. See
    // shared/content/contentRedirects.js for why each destination was chosen.
    for (const map of [BLOG_REDIRECTS, GUIDE_REDIRECTS, HUB_REDIRECTS]) {
      for (const [source, destination] of Object.entries(map)) {
        redirects.push(...r(source, destination));
      }
    }

    // Renamed downloads. A PDF URL is the kind of link that gets pasted into an
    // email and clicked a year later, so the old filenames keep resolving.
    redirects.push(
      ...r('/downloads/remodel-budget-worksheet.pdf', '/downloads/new-home-budget-worksheet.pdf'),
      ...r('/downloads/kitchen-bath-planning-checklist.pdf', '/downloads/lot-evaluation-checklist.pdf'),
    );

    // Retired service slugs, both the service page and every city variant. The
    // city is preserved across the redirect so a Nampa visitor stays on a Nampa
    // page - dropping them on the Boise page would lose the local intent that
    // made the URL worth ranking.
    for (const [oldSlug, newSlug] of Object.entries(SERVICE_SLUG_REDIRECTS)) {
      redirects.push(...r(`/services/${oldSlug}`, `/services/${newSlug}`));
      redirects.push({
        source: `/services/${oldSlug}/:city`,
        destination: `/services/${newSlug}/:city`,
        permanent: true,
      });
    }

    return redirects;
  },
}

module.exports = nextConfig

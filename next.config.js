const path = require('path');

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
    unoptimized: true,
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

    // Legacy page aliases → canonical BRC routes
    const pageAliases = {
      '/about-us': '/about',
      '/our-story': '/',
      '/meet-the-team': '/',
      '/contact-us': '/contact',
      '/get-in-touch': '/#consult',
      '/get-quote': '/#consult',
      '/free-quote': '/#consult',
      '/free-estimate': '/#calculator',
      '/request-quote': '/#consult',
      '/request-estimate': '/#consult',
      '/get-estimate': '/#calculator',
      '/get-a-quote': '/#consult',
      '/get-a-free-quote': '/#consult',
      '/quote': '/#consult',
      '/estimate': '/#calculator',
      '/portfolio': '/testimonials',
      '/gallery': '/#gallery',
      '/our-work': '/testimonials',
      '/projects': '/testimonials',
      '/reviews': '/testimonials',
      '/our-reviews': '/testimonials',
      '/our-services': '/#services',
      '/all-services': '/',
      '/pricing': '/#calculator',
      '/our-pricing': '/#calculator',
      '/rates': '/#calculator',
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
      '/sitemap': '/sitemap.xml',
      '/site-map': '/sitemap.xml',
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

    const blogRedirects = {
      '/blog/kitchen-remodel-cost-treasure-valley': '/blog/kitchen-remodel-cost-boise',
      '/blog/bathroom-remodel-cost-idaho': '/blog/bathroom-remodel-cost-boise',
      // ROI near-duplicate consolidation (audit §D)
      '/blog/kitchen-roi-remodeling': '/blog/kitchen-remodel-roi',
      '/blog/bathroom-roi-remodeling': '/blog/bathroom-remodel-roi',
    };
    for (const [source, destination] of Object.entries(blogRedirects)) {
      redirects.push(...r(source, destination));
    }

    return redirects;
  },
}

module.exports = nextConfig

import type { Metadata, Viewport } from 'next'
import { Montserrat, Libre_Baskerville } from 'next/font/google'
import { Navigation } from '@/components/Navigation'
import { ConditionalFooter } from '@/components/ConditionalFooter'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/Providers'
import { ScrollToTop } from '@/components/ScrollToTop'
import { SITE_TAGLINE } from '@/shared/siteContent'
import { SITE_CONFIG } from '@/shared/siteConfig'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { MetaPixel } from '@/components/MetaPixel'
import { MicrosoftClarity } from '@/components/MicrosoftClarity'
import { ConversionTracking } from '@/components/ConversionTracking'
import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
})

// Libre Baskerville Italic is the brand's accent typeface (the italic "Co." in
// the wordmark and "Construction" in the seal). It carries every decorative
// serif moment on the site so type matches the approved marks. Only 400/700 ship.
const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    /*
     * Leads with the primary commercial term rather than the brand. Ahrefs
     * (US, 2026-08): "custom home builder boise" ~150/mo and low difficulty is
     * the strongest buy-intent phrase for what the company does, and it was
     * absent from the homepage title, which led with "Treasure Valley Home
     * Builder". "Treasure Valley" still carries the 200/mo regional term through
     * the description, the service title, and every location page, so nothing is
     * lost by putting Boise + the service first here. 58 chars incl. the brand.
     */
    default: `Custom Home Builder in Boise, Idaho | ${SITE_CONFIG.name}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: `Boise custom home builder and new home construction across Meridian, Eagle, Nampa, Kuna & the Treasure Valley. Custom and semi-custom homes, design-build, and builds on your lot, with a line-item budget before we break ground.`,
  manifest: '/site.webmanifest',
  // Feed discovery for readers, aggregators, and AI/answer-engine crawlers.
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: `${SITE_CONFIG.name} | Home Building Guides and Insights` },
      ],
    },
  },
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  /*
   * Bing Webmaster Tools site verification.
   *
   * Kept here rather than as a one-off file in public/ so it travels with the
   * rest of the head metadata and survives a rebuild. Bing re-checks this tag
   * periodically, not just once: removing it after verification succeeds
   * un-verifies the site, which is why it is a permanent part of the layout
   * rather than something to clean up later.
   */
  verification: {
    other: { 'msvalidate.01': '3AE4F733FD62C188FB58F0DD6F2C8D23' },
  },
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  // Favicon set built from the approved small-size brand icon (ochre field, the
  // script "C" initial), the mark the brand kit specifies for favicons and app
  // icons, since the seal's arc text stops reading below ~160px.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} | Treasure Valley Home Builder`,
    description: `${SITE_TAGLINE}. Custom homes, semi-custom homes, build-on-your-lot, and design-build across the Treasure Valley.`,
    images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} | Treasure Valley Home Builder`,
    description: `${SITE_TAGLINE}. Design-build home building for Boise and the Treasure Valley.`,
    images: ['/images/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#2C302F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on notched devices, so
  // sticky bottom bars clear the iPhone home indicator.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${montserrat.variable} ${libreBaskerville.variable}`} style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <noscript>
          <style>{`.reveal-init{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>
          <ScrollToTop />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:shadow-lg"
          >
            Skip to content
          </a>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <ConditionalFooter />
          </div>
          <Toaster />
          <AssistantWidget />
        </Providers>
        <GoogleAnalytics />
        <MetaPixel />
        <MicrosoftClarity />
        <ConversionTracking />
      </body>
    </html>
  )
}

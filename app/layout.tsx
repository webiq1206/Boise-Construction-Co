import type { Metadata, Viewport } from 'next'
import { Montserrat, Fraunces } from 'next/font/google'
import { Navigation } from '@/components/Navigation'
import { ConditionalFooter } from '@/components/ConditionalFooter'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/Providers'
import { ScrollToTop } from '@/components/ScrollToTop'
import { SITE_TAGLINE } from '@/shared/siteContent'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Boise Remodeling Co | Treasure Valley Design-Build',
    template: '%s | Boise Remodeling Co',
  },
  description: `Design-build remodeling for Boise, Meridian, Eagle, Nampa & the Treasure Valley. Clear expectations and budget guidance. Schedule a free in-home consultation.`,
  manifest: '/site.webmanifest',
  authors: [{ name: 'Boise Remodeling Co' }],
  creator: 'Boise Remodeling Co',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://boiseremodeling.co'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Boise Remodeling Co',
    title: 'Boise Remodeling Co | Treasure Valley Design-Build',
    description: `${SITE_TAGLINE}. Kitchen, bathroom, whole-home, and addition remodeling across the Treasure Valley.`,
    images: [{ url: '/images/hero-remodel-interior.png', width: 1200, height: 630, alt: 'Boise Remodeling Co' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boise Remodeling Co | Treasure Valley Design-Build',
    description: `${SITE_TAGLINE}. Design-build remodeling for Boise and the Treasure Valley.`,
    images: ['/images/hero-remodel-interior.png'],
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
  themeColor: '#3A3E3D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
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
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <ConditionalFooter />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

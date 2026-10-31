import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { PrimaryCta } from '@/components/approved/PrimaryCta';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { fitDescription } from '@/lib/page-metadata';
import {
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { Metadata } from 'next';
import Link from 'next/link';

const PATH = '/re-10-repairs-boise';
// Boise Handyman Co owns the RE-10 page. Canonical tag only, pending confirmation. Do not 301 this route.
const RE10_CANONICAL = 'https://boisehandyman.co/re-10-repairs-boise';

const TITLE_WITH_BRAND = 'RE-10 Repairs in Boise | Boise Construction Co';
const TITLE = 'RE-10 and Inspection Repairs in Boise';
const DESCRIPTION = fitDescription(
  'RE-10 and inspection repair lists in Boise are handled by Boise Handyman Co. Continue there for written pricing before work starts.',
);

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: TITLE_WITH_BRAND },
    description: DESCRIPTION,
    alternates: { canonical: RE10_CANONICAL },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: RE10_CANONICAL,
      type: 'website',
      images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: ['/images/og-default.png'],
    },
  },
  '/re-10-repairs-boise',
);

export default function Re10RepairsPage() {
  const schemas = [
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: PATH,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'RE-10 Repairs', url: PATH },
    ]),
  ];

  return (
    <InteriorPage kind="detail">
      <>
        <JsonLd data={schemas} />
        <InteriorHero layout="editorial">
          <p className="ed-eyebrow">Inspection repairs</p>
          <h1 className="ed-display ed-statement-display mb-6">
            RE-10 repairs in Boise
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
            RE-10 and inspection repair lists for Boise and the Treasure Valley are handled by Boise Handyman Co,
            with one written price before work starts. Continue there to send your list and photos.
          </p>
          <PrimaryCta href={RE10_CANONICAL} trackingLocation="re10_referral">Go to Boise Handyman Co</PrimaryCta>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for a new home or ADU instead?{' '}
            <Link href="/estimate" className="underline underline-offset-2">
              Request a quote
            </Link>{' '}
            from Boise Construction Co.
          </p>
        </InteriorHero>
      </>
    </InteriorPage>
  );
}

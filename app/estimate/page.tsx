import { InteriorPage } from '@/components/approved/InteriorLayout';
import { QuoteRequestWizard } from '@/components/QuoteRequestWizard';
import { JsonLd } from '@/components/seo/JsonLd';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical, fitDescription } from '@/lib/page-metadata';
import { generateBreadcrumbSchema, generateWebPageSchema } from '@/lib/schema';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { Metadata } from 'next';

const TITLE = 'Request a quote';
const DESCRIPTION = fitDescription(
  'Request a quote for a custom home, semi-custom home, ADU, or addition in Boise and the Treasure Valley. We reply within one business day.',
);

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
    description: DESCRIPTION,
    alternates: { canonical: buildCanonical('/estimate') },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: buildCanonical('/estimate'),
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
  '/estimate',
);

export default function EstimatePage() {
  const schemas = [
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: '/estimate',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Request a quote', url: '/estimate' },
    ]),
  ];

  return (
    <InteriorPage kind="estimate">
      <>
        <JsonLd data={schemas} />
        {/* D2 / C10: AppFrame owns the viewport; promotional bottom bar is hidden for the flow. */}
        <QuoteRequestWizard mode="app" />
        {/* Spacer so InteriorPage layout does not collapse behind the fixed AppFrame. */}
        <div aria-hidden="true" className="min-h-[70vh]" />
      </>
    </InteriorPage>
  );
}

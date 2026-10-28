import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { ConsultationForm } from '@/components/ConsultationForm';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Section } from '@/components/marketing/Section';
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
        <InteriorHero layout="editorial">
          <p className="ed-eyebrow">Planning conversation</p>
          <h1 className="ed-display ed-statement-display mb-6">{TITLE}</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Tell us what you want to build and where. Our team replies within one business day with the next step,
            usually a planning conversation about your lot, scope, and budget.
          </p>
        </InteriorHero>
        <Section divider className="scroll-mt-16">
          <div className="ed-shell max-w-3xl">
            <MarketingCard padding="lg">
              <ConsultationForm />
            </MarketingCard>
          </div>
        </Section>
      </>
    </InteriorPage>
  );
}

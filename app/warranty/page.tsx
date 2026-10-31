import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { Section } from '@/components/marketing/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { PrimaryCta } from '@/components/approved/PrimaryCta';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical, fitDescription } from '@/lib/page-metadata';
import { generateBreadcrumbSchema, generateFAQSchema, generateWebPageSchema } from '@/lib/schema';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { Metadata } from 'next';
import Link from 'next/link';

const TITLE = 'New Home Warranty in Boise, Idaho';
const DESCRIPTION = fitDescription(
  'New home warranty from Boise Construction Co: 1-year workmanship on new builds. Ask whether a 10-year structural warranty applies to your contract.',
);

const FAQS = [
  {
    question: 'What workmanship warranty do you provide on a new build?',
    answer:
      'Boise Construction Co provides a 1-year workmanship warranty on new builds. If something we built or installed fails because of workmanship, rather than normal wear, deferred maintenance, or later modifications, we come back and fix it.',
  },
  {
    question: 'Do you offer a 10-year structural warranty?',
    answer:
      'Ask us whether a 10-year structural warranty applies to your contract. It is offered on some projects and is not claimed here as always included.',
  },
  {
    question: 'How do manufacturer warranties work?',
    answer:
      'We pass through manufacturer warranties on products we install, including appliances, windows, roofing, and mechanical equipment, according to each maker\'s terms.',
  },
];

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
    description: DESCRIPTION,
    alternates: { canonical: buildCanonical('/warranty') },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: buildCanonical('/warranty'),
      type: 'website',
      images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
  },
  '/warranty',
);

export default function WarrantyPage() {
  const schemas = [
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: '/warranty',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Warranty', url: '/warranty' },
    ]),
    generateFAQSchema(FAQS),
  ];

  return (
    <InteriorPage kind="warranty">
      <>
        <JsonLd data={schemas} />
        <InteriorHero layout="editorial">
          <p className="ed-eyebrow">After you move in</p>
          <h1 className="ed-display ed-statement-display mb-6">
            New home warranty in Boise, Idaho
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
            New home warranty coverage from Boise Construction Co starts with a 1-year workmanship warranty on new builds.
            Ask us whether a 10-year structural warranty applies to your contract.
          </p>
          <PrimaryCta trackingLocation="warranty_hero">{CTA_PRIMARY}</PrimaryCta>
        </InteriorHero>

        <Section divider>
          <div className="ed-shell max-w-3xl space-y-8">
            <div>
              <h2 className="ed-h2 mb-4">What the 1-year workmanship warranty covers</h2>
              <p className="ed-body text-muted-foreground">
                Workmanship on the home we build: if a failure traces to how we built or installed something,
                we return and correct it during the warranty term. Normal wear, deferred maintenance, owner
                modifications, and manufacturer defects fall outside workmanship coverage.
              </p>
            </div>
            <div>
              <h2 className="ed-h2 mb-4">Structural coverage</h2>
              <p className="ed-body text-muted-foreground">
                A 10-year structural warranty may apply on some contracts. Confirm with us before you treat it as
                included. The written contract states which warranty documents apply to your build.
              </p>
            </div>
            <div>
              <h2 className="ed-h2 mb-4">Common questions</h2>
              <div className="divide-y divide-border border-y border-border">
                {FAQS.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="cursor-pointer text-base font-medium">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn more about who you are hiring on our{' '}
              <Link href="/about" className="underline underline-offset-2">
                About
              </Link>{' '}
              page.
            </p>
          </div>
        </Section>
      </>
    </InteriorPage>
  );
}

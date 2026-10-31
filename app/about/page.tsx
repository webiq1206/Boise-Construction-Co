import { CONCEPT_IMAGERY_LABEL, InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { AreaCard } from '@/components/marketing/AreaCard';
import { Section } from '@/components/marketing/Section';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { CITIES, TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { CONTRACTOR_REGISTRATION_LABEL } from '@/shared/contractorRegistration';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const ABOUT_FAQS = [
  {
    question: 'What is Boise Construction Co?',
    answer:
      'Boise Construction Co is a design-build home builder in Meridian, Idaho, and one of the companies of P5 Home Co. It builds custom and semi-custom homes and ADUs across the Treasure Valley under one accountable team.',
  },
  {
    question: 'Who runs Boise Construction Co?',
    answer:
      'Nick Perkins, a construction project manager with a bachelor\'s degree in Construction with an emphasis in Project Management, and more than a decade of work from small renovations to multimillion-dollar custom homes. He founded P5 in Colorado in 2020 and moved the family and the company to the Treasure Valley in 2025.',
  },
  {
    question: 'Are you a registered contractor?',
    answer: `Yes. ${CONTRACTOR_REGISTRATION_LABEL}. Insured; certificate on request.`,
  },
];

const CONSTRUCTION_STANDARDS = [
  'Line-item budget before ground breaks',
  'Allowances set at real local pricing',
  'Site costs on their own lines',
  'Lender draw and inspection scheduling',
  'Friday written update through the build',
];

const SPEAKABLE_SUMMARY =
  'Boise Construction Co is a design-build home builder in Meridian, Idaho, run by Nick Perkins. It builds custom and semi-custom homes and ADUs across the Treasure Valley.';

function HeroBreadcrumbs() {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'About' },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-foreground/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-inverse-foreground transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-inverse-foreground font-normal' : ''}>{item.name}</span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const metadata = withBrandPageMetadata(
  buildPageMetadata({
    kind: 'about',
    path: '/about',
  }),
  '/about',
);

export default function AboutPage() {
  const schemas = [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `About ${SITE_CONFIG.name}`,
      description:
        'About Boise Construction Co: founder Nick Perkins, custom and semi-custom homes and ADUs, and the P5 Home Co standard in the Treasure Valley.',
      url: '/about',
      speakable: true,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' },
    ]),
    generateFAQSchema(ABOUT_FAQS),
  ];

  return (
    <InteriorPage kind="about">
      <>
        <JsonLd data={schemas} />
        <div className="flex flex-col">
          <InteriorHero layout="editorial" peopleSafe imageLabel={false} imageSrc="/images/about/perkins-family-meridian-idaho.webp" imageAlt="Nick Perkins with his wife and five children at a pumpkin patch">
            <HeroBreadcrumbs />
            <p data-speakable="summary" className="sr-only">
              {SPEAKABLE_SUMMARY}
            </p>
            <p className="ed-eyebrow" style={{ color: 'rgb(255 255 255 / 0.72)' }}>
              Real people. A higher standard.
            </p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground mb-8">
              About Boise Construction Co
            </h1>
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-4">
              Boise Construction Co is a design-build home builder in Meridian, Idaho, and one of the companies of P5 Home Co.
              It is run by Nick Perkins, a construction project manager with a bachelor&apos;s degree in Construction with an
              emphasis in Project Management, and more than a decade of work from small renovations to multimillion-dollar
              custom homes. He founded P5 in Colorado in 2020 and moved the family and the company to the Treasure Valley in
              2025. Read the full story on{' '}
              <a href="https://p5homeco.com/about" rel="noopener" className="underline underline-offset-2">
                p5homeco.com/about
              </a>
              .
            </p>
            <p className="text-base md:text-lg text-inverse-foreground/75 max-w-2xl leading-relaxed mb-8">
              {CONTRACTOR_REGISTRATION_LABEL}. Insured, certificate on request. 1-year workmanship warranty on new builds (
              <Link href="/warranty" className="underline underline-offset-2">
                warranty details
              </Link>
              ).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-8">
              <ConsultCTA variant="brand">
                {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
              </ConsultCTA>
              <Button variant="heroOutline" asChild>
                <a href="/#consult">{CTA_SECONDARY}</a>
              </Button>
            </div>
          </InteriorHero>

          <Section divider>
            <div className="ed-shell max-w-3xl space-y-6">
              <SectionHeader
                eyebrow="What we build"
                title={<>Custom homes, semi-custom homes, and ADUs</>}
                description="We build on your lot or a lot we help you evaluate. Remodels sit with Boise Remodeling Co; RE-10 lists sit with Boise Handyman Co."
                className="mb-0 max-w-none"
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. See{' '}
                <Link href="/services/adu" className="underline underline-offset-2">
                  ADUs &amp; guest houses
                </Link>
                .
              </p>
            </div>
          </Section>

          <Section variant="greige" divider>
            <div className="ed-shell max-w-3xl">
              <SectionHeader
                eyebrow="How we work"
                title={<>Five things every Construction project includes</>}
                className="mb-8 max-w-none"
              />
              <ul className="grid gap-3 sm:grid-cols-1">
                {CONSTRUCTION_STANDARDS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-muted-foreground leading-relaxed">
                The P5 standard is simple: one written scope before any price, a weekly written update, and a workmanship
                warranty you can read before you sign.
              </p>
              <div className="mt-8 pt-8 border-t border-border">
                <p className="ed-eyebrow">Where the budget lands</p>
                <h3 className="ed-h4">Your budget builds the house, not the company</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A larger builder&apos;s offices, model homes, and branded trucks are real costs, and they are quietly
                  recovered inside the price per square foot you are quoted. We keep our footprint small on purpose, so a
                  bigger share of what you spend goes into the foundation, the framing, the envelope, and the finishes you
                  chose.
                </p>
              </div>
            </div>
          </Section>

          <section className="relative bg-[#f1ede4]" aria-label="The Perkins family">
            <Image
              src="/images/about/perkins-family-meridian-idaho.webp"
              alt="Nick Perkins with his wife and five children at a pumpkin patch"
              width={2048}
              height={2048}
              sizes="100vw"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
            <p className="px-6 py-4 ed-small text-muted-foreground">The Perkins family</p>
          </section>

          <Section divider>
            <div className="container px-4 max-w-3xl">
              <h2 className="ed-h2 mb-6">Common questions</h2>
              <div className="divide-y divide-border border-y border-border">
                {ABOUT_FAQS.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="cursor-pointer text-base font-medium">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                Boise Construction Co is a trade name of P5 Home Co LLC. Related companies:{' '}
                <a href="https://boiseremodeling.co" rel="noopener" className="underline underline-offset-2">
                  Boise Remodeling Co
                </a>
                ,{' '}
                <a href="https://boisehandyman.co" rel="noopener" className="underline underline-offset-2">
                  Boise Handyman Co
                </a>
                , and{' '}
                <a href="https://boisecabinet.co" rel="noopener" className="underline underline-offset-2">
                  Boise Cabinet Co
                </a>
                .
              </p>
            </div>
          </Section>

          <Section divider>
            <div className="container px-4 max-w-5xl">
              <SectionHeader
                eyebrow="Treasure Valley"
                size="display"
                title={
                  <>
                    Service <em className="brc-accent">areas</em>
                  </>
                }
                description={`We serve homeowners in ${TREASURE_VALLEY_CITIES}, and surrounding communities.`}
                className="max-w-3xl"
              />
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {CITIES.map((city, i) => (
                  <Reveal key={city.slug} delay={Math.min(i, 7) * 50}>
                    <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                  </Reveal>
                ))}
              </div>
              <p className="ed-small mt-4 text-muted-foreground">{CONCEPT_IMAGERY_LABEL}</p>
            </div>
          </Section>

          <Section surface="gradient" spacing="xl" edge>
            <div className="ed-shell">
              <div className="ed-split ed-split-center">
                <h2 className="ed-h2-sm ed-statement-wide">Ready to start your project?</h2>
                <div>
                  <p className="ed-body">
                    Request a quote and we reply within one business day with the next planning step.
                  </p>
                  <div className="mt-8">
                    <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </>
    </InteriorPage>
  );
}

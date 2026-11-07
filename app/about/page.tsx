import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { AreaCard } from '@/components/marketing/AreaCard';
import { Section } from '@/components/marketing/Section';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { HeroTextLink, PrimaryCta } from '@/components/approved/PrimaryCta';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
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
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const ABOUT_FAQS = [
  {
    question: 'What is Boise Construction Co?',
    answer:
      'Boise Construction Co is a design-build home builder in Meridian, Idaho, and one of the companies of P5 Home Co. It builds custom and semi-custom homes across the Treasure Valley. ADUs are built by our sister company Boise ADU Co, part of P5 Home Co.',
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
  {
    question: 'How will I know where my build stands?',
    answer:
      'You get written progress updates through the build, and we schedule lender draws and inspections for you.',
  },
  {
    question: 'Can you build on my lot?',
    answer:
      'Yes. We build on land you already own, starting with a lot evaluation so site needs and permits are clear before design.',
  },
];

const CONSTRUCTION_STANDARDS = [
  'Line-item budget before ground breaks',
  'Allowances set at real local pricing',
  'Site costs on their own lines',
  'Lender draw and inspection scheduling',
  'Written progress updates through the build',
];

const ABOUT_ANSWER =
  'Plan your Treasure Valley home with clear responsibilities from design through construction. Boise Construction Co is a design-build home builder and part of P5 Home Co. Your project scope sets out a line-item budget before groundbreaking, lender draw and inspection scheduling, and written progress updates.';

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
        'About Boise Construction Co: founder Nick Perkins, custom and semi-custom homes across the Treasure Valley. ADUs are built by our sister company Boise ADU Co, part of P5 Home Co.',
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
          <InteriorHero layout="editorial">
            <HeroBreadcrumbs />
            <p className="ed-eyebrow">Real people. A higher standard.</p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground">
              About Boise Construction Co
            </h1>
            <p className="interior-hero-answer" data-speakable="summary">
              {ABOUT_ANSWER}
            </p>
            {/* One support line; the founder and registration detail opens the
                first section below the photo (C3 hero budget). */}
            <p className="interior-hero-support">
              Boise Construction Co is a design-build home builder in Meridian, Idaho, and one of the companies of P5 Home Co.
            </p>
            <div className="interior-hero-actions">
              <PrimaryCta href={SITE_CONFIG.phoneHref} trackingLocation="about_hero">Call or text us about your project.</PrimaryCta>
              <HeroTextLink href={SITE_CONFIG.phoneSmsHref}>Text {SITE_CONFIG.phone}</HeroTextLink>
              <HeroTextLink href="/estimate">{CTA_PRIMARY}</HeroTextLink>
            </div>
          </InteriorHero>

          {/* Who runs it: the lede beside the one family photograph, full and never
              cropped, capped to the copy's height instead of a 2560px frame across
              the whole shell. */}
          <Section divider className="pt-0">
            <div className="ed-shell">
              <div className="ed-split ed-split-narrow ed-split-center">
                <Reveal>
                  <p className="ed-eyebrow">The founder</p>
                  <p className="ed-lede">
                    It is run by Nick Perkins, a construction project manager with a bachelor&apos;s degree in Construction with an
                    emphasis in Project Management, and more than a decade of work from small renovations to multimillion-dollar
                    custom homes. He founded P5 in Colorado in 2020 and moved the family and the company to the Treasure Valley in
                    2025. Read the full story on{' '}
                    <a href="https://p5homeco.com/about" rel="noopener" className="underline underline-offset-2">
                      p5homeco.com/about
                    </a>
                    .
                  </p>
                  <p className="ed-small mt-6 max-w-2xl">
                    {CONTRACTOR_REGISTRATION_LABEL}. Insured; certificate on request.
                  </p>
                </Reveal>
                <img
                  className="people-safe-photo h-auto w-full"
                  src="/images/about/perkins-family-meridian-idaho.webp"
                  alt="Nick Perkins with his wife and five children at a pumpkin patch"
                  width={2560}
                  height={1920}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          </Section>
          <Section divider>
            <div className="ed-shell">
              <div className="ed-split ed-split-narrow">
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <p className="ed-eyebrow">What we build</p>
                  <h2 className="ed-h2 ed-statement">
                    Custom homes and semi-custom homes. ADUs are built by our sister company{' '}
                    <a href="https://p5homeco.com/quote/adu" rel="noopener" className="underline underline-offset-2">Boise ADU Co</a>
                    , part of P5 Home Co.
                  </h2>
                </div>
                <Reveal>
                  <p className="ed-lede">
                    We build on your lot or a lot we help you evaluate. Remodels sit with Boise Remodeling Co; RE-10 lists sit with Boise Handyman Co.
                  </p>
                  <p className="ed-body mt-6">
                    <a href="https://p5homeco.com/quote/adu" rel="noopener" className="underline underline-offset-2">
                      ADUs: Boise ADU Co
                    </a>
                  </p>
                </Reveal>
              </div>
            </div>
          </Section>
          <Section variant="greige" divider>
            <div className="ed-shell">
              <p className="ed-eyebrow">How we work</p>
              <h2 className="ed-h2 ed-statement">Know what your project includes before construction</h2>
              <ul className="ed-matrix mt-10 list-none p-0" style={{ '--ed-cell-h': '150px' } as React.CSSProperties}>
                {CONSTRUCTION_STANDARDS.map((item, i) => (
                  <li key={item} className="flex flex-col gap-4">
                    <span className="ed-step-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ed-h4">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="ed-split ed-split-narrow mt-12">
                <p className="ed-lede">
                  Understand your project before work starts, with a written scope before pricing and written progress updates through construction.
                </p>
                <div className="ed-inset">
                  <p className="ed-eyebrow">Where the budget lands</p>
                  <h3 className="ed-h3">Your budget builds the house, not the company</h3>
                  <p className="ed-body mt-3">
                    A larger builder&apos;s offices, model homes, and branded trucks are real costs, and they are quietly
                    recovered inside the price per square foot you are quoted. We keep our footprint small on purpose, so a
                    bigger share of what you spend goes into the foundation, the framing, the envelope, and the finishes you
                    chose.
                  </p>
                </div>
              </div>
            </div>
          </Section>
          {/* The Perkins family photo appears once, in the hero. */}
          <Section divider>
            <div className="ed-shell">
              <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Before you commit</p>
                <h2 className="ed-h2 ed-statement">Common questions</h2>
              </div>
              <div>
              <div className="divide-y divide-border border-y border-border">
                {ABOUT_FAQS.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="cursor-pointer ed-h4 py-2">{faq.question}</summary>
                    <p className="ed-body mt-3 pb-2">{faq.answer}</p>
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
              </div>
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

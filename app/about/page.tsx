import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import { DisplayNum, formatStepNumber, Section } from '@/components/marketing';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { Hairline } from '@/components/marketing/Hairline';
import { SITE_IMAGES } from '@/shared/siteImages';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Reveal } from '@/components/Reveal';
import { WhyChooseUsSection } from '@/components/sections/WhyChooseUsSection';
import { StatementBandSection } from '@/components/sections/StatementBandSection';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { CITIES, TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { HERO_STATS, PRINCIPLES, TRUST_ITEMS } from '@/shared/siteContent';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { Button } from '@/components/ui/button';
import { AreaCard } from '@/components/marketing/AreaCard';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { GRAIN_URL } from '@/lib/grain';
import { SITE_CONFIG } from '@/shared/siteConfig';

const SPEAKABLE_SUMMARY =
  'We are a locally owned design-build home builder serving the Treasure Valley. Our focus is clarity: a line-item budget before we break ground, a published draw schedule, weekly written updates, permits handled in-house for Ada and Canyon County, and a one-year workmanship warranty after you take possession.';

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
                <Link
                  href={item.href}
                  className="hover:text-inverse-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-inverse-foreground font-normal' : ''}>
                  {item.name}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const metadata = buildPageMetadata({
  kind: 'about',
  path: '/about',
});

export default function AboutPage() {
  const schemas = [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `About ${SITE_CONFIG.name}`,
      description:
        'Treasure Valley design-build home builder. Bonded, insured, and committed to clear communication.',
      url: '/about',
      speakable: true,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="flex flex-col pb-20 md:pb-0">
        {/* ─── Cinematic hero ─── */}
        <section className="relative min-h-[540px] md:min-h-[78vh] flex items-end overflow-hidden bg-inverse">
          <Image
            src={SITE_IMAGES.leadership}
            alt={`Representative framing work with a ${SITE_CONFIG.name} branded worker`}
            fill
            className="object-cover opacity-[0.82] img-brand-grade"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse/90 via-inverse/60 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/90 via-inverse/60 to-inverse/10" />
          <div className="absolute inset-x-0 top-0 h-44 pointer-events-none bg-gradient-to-b from-inverse/70 via-inverse/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }}
          />

          <div className="relative z-10 w-full container px-4 pb-14 md:pb-20 pt-10 fade-up">
            <HeroBreadcrumbs />
            <p data-speakable="summary" className="sr-only">
              {SPEAKABLE_SUMMARY}
            </p>
            <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>About us</p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground mb-8">
              About Boise Construction{' '}
              <em className="brc-accent">Co</em>
            </h1>
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-4">
              We are a locally owned design-build home builder serving the Treasure Valley. You work
              with one accountable team from the first conversation about your lot through the day
              you get the keys.
            </p>
            <p className="text-base md:text-lg text-inverse-foreground/75 max-w-2xl leading-relaxed mb-8">
              Our focus is clarity: a line-item budget before we break ground, a published draw
              schedule, a written update every week, permits handled in-house for Ada and Canyon
              County, and a one-year workmanship warranty. The point of all of it is simple - you
              always know what your home costs and where the build stands.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-8">
              <ConsultCTA variant="brand">
                {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
              </ConsultCTA>
              <Button variant="heroOutline" asChild>
                <a href="/#consult">{CTA_SECONDARY}</a>
              </Button>
            </div>
            <dl className="ed-hero-facts">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.num}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Design-build split ─── */}
        <Section variant="greige" spacing="none" divider className="p-0">
          <div id="team" className="grid md:grid-cols-2 overflow-hidden scroll-mt-24">
            <div className="relative min-h-[260px] md:min-h-[520px] overflow-hidden bg-inverse">
              <Image
                src={SITE_IMAGES.process}
                alt="Architectural drawings and finish selections for a Treasure Valley new home"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover img-brand-grade"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.028 }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>Design-build, explained</p>
                <p className="font-sans font-light text-xl md:text-2xl text-inverse-foreground">
                  One team from
                  <br />
                  concept to completion
                </p>
              </div>
            </div>

            <div className="section-y-sm px-8 md:px-14 lg:px-16 bg-card border-l border-border">
              <Reveal>
                <SectionHeader
                  eyebrow="Our model"
                  title={
                    <>
                      Design-build,{' '}
                      <em className="brc-accent">explained</em>
                    </>
                  }
                  description="Design-build means your designer, estimator, and construction lead work together under one roof. The plan, the budget, the engineering, and the permit set stay aligned, so the house you are shown in design is the house that gets priced and built."
                  className="mb-8 max-w-none"
                />
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Idaho contractor registration information is available upon request. We are bonded
                  and insured for residential construction across the Treasure Valley.
                </p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {TRUST_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="ed-eyebrow">Our commitment</p>
                  <h3 className="ed-h4">
                    One accountable team
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {SITE_CONFIG.name} has worked in Treasure Valley residential construction since
                    2020. One team leads every build from the first look at your lot through Ada and
                    Canyon County permitting to the final walkthrough, and stands behind a line-item budget
                    before we break ground and a one-year workmanship warranty after you move in.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                    New to building? Start with our{' '}
                    <Link
                      href="/guides/boise-home-building-cost-guide"
                      className="text-foreground underline underline-offset-2 hover:text-accent-legible"
                    >
                      Boise home building cost guide
                    </Link>{' '}
                    or explore our most requested service,{' '}
                    <Link
                      href="/services/custom-home-builder"
                      className="text-foreground underline underline-offset-2 hover:text-accent-legible"
                    >
                      custom home building in Boise
                    </Link>
                    .
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="ed-eyebrow">Where the budget lands</p>
                  <h3 className="ed-h4">
                    Your budget builds the house, not the company
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A larger builder's offices, model homes, and branded trucks are real costs, and
                    they are quietly recovered inside the price per square foot you are quoted. We keep
                    our footprint small on purpose, so a bigger share of what you spend goes into the
                    foundation, the framing, the envelope, and the finishes you chose - the parts of
                    the home you actually live with.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        <WhyChooseUsSection />

        <StatementBandSection />

        {/* ─── Principles ─── */}
        <Section variant="inverse" divider>
          <div className="container px-4 max-w-5xl">
            {/* Brand icon (ochre field) - bright badge on the dark band */}
            <img
              src="/brand/svg/icon/boise-construction-co-icon-accent.svg"
              alt="Boise Construction Co"
              width={72}
              height={72}
              className="h-16 w-16 md:h-[72px] md:w-[72px] mb-8"
            />
            <SectionHeader
              eyebrow="Our standards"
              inverse
              size="display"
              title={
                <>
                  Six principles we never{' '}
                  <em className="brc-accent">compromise</em> on
                </>
              }
              className="mb-0 max-w-3xl"
            />
            <Hairline inverse className="mt-8 mb-12" />
            <div className="ed-cards-3 gap-6">
              {PRINCIPLES.map(({ title, desc }, i) => (
                <Reveal key={title} delay={Math.min(i, 5) * 60}>
                  <div className="h-full">
                    <DisplayNum className="text-2xl text-inverse-foreground/50 leading-none mb-4 block">
                      {formatStepNumber(i)}
                    </DisplayNum>
                    <h3 className="ed-h4">
                      {title}
                    </h3>
                    <p className="text-sm text-inverse-muted leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Service areas ─── */}
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
            <div className="grid sm:grid-cols-3 gap-4">
              {CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={Math.min(i, 7) * 50}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Closing CTA ─── */}
        <Section surface="gradient" spacing="xl" edge>
          <div className="ed-shell">
            <div className="ed-split ed-split-center">
              <h2 className="ed-h2-sm ed-statement-wide">
                Ready to start your project?
              </h2>
              <div>
              <p className="ed-body">
                Schedule a free in-home visit for planning guidance, design direction, and an honest
                project range.
              </p>
              <div className="mt-8"><ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
            </div>

              </div></div>
          </div>
        </Section>
      </div>
    </>
  );
}

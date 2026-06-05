import { ArrowRight, Check, ChevronRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import { DisplayNum, Section } from '@/components/marketing';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { Hairline } from '@/components/marketing/Hairline';
import { SITE_IMAGES } from '@/shared/siteImages';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Reveal } from '@/components/Reveal';
import { StatementBandSection } from '@/components/sections/StatementBandSection';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { BUSINESS_INFO } from '@/lib/seo';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { CITIES, TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { CONSULT_BULLETS, HERO_STATS } from '@/shared/siteContent';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { EstimateCTA } from '@/components/modals/EstimateCTA';

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`;

const SPEAKABLE_SUMMARY =
  'Contact Boise Remodeling Co for a free consultation. Schedule a free 60 to 90 minute in-home visit, call our team, or use the project estimator to explore a planning range for your remodel.';

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(SITE_CONFIG.address.full)}`;

function HeroBreadcrumbs() {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'Contact' },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-muted">
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
                <span className={isLast ? 'text-inverse-foreground/90 font-medium' : ''}>
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

function StatCard({ num, label }: { num: string; label: string }) {
  return (
    <div className="px-3 py-3 md:px-6 md:py-5 rounded-sm bg-inverse-foreground/10 border border-inverse-foreground/15 backdrop-blur-sm">
      <DisplayNum className="text-inverse-foreground text-lg md:text-3xl leading-none">
        {num}
      </DisplayNum>
      <div className="mt-1 md:mt-1.5 text-[9px] md:text-[11px] tracking-[0.08em] md:tracking-[0.1em] uppercase text-inverse-muted leading-snug">
        {label}
      </div>
    </div>
  );
}

interface ContactChannelProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  subtext: string;
  featured?: boolean;
}

function ContactChannel({
  icon,
  label,
  href,
  external,
  children,
  subtext,
  featured,
}: ContactChannelProps) {
  const inner = (
    <MarketingCard
      className={`h-full transition-colors ${
        href ? 'group-hover:border-foreground/25' : ''
      } ${featured ? 'md:p-10' : ''}`}
      padding={featured ? 'lg' : 'default'}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="brc-label mb-2">{label}</p>
          <div
            className={`text-foreground ${featured ? 'text-xl md:text-2xl' : 'text-base'} ${
              href ? 'group-hover:text-foreground/70 transition-colors' : ''
            }`}
          >
            {children}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtext}</p>
        </div>
      </div>
    </MarketingCard>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block h-full group"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }

  return inner;
}

export const metadata = buildPageMetadata({
  kind: 'contact',
  path: '/contact',
});

export default function ContactPage() {
  const schemas = [
    generateLocalBusinessSchema(),
    generateWebPageSchema({
      title: 'Contact Boise Remodeling Co',
      description:
        'Schedule a free in-home consultation or call our Treasure Valley design-build team.',
      url: '/contact',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="flex flex-col pb-20 md:pb-0">
        {/* ─── Cinematic hero ─── */}
        <section className="relative min-h-[520px] md:min-h-[72vh] flex items-end overflow-hidden bg-inverse">
          <Image
            src={SITE_IMAGES.hero}
            alt="Modern luxury home interior remodel in Boise Idaho Treasure Valley"
            fill
            className="object-cover opacity-[0.82] img-brand-grade"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse via-inverse/60 to-inverse/10" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/70 via-inverse/20 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-inverse/70 via-inverse/30 to-transparent" />
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
            <div className="brc-label text-inverse-muted mt-6 mb-5">Get in touch</div>
            <h1 className="font-sans font-light text-display tracking-tight text-inverse-foreground max-w-4xl mb-6">
              Contact Boise Remodeling{' '}
              <em className="brc-accent text-accent">Co</em>
            </h1>
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-6">
              Schedule a free 60 to 90 minute in-home visit, call our team, or use the project
              estimator to explore a planning range for your remodel.
            </p>
            <a
              href={SITE_CONFIG.phoneHref}
              className="inline-block brc-display-num tabular-nums text-2xl md:text-3xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors mb-8"
            >
              {BUSINESS_INFO.phone}
            </a>
            <div className="flex flex-wrap gap-3 mb-8">
              <ConsultCTA variant="brand">
                {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
              </ConsultCTA>
              <EstimateCTA
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white"
              >
                {CTA_SECONDARY}
              </EstimateCTA>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              {HERO_STATS.map((stat) => (
                <StatCard key={stat.num} num={stat.num} label={stat.label} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Contact channels ─── */}
        <Section variant="greige" divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Reach us directly"
              size="display"
              title={
                <>
                  Every way to{' '}
                  <em className="brc-accent text-accent">connect</em>
                </>
              }
              description="Call, email, or visit - we respond within one business day and never use high-pressure sales tactics."
              className="max-w-3xl"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Reveal className="sm:col-span-2">
                <ContactChannel
                  icon={<Phone className="h-5 w-5" strokeWidth={1.5} />}
                  label="Call us"
                  href={SITE_CONFIG.phoneHref}
                  subtext="Mon – Fri 7 am – 6 pm · Sat 8 am – 4 pm"
                  featured
                >
                  <span className="brc-display-num tabular-nums">{BUSINESS_INFO.phone}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={60}>
                <ContactChannel
                  icon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
                  label="Email us"
                  href={`mailto:${BUSINESS_INFO.email}`}
                  subtext="Response within one business day"
                >
                  {BUSINESS_INFO.email}
                </ContactChannel>
              </Reveal>
              <Reveal delay={120}>
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Visit us"
                  href={MAPS_URL}
                  external
                  subtext="Treasure Valley · Ada and Canyon County"
                >
                  <address className="not-italic leading-relaxed">
                    {BUSINESS_INFO.address.street}
                    <br />
                    {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.state}{' '}
                    {BUSINESS_INFO.address.zip}
                  </address>
                </ContactChannel>
              </Reveal>
              <Reveal delay={180} className="sm:col-span-2">
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Service area"
                  subtext="Free in-home visits across the Treasure Valley"
                >
                  <span className="text-sm leading-relaxed">{TREASURE_VALLEY_CITIES}</span>
                </ContactChannel>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* ─── What to expect split ─── */}
        <Section variant="canvas" spacing="none" divider className="p-0">
          <div className="grid md:grid-cols-2 overflow-hidden">
            <div className="relative min-h-[260px] md:min-h-[520px] overflow-hidden bg-inverse order-2 md:order-1">
              <Image
                src={SITE_IMAGES.leadership}
                alt="Boise Remodeling Co team at a finished kitchen project"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover img-brand-grade"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/70" />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.028 }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <div className="brc-label mb-3 text-inverse-muted">Your free visit includes</div>
                <p className="font-sans font-light text-xl md:text-2xl text-inverse-foreground">
                  No pressure.
                  <br />
                  No pitch. Just answers.
                </p>
              </div>
            </div>

            <div className="section-y-sm px-8 md:px-14 lg:px-16 bg-card border-l border-border order-1 md:order-2">
              <Reveal>
                <SectionHeader
                  eyebrow="What to expect"
                  title={
                    <>
                      No pressure. No pitch.{' '}
                      <em className="brc-accent text-accent">Just answers.</em>
                    </>
                  }
                  description="Your free 60 to 90 minute in-home visit is focused on planning guidance and an honest project range - not a commission-driven pitch."
                  className="mb-8 max-w-none"
                />
                <ul className="flex flex-col gap-0 mb-8">
                  {CONSULT_BULLETS.map((bullet, i) => (
                    <li key={bullet}>
                      <div className="flex items-start gap-3 py-4">
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-base text-foreground">{bullet}</span>
                      </div>
                      {i < CONSULT_BULLETS.length - 1 && (
                        <Hairline spaced={false} className="my-0" />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                  <EstimateCTA variant="brandOutline">{CTA_SECONDARY}</EstimateCTA>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        <StatementBandSection />

        {/* ─── Service areas ─── */}
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Treasure Valley"
              size="display"
              title={
                <>
                  Where we <em className="brc-accent text-accent">work</em>
                </>
              }
              description={`We serve homeowners in ${TREASURE_VALLEY_CITIES}, and surrounding communities.`}
              className="max-w-3xl"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={Math.min(i, 7) * 50}>
                  <Link href={`/areas/${city.slug}`} className="block h-full group">
                    <MarketingCard className="h-full transition-colors group-hover:border-foreground/20">
                      <p className="font-sans font-medium text-sm text-foreground mb-0.5">
                        {city.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Idaho</p>
                    </MarketingCard>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Closing CTA ─── */}
        <Section divider spacing="sm">
          <div className="container px-4 max-w-2xl mx-auto">
            <Reveal>
              <MarketingCard className="cta-card-dark p-10 md:p-12 text-center">
                <h2 className="font-sans font-light text-section-title mb-4 text-inverse-foreground">
                  Prefer to talk first?
                </h2>
                <p className="text-base text-inverse-muted mb-2">
                  Call us directly - no phone tree, no sales scripts.
                </p>
                <a
                  href={SITE_CONFIG.phoneHref}
                  className="inline-block brc-display-num tabular-nums text-2xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors mb-8"
                >
                  {BUSINESS_INFO.phone}
                </a>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                  <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                  <EstimateCTA
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  >
                    {CTA_SECONDARY}
                  </EstimateCTA>
                </div>
              </MarketingCard>
            </Reveal>
          </div>
        </Section>
      </div>
    </>
  );
}

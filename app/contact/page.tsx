import { ArrowRight, Check, ChevronRight, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import { Section } from '@/components/marketing';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { Hairline } from '@/components/marketing/Hairline';
import { SITE_IMAGES } from '@/shared/siteImages';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Reveal } from '@/components/Reveal';
import { StatementBandSection } from '@/components/sections/StatementBandSection';
import { ConsultationForm } from '@/components/ConsultationForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateLocalBusinessSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { EmailLink } from '@/components/EmailLink';
import { BusinessPhoneContact } from '@/components/BusinessPhoneContact';
import { SaveContactLink } from '@/components/SaveContactLink';
import { BUSINESS_INFO } from '@/lib/seo';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { CITIES, TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { CONSULT_BULLETS, HERO_STATS } from '@/shared/siteContent';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Button } from '@/components/ui/button';
import { areaPath } from '@/lib/seo-routes';
import { EstimatePromptBand } from '@/components/marketing/EstimatePromptBand';
import { GRAIN_URL } from '@/lib/grain';

const CONTACT_FAQS = [
  {
    question: 'How quickly will you respond to my inquiry?',
    answer:
      'We respond within one business day. Call us during business hours for an immediate conversation, or submit the form and we will reach out to schedule your free planning consultation.',
  },
  {
    question: 'Is the planning consultation really free?',
    answer:
      'Yes. The 60 to 90 minute consultation is free with no obligation. We meet at our office, or on your lot if you already own one, and you leave with a budget band, a realistic schedule, and a read on what your site will require - never a high-pressure sales pitch.',
  },
  {
    question: 'Do I need to own land before I contact you?',
    answer:
      'No. Roughly half the people who call us are still looking. We will walk a lot with you before you buy and tell you what it will cost to build on, which is the single most useful thing you can know before making an offer.',
  },
  {
    question: 'What areas do you serve?',
    answer: `We build in ${TREASURE_VALLEY_CITIES}, and surrounding Treasure Valley communities across Ada and Canyon County.`,
  },
  {
    question: 'Do you handle permits?',
    answer:
      'Yes. Building permits, plan review, engineering, and utility applications are part of our design-build scope and handled in-house for both Ada and Canyon County jurisdictions.',
  },
  {
    question: 'How do I get a cost estimate for my home?',
    answer:
      'Use our online build cost estimator for an instant range, then book a free consultation for a written, line-item budget tailored to your plan and your lot.',
  },
];

const SPEAKABLE_SUMMARY =
  `Contact ${SITE_CONFIG.name} for a free consultation. Schedule a free 60 to 90 minute planning consultation, call our team, or use the build cost estimator to explore a range for your new home.`;

function HeroBreadcrumbs() {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'Contact' },
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

interface ContactChannelProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  subtext: string;
  featured?: boolean;
  /** Rendered below the card, outside any link wrapper (e.g. save-to-contacts). */
  companion?: React.ReactNode;
}

function ContactChannel({
  icon,
  label,
  href,
  external,
  children,
  subtext,
  featured,
  companion,
}: ContactChannelProps) {
  const inner = (
    <MarketingCard
      className={`h-full transition-colors ${
        href ? 'group-hover:border-foreground/25' : ''
      } ${featured ? 'md:p-10' : ''}`}
      padding={featured ? 'lg' : 'default'}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-accent-legible/10 text-accent-legible">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="ed-eyebrow !mb-2">{label}</p>
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
      <div className="h-full">
        <a
          href={href}
          className="block h-full group"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inner}
        </a>
        {companion ? <div className="mt-2 pl-14">{companion}</div> : null}
      </div>
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
      title: `Contact ${SITE_CONFIG.name}`,
      description:
        'Schedule a free planning consultation or call our Treasure Valley design-build home building team.',
      url: '/contact',
      speakable: true,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' },
    ]),
    generateFAQSchema(CONTACT_FAQS),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="flex flex-col pb-20 md:pb-0">
        {/* ─── Cinematic hero ─── */}
        <section className="relative min-h-[520px] md:min-h-[72vh] flex items-end overflow-hidden bg-inverse">
          <Image
            src={SITE_IMAGES.hero}
            alt="White board-and-batten home exterior with a covered front porch"
            fill
            className="object-cover opacity-[0.82] img-brand-grade"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse/90 via-inverse/60 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/60 via-inverse/15 to-transparent" />
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
            <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>Get in touch</p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground mb-8">
              Contact Boise Construction{' '}
              <em className="brc-accent">Co</em>
            </h1>
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-6">
              Schedule a free 60 to 90 minute planning consultation, call our team, or use the build
              cost estimator to explore a range for your new home.
            </p>
            <BusinessPhoneContact
              layout="stack"
              display
              phoneClassName="text-2xl md:text-3xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors"
              saveClassName="text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors"
              phoneTestId="link-hero-phone"
            />
            <a
              href={SITE_CONFIG.phoneSmsHref}
              className="block text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors mb-8"
              data-testid="link-hero-text"
            >
              Prefer to text? Message us instead
            </a>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-8">
              {/* Primary action on the contact page is the inline form below -
                  one tap from the hero. The estimator lives on the homepage. */}
              <Button variant="brand" asChild>
                <a href="#consult">
                  Request your free visit <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="heroOutline" asChild>
                <a href="/estimate">Get an instant estimate</a>
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

        {/* ─── Inline consultation form ─── */}
        <Section id="consult" divider className="scroll-mt-24">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12 items-start">
              <div className="min-w-0 md:col-span-2">
                <Reveal>
                  <p className="ed-eyebrow">Request your consultation</p>
                  <h2 className="ed-h2 ed-statement-wide">
                    Tell us about the home you want to{' '}
                    <em className="brc-accent">build</em>.
                  </h2>
                  <p className="text-base leading-relaxed mb-8 text-muted-foreground">
                    Send a few details and we will reach out within one business day to schedule
                    your free 60 to 90 minute planning consultation - budget band, schedule, and
                    site requirements, with no obligation.
                  </p>
                </Reveal>
              </div>
              <MarketingCard className="md:col-span-3 p-4 sm:p-7 md:p-10" padding="lg">
                <ConsultationForm />
              </MarketingCard>
            </div>
          </div>
        </Section>

        {/* ─── Contact channels ─── */}
        <Section variant="greige" divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Reach us directly"
              size="display"
              title={
                <>
                  Every way to{' '}
                  <em className="brc-accent">connect</em>
                </>
              }
              description="Call, email, or visit - we respond within one business day and never use high-pressure sales tactics."
              className="max-w-3xl"
            />
            <div className="ed-grid-balance grid sm:grid-cols-2 gap-4">
              <Reveal className="sm:col-span-2">
                <ContactChannel
                  icon={<Phone className="h-5 w-5" strokeWidth={1.5} />}
                  label="Call us"
                  href={SITE_CONFIG.phoneHref}
                  subtext="Mon – Fri 7 am – 6 pm · Sat 8 am – 4 pm"
                  featured
                  companion={
                    <SaveContactLink className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
                  }
                >
                  <span className="brc-display-num tabular-nums">{BUSINESS_INFO.phone}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={30} className="sm:col-span-2">
                <ContactChannel
                  icon={<MessageSquare className="h-5 w-5" strokeWidth={1.5} />}
                  label="Text us"
                  href={SITE_CONFIG.phoneSmsHref}
                  subtext="Quick questions? Send us a text"
                  companion={
                    <SaveContactLink className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
                  }
                >
                  <span className="brc-display-num tabular-nums">{BUSINESS_INFO.phone}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={90}>
                <ContactChannel
                  icon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
                  label="Email us"
                  subtext="Response within one business day"
                >
                  <EmailLink className="text-base hover:text-foreground/70 transition-colors" />
                </ContactChannel>
              </Reveal>
              <Reveal delay={120}>
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Where we work"
                  subtext={SITE_CONFIG.address.serviceArea}
                >
                  <address className="not-italic leading-relaxed">
                    Based in {SITE_CONFIG.address.cityState}
                    <br />
                    Serving the Treasure Valley
                  </address>
                </ContactChannel>
              </Reveal>
              <Reveal delay={180} className="sm:col-span-2">
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Service area"
                  subtext="Free planning consultations across the Treasure Valley"
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
                alt={`Representative framing work with a ${SITE_CONFIG.name} branded worker`}
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
                <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>Your free visit includes</p>
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
                      <em className="brc-accent">Just answers.</em>
                    </>
                  }
                  description="Your free 60 to 90 minute planning consultation is focused on what your build will actually cost and how long it will take - not a commission-driven pitch."
                  className="mb-8 max-w-none"
                />
                <ul className="flex flex-col gap-0 mb-8">
                  {CONSULT_BULLETS.map((bullet, i) => (
                    <li key={bullet}>
                      <div className="flex items-start gap-3 py-4">
                        <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
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
                  <Button variant="brandOutline" asChild><a href="#consult">{CTA_SECONDARY}</a></Button>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* ─── Contact FAQ ─── */}
        <Section variant="greige" divider>
          <div className="container px-4 max-w-3xl">
            <Reveal>
              <p className="ed-eyebrow">Common questions</p>
              <h2 className="ed-h2 ed-statement-wide mb-10">
                Before you <em className="brc-accent">reach out</em>
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {CONTACT_FAQS.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-0 border-t border-border"
                  >
                    <AccordionTrigger className="text-left py-5 hover:no-underline font-sans font-normal text-sm text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed pb-6 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </Section>

        <StatementBandSection />

        <EstimatePromptBand
          title={
            <>
              Prefer a number before you{' '}
              <em className="brc-accent">call</em>?
            </>
          }
          description="Use our online build cost estimator for an instant Treasure Valley range - then schedule your free consultation when you're ready for a written, line-item budget."
          variant="canvas"
        />

        {/* ─── Service areas ─── */}
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Treasure Valley"
              size="display"
              title={
                <>
                  Where we <em className="brc-accent">work</em>
                </>
              }
              description={`We serve homeowners in ${TREASURE_VALLEY_CITIES}, and surrounding communities.`}
              className="max-w-3xl"
            />
            <nav aria-label="Service areas" className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-border">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={areaPath(city.slug)}
                  className="flex min-h-14 items-center justify-between gap-3 border-b border-r border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-card focus-visible:bg-card last:col-span-2 sm:last:col-span-1"
                >
                  {city.name}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              ))}
            </nav>
          </div>
        </Section>

        {/* ─── Closing CTA ─── */}
        <Section surface="gradient" spacing="xl" edge>
          <div className="ed-shell">
            <Reveal>
              <div className="ed-split ed-split-center">
                <h2 className="ed-h2-sm ed-statement-wide">
                  Prefer to talk first?
                </h2>
              <div>
                <p className="ed-body">
                  Call us directly - no phone tree, no sales scripts.
                </p>
                <BusinessPhoneContact
                  layout="stack"
                  display
                  className="mb-2"
                  phoneClassName="text-2xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors"
                  saveClassName="text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors"
                  phoneTestId="link-closing-phone"
                />
                <a
                  href={SITE_CONFIG.phoneSmsHref}
                  className="ed-link mt-4 block w-fit"
                  data-testid="link-closing-text"
                >
                  Or send us a text message
                </a>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 [&>*]:w-full sm:[&>*]:w-auto">
                  <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                  <Button variant="heroOutline" asChild>
                    <a href="#consult">{CTA_SECONDARY}</a>
                  </Button>
                </div>
              
              </div></div>
            </Reveal>
          </div>
        </Section>
      </div>
    </>
  );
}

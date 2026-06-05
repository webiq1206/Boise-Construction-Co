import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { DisplayNum, formatStepNumber, Section } from '@/components/marketing';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Reveal } from '@/components/Reveal';
import { RelatedLinks } from './RelatedLinks';
import { RelatedPostCards } from '@/components/marketing/RelatedPostCards';
import type { FAQItem } from '@/shared/seoContent';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { EstimateCTA } from '@/components/modals/EstimateCTA';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`;

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface LandingPageTemplateProps {
  h1: string;
  speakableSummary: string;
  overview: string;
  breadcrumbs: BreadcrumbItem[];
  heroImageUrl?: string;
  breatherImageUrl?: string;
  processImageUrl?: string;
  manifestPath?: string;
  benefits?: string[];
  inclusions?: string[];
  timeline?: string;
  processSteps?: { title: string; description: string }[];
  localNote?: string;
  /**
   * Optional long-form content sections rendered as H2 blocks (with optional H3
   * subsections and link lists). Used to expand thin area/service pages with
   * localized copy and contextual internal links.
   */
  sections?: LandingSection[];
  faqs: FAQItem[];
  related: {
    variant: 'service' | 'area' | 'city-service';
    serviceSlug?: string;
    citySlug?: string;
  };
}

export interface LandingSection {
  heading: string;
  paragraphs?: string[];
  links?: { label: string; href: string }[];
  subsections?: { heading: string; paragraphs: string[] }[];
}

function HeroBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
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

/**
 * Splits a benefit string into a bold lead phrase and a muted supporting caption.
 * Priority: split on first comma; fallback: split after first 4 words if string > 6 words.
 */
function splitBenefit(text: string): { lead: string; body: string } {
  const commaIdx = text.indexOf(',');
  if (commaIdx > 0 && commaIdx < text.length - 1) {
    return {
      lead: text.slice(0, commaIdx).trim(),
      body: text.slice(commaIdx + 1).trim(),
    };
  }
  const words = text.split(' ');
  if (words.length > 6) {
    return {
      lead: words.slice(0, 4).join(' '),
      body: words.slice(4).join(' '),
    };
  }
  return { lead: text, body: '' };
}

export function LandingPageTemplate({
  h1,
  speakableSummary,
  overview,
  breadcrumbs,
  heroImageUrl,
  breatherImageUrl,
  processImageUrl,
  manifestPath,
  benefits,
  inclusions,
  timeline,
  processSteps,
  localNote,
  sections,
  faqs,
  related,
}: LandingPageTemplateProps) {
  const eyebrow = breadcrumbs[breadcrumbs.length - 2]?.name;
  const breatherImage = breatherImageUrl ?? heroImageUrl;
  const processImage = processImageUrl ?? heroImageUrl;

  return (
    <div className="flex flex-col pb-20 md:pb-0">

      {/* ─── Cinematic hero ─── */}
      <section className="relative min-h-[540px] md:min-h-[78vh] flex items-end overflow-hidden bg-inverse">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover opacity-[0.82] img-brand-grade"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse via-inverse/60 to-inverse/10" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/70 via-inverse/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-inverse/70 via-inverse/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }}
        />

        <div className="relative z-10 w-full container px-4 pb-14 md:pb-20 pt-10 fade-up">
          <HeroBreadcrumbs items={breadcrumbs} />
          <p data-speakable="summary" className="sr-only">
            {speakableSummary}
          </p>
          {eyebrow && (
            <div className="brc-label text-inverse-muted mt-6 mb-5">{eyebrow}</div>
          )}
          <h1 className="font-sans font-light text-display tracking-tight text-inverse-foreground max-w-4xl mb-6">
            {h1}
          </h1>
          <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-8">
            {overview}
          </p>
          <div className="flex flex-wrap gap-3">
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
        </div>
      </section>

      {/* ─── Benefits ─── */}
      {benefits && benefits.length > 0 && (
        <Section variant="greige" divider>
          <div className="container px-4 max-w-5xl">
            <Reveal>
              <div className="brc-label mb-5">Why choose us</div>
              <h2 className="font-sans font-light text-[2rem] md:text-[2.5rem] leading-[1.08] tracking-tight text-foreground mb-10">
                Why homeowners <em className="brc-accent text-accent">choose us</em>
              </h2>
            </Reveal>
            <ul className="grid sm:grid-cols-2 gap-4">
              {benefits.map((item, i) => {
                const { lead, body } = splitBenefit(item);
                return (
                  <li key={item} className="list-none">
                    <Reveal
                      delay={Math.min(i, 5) * 70}
                      className="marketing-card p-5 flex items-start gap-3 h-full"
                    >
                      <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">
                        <strong className="font-medium text-foreground">{lead}</strong>
                        {body && (
                          <span className="text-muted-foreground">{', '}{body}</span>
                        )}
                      </span>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
      )}

      {/* ─── Full-bleed image breather ─── */}
      {breatherImage && (
        <section className="relative h-44 md:h-64 overflow-hidden" aria-hidden>
          <Image
            src={breatherImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover img-brand-grade"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-inverse/20 to-background/90" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }}
          />
        </section>
      )}

      {/* ─── Inclusions ─── */}
      {inclusions && inclusions.length > 0 && (
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <Reveal>
              <div className="brc-label mb-5">Scope of work</div>
              <h2 className="font-sans font-light text-[2rem] md:text-[2.5rem] leading-[1.08] tracking-tight text-foreground mb-10">
                What&apos;s <em className="brc-accent text-accent">included</em>
              </h2>
            </Reveal>
            <MarketingCard>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {inclusions.map((item, i) => (
                  <li key={item} className="list-none">
                    <Reveal
                      delay={Math.min(i, 6) * 60}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </MarketingCard>
          </div>
        </Section>
      )}

      {/* ─── Process (split: charcoal panel + steps) ─── */}
      {processSteps && processSteps.length > 0 && (
        <Section variant="greige" divider spacing="none" className="p-0">
          <div className="grid md:grid-cols-2 overflow-hidden">
            <div className="relative min-h-[260px] md:min-h-[520px] overflow-hidden bg-inverse">
              {processImage && (
                <Image
                  src={processImage}
                  alt=""
                  fill
                  className="object-cover img-brand-grade"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-inverse via-inverse/70 to-inverse/40" />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }}
              />
              <div className="relative h-full flex flex-col justify-end p-8 md:p-12 lg:p-14">
                <div className="brc-label text-inverse-muted mb-4">How it works</div>
                <h2 className="font-sans font-light text-[2rem] md:text-[2.75rem] leading-[1.06] tracking-tight text-inverse-foreground">
                  Our <em className="brc-accent text-accent">process</em>,
                  <br />
                  step by step
                </h2>
              </div>
            </div>

            <div className="section-y-sm px-6 md:px-12 lg:px-14 bg-card border-l border-border">
              <div className="divide-y divide-border border-t border-border">
                {processSteps.map((step, i) => (
                  <Reveal key={step.title} delay={Math.min(i, 5) * 70}>
                    <div className="flex gap-5 py-7">
                      <DisplayNum className="text-2xl w-9 flex-shrink-0 leading-none mt-0.5 text-foreground/20">
                        {formatStepNumber(i)}
                      </DisplayNum>
                      <div>
                        <h3 className="font-medium text-base text-foreground mb-1.5">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Timeline & local notes ─── */}
      {(timeline || localNote) && (
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <div
              className={`grid gap-6 ${timeline && localNote ? 'md:grid-cols-2' : 'max-w-2xl'}`}
            >
              {timeline && (
                <Reveal>
                  <MarketingCard className="p-6 md:p-8 h-full">
                    <div className="flex gap-4">
                      <div className="w-0.5 bg-accent/50 flex-shrink-0 rounded-full" />
                      <div>
                        <div className="brc-label mb-3">Planning details</div>
                        <h3 className="font-sans font-medium text-base text-foreground mt-3 mb-3">
                          Typical timeline
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{timeline}</p>
                      </div>
                    </div>
                  </MarketingCard>
                </Reveal>
              )}
              {localNote && (
                <Reveal delay={timeline ? 90 : 0}>
                  <MarketingCard className="p-6 md:p-8 h-full">
                    <div className="flex gap-4">
                      <div className="w-0.5 bg-accent/50 flex-shrink-0 rounded-full" />
                      <div>
                        <div className="brc-label mb-3">Local details</div>
                        <h3 className="font-sans font-medium text-base text-foreground mt-3 mb-3">
                          Local notes
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{localNote}</p>
                      </div>
                    </div>
                  </MarketingCard>
                </Reveal>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ─── Long-form content sections ─── */}
      {sections && sections.length > 0 && (
        <Section divider>
          <div className="container px-4 max-w-3xl space-y-12">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={Math.min(i, 4) * 60}>
                <div className="prose-measure">
                  <h2 className="font-sans font-light text-[1.75rem] md:text-[2rem] leading-tight tracking-tight text-foreground mb-5">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((p, j) => (
                    <p key={j} className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                      {p}
                    </p>
                  ))}
                  {section.subsections?.map((sub) => (
                    <div key={sub.heading} className="mt-6">
                      <h3 className="font-sans font-medium text-base text-foreground mb-2">
                        {sub.heading}
                      </h3>
                      {sub.paragraphs.map((p, k) => (
                        <p key={k} className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {p}
                        </p>
                      ))}
                    </div>
                  ))}
                  {section.links && section.links.length > 0 && (
                    <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                      {section.links.map((link) => (
                        <li key={link.href} className="list-none">
                          <Link
                            href={link.href}
                            className="inline-flex items-center text-sm text-accent hover:underline font-medium"
                          >
                            {link.label}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ─── FAQ ─── */}
      <Section variant="greige" divider>
        <div className="container px-4 max-w-3xl">
          <Reveal>
            <div className="brc-label mb-5">Common questions</div>
            <h2 className="font-sans font-light text-[2rem] md:text-[2.5rem] leading-[1.08] tracking-tight text-foreground mb-10">
              Frequently asked <em className="brc-accent text-accent">questions</em>
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-0 border-t border-border"
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline font-sans font-medium text-sm text-foreground">
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

      {/* ─── Related links & posts ─── */}
      <Section divider>
        <div className="container px-4 max-w-5xl space-y-12">
          <Reveal>
            <RelatedLinks {...related} />
          </Reveal>
          {manifestPath && (
            <Reveal>
              <RelatedPostCards path={manifestPath} />
            </Reveal>
          )}
        </div>
      </Section>

      {/* ─── Bottom CTA strip ─── */}
      <Section divider>
        <div className="container px-4">
          <Reveal>
            <MarketingCard className="cta-card-dark relative overflow-hidden p-10 md:p-16 text-center max-w-4xl mx-auto">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.04 }}
              />
              <div className="relative">
                <div className="brc-label text-inverse-muted justify-center mb-6">
                  Start your project
                </div>
                <h2 className="font-sans font-light text-[2rem] md:text-[2.5rem] leading-tight tracking-tight text-inverse-foreground mb-4">
                  Ready to <em className="brc-accent">begin</em>?
                </h2>
                <p className="text-inverse-muted mb-8 text-base leading-relaxed">
                  Free 60 to 90 minute in-home visit. Planning guidance, design direction, no
                  obligation.
                </p>
                <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
              </div>
            </MarketingCard>
          </Reveal>
        </div>
      </Section>
    </div>
  );
}

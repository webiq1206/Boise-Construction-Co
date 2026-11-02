import { InteriorHero,InteriorProjectAside } from '@/components/approved/InteriorLayout';
import { HeroTextLink,PrimaryCta } from '@/components/approved/PrimaryCta';
import { Section } from '@/components/marketing';
import { RelatedPostCards } from '@/components/marketing/RelatedPostCards';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { FeaturedBeforeAfterSection } from '@/components/sections/FeaturedBeforeAfterSection';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import { GRAIN_URL } from '@/lib/grain';
import { contentImageAlt } from '@/shared/imageAlts';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { hasPlanningFigure } from '@/shared/contentData';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { GalleryProject } from '@/shared/galleryData';
import type { FAQItem } from '@/shared/seoContent';
import { ArrowRight,ChevronRight,Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { RelatedLinks } from './RelatedLinks';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface LandingPageTemplateProps {
  h1: string;
  speakableSummary: string;
  overview: string;
  /**
   * When set, these replace the single overview paragraph. The hero carries
   * only their opening line (see splitHeroLead); the rest opens the first
   * section below the hero.
   */
  overviewParagraphs?: readonly string[];
  /** A phrase set in bold wherever it falls in the overview (one occurrence). */
  overviewEmphasis?: string;
  /**
   * Explicit hero support line, for an overview whose first sentence runs past
   * the hero budget. The whole overview then opens the section below the hero.
   */
  heroLine?: string;
  breadcrumbs: BreadcrumbItem[];
  heroImageUrl?: string;
  heroImageAlt?: string;
  breatherImageUrl?: string;
  processImageUrl?: string;
  manifestPath?: string;
  /** Optional planning starting point ("$15k") shown near the hero CTAs. */
  planningFrom?: string;
  /** Optional estimator URL that retains the service's project intent. */
  estimateHref?: string;
  /**
   * Cost-and-timeline expectation, rendered directly AFTER THE HERO: the first
   * question a visitor researches is what this costs and how long it takes, so
   * it must not sit below inclusions and process. When provided, the `timeline`
   * renders alongside it instead of in the lower planning-details block.
   */
  costGuidance?: {
    heading: string;
    paragraphs: string[];
    links?: { label: string; href: string }[];
  };
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
  /**
   * Optional embedded local proof (matched testimonials + before/after
   * projects). Surfacing real, city-specific proof on landing pages is part of
   * the doorway-page mitigation (see seo-audit/doorway-page-analysis.md).
   */
  proof?: LandingProof;
  proofHeading?: string;
  /** Optional featured before/after for service hub pages. */
  featuredProject?: GalleryProject;
  /** Show contextual estimator prompt band (default true on service/area pages). */
  showEstimatePrompt?: boolean;
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
  /** Inline anchors for the paragraph at the same index. Schema and other cities stay plain. */
  paragraphLinks?: Array<{ phrase: string; href: string }[] | undefined>;
  bullets?: string[];
  /** Paragraph index after which `bullets` render. Defaults to after the last paragraph. */
  bulletsAfterParagraph?: number;
  links?: { label: string; href: string }[];
  subsections?: { heading: string; paragraphs: string[] }[];
  /**
   * Optional photograph placed after the section copy so mobile scroll keeps a
   * photography/text rhythm through long-form landing content.
   */
  figure?: { src: string; caption?: string };
}

function InlineLinks({
  text,
  links,
}: {
  text: string;
  links?: { phrase: string; href: string }[];
}) {
  if (!links?.length) return <>{text}</>;
  const sorted = [...links].sort((a, b) => b.phrase.length - a.phrase.length);
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length) {
    let earliest = -1;
    let match: { phrase: string; href: string } | null = null;
    for (const link of sorted) {
      const idx = rest.indexOf(link.phrase);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        match = link;
      }
    }
    if (!match || earliest === -1) {
      nodes.push(rest);
      break;
    }
    if (earliest > 0) nodes.push(rest.slice(0, earliest));
    nodes.push(
      <Link key={key++} href={match.href} className="ed-link ed-link-accent">
        {match.phrase}
      </Link>,
    );
    rest = rest.slice(earliest + match.phrase.length);
  }
  return <>{nodes}</>;
}

export interface LandingProof {
  testimonials?: { name: string; rating: number; quote: string }[];
  projects?: {
    title: string;
    description: string;
    /** Exterior / lead view of the concept home. */
    exteriorImageUrl: string;
    /** Matching interior view of the same concept home. */
    interiorImageUrl: string;
  }[];
}

function HeroBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-foreground/80 [&_a]:inline-flex [&_a]:items-center [&_a]:min-h-11 md:[&_a]:min-h-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
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

const accent = { color: 'var(--ed-accent)' } as const;
const line = { borderColor: 'var(--ed-line)' } as const;

/**
 * The landing template behind every service, area and city-service page - the
 * highest-volume SEO routes on the site, dozens of pages from one file.
 *
 * Rebuilt on the family layer. Every band keeps its content and its order (the
 * order is the sales conversation and the SEO structure - untouched), but each
 * takes the layout that suits what it holds rather than the same card grid:
 * benefits as a hairline matrix, inclusions as a split with an inset list,
 * process as the family's image panel, long-form copy on the prose measure,
 * proof as a matrix, FAQ as the parent site's split. Grounds alternate dark /
 * deep / gradient so a long page has a rhythm; there is no light band here by
 * design - these pages are dark-dominant like the rest of the site.
 */
/** Anchor id for a long-form section heading, used by the sticky index. */
function sectionId(heading: string): string {
  return 'section-' + heading.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Word budget for the hero support line: one short line, never the paragraph. */
const HERO_LINE_WORDS = 22;
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * The interior hero carries one support line: the opening sentence of the
 * overview, plus the next one while the pair stays inside HERO_LINE_WORDS (so a
 * lead question keeps its answer). Everything after it moves, unchanged and in
 * order, into the first section below the hero, so no copy is lost and the CTA
 * stays inside the first screen at 360x640.
 */
export function splitHeroLead(paragraphs: readonly string[], heroLine?: string): { line: string; rest: string[] } {
  const clean = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (heroLine) return { line: heroLine, rest: clean };
  if (clean.length === 0) return { line: '', rest: [] };
  const sentences = clean[0].match(/[^.?!]+(?:[.?!]+(?=\s|$)|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [clean[0]];
  let line = sentences[0];
  let used = 1;
  for (const next of sentences.slice(1)) {
    if (wordCount(`${line} ${next}`) > HERO_LINE_WORDS) break;
    line = `${line} ${next}`;
    used++;
  }
  const remainder = sentences.slice(used).join(' ');
  return { line, rest: [...(remainder ? [remainder] : []), ...clean.slice(1)] };
}

function Emphasis({ text, phrase }: { text: string; phrase?: string }) {
  const index = phrase ? text.indexOf(phrase) : -1;
  if (!phrase || index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong>{phrase}</strong>
      {text.slice(index + phrase.length)}
    </>
  );
}

export function LandingPageTemplate({
  h1,
  speakableSummary,
  overview,
  overviewParagraphs,
  overviewEmphasis,
  heroLine,
  breadcrumbs,
  heroImageUrl,
  heroImageAlt,
  breatherImageUrl,
  processImageUrl,
  manifestPath,
  planningFrom,
  estimateHref,
  costGuidance,
  benefits,
  inclusions,
  timeline,
  processSteps,
  localNote,
  sections,
  proof,
  proofHeading,
  featuredProject,
  showEstimatePrompt = false,
  faqs,
  related,
}: LandingPageTemplateProps) {
  void showEstimatePrompt;
  const eyebrow = breadcrumbs[breadcrumbs.length - 2]?.name;
  const hasProof =
    !!proof && ((proof.testimonials?.length ?? 0) > 0 || (proof.projects?.length ?? 0) > 0);
  const breatherImage = breatherImageUrl ?? heroImageUrl;
  const processImage = processImageUrl ?? heroImageUrl;
  const showTimelineBelow = !!timeline && !costGuidance;
  const lead = splitHeroLead(overviewParagraphs && overviewParagraphs.length > 0 ? overviewParagraphs : [overview], heroLine);
  const emphasisInHero = !!overviewEmphasis && lead.line.includes(overviewEmphasis);
  const planningFigure = planningFrom && hasPlanningFigure(planningFrom) ? planningFrom : undefined;

  return (
    <div className="flex flex-col ">
      {/* Approved split hero, held to the first screen (C3): breadcrumb,
          eyebrow, H1, ONE support line, the planning figure as a chip, one
          primary action and the phone as a text link. The rest of the overview
          opens the section directly below, unchanged. */}
      <InteriorHero imageSrc={heroImageUrl} imageAlt={heroImageAlt ?? contentImageAlt(heroImageUrl)} layout="split">
          <HeroBreadcrumbs items={breadcrumbs} />
          <p data-speakable="summary" className="sr-only">{speakableSummary}</p>
          {eyebrow && <p className="ed-eyebrow interior-hero-eyebrow">{eyebrow}</p>}
          <h1 className="ed-display ed-statement-display text-inverse-foreground">{h1}</h1>
          {lead.line && (
            <p className="interior-hero-support">
              <Emphasis text={lead.line} phrase={emphasisInHero ? overviewEmphasis : undefined} />
            </p>
          )}
          {planningFrom && (
            <p className="interior-hero-chip">
              {planningFigure ? (<>Planning from <strong>{planningFigure}</strong></>) : planningFrom}
            </p>
          )}
          <div className="interior-hero-actions">
            <PrimaryCta href={estimateHref ?? '/estimate'} trackingLocation="landing_hero">{CTA_PRIMARY}</PrimaryCta>
            <HeroTextLink href={SITE_CONFIG.phoneHref}>Call {SITE_CONFIG.phone}</HeroTextLink>
          </div>
        </InteriorHero>

      {(lead.rest.length > 0 || planningFigure) && (
        <section className="interior-hero-more" aria-label="Overview">
          <div className="interior-hero-more-inner">
            {lead.rest.map((paragraph, i) => (
              <p key={i} className={i === 0 ? 'interior-hero-more-lede' : undefined}>
                <Emphasis text={paragraph} phrase={!emphasisInHero ? overviewEmphasis : undefined} />
              </p>
            ))}
            {planningFigure && (
              <p className="interior-hero-more-note">Planning from {planningFigure}. Your exact range is confirmed at the free in-home visit.</p>
            )}
          </div>
        </section>
      )}
{/* The scope list is this section's content. Area pages pass none, which
          used to leave the heading alone beside the sticky aside with an empty
          column, so the section only renders when there is a list to show. */}
      {inclusions&&inclusions.length>0&&<div className="interior-detail-body"><div><p className="interior-eyebrow">A CLEAR SCOPE</p><p className="interior-statement">Plan the details.<br/><em>Know the next step.</em></p><ul className="interior-scope-list">{inclusions.map((item,i)=><li key={item}><span>{String(i+1).padStart(2,'0')}</span>{item}</li>)}</ul></div><InteriorProjectAside>{timeline&&<p className="ed-body mt-6">{timeline}</p>}</InteriorProjectAside></div>}

      {/* ─── Cost and timeline expectation ───
          Cost guidance follows the concise scope and estimate sidebar. */}
      {costGuidance && (
        <Section surface="dark" spacing="xl">
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <Reveal>
                  <p className="ed-eyebrow">Cost and timeline</p>
                  <h2 className="ed-h2 ed-statement">{costGuidance.heading}</h2>
                  {timeline && (
                    <div className="ed-inset mt-10">
                      <p className="ed-eyebrow ed-eyebrow-accent">Typical timeline</p>
                      <p className="ed-body">{timeline}</p>
                    </div>
                  )}
                </Reveal>
              </div>
              <Reveal delay={60}>
                {costGuidance.paragraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? 'ed-lede' : 'ed-body mt-5'}>{p}</p>
                ))}
                {costGuidance.links && costGuidance.links.length > 0 && (
                  <ul className="mt-8 flex list-none flex-wrap gap-x-8 gap-y-3 p-0">
                    {costGuidance.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="ed-link ed-link-accent">
                          {link.label}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Benefits: a hairline matrix, not a card grid ─── */}
      {benefits && benefits.length > 0 && (
        <Section surface="bone" spacing="xl" edge>
          <div className="ed-shell">
            <Reveal>
              <p className="ed-eyebrow">Why choose us</p>
              <h2 className="ed-h2 ed-statement-wide">
                Why homeowners <em className="not-italic" style={accent}>choose us</em>
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <ul
                className="ed-matrix mt-[clamp(40px,5vw,72px)] list-none p-0"
                style={{ ['--ed-cols' as string]: benefits.length === 4 ? 4 : Math.min(benefits.length, 3), ['--ed-cell-h' as string]: '0' }}
              >
                {/* Each benefit is one sentence and renders whole. Splitting it at a
                    comma or after four words cut titles mid-phrase. (BRC-32, BCONC-06, BHC-12) */}
                {benefits.map((item, i) => (
                  <li key={item} className="flex flex-col">
                    <span className="ed-small" style={accent}>{String(i + 1).padStart(2, '0')}</span>
                    <p className="ed-h4 mt-5 text-pretty">{item}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>
      )}

      {/* ─── Full-bleed image breather ─── */}
      {breatherImage && (
        <section className="relative h-[clamp(220px,28vw,360px)] overflow-hidden">
          <Image src={breatherImage} alt={contentImageAlt(breatherImage)} fill sizes="100vw" className="object-cover img-brand-grade" />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }} />
        </section>
      )}

      {/* ─── Inclusions: split, list in an inset panel ─── */}


      {/* ─── Featured before/after (service hub) ─── */}
      {featuredProject && <FeaturedBeforeAfterSection project={featuredProject} />}

      {/* ─── Process: the family's image panel, timeline leading ─── */}
      {processSteps && processSteps.length > 0 && (
        <Section surface="deep" spacing="none" edge className="p-0">
          <div className="ed-panel ed-panel-reverse">
            <div className="ed-panel-media">
              {processImage && (
                <Image src={processImage} alt={contentImageAlt(processImage)} fill className="object-cover img-brand-grade" sizes="(max-width: 820px) 100vw, (max-width: 1100px) 48vw, 57vw" />
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }} />
            </div>
            <div className="ed-panel-body">
              <Reveal>
                <p className="ed-eyebrow">How it works</p>
                <h2 className="ed-h2-sm ed-statement">
                  Our <em className="not-italic" style={accent}>process</em>, step by step
                </h2>
              </Reveal>
              <div className="ed-steps mt-[clamp(32px,4vw,56px)]">
                {processSteps.map((step, i) => (
                  <Reveal key={step.title} delay={Math.min(i, 5) * 60}>
                    <div className="ed-step">
                      <span className="ed-step-n">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="ed-h4">{step.title}</h3>
                        <p className="ed-body mt-2 text-[0.875rem]">{step.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Timeline & local notes ───
          The timeline renders up in the cost section when costGuidance hoisted
          it; showing it twice would be noise. */}
      {(showTimelineBelow || localNote) && (
        <Section surface="dark" spacing="lg" edge>
          <div className="ed-shell">
            {showTimelineBelow && localNote ? (
              <div className="grid gap-[var(--ed-gutter)] lg:grid-cols-2">
                <Reveal>
                  <div className="ed-inset h-full">
                    <p className="ed-eyebrow ed-eyebrow-accent">Planning details</p>
                    <h3 className="ed-h3">Typical timeline</h3>
                    <p className="ed-body mt-4">{timeline}</p>
                  </div>
                </Reveal>
                <Reveal delay={90}>
                  <div className="ed-inset h-full">
                    <p className="ed-eyebrow ed-eyebrow-accent">Local details</p>
                    <h3 className="ed-h3">Local notes</h3>
                    <p className="ed-body mt-4">{localNote}</p>
                  </div>
                </Reveal>
              </div>
            ) : (
              /* One note on its own used to sit in a small box on the left of
                 an otherwise empty band. It is now a split: the heading holds
                 the left column, the note reads as a lede on the right. */
              <div className="ed-split ed-split-narrow">
                <Reveal>
                  <p className="ed-eyebrow ed-eyebrow-accent">{showTimelineBelow ? 'Planning details' : 'Local details'}</p>
                  <h2 className="ed-h2 ed-statement">
                    {showTimelineBelow ? (<>Typical <em className="not-italic" style={accent}>timeline</em></>) : (<>Local <em className="not-italic" style={accent}>notes</em></>)}
                  </h2>
                </Reveal>
                <Reveal delay={60}>
                  <p className="ed-lede">{showTimelineBelow ? timeline : localNote}</p>
                </Reveal>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ─── Long-form content sections: the prose measure ─── */}
      {sections && sections.length > 0 && (
        <Section surface="dark" spacing="xl" edge>
          <div className="ed-shell">
            <div className="mx-auto grid max-w-3xl gap-10">
              {/* Keep the guide index above centered copy at every width. */}
              <aside aria-label="In this guide">
                <Reveal>
                  <p className="ed-eyebrow">In this guide</p>
                  <ol className="m-0 list-none border-t p-0" style={line}>
                    {sections.map((section, i) => (
                      <li key={section.heading} className="border-b" style={line}>
                        <a
                          href={`#${sectionId(section.heading)}`}
                          className="flex min-h-11 items-baseline gap-4 py-3 text-[0.9375rem] leading-snug transition-colors hover:[color:var(--ed-accent)] focus-visible:[color:var(--ed-accent)]"
                        >
                          <span className="ed-small shrink-0" style={accent}>{String(i + 1).padStart(2, '0')}</span>
                          <span>{section.heading}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              </aside>
              <div className="space-y-[clamp(48px,6vw,88px)]">
                {sections.map((section, i) => (
                  <Reveal key={section.heading} delay={Math.min(i, 4) * 60}>
                    <h2 id={sectionId(section.heading)} className="ed-h2-sm ed-statement-wide scroll-mt-28">{section.heading}</h2>
                    {section.paragraphs?.map((p, j) => {
                      const bulletAt = section.bulletsAfterParagraph ?? (section.paragraphs!.length - 1);
                      return (
                        <Fragment key={j}>
                          <p className={i === 0 && j === 0 && !costGuidance ? 'ed-lede mt-6 max-w-[52ch]' : j === 0 ? 'ed-body mt-6 max-w-[62ch]' : 'ed-body mt-4 max-w-[62ch]'}>
                            <InlineLinks text={p} links={section.paragraphLinks?.[j]} />
                          </p>
                          {section.bullets && bulletAt === j && (
                            <ul className="ed-body mt-4 max-w-[62ch] list-disc space-y-2 pl-5">
                              {section.bullets.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </Fragment>
                      );
                    })}
                    {section.subsections?.map((sub) => (
                      <div key={sub.heading} className="mt-8 border-t pt-6" style={line}>
                        <h3 className="ed-h4">{sub.heading}</h3>
                        {sub.paragraphs.map((p, k) => (
                          <p key={k} className="ed-body mt-3 max-w-[62ch]">{p}</p>
                        ))}
                      </div>
                    ))}
                    {section.links && section.links.length > 0 && (
                      <ul className="ed-rule-list mt-8">
                        {section.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="ed-rule-link">
                              {link.label}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.figure && (
                      <figure className="mt-8">
                        <div className="relative aspect-[16/10] overflow-hidden" style={{ border: '1px solid var(--ed-line)' }}>
                          <Image
                            src={section.figure.src}
                            alt={contentImageAlt(section.figure.src)}
                            fill
                            sizes="(max-width: 768px) 100vw, 720px"
                            className="object-cover img-brand-grade"
                            loading="lazy"
                          />
                        </div>
                        {section.figure.caption ? (
                          <figcaption className="ed-small mt-3 text-muted-foreground">
                            {section.figure.caption}
                          </figcaption>
                        ) : (
                          <figcaption className="ed-small mt-3 text-muted-foreground">
                            Representative imagery
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Local proof (matched testimonials + projects) ─── */}
      {hasProof && (
        <Section surface="deep" spacing="xl" edge>
          <div className="ed-shell">
            <Reveal>
              <p className="ed-eyebrow">Representative imagery</p>
              {proofHeading ? <h2 className="ed-h2 ed-statement-wide">{proofHeading}</h2> : null}
            </Reveal>

            {proof?.projects && proof.projects.length > 0 && (
              <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 sm:grid-cols-2">
                {proof.projects.map((project) => (
                  <Reveal key={project.title}>
                    <article className="flex h-full flex-col" style={{ border: '1px solid var(--ed-line)' }}>
                      <div className="grid grid-cols-2">
                        <div className="relative aspect-[4/3]">
                          <Image src={project.exteriorImageUrl} alt={contentImageAlt(project.exteriorImageUrl) || 'Representative image: Exterior view'} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                        </div>
                        <div className="relative aspect-[4/3]">
                          <Image src={project.interiorImageUrl} alt={contentImageAlt(project.interiorImageUrl) || 'Representative image: Interior view'} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="ed-h4">{project.title}</h3>
                        <p className="ed-body mt-2 text-[0.875rem]">{project.description}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}

            {proof?.testimonials && proof.testimonials.length > 0 && (
              <div
                className="ed-matrix mt-[clamp(32px,4vw,56px)]"
                style={{ ['--ed-cols' as string]: Math.min(proof.testimonials.length, 2), ['--ed-cell-h' as string]: '0' }}
              >
                {proof.testimonials.map((t) => (
                  <figure key={t.name} className="m-0">
                    <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: Math.round(t.rating) }).map((_, i) => (
                        <Star key={i} className="h-4 w-4" style={{ fill: 'var(--ed-accent)', color: 'var(--ed-accent)' }} aria-hidden="true" />
                      ))}
                    </div>
                    <blockquote className="ed-body mt-4 text-[0.9375rem]">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="ed-h4 mt-4 text-[1rem]">{t.name}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}


      {/* ─── FAQ: the parent site's split ─── */}
      <Section surface="bone" spacing="xl" edge>
        <div className="ed-shell">
          <div className="ed-split ed-split-narrow">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="ed-eyebrow">Common questions</p>
              <h2 className="ed-h2 ed-statement">
                Frequently asked <em className="not-italic" style={accent}>questions</em>
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full border-t" style={line}>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0 border-b" style={line}>
                  <AccordionTrigger className="ed-h4 py-6 text-left hover:no-underline [&[data-state=open]]:[color:var(--ed-accent)]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="ed-body pb-7 text-[0.9375rem]">
                    <InlineLinks text={faq.answer} links={faq.links} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Section>

      {/* ─── Related links & posts ─── */}
      <Section surface="deep" spacing="lg" edge>
        <div className="ed-shell space-y-12">
          <Reveal><RelatedLinks {...related} /></Reveal>
          {manifestPath && (<Reveal><RelatedPostCards path={manifestPath} /></Reveal>)}
        </div>
      </Section>

      {/* ─── Bottom CTA: a statement on the gradient ground ─── */}
      <Section surface="gradient" spacing="xl" edge>
        <div className="ed-shell">
          <div className="ed-split ed-split-center">
            <Reveal>
              <p className="ed-eyebrow ed-eyebrow-accent">Start your project</p>
              <h2 className="ed-h2 ed-statement">
                Ready to <em className="not-italic" style={accent}>begin</em>?
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="ed-lede">Free 60 to 90 minute in-home visit.</p>
              <p className="ed-body mt-3">Planning guidance, design direction, no obligation.</p>
              <div className="mt-8"><ConsultCTA variant="brand" href={estimateHref}>{CTA_PRIMARY}</ConsultCTA></div>
            </Reveal>
          </div>
        </div>
      </Section>
    </div>
  );
}

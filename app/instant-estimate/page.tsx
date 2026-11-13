import { InteriorPage } from '@/components/approved/InteriorLayout';
import { HeroTextLink, PrimaryCta } from '@/components/approved/PrimaryCta';
import EstimatorAnalytics from '@/components/estimator/EstimatorAnalytics';
import EstimatorFrame from '@/components/estimator/EstimatorFrame';
import { Section } from '@/components/marketing/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical, fitDescription } from '@/lib/page-metadata';
import { generateBreadcrumbSchema, generateWebPageSchema } from '@/lib/schema';
import { CTA_QUOTE } from '@/shared/ctaCopy';
import { INSTANT_ESTIMATE_PATH, QUOTE_REQUEST_PATH, validEstimatorProject } from '@/shared/instantEstimate';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { Metadata } from 'next';

/**
 * The family's central instant estimator, framed into this site.
 *
 * Owner decision, 13 November 2026. The estimator itself (questions, pricing,
 * property lookup, lead delivery) runs on the parent company's site and is the
 * same for every family brand. This page only frames it: see
 * components/estimator/EstimatorFrame.tsx. Never copy estimator logic here.
 *
 * The block above the frame stays short on purpose: on a phone the first
 * estimator question has to be on the first screen.
 */
const TITLE = 'Instant build estimate in Boise';
const DESCRIPTION = fitDescription(
  'Get an instant preliminary estimate for a custom home, addition, ADU or detached garage in Boise. Answer a few questions and see your range on screen.',
);

/**
 * The sticky header (--header-height in styles/family-tokens.css) is 64px below
 * 640px and 76px from there up. The frame takes one number, so it gets the
 * taller one: a question is never tucked under the header at any width.
 */
const HEADER_OFFSET = 76;

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Pick your project',
    text: 'Choose what you are planning and answer a few questions about it.',
  },
  {
    title: 'We add the public record',
    text: 'Where the county publishes it, we add the property record for your address, so you type less.',
  },
  {
    title: 'See your range on screen',
    text: 'Tell us where to reach you, then see your preliminary range with a breakdown by division.',
  },
];

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
    description: DESCRIPTION,
    alternates: { canonical: buildCanonical(INSTANT_ESTIMATE_PATH) },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: buildCanonical(INSTANT_ESTIMATE_PATH),
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
  '/instant-estimate',
);

export default async function InstantEstimatePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  // Opens straight into one project when a service page sent the visitor here.
  const project = validEstimatorProject(searchParams.project);

  const schemas = [
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: INSTANT_ESTIMATE_PATH,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Instant estimate', url: INSTANT_ESTIMATE_PATH },
    ]),
  ];

  return (
    <InteriorPage kind="instant-estimate">
      <>
        <JsonLd data={schemas} />

        <section className="instant-estimate-intro" aria-labelledby="instant-estimate-title">
          <div className="instant-estimate-measure">
            <h1 id="instant-estimate-title" className="ed-h2-sm">Get your instant build estimate</h1>
            <p className="instant-estimate-support">
              Answer a few questions and see a personalized preliminary price range on screen. Free, any time, with
              no appointment and no waiting for a callback.
            </p>
          </div>
        </section>

        <section className="instant-estimate-frame" aria-label="Instant estimator">
          <EstimatorAnalytics />
          <EstimatorFrame
            brand="construction"
            project={project}
            title={`${SITE_CONFIG.name} instant estimator`}
            headerOffset={HEADER_OFFSET}
          />
        </section>

        <Section surface="bone" spacing="lg" edge>
          <div className="ed-shell">
            <p className="ed-eyebrow ed-eyebrow-accent">Three steps</p>
            <h2 className="ed-h2-sm ed-statement">How it works</h2>
            <ol
              className="ed-matrix mt-[clamp(32px,4vw,56px)] list-none p-0"
              style={{ ['--ed-cols' as string]: 3, ['--ed-cell-h' as string]: '0' }}
            >
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col" style={{ maxWidth: 'none', margin: 0 }}>
                  <span className="ed-small" style={{ color: 'var(--ed-accent)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="ed-h4 mt-3">{step.title}</h3>
                  <p className="ed-body mt-2">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section spacing="lg">
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <h2 className="ed-h2-sm ed-statement">A preliminary range now, a firm proposal after we visit</h2>
              <div>
                <p className="ed-body">
                  The range on screen is for budgeting, before you talk to a contractor. It is preliminary: it comes
                  from your answers, before anyone has seen the site.
                </p>
                <p className="ed-body">
                  A firm written proposal follows a site visit, measurements and your selections.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section surface="gradient" spacing="lg" edge>
          <div className="ed-shell">
            <div className="ed-split ed-split-center">
              <h2 className="ed-h2-sm ed-statement">Prefer to talk to us?</h2>
              <div>
                <p className="ed-body">
                  Call or text us, or send your project details and we answer your questions and help you work out
                  the next step.
                </p>
                <div className="mt-8 interior-hero-actions">
                  <PrimaryCta href={QUOTE_REQUEST_PATH} trackingLocation="instant_estimate_talk">
                    {CTA_QUOTE}
                  </PrimaryCta>
                  <HeroTextLink href={SITE_CONFIG.phoneHref}>Call {SITE_CONFIG.phone}</HeroTextLink>
                  <HeroTextLink href={SITE_CONFIG.phoneSmsHref}>Text us</HeroTextLink>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </>
    </InteriorPage>
  );
}

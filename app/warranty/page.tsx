import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { Section } from '@/components/marketing/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { HeroTextLink, PrimaryCta } from '@/components/approved/PrimaryCta';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical, fitDescription } from '@/lib/page-metadata';
import { generateBreadcrumbSchema, generateFAQSchema, generateWebPageSchema } from '@/lib/schema';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';
import type { Metadata } from 'next';
import Link from 'next/link';

const TITLE = 'New Home Warranty in Boise, Idaho';
const DESCRIPTION = fitDescription(
  'New home warranty from Boise Construction Co: 1-year workmanship on new builds from documented Final Completion, and how existing customers get help.',
);

/** What to send so a warranty report can be reviewed without a second round of questions. */
const HELP_DETAILS = [
  'Your name',
  'The project address',
  'The affected item and where it is in the home',
  'When it started',
  'A short description of what you are seeing',
  'Photos, if you have them',
];

const HELP_SUBJECT = 'Help with a completed project';
const HELP_BODY = [
  'Name:',
  'Project address:',
  'Affected item and location:',
  'When it started:',
  'Description:',
  'Photos attached (if available):',
].join('\n');
const HELP_MAILTO = `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(HELP_SUBJECT)}&body=${encodeURIComponent(HELP_BODY)}`;

const FAQS = [
  {
    question: 'What workmanship warranty do you provide on a new build?',
    answer:
      'Boise Construction Co provides a 1-year workmanship warranty on new builds, starting at documented Final Completion: the agreed work is complete, required inspections have passed, and the walkthrough and handover records are done. It covers work performed by our own team. If something our team built or installed fails because of workmanship, rather than normal wear, deferred maintenance, or later modifications, we come back and fix it. Work performed by subcontractors, such as licensed plumbing, electrical or HVAC, is covered by that subcontractor\'s own warranty, and at the end of every project we provide a complete list of the subcontractors who worked on it, with their contact information.',
  },
  {
    question: 'Who covers work done by subcontractors?',
    answer:
      "Work performed by subcontractors, such as licensed plumbing, electrical or HVAC, is covered by that subcontractor's own warranty. At the end of every project we provide a complete list of the subcontractors who worked on it, with their contact information. If you are not sure who did a piece of work, contact us and we can point you to the right subcontractor from the list.",
  },
  {
    question: 'Do you offer a 10-year structural warranty?',
    answer:
      'Ask us whether a 10-year structural warranty applies to your contract. It is offered on some projects and is not claimed here as always included.',
  },
  {
    question: 'How do I report a problem with a completed project?',
    answer:
      `Email ${SITE_CONFIG.email} or call ${SITE_CONFIG.phone} with your name, the project address, the affected item and its location, when it started, a description, and photos if you have them. We review the report, inspect where needed, and explain what is covered and the plan to correct it. Your signed agreement says how formal warranty notice must be given, and that method controls a formal claim.`,
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
            New home warranty coverage from Boise Construction Co starts with a 1-year workmanship warranty on new builds,
            from documented Final Completion. Ask us whether a 10-year structural warranty applies to your contract.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PrimaryCta href="#get-help" trackingLocation="warranty_hero_help">
              Get help with a completed project
            </PrimaryCta>
            <HeroTextLink href={SITE_CONFIG.phoneHref}>Call {SITE_CONFIG.phone}</HeroTextLink>
          </div>
        </InteriorHero>

        <Section variant="greige" divider id="get-help">
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Existing customers</p>
                <h2 className="ed-h2 ed-statement">Get help with a completed project</h2>
              </div>
              <div>
                <p className="ed-lede">
                  Email or call us and we will answer your questions and help you work out the next step. Please include:
                </p>
                <ul className="ed-body mt-6 list-disc pl-5 space-y-1">
                  {HELP_DETAILS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="ed-body mt-6">
                  <a href={HELP_MAILTO} className="underline underline-offset-2">
                    Email {SITE_CONFIG.email}
                  </a>{' '}
                  or call{' '}
                  <a href={SITE_CONFIG.phoneHref} className="underline underline-offset-2">
                    {SITE_CONFIG.phone}
                  </a>
                  . We review the report, inspect where needed, and explain what is covered and the plan to correct it.
                </p>
                <p className="ed-body mt-6">
                  For work a subcontractor performed, we can point you to the right subcontractor from the list we
                  provide at the end of your project.
                </p>
                <p className="ed-body mt-6">
                  Your signed agreement says how formal warranty notice must be given. That notice method controls a
                  formal warranty claim, so follow it as well as getting in touch here.
                </p>
                <p className="ed-body mt-6">
                  If there is immediate danger, such as a gas smell, active water or an electrical hazard, contact
                  emergency services or the utility first, then let us know.
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section divider>
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Workmanship</p>
                <h2 className="ed-h2 ed-statement">What the 1-year workmanship warranty covers</h2>
              </div>
              <div>
                <p className="ed-lede">
                  Workmanship performed by our own team: if a failure traces to how our team built or installed
                  something, we return and correct it during the one-year term, which starts at documented Final
                  Completion.
                </p>
                <p className="ed-body mt-6">
                  Work performed by subcontractors, such as licensed plumbing, electrical or HVAC, is covered by that
                  subcontractor's own warranty. At the end of every project we provide a complete list of the
                  subcontractors who worked on it, with their contact information.
                </p>
                <p className="ed-body mt-6">
                  Final Completion means the agreed work and any written changes are complete, required inspections
                  have passed, and the walkthrough and handover records are done. Your signed agreement defines it for
                  your project.
                </p>
                <p className="ed-body mt-6">
                  Manufacturer and product warranties are separate and follow each maker's terms.
                </p>
                <p className="ed-body mt-6">
                  Normal wear, deferred maintenance, owner modifications, and manufacturer defects fall outside
                  workmanship coverage.
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section variant="greige" divider>
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Structure</p>
                <h2 className="ed-h2 ed-statement">Structural coverage</h2>
              </div>
              <div>
                <p className="ed-lede">
                  A 10-year structural warranty may apply on some contracts. Confirm with us before you treat it as
                  included.
                </p>
                <p className="ed-body mt-6">The written contract states which warranty documents apply to your build.</p>
              </div>
            </div>
          </div>
        </Section>
        <Section divider>
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Before you sign</p>
                <h2 className="ed-h2 ed-statement">Common questions</h2>
              </div>
              <div>
                <div className="divide-y divide-border border-y border-border">
                  {FAQS.map((faq) => (
                    <details key={faq.question} className="group py-4">
                      <summary className="cursor-pointer ed-h4 py-2">{faq.question}</summary>
                      <p className="ed-body mt-3 pb-2">{faq.answer}</p>
                    </details>
                  ))}
                </div>
                <p className="ed-body mt-8">
                  Learn more about who you are hiring on our{' '}
                  <Link href="/about" className="underline underline-offset-2">
                    About
                  </Link>{' '}
                  page. Planning a new build instead?{' '}
                  <Link href="/estimate" className="underline underline-offset-2">
                    {CTA_PRIMARY}
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </Section>
      </>
    </InteriorPage>
  );
}

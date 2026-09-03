import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { Section } from '@/components/marketing/Section';
import { PermitFlowGraphic } from './PermitFlowGraphic';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateHowToSchema,
} from '@/lib/schema';

const PERMIT_FLOW_DESCRIPTION =
  'Visual guide to new home construction permits in Ada and Canyon County - jurisdiction, plan review, and the inspection sequence for Treasure Valley builds.';

export const metadata: Metadata = buildPageMetadata({
  kind: 'blog',
  path: '/resources/ada-canyon-permit-flow',
  titleOverride: 'Ada vs Canyon County Permit Flow | Boise Construction Co',
  descriptionOverride: PERMIT_FLOW_DESCRIPTION,
});

export default function AdaCanyonPermitFlowPage() {
  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Resources', url: '/resources' },
      { name: 'Ada vs Canyon County Permit Flow', url: '/resources/ada-canyon-permit-flow' },
    ]),
    generateArticleSchema({
      title: 'Ada vs Canyon County Permit Flow',
      description: PERMIT_FLOW_DESCRIPTION,
      publishedAt: '2026-05-01',
      slug: 'ada-canyon-permit-flow',
      pathPrefix: 'resources',
    }),
    generateHowToSchema({
      name: 'How new home construction permits move through Ada and Canyon County',
      description: PERMIT_FLOW_DESCRIPTION,
      url: '/resources/ada-canyon-permit-flow',
      steps: [
        { name: 'Confirm jurisdiction', text: 'Determine whether your lot falls under Ada County, Canyon County, or a specific city building department, and whether it sits inside an impact fee or highway district boundary.' },
        { name: 'Prepare and submit plans', text: 'Submit a full construction set - architectural, structural, energy compliance and site plan - through the correct county or city portal, along with any required plot plan and grading detail.' },
        { name: 'Plan review', text: 'The building department reviews the set for code compliance. A custom home carries a longer review than a stock plan, and a comment cycle is normal rather than a setback.' },
        { name: 'Permit issuance', text: 'Pay plan review, permit, impact and utility connection fees, then receive approved permits before any work begins on site.' },
        { name: 'Inspections', text: 'Schedule inspections in sequence through the build: footing and foundation, framing, rough-in for mechanical, electrical and plumbing, insulation, and a final before occupancy.' },
      ],
    }),
  ];

  return (
    <div className="flex flex-col pb-20">
      <JsonLd data={schemas} />
      <Section spacing="lg" className="pt-28 md:pt-32">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link
            href="/resources"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Planning resources
          </Link>

          <p className="text-xs font-normal uppercase tracking-wider text-accent-legible mb-3">
            Visual guide
          </p>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">
            Ada vs Canyon County permit flow
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            A step-by-step view of how a new home permit moves through plan review and
            inspections in the Treasure Valley. Timelines vary by jurisdiction and by how
            complete the submitted set is.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="/downloads/ada-canyon-permit-guide.pdf"
              download
              className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-normal hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download PDF reference
            </a>
            <Link
              href="/blog/ada-vs-canyon-county-permit-timelines"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted/50"
            >
              Read full article
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <PermitFlowGraphic />

          <div className="mt-12 prose-measure text-sm text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Note:</strong> HOAs in Eagle, Harris Ranch,
              Hidden Springs, and similar communities may require architectural review in addition
              to county permits.
            </p>
            <p>
              Design-build contracts should state who submits plans, pays fees, and schedules
              inspections. Cosmetic work without layout changes may not need the full path below.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <ConsultCTA variant="brand">
              {CTA_PRIMARY}
              <ArrowRight className="ml-2 h-4 w-4" />
            </ConsultCTA>
            <Link
              href="/guides/boise-home-building-process-guide"
              className="inline-flex items-center text-sm text-accent-legible hover:underline"
            >
              Home building process guide
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}

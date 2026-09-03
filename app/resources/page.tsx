import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, FileText, Workflow } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { Section } from '@/components/marketing/Section';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { ALL_RESOURCES_LIST } from '@/shared/guideResources';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from '@/lib/schema';

export const metadata: Metadata = buildPageMetadata({
  kind: 'blog',
  path: '/resources',
  titleOverride: 'Home Building Planning Resources | Boise Construction Co',
  descriptionOverride:
    'Free PDF worksheets and visual guides for building in the Treasure Valley: new home budget worksheet, lot evaluation checklist, and the Ada vs Canyon County permit flow.',
});

export default function ResourcesIndexPage() {
  const pdfs = ALL_RESOURCES_LIST.filter((r) => r.kind === 'pdf');
  const visuals = ALL_RESOURCES_LIST.filter((r) => r.kind === 'visual');

  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Resources', url: '/resources' },
    ]),
    generateCollectionPageSchema({
      title: 'Home Building Planning Resources',
      description:
        'Free PDF worksheets and visual guides for building in the Treasure Valley: new home budget worksheet, lot evaluation checklist, and the Ada vs Canyon County permit flow.',
      url: '/resources',
      items: ALL_RESOURCES_LIST.map((r) => ({
        name: r.title,
        url: r.href,
      })),
    }),
  ];

  return (
    <Section spacing="lg" className="pt-28 md:pt-32">
      <JsonLd data={schemas} />
      <div className="container px-4 max-w-4xl mx-auto">
        <p className="text-xs font-normal uppercase tracking-wider text-accent-legible mb-3">
          Free downloads
        </p>
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">
          Home building planning resources
        </h1>
        <p className="text-lg text-muted-foreground mb-5 max-w-2xl">
          Printable PDFs and visual guides to use alongside our{' '}
          <Link href="/guides" className="text-accent-legible hover:underline">
            home building guides
          </Link>
          . These are planning tools - not quotes or contracts.
        </p>
        <p className="text-base text-muted-foreground mb-4 max-w-2xl leading-relaxed">
          These come from the same worksheets we use on real Treasure Valley builds. The budget
          worksheet pressure-tests your number before you talk to anyone, including the site costs
          most people forget until the excavator shows up. The lot evaluation checklist is what we
          walk with when a client asks us to look at a parcel before they make an offer. And the
          permit walkthrough shows how approvals actually run in Ada versus Canyon County, which
          are not the same process or the same timeline.
        </p>
        <p className="text-base text-muted-foreground mb-12 max-w-2xl leading-relaxed">
          All free, no email required. When you are ready, bring your notes to a{' '}
          <Link href="/contact" className="text-accent-legible hover:underline">
            free planning consultation
          </Link>{' '}
          and we will turn them into a written scope and an honest build range for your lot.
        </p>

        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          PDF worksheets
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {pdfs.map((r) => (
            <MarketingCard key={r.id} className="p-5 flex flex-col h-full">
              <FileText className="h-5 w-5 text-accent-legible mb-3" />
              <h3 className="font-normal mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
              <a
                href={r.href}
                download
                className="inline-flex items-center text-sm text-accent-legible hover:underline font-normal"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </a>
            </MarketingCard>
          ))}
        </div>

        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Visual guides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {visuals.map((r) => (
            <MarketingCard key={r.id} className="p-5 flex flex-col h-full">
              <Workflow className="h-5 w-5 text-accent-legible mb-3" />
              <h3 className="font-normal mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
              <Link
                href={r.href}
                className="inline-flex items-center text-sm text-accent-legible hover:underline font-normal"
              >
                View infographic
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </MarketingCard>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-12 text-center">
          <Link href="/guides/boise-home-building-cost-guide" className="text-accent-legible hover:underline">
            Start with the cost guide
          </Link>
          {' · '}
          <Link href="/contact" className="text-accent-legible hover:underline">
            Schedule a consultation
          </Link>
        </p>
      </div>
    </Section>
  );
}

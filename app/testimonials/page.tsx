import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Section } from '@/components/marketing/Section';
import { PageHeader } from '@/components/marketing/PageHeader';
import { ProjectGallerySection } from '@/components/sections/ProjectGallerySection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { buildPageMetadata } from '@/lib/page-metadata';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { Button } from '@/components/ui/button';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateReviewSchema,
} from '@/lib/schema';
import { GALLERY_PROJECTS } from '@/shared/galleryData';
import { TESTIMONIALS } from '@/shared/testimonialsData';

export const metadata = buildPageMetadata({
  kind: 'about',
  path: '/testimonials',
  titleOverride: 'Projects & Reviews',
  descriptionOverride:
    'See Treasure Valley remodeling transformations and read reviews from Boise Remodeling Co homeowners. Kitchen, bath, whole-home, and addition projects.',
});

// Review schema is wired to the LocalBusiness entity below. AggregateRating
// stays gated inside generateReviewSchema until BUSINESS_INFO.rating/reviewCount
// reflect genuine, verified reviews (no fabricated ratings). Add ISO `date`
// values to TESTIMONIALS entries to surface review dates.

export default function TestimonialsPage() {
  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Projects & Reviews', url: '/testimonials' },
    ]),
    generateCollectionPageSchema({
      title: 'Projects & Reviews',
      description:
        'Treasure Valley remodeling transformations from Boise Remodeling Co: kitchen, bath, whole-home, and addition projects.',
      url: '/testimonials',
      items: GALLERY_PROJECTS.map((p) => ({
        name: p.title,
        url: `/services/${p.serviceType}/${p.city}`,
      })),
    }),
    generateReviewSchema(
      TESTIMONIALS.map((t) => ({
        author: t.customerName,
        rating: Number(t.rating) || 5,
        text: t.testimonial,
      })),
    ),
  ];

  return (
    <div className="flex flex-col pb-20 md:pb-0">
      <JsonLd data={schemas} />
      <Section spacing="sm" className="pt-8 md:pt-12">
        <div className="container px-4 max-w-3xl">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Projects & Reviews' },
            ]}
          />
          <PageHeader
            align="left"
            className="mt-6"
            title={
              <>
                Projects &amp; homeowner{" "}
                <em className="brc-accent">reviews</em>
              </>
            }
            description="Explore recent design-build work across the Treasure Valley and hear from homeowners who prioritized clarity, craftsmanship, and communication."
          />
          <div className="mb-8" />
          <div className="flex flex-wrap gap-3">
            <ConsultCTA variant="brand">
              {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
            </ConsultCTA>
            <Button variant="brandOutline" asChild>
              <a href="/#consult">{CTA_SECONDARY}</a>
            </Button>
          </div>
        </div>
      </Section>

      <ProjectGallerySection limit={6} showViewAll={false} />
      <TestimonialsSection limit={4} showViewAll={false} />

      <Section divider spacing="sm">
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="marketing-card p-10 md:p-12 text-center">
            <h2 className="font-sans font-light text-section-title mb-4 text-foreground">
              Ready to start your project?
            </h2>
            <p className="text-base text-muted-foreground mb-8">
              Schedule a free in-home visit for planning guidance, design direction, and an honest
              project range.
            </p>
            <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
          </div>
        </div>
      </Section>
    </div>
  );
}

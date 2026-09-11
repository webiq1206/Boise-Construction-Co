import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  LandingPageTemplate,
  type LandingSection,
} from '@/components/seo/LandingPageTemplate';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  landingBreadcrumbs,
  landingFAQSchema,
  landingServiceSchema,
  landingSpeakable,
} from '@/lib/landing-schema';
import { SERVICE_SLUGS, getServiceBySlug, servicePath } from '@/lib/seo-routes';
import { SERVICE_SEO_CONTENT } from '@/shared/seoContent';
import { generateSpeakableSchema } from '@/lib/schema';
import { getServiceImageSet } from '@/shared/serviceBackgrounds';
import { CITIES } from '@/shared/contentData';
import { getFeaturedGalleryProject } from '@/shared/galleryData';

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const service = getServiceBySlug(params.slug);
  if (!service) return {};
  return buildPageMetadata({
    kind: 'service',
    serviceName: service.name,
    serviceSlug: service.slug,
    path: servicePath(service.slug),
  });
}

export default async function ServicePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const service = getServiceBySlug(params.slug);
  const content = SERVICE_SEO_CONTENT[params.slug];
  if (!service || !content) notFound();

  const path = servicePath(service.slug);
  const faqs = content.faqs;
  const images = getServiceImageSet(service.slug);
  const featuredProject = getFeaturedGalleryProject(service.slug);
  const serviceLC = service.name.toLowerCase();
  const isAddition = service.slug === 'home-additions';

  /* Cost guidance is no longer one of the long-form sections: it renders as
     the template's dedicated cost-and-timeline band directly after the hero,
     where the visitor's first question gets answered first. */
  const costGuidance = content.costGuidance
    ? {
        heading: content.costGuidance.heading,
        paragraphs: content.costGuidance.paragraphs,
        links: [
          { label: 'Boise Home Building Cost Guide', href: '/guides/boise-home-building-cost-guide' },
          {
            label: isAddition ? 'Start your home addition estimate' : 'Get your build cost range',
            href: isAddition
              ? '/estimate?project=addition&service=home-additions'
              : '/#calculator',
          },
        ],
      }
    : undefined;

  const sections: LandingSection[] = isAddition ? [
    {
      heading: 'Room additions across the Treasure Valley',
      paragraphs: [
        'We plan home additions in Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and Garden City. Local permit paths and the details of an existing home vary, so every project begins with the home itself.',
        'Choose your city for local home addition guidance, or schedule an in-home planning conversation to talk through the space you need.',
      ],
      links: CITIES.map((c) => ({
        label: `Home Additions in ${c.name}`,
        href: `/services/${service.slug}/${c.slug}`,
      })),
    },
    {
      heading: 'A practical place to start',
      paragraphs: [
        'Useful additions start with a plain question: what would make this home work better? A bedroom, more living space, or a room that gives the household breathing room can all begin with that answer.',
        'We then look at how the new space can meet the home already there, including structure, access, utilities, exterior continuity, and the permit path.',
      ],
    },
  ] : [
    {
      heading: `${service.name} across the Treasure Valley`,
      paragraphs: [
        `We provide ${serviceLC} services throughout the Treasure Valley, with dedicated local pages for each city we serve. Lot availability, permit paths, impact fees, and HOA design review differ between Ada and Canyon County communities, so each city page covers the details that matter where you plan to build.`,
        `Choose your city below to see local ${serviceLC} guidance, or schedule a free planning consultation to discuss your build directly.`,
      ],
      links: CITIES.map((c) => ({
        label: `${service.name} in ${c.name}`,
        href: `/services/${service.slug}/${c.slug}`,
      })),
    },
    {
      heading: `Why design-build for your ${serviceLC}`,
      paragraphs: [
        `As a design-build home builder, we bring architectural design, engineering, estimating, permitting, and construction under one contract and one accountable team. That removes the handoffs and finger-pointing that happen when the architect, the plan reviewer, and the general contractor all answer to someone different - and it keeps your ${serviceLC} on a single, coordinated schedule.`,
        // The line-item budget, allowances, weekly updates, and warranty are
        // already stated as scannable bullets above (benefits/inclusions) -
        // restating them here in prose was pure repetition. This paragraph
        // now adds only what those lists don't: the fixed-price framing and
        // the draw schedule.
        `You get a written, fixed price before we break ground and a published draw schedule through the build.`,
      ],
    },
  ];

  const schemas = [
    landingBreadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: service.name, url: path },
    ]),
    landingServiceSchema(service.name, content.overview),
    landingFAQSchema(faqs),
    generateSpeakableSchema({ path, name: content.headline }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <LandingPageTemplate
        h1={content.headline}
        speakableSummary={content.overview}
        overview={content.overview}
        heroImageUrl={images.hero}
        breatherImageUrl={images.breather}
        processImageUrl={images.process}
        manifestPath={path}
        planningFrom={service.planningFrom}
        estimateHref={isAddition ? '/estimate?project=addition&service=home-additions' : undefined}
        consultationHref={isAddition ? '/contact?service=home-additions&project=addition#consult' : undefined}
        costGuidance={costGuidance}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Services', href: '/services' },
          { name: service.name },
        ]}
        benefits={content.benefits}
        inclusions={content.inclusions}
        timeline={content.timeline}
        processSteps={content.processSteps}
        sections={sections}
        featuredProject={featuredProject}
        showEstimatePrompt
        faqs={faqs}
        related={{ variant: 'service', serviceSlug: service.slug }}
      />
    </>
  );
}

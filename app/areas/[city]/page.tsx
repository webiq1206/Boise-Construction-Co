import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  landingAreaBusinessSchema,
  landingBreadcrumbs,
  landingFAQSchema,
} from '@/lib/landing-schema';
import { CITY_SEO_DATA } from '@/lib/seo';
import { areaPath, CITY_SLUGS, getCityBySlug } from '@/lib/seo-routes';
import { getCountyLabel, SERVICES } from '@/shared/contentData';
import { AREA_PAGE_FAQS, getAreaIntro } from '@/shared/seoContent';
import { generateSpeakableSchema } from '@/lib/schema';
import { getAreaImageSet } from '@/shared/cityServiceImages';
import type { LandingSection, LandingProof } from '@/components/seo/LandingPageTemplate';
import { getGalleryProjectsForCity } from '@/shared/galleryData';
import { SITE_CONFIG } from '@/shared/siteConfig';

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ city: string }>;
  }
) {
  const params = await props.params;
  const cityData = getCityBySlug(params.city);
  if (!cityData) return {};
  return buildPageMetadata({
    kind: 'area',
    cityName: cityData.name,
    citySlug: cityData.slug,
    path: areaPath(cityData.slug),
  });
}

export default async function AreaPage(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const seo = CITY_SEO_DATA[city.name];
  const county = getCountyLabel(city.county);
  const path = areaPath(city.slug);
  const overview = getAreaIntro(city);
  const images = getAreaImageSet(city.slug);
  const localNote = seo
    ? `We serve ${city.name} homeowners across ${seo.neighborhoods.slice(0, 3).join(', ')}, and all of ${county}. Permits are coordinated through ${county} for projects requiring approval.`
    : `We serve ${city.name} and all of ${county} with design-build home construction.`;

  const neighborhoods = seo?.neighborhoods ?? [];
  const landmarks = seo?.landmarks ?? [];

  const sections: LandingSection[] = [
    {
      heading: `Home building services in ${city.name}`,
      paragraphs: [
        `${SITE_CONFIG.name} is a design-build home builder serving ${city.name} and the surrounding ${county} area. Whether you are building a fully custom home, adapting a semi-custom plan, or building on land you already own, every project runs through one accountable team - from the first planning consultation and lot review, through design, permits, construction, and the day you get the keys.`,
        `Explore the specific services we offer in ${city.name} below. Each links to a dedicated ${city.name} page with local details, typical scope, and budget guidance.`,
      ],
      links: SERVICES.map((s) => ({
        label: `${s.name} in ${city.name}`,
        href: `/services/${s.slug}/${city.slug}`,
      })),
    },
    {
      heading: `Neighborhoods and lots we build on in ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We build throughout ${city.name}, including ${neighborhoods.join(', ')}. Lots vary block by block in setbacks, utilities, soil, and slope, so we evaluate the specific parcel before we price the home rather than applying a flat square-foot number.`
          : `We build throughout ${city.name}, evaluating each parcel for setbacks, utilities, soil, and slope before we price the home rather than applying a flat square-foot number.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, we understand the area's character and how to design a home that fits its street and holds its value.`
          : `As a local team, we understand the area's character and how to design a home that fits its street and holds its value.`,
      ],
    },
    {
      heading: `Permits and planning in ${county}`,
      paragraphs: [
        `Every new home in ${city.name} requires a building permit through ${county}, along with plan review, and often site-specific approvals for driveways, septic, or well. We build plan review and inspection windows into the master schedule so timelines stay realistic, and we coordinate submissions, fees, and inspections as part of your design-build contract.`,
        seo?.climate
          ? `Our ${city.name} designs also account for the local ${seo.climate} - from insulation levels and window specification to a building envelope and exterior materials that hold up to freeze-thaw cycles.`
          : `Our designs also account for the Treasure Valley climate, from insulation levels and window specification to a building envelope built for freeze-thaw cycles.`,
      ],
    },
  ];

  // Real before/after projects only - no seeded testimonials or star ratings
  // until genuine, verified reviews exist.
  const cityProjects = getGalleryProjectsForCity(city.slug);
  const proof: LandingProof | undefined =
    cityProjects.length > 0
      ? {
          projects: cityProjects.map((p) => ({
            title: p.title,
            description: p.description,
            beforeImageUrl: p.beforeImageUrl,
            afterImageUrl: p.afterImageUrl,
          })),
        }
      : undefined;

  const h1 = `Home Builder in ${city.name}, Idaho`;
  const faqs = [
    ...AREA_PAGE_FAQS,
    {
      question: `Do you build in ${city.name}, Idaho?`,
      answer: `Yes. ${city.name} is part of our Treasure Valley service area. We build custom homes, semi-custom homes, and homes on land you already own, and we can evaluate a ${city.name} lot before you buy it.`,
    },
  ];

  const schemas = [
    landingBreadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Service Areas', url: '/areas' },
      { name: city.name, url: path },
    ]),
    landingAreaBusinessSchema(city.name),
    landingFAQSchema(faqs),
    generateSpeakableSchema({ path, name: h1 }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <LandingPageTemplate
        h1={h1}
        speakableSummary={overview}
        overview={overview}
        heroImageUrl={images.hero}
        breatherImageUrl={images.breather}
        processImageUrl={images.process}
        manifestPath={path}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Service Areas', href: '/areas' },
          { name: city.name },
        ]}
        benefits={[
          `Local experience in ${city.name} and ${county}`,
          'Design-build team, one accountable contact',
          'Line-item budget before we break ground',
          'Written workmanship warranty',
        ]}
        localNote={localNote}
        sections={sections}
        proof={proof}
        proofHeading={`Recent ${city.name} projects`}
        showEstimatePrompt
        faqs={faqs}
        related={{ variant: 'area', citySlug: city.slug }}
      />
    </>
  );
}

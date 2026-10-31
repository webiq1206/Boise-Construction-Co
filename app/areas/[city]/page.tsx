import { InteriorPage } from '@/components/approved/InteriorLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import type { LandingProof,LandingSection } from '@/components/seo/LandingPageTemplate';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import {
landingBreadcrumbs,
landingFAQSchema,
} from '@/lib/landing-schema';
import { buildPageMetadata } from '@/lib/page-metadata';
import { permitGuidance, permitSource } from '@/lib/permitGuidance';
import { generateSpeakableSchema } from '@/lib/schema';
import { CITY_SEO_DATA, indianCreekDescription } from '@/lib/seo';
import { areaPath,CITY_SLUGS,getCityBySlug } from '@/lib/seo-routes';
import { getAreaImageSet } from '@/shared/cityServiceImages';
import { getCountyLabel,SERVICES } from '@/shared/contentData';
import { getGalleryProjectsForCity } from '@/shared/galleryData';
import { getAreaCityCopy } from '@/shared/content/areaCopy';
import { AREA_PAGE_FAQS,getAreaIntro } from '@/shared/seoContent';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { CONSTRUCTION_IMAGES } from '@/shared/siteImages';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

function emphasizePhrase(text: string, phrase: string): ReactNode {
  const index = text.indexOf(phrase);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <strong>{phrase}</strong>
      {text.slice(index + phrase.length)}
    </>
  );
}

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
  return withBrandPageMetadata(await (buildPageMetadata({
    kind: 'area',
    cityName: cityData.name,
    citySlug: cityData.slug,
    path: areaPath(cityData.slug),
    ...(cityData.slug === 'middleton' ? {
      titleOverride: 'Custom Home Builder in Middleton, ID',
      descriptionOverride: 'Plan a custom home in Middleton, ID. Share your lot, plans and project details with Boise Construction Co for team review before we prepare your estimate.',
    } : {}),
  })), "/areas/[city]");
}

export default async function AreaPage(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const seo = CITY_SEO_DATA[city.name];
  const county = getCountyLabel(city.county);
  const path = areaPath(city.slug);
  const cityCopy = getAreaCityCopy(city.slug);
  const overview = getAreaIntro(city);
  const answerFirst = `${city.name}, Idaho is in ${county}. ${SITE_CONFIG.name} builds there as a design-build home builder. Ada County and Canyon County permit steps are on the permit-flow page.`;
  const middletonLead = city.slug === 'middleton' ? cityCopy?.lead : undefined;
  const images = getAreaImageSet(city.slug);
  const localNote = seo
    ? `We serve ${city.name} homeowners${seo.neighborhoods.length ? ` across ${seo.neighborhoods.slice(0, 3).join(', ')}` : ''}, and all of ${county}. Addresses outside city limits go through the county instead; we check this for you at the first visit.`
    : `We serve ${city.name} and all of ${county} with design-build home construction. Addresses outside city limits go through the county instead; we check this for you at the first visit.`;

  const neighborhoods = seo?.neighborhoods ?? [];
  const landmarks = seo?.landmarks ?? [];
  const creek = indianCreekDescription(city.name);

  const sections: LandingSection[] = [
    ...(city.slug === 'middleton'
      ? [
          {
            heading: 'Custom home builder serving Middleton',
            paragraphs: [
              'Home builders in Middleton work with both city lots and Canyon County acreage. As your custom home builder in Middleton, we handle lot evaluation, design, engineering, permitting, and construction under one contract so drawings, budget, and schedule stay tied together.',
              'For local permit and land detail, read our Middleton home building guide. For Treasure Valley process and planning ranges, see custom home builder.',
            ],
            paragraphLinks: [
              undefined,
              [
                {
                  phrase: 'Middleton home building guide',
                  href: '/guides/middleton-home-building-guide',
                },
                { phrase: 'custom home builder', href: '/services/custom-home-builder' },
              ],
            ],
            bullets: [
              'Fully custom homes designed around your lot and how you live',
              'Semi-custom plans adapted for timeline and budget range',
              'Build on your lot when you already own the land',
            ],
            bulletsAfterParagraph: 0,
          } satisfies LandingSection,
        ]
      : []),
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
      figure: {
        src:
          city.slug === 'eagle'
            ? '/images/projects/eagle-mountain-modern/eagle-custom-home-front-exterior.webp'
            : images.breather,
        caption:
          city.slug === 'eagle'
            ? 'Charcoal stucco, ledgestone, and dark standing-seam roof on a foothills concept home.'
            : `Concept design imagery for home building in ${city.name}.`,
      },
    },
    {
      heading: `Neighborhoods and lots we build on in ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We build throughout ${city.name}, including ${neighborhoods.join(', ')}.${creek ? ` ${creek}` : ''} Lots vary block by block in setbacks, utilities, soil, and slope, so we evaluate the specific parcel before we price the home rather than applying a flat square-foot number.`
          : creek
            ? `We build throughout ${city.name}. ${creek} We evaluate each parcel for setbacks, utilities, soil, and slope before we price the home rather than applying a flat square-foot number.`
            : `We build throughout ${city.name}, evaluating each parcel for setbacks, utilities, soil, and slope before we price the home rather than applying a flat square-foot number.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, we understand the area's character and how to design a home that fits its street and holds its value.`
          : `As a local team, we understand the area's character and how to design a home that fits its street and holds its value.`,
      ],
      figure: {
        src:
          city.slug === 'eagle'
            ? '/images/projects/eagle-mountain-modern/eagle-custom-home-great-room.webp'
            : CONSTRUCTION_IMAGES.lot,
        caption:
          city.slug === 'eagle'
            ? 'Great room with black steel window wall, white oak floor, and ledgestone fireplace.'
            : `Lot and living-space planning for ${city.name}.`,
      },
    },
    {
      heading: `Permits and planning in ${city.name}`,
      links: [
        ...(permitSource(city.name)
          ? [{ label: `Official ${city.name} permit guidance`, href: permitSource(city.name)! }]
          : []),
        { label: 'Ada and Canyon County permit flow', href: '/resources/ada-canyon-permit-flow' },
        { label: 'Custom home builder', href: '/services/custom-home-builder' },
      ],
      paragraphs: [
        permitGuidance(city.name),
        'Addresses outside city limits go through the county instead; we check this for you at the first visit.',
        'We confirm the required submissions and inspection steps for your scope, then account for them in the project schedule.',
        seo?.climate
          ? `Our ${city.name} designs also account for the local ${seo.climate}, from insulation levels and window specification to a building envelope and exterior materials that hold up to freeze-thaw cycles.`
          : `Our designs also account for the Treasure Valley climate, from insulation levels and window specification to a building envelope built for freeze-thaw cycles.`,
      ],
    },
  ];

  // Concept-home imagery only - no seeded testimonials or star ratings until
  // genuine, verified reviews exist.
  const cityProjects = getGalleryProjectsForCity(city.slug);
  const proof: LandingProof | undefined =
    cityProjects.length > 0
      ? {
          projects: cityProjects.map((p) => ({
            title: p.title,
            description: p.description,
            exteriorImageUrl: p.images[0]?.src ?? "",
            interiorImageUrl: p.images[1]?.src ?? p.images[0]?.src ?? "",
          })),
        }
      : undefined;

  const h1 =
    city.slug === 'middleton'
      ? 'Custom Home Builder in Middleton, Idaho'
      : `Home Builder in ${city.name}, Idaho`;
  const faqs = cityCopy?.faqs ?? [
    ...AREA_PAGE_FAQS,
    {
      question: `Do you build in ${city.name}, Idaho?`,
      answer: `Yes. ${city.name} is part of our Treasure Valley service area. We build custom homes, semi-custom homes, and homes on land you already own, and we can evaluate a ${city.name} lot before you buy it.`,
    },
    {
      question: `Which county is ${city.name} in?`,
      answer: `${city.name} is in ${county}. The permit steps for Ada County and Canyon County are compared on the Ada and Canyon County permit-flow page.`,
    },
  ];

  const schemas = [
    landingBreadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Service Areas', url: '/areas' },
      { name: city.name, url: path },
    ]),
    landingFAQSchema(faqs),
    generateSpeakableSchema({ path, name: h1 }),
  ];

  return (
    <InteriorPage kind="areas"><>
      <JsonLd data={schemas} />
      <LandingPageTemplate
        h1={h1}
        speakableSummary={overview}
        overview={middletonLead ? overview : `${answerFirst} ${overview}`}
        overviewParagraphs={
          middletonLead
            ? middletonLead.map((paragraph, index) =>
                index === 0 ? emphasizePhrase(paragraph, 'custom home builder in Middleton') : paragraph,
              )
            : undefined
        }
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
        showEstimatePrompt
        faqs={faqs}
        related={{ variant: 'area', citySlug: city.slug }}
      />
    </></InteriorPage>
  );
}

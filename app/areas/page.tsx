import { InteriorPage } from "@/components/approved/InteriorLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AreaCard } from "@/components/marketing/AreaCard";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { ConsultCTA } from "@/components/modals/ConsultCTA";
import { Reveal } from "@/components/Reveal";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { JsonLd } from "@/components/seo/JsonLd";
import { HeroTextLink } from "@/components/approved/PrimaryCta";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildPageMetadata } from "@/lib/page-metadata";
import {
generateBreadcrumbSchema,
generateWebPageSchema,
} from "@/lib/schema";
import { CITY_HERO_IMAGES } from "@/shared/cityServiceImages";
import { SERVICE_AREA_CITIES,SERVICE_AREA_LINE } from "@/shared/contentData";
import { CTA_PRIMARY,CTA_SECONDARY } from "@/shared/ctaCopy";
import { contentImageAlt } from "@/shared/imageAlts";
import { SITE_IMAGES } from "@/shared/siteImages";

export const metadata = withBrandPageMetadata((buildPageMetadata({
  kind: "about",
  path: "/areas",
  titleOverride: "Treasure Valley Service Areas",
  descriptionOverride:
    "Custom home building in Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City, across Ada and Canyon County.",
})), "/areas");

export default function AreasHubPage() {
  const schemas = [
    generateWebPageSchema({
      title: "Treasure Valley Service Areas",
      description: `Custom and semi-custom home building in ${SERVICE_AREA_LINE}.`,
      url: "/areas",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Service Areas", url: "/areas" },
    ]),
  ];

  return (
    <InteriorPage kind="areas"><>
      <JsonLd data={schemas} />
      <div className="flex flex-col ">
        <PageHeroBand
          imageSrc={SITE_IMAGES.hero}
          imageAlt={contentImageAlt(SITE_IMAGES.hero)}
        >
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Service areas" }]} />
          <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Treasure Valley</p>
          <h1 className="ed-display ed-statement-display text-inverse-foreground">
            Treasure Valley service{" "}
            <em className="brc-accent">areas</em>
          </h1>
          <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
            We build custom and semi-custom homes across Ada County and Canyon County, on lots you
            own and lots we help you find, under one design-build team.
          </p>
          <p className="sr-only" data-speakable="summary">
            Treasure Valley new home construction service areas.
          </p>
          {/* One primary; the consultation is a quiet text action, not a second button. */}
          <div className="interior-hero-actions">
            <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
            <HeroTextLink href="/#consult">{CTA_SECONDARY}</HeroTextLink>
          </div>
        </PageHeroBand>

        <Section surface="bone" spacing="xl">
          <div className="ed-shell">
            <SectionHeader
              eyebrow="Treasure Valley"
              title={<>Nine cities, one design-build team</>}
              description="Custom homes, semi-custom homes, and builds on your own lot in Ada County and Canyon County."
              align="left"
            />
            <div className="ed-cards-3 gap-5">
              {SERVICE_AREA_CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={i * 40}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <EstimatePromptBand
          title={
            <>
              Planning a build in your{' '}
              <em className="brc-accent">city</em>?
            </>
          }
          description="Lot costs, impact fees, and permit timelines differ across Ada and Canyon County. See a preliminary price range for your build on screen, then talk through your lot and city with our team."
          variant="tint"
        />

        <BlogEndCta />
      </div>
    </></InteriorPage>
  );
}

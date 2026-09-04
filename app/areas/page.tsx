import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { AreaCard } from "@/components/marketing/AreaCard";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { CITY_HERO_IMAGES } from "@/shared/cityServiceImages";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { buildPageMetadata } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { CITIES, TREASURE_VALLEY_CITIES } from "@/shared/contentData";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/shared/ctaCopy";
import { Button } from "@/components/ui/button";
import { ConsultCTA } from "@/components/modals/ConsultCTA";
import { SITE_IMAGES } from "@/shared/siteImages";

export const metadata = buildPageMetadata({
  kind: "about",
  path: "/areas",
  titleOverride: "Treasure Valley Service Areas",
  descriptionOverride:
    "Custom home building across the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho.",
});

export default function AreasHubPage() {
  const schemas = [
    generateWebPageSchema({
      title: "Treasure Valley Service Areas",
      description: `Custom and semi-custom home building serving ${TREASURE_VALLEY_CITIES}.`,
      url: "/areas",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Service Areas", url: "/areas" },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="flex flex-col pb-20 md:pb-0">
        <PageHeroBand
          imageSrc={SITE_IMAGES.hero}
          imageAlt="Newly built Treasure Valley home with open kitchen and living space"
        >
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Service Areas" }]} />
          <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Treasure Valley</p>
          <h1 className="ed-display ed-statement-display text-inverse-foreground">
            Treasure Valley service{" "}
            <em className="brc-accent">areas</em>
          </h1>
          <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
            We build custom and semi-custom homes across {TREASURE_VALLEY_CITIES}, and the surrounding
            communities, on lots you own and lots we help you find, under one design-build team.
          </p>
          <p className="sr-only" data-speakable="summary">
            Treasure Valley new home construction service areas.
          </p>
          <div className="flex flex-wrap gap-3">
            <ConsultCTA variant="brand">
              {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
            </ConsultCTA>
            <Button variant="heroGhost" asChild>
              <a href="/#consult">{CTA_SECONDARY}</a>
            </Button>
          </div>
        </PageHeroBand>

        <Section surface="dark" spacing="xl">
          <div className="ed-shell">
            <SectionHeader
              eyebrow="Treasure Valley"
              title={<>Eight cities, one design-build team</>}
              description="Custom homes, semi-custom homes, and builds on your own lot across Ada and Canyon County."
              align="left"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CITIES.map((city, i) => (
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
          description="Lot costs, impact fees, and permit timelines differ across Ada and Canyon County. Get an instant build cost range for your city, then book a free consultation for local guidance."
          variant="tint"
        />

        <BlogEndCta />
      </div>
    </>
  );
}

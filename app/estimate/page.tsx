import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Section } from "@/components/marketing/Section";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCanonical } from "@/lib/page-metadata";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema";
import { CONSTRUCTION_IMAGES } from "@/shared/siteImages";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CTA_SECONDARY } from "@/shared/ctaCopy";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const EstimateCalculator = dynamic(
  () =>
    import("@/components/EstimateCalculator").then((mod) => mod.EstimateCalculator),
  {
    loading: () => (
      <div className="container px-4 py-16 text-center text-sm text-muted-foreground">
        Loading project estimator...
      </div>
    ),
  },
);

// 34 chars, so the branded title below lands at 58 with the 24-char suffix.
const TITLE = "Home Build Cost Estimator, Idaho";
const DESCRIPTION =
  "Get an instant cost range for building a new home in Boise, Meridian, Eagle, Nampa, and the Treasure Valley. Covers size, finish level, and site costs. Free, no obligation.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
  description: DESCRIPTION,
  alternates: { canonical: buildCanonical("/estimate") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: buildCanonical("/estimate"),
    type: "website",
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/og-default.png"],
  },
};

export default function EstimatePage() {
  const schemas = [
    generateWebPageSchema({
      title: "Home Build Cost Estimator",
      description: DESCRIPTION,
      url: "/estimate",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Project Estimator", url: "/estimate" },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      <PageHeroBand
        imageSrc={CONSTRUCTION_IMAGES.customHome}
        imageAlt="Newly built custom home exterior in the Treasure Valley at dusk"
        scrim={0.85}
      >
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Project Estimator" }]} />
        <div className="brc-label text-inverse-muted mt-6 mb-4">Free planning tool</div>
        <h1 className="font-sans font-light text-display tracking-tight text-inverse-foreground max-w-3xl mb-4">
          Treasure Valley home build{" "}
          <em className="brc-accent">estimator</em>
        </h1>
        <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed">
          Answer a few questions about the home you want to build and get an instant planning range
          based on real Treasure Valley construction costs - takes about 2 minutes, no obligation.
        </p>
      </PageHeroBand>

      <EstimateCalculator />

      <Section variant="greige" divider>
        <div className="container px-4 max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="brc-label mb-4">What happens next</div>
            <h2 className="font-sans font-light text-2xl md:text-3xl tracking-tight text-foreground mb-4">
              Your range is a starting point - not a quote
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              The estimator gives you a realistic planning band for your home type, size, and
              finish level. When you&apos;re ready for detail, book a free consultation and we&apos;ll
              walk your lot, talk through plans and site costs, and put a written range in your hands.
            </p>
            <Button variant="brandOutline" asChild>
              <Link href="/contact#consult">
                {CTA_SECONDARY} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <MarketingCard padding="lg">
            <p className="text-sm font-normal text-foreground mb-4">Your free consultation includes</p>
            <ul className="space-y-3">
              {CONSULT_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                  {bullet}
                </li>
              ))}
            </ul>
          </MarketingCard>
        </div>
      </Section>
    </>
  );
}

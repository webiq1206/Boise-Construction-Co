import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FAQSection } from "@/components/FAQSection";
import { ConsultationForm } from "@/components/ConsultationForm";
import { Reveal } from "@/components/Reveal";
import { HeroSection } from "@/components/sections/HeroSection";
import { ValueOverheadSection } from "@/components/sections/ValueOverheadSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { BudgetInclusionsSection } from "@/components/sections/BudgetInclusionsSection";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { BrandStatementBand } from "@/components/sections/BrandStatementBand";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { Section } from "@/components/marketing/Section";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Check } from "lucide-react";
import { CONSULT_BULLETS, SITE_TAGLINE } from "@/shared/siteContent";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { buildCanonical } from "@/lib/page-metadata";
import { SITE_IMAGES } from "@/shared/siteImages";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { fitDescription } from '@/lib/page-metadata';

const EstimateCalculator = dynamic(
  () =>
    import("@/components/EstimateCalculator").then((mod) => mod.EstimateCalculator),
  {
    loading: () => (
      <div
        id="calculator"
        className="container scroll-mt-20 px-4 py-16 text-center text-sm text-muted-foreground"
      >
        Loading estimate calculator...
      </div>
    ),
  },
);

export const metadata: Metadata = {
  // 55 chars. Leads with the primary term ("custom home builder Boise") rather
  // than the brand, which the suffix carries anyway.
  title: { absolute: `Custom Home Builder in Boise, ID | ${SITE_CONFIG.name}` },
  description:
    fitDescription("Design-build home builder for Boise, Meridian, Eagle, Nampa & the Treasure Valley. Custom and semi-custom homes, or build on your own lot, with a line-item budget before we break ground."),
  alternates: {
    canonical: buildCanonical("/"),
    // Setting `alternates` replaces the root declaration, so the feed link has
    // to be repeated here or the homepage loses feed discovery entirely.
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_CONFIG.name} | Home Building Guides and Insights` },
      ],
    },
  },
  openGraph: {
    title: `${SITE_CONFIG.name} | Treasure Valley Home Builder`,
    description:
      `${SITE_TAGLINE}. Custom homes, semi-custom homes, build-on-your-lot, and design-build across the Treasure Valley.`,
    type: "website",
    url: buildCanonical("/"),
    siteName: SITE_CONFIG.name,
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col pb-20 md:pb-0 bg-background">
      {/* PAGE ORDER IS THE SALES CONVERSATION, IN THE ORDER A HOMEOWNER HAS IT.

          1. Hero            who we are, and the one action we want
          2. Where the money goes   frames price before we quote one
          3. Estimator       the number - the question every visitor arrives with
          4. What's included what that number actually covers
          5. Services        what we do
          6. Our work        proof we do it well
          7. Why us          why this company rather than another
          8. Process         what happens after they say yes
          9. Brand band      the emotional close
          10. FAQ            the last objections
          11. Consultation   the ask

          The estimator sits third on purpose. It is the site's primary lead
          generator and the hero's own call to action points at it, so burying
          it below services, process, a featured project and the gallery meant
          the highest-intent visitors scrolled past five sections to reach the
          thing they came for. Everything above it now exists only to make the
          number land well; everything below it answers what the number raised. */}
      <HomePageSchema />
      <HeroSection />
      <ValueOverheadSection />
      <EstimateCalculator />
      <BudgetInclusionsSection />
      <ServicesGrid />
      {/* No longer excludes whole-home: the featured before/after slider that
          used to carry that project was removed, so the gallery is now the only
          place it appears. */}
      <ProjectGallerySection limit={6} showViewAll={true} />

      <EstimatePromptBand
        eyebrow="Still comparing builders"
        title={
          <>
            Find out what your home will{' '}
            <em className="brc-accent">cost</em>
          </>
        }
        description="Missed the estimator higher up the page? It stays open whenever you are ready - or book a free planning consultation and we will work through your lot, your plan, and a realistic budget band in person."
        variant="tint"
        bullets={[
          "A ballpark range built from current Treasure Valley build costs",
          "A free planning consultation when you want the detail",
          "No strings - a copy of whatever the estimator returns lands in your inbox",
        ]}
      />

      <WhyChooseUsSection limit={5} />
      <ProcessSection />
      <BrandStatementBand />
      <FAQSection />
      <Section id="consult" divider className="relative overflow-hidden scroll-mt-16 pb-28 md:pb-28">
        {/* Warm, dimmed lifestyle photo grounds the closing section. Directional
            scrims keep the left-column copy legible and fade the edges into the
            page ground; the form card floats above on its own shadow. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Image
            src={SITE_IMAGES.consultBg}
            unoptimized
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover opacity-[0.52] img-brand-grade"
          />
          {/* Directional scrims: solid behind the left-column copy, opening up
              toward the right where the form card carries its own surface. */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/[0.68] to-background/[0.32]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-transparent to-background" />
        </div>
        {/* The ask. Full measure, heading at h2 scale, the form kept in its
            card because a form needs a defined field to sit in - this is one of
            the places a card is actually the right answer. */}
        <div className="ed-shell relative z-10">
          <div className="grid gap-[var(--ed-gutter)] lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="ed-eyebrow">Begin a conversation</p>
                <h2 className="ed-h2 ed-statement">
                  Tell us what you want to{" "}
                  <em className="not-italic" style={{ color: "var(--ed-accent)" }}>
                    build
                  </em>
                  .
                </h2>
                <p className="ed-lede mt-8 max-w-[40ch]">
                  Send a few details and we will set up a free 60 to 90 minute
                  planning session, usually within one business day.
                </p>
                <p className="ed-body mt-4">
                  By the end you will have a realistic budget band, a clear-eyed read
                  on your lot, and no expectation to go any further.
                </p>
                <ul
                  className="mt-8 grid list-none gap-3 border-t p-0 pt-6"
                  style={{ borderColor: "var(--ed-line)" }}
                >
                  {CONSULT_BULLETS.map((item) => (
                    <li key={item} className="ed-body flex items-center gap-3 text-[0.875rem]">
                      <Check
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "var(--ed-accent)" }}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <MarketingCard className="shadow-2xl" padding="lg">
              <ConsultationForm />
            </MarketingCard>
          </div>
        </div>
      </Section>
    </div>
  );
}

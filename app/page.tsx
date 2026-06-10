import type { Metadata } from "next";
import { EstimateCalculator } from "@/components/EstimateCalculator";
import { FAQSection } from "@/components/FAQSection";
import { ConsultationForm } from "@/components/ConsultationForm";
import { Reveal } from "@/components/Reveal";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { StatementBandSection } from "@/components/sections/StatementBandSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { FeaturedProjectSection } from "@/components/sections/FeaturedProjectSection";
import { BudgetInclusionsSection } from "@/components/sections/BudgetInclusionsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { Section } from "@/components/marketing/Section";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Check } from "lucide-react";
import { CONSULT_BULLETS, SITE_TAGLINE } from "@/shared/siteContent";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { buildCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = {
  title: { absolute: "Remodeling Contractor in Boise, ID | Boise Remodeling Co" },
  description:
    "Design-build remodeling for Boise, Meridian, Eagle, Nampa & the Treasure Valley. Clear expectations and budget guidance. Schedule a free in-home consultation.",
  alternates: {
    canonical: buildCanonical("/"),
  },
  openGraph: {
    title: "Boise Remodeling Co | Treasure Valley Design-Build",
    description:
      `${SITE_TAGLINE}. Kitchen, bathroom, whole-home, and addition remodeling across the Treasure Valley.`,
    type: "website",
    images: [{ url: "/images/hero-remodel-interior.png", width: 1200, height: 630, alt: "Boise Remodeling Co" }],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col pb-20 md:pb-0 bg-background">
      <HomePageSchema />
      <HeroSection />
      <ServicesGrid />
      <StatementBandSection />
      <ProcessSection />
      <FeaturedProjectSection />
      <TestimonialsSection limit={3} showViewAll={true} />
      <EstimateCalculator />
      <WhyChooseUsSection limit={5} />
      <BudgetInclusionsSection />
      <FAQSection />
      <Section id="consult" divider className="pb-28 md:pb-28">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12 items-start">
            <div className="md:col-span-2">
              <Reveal>
                <div className="brc-label mb-5">Begin a conversation</div>
                <h2 className="font-sans font-light text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] leading-[1.08] tracking-tight mb-4 text-foreground">
                  Tell us about your{" "}
                  <em className="brc-accent text-accent">home</em>.
                </h2>
                <p className="text-base leading-relaxed mb-8 text-muted-foreground">
                  We will reach out within one business day to schedule your free
                  60 to 90 minute in-home visit. You will leave with planning guidance,
                  design direction, and no obligation.
                </p>
                <div className="space-y-3">
                  {CONSULT_BULLETS.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-foreground/60" />
                      {item}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <MarketingCard className="md:col-span-3" padding="lg">
              <ConsultationForm />
            </MarketingCard>
          </div>
        </div>
      </Section>
    </div>
  );
}

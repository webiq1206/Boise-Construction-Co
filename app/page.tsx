import { ApprovedHome } from "@/components/approved/ApprovedHome";
import { HomeHero } from "@/components/approved/HomeHero";
import { ConsultationForm } from "@/components/ConsultationForm";
import { QuoteFormAnchor } from "@/components/QuoteFormAnchor";
import { Reveal } from "@/components/Reveal";
import { BudgetInclusionsSection } from "@/components/sections/BudgetInclusionsSection";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical,fitDescription } from "@/lib/page-metadata";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CONSULT_BULLETS,SITE_TAGLINE } from "@/shared/siteContent";
import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = withBrandPageMetadata(({
  // 55 chars. Leads with the primary term ("custom home builder Boise") rather
  // than the brand, which the suffix carries anyway.
  title: { absolute: `Custom Home Builder in Boise, ID | ${SITE_CONFIG.name}` },
  // Keyword first, 140 to 155 characters, no phone (scripts/verify-meta-descriptions.ts).
  description:
    fitDescription("Custom home builder in Boise, Idaho. Boise Construction Co, a P5 Home Co company, designs and builds custom and semi-custom homes with a line-item budget."),
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
}), "/");

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background">
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
      <HomeHero />
      <ApprovedHome />
      <ProjectGallerySection limit={1} />
      <BudgetInclusionsSection />
      <div id="contact" className="scroll-mt-24" aria-hidden="true" />
      {/* The ask. A bone band after the dark budget section, with the form as the one
          bright object on the screen: white card, accent top rule, deep shadow. Every
          "#consult" link lands on the form heading and its first field (QuoteFormAnchor).
          Phones: the form leads and the reassurance follows it. */}
      <section className="fr-request family-site family-construction" style={{ "--f-accent": "#C48D3F" } as React.CSSProperties} aria-label="Request a quote">
        <div className="f-section f-container">
          <div className="fr-request-grid">
            <div id="consult" data-quote-anchor="" className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1">
              <QuoteFormAnchor />
              <div className="fr-request-card">
                <ConsultationForm />
              </div>
            </div>
            <div className="fr-request-copy order-2 lg:order-1 lg:col-start-1 lg:row-start-1">
              <Reveal>
                <p className="f-eyebrow">BEGIN A CONVERSATION</p>
                <h2>Tell us what you<br /><em style={{ color: "var(--f-accent)" }}>want to build.</em></h2>
                <p>Send a few details and we will set up a free 60 to 90 minute planning session, usually within one business day.</p>
                <p>By the end you will have a realistic budget band, a clear-eyed read on your lot, and no expectation to go any further.</p>
                <ul className="fr-request-list">
                  {CONSULT_BULLETS.map((item) => (
                    <li key={item}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="fr-request-list" style={{ borderTop: 0, paddingTop: 0 }}>
                  <li><a href={SITE_CONFIG.phoneHref} className="f-link">Call {SITE_CONFIG.phone} <ArrowUpRight size={16} aria-hidden="true" /></a></li>
                  <li><a href={SITE_CONFIG.phoneSmsHref} className="f-link">Send a text <ArrowUpRight size={16} aria-hidden="true" /></a></li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

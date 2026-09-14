import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCanonical } from "@/lib/page-metadata";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { fitDescription } from '@/lib/page-metadata';

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
  fitDescription("Get an instant cost range for building a new home in Boise, Meridian, Eagle, Nampa, and the Treasure Valley. Covers size, finish level, and site costs. Free, no obligation.");

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

      {/* ONE SCREEN. The estimator is the page: the conversational app frame
          mounts beneath the site header and owns everything below it, with its
          own scroll area and a bottom-anchored input, so nothing here scrolls
          into unrelated content. */}
      <EstimateCalculator fitViewport />
    </>
  );
}

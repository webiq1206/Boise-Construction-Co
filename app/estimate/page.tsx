import {withBrandPageMetadata} from '@/lib/brand-page-metadata';
import type { Metadata } from "next";
import { EstimateCalculator } from "@/components/EstimateCalculator";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCanonical } from "@/lib/page-metadata";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { fitDescription } from '@/lib/page-metadata';



const TITLE = "Request a Home Build Estimate";
const DESCRIPTION =
  fitDescription("Planning a home build in Boise or the Treasure Valley? Share your project details and plans for team review before we prepare your estimate.");

export const metadata: Metadata = withBrandPageMetadata(({
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
}), "/estimate");

export default function EstimatePage() {
  const schemas = [
    generateWebPageSchema({
      title: "Request a Home Build Estimate",
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
      <div data-clarity-mask="true">
        <EstimateCalculator fitViewport />
      </div>
    </>
  );
}

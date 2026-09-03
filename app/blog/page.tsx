import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogIndexClient } from "@/components/marketing/BlogIndexClient";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildPageMetadata } from "@/lib/page-metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { BLOG_POSTS } from "@/shared/blogContent";
import { getBlogHeroImage, getBlogImageAlt } from "@/shared/blogImages";
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from "@/lib/schema";

export const metadata: Metadata = buildPageMetadata({
  kind: "blog",
  path: "/blog",
});

export default function BlogPage() {
  const schemas = [
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]),
    generateCollectionPageSchema({
      title: "Home Building Insights",
      description:
        "Straight answers for Treasure Valley families building a new home: what it costs, how long it takes, how to read a bid, and what to look for in a lot.",
      url: "/blog",
      items: BLOG_POSTS.map((post) => ({
        name: post.title,
        url: `/blog/${post.slug}`,
      })),
    }),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      <PageHeroBand
        imageSrc={getBlogHeroImage("stages-of-building-a-house")}
        imageAlt={getBlogImageAlt("stages-of-building-a-house")}
      >
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
        <div className="brc-label text-inverse-muted mt-6 mb-4">Blog</div>
        <h1 className="font-serif text-display tracking-tight text-inverse-foreground max-w-3xl mb-4">
          Home Building Insights
        </h1>
        <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-4">
          Straight answers for Treasure Valley families building a new home. What it actually costs,
          how long each stage takes, how to compare two bids that look nothing alike, and what to
          check before you buy a lot.
        </p>
        <Link
          href="/guides"
          className="text-sm text-inverse-foreground/90 hover:text-inverse-foreground inline-flex items-center transition-colors"
        >
          Browse the full home building guides
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </PageHeroBand>

      <BlogIndexClient />

      <EstimatePromptBand
        eyebrow="Ready to plan"
        title={
          <>
            From articles to an actual{' '}
            <em className="brc-accent">range</em>
          </>
        }
        description="Read enough to know roughly what you want? Run it through the estimator for a Treasure Valley build range in about 60 seconds. No obligation, no phone number required."
        variant="greige"
      />
    </>
  );
}

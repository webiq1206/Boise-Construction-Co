/**
 * Branded Open Graph share cards per blog post and guide.
 *
 * GENERATED FILE - do not edit by hand.
 * Run `npm run images:og` to regenerate from the content layer.
 *
 * Each card is the post hero photo under a dark overlay with the title and the
 * brand eyebrow, 1200x630 JPEG at public/images/blog/{slug}-og.jpg. Blog and
 * guide metadata fall back to the plain hero image when a slug is absent here.
 */
export const BLOG_OG_IMAGES: Record<string, string> = {
  // Blog posts
  'ada-vs-canyon-county-permit-timelines': '/images/blog/ada-vs-canyon-county-permit-timelines-og.jpg',
  'adu-cost-boise': '/images/blog/adu-cost-boise-og.jpg',
  'aging-in-place-home-design': '/images/blog/aging-in-place-home-design-og.jpg',
  'allowances-explained-new-home': '/images/blog/allowances-explained-new-home-og.jpg',
  'boise-building-permit-guide': '/images/blog/boise-building-permit-guide-og.jpg',
  'build-vs-buy-boise': '/images/blog/build-vs-buy-boise-og.jpg',
  'building-in-the-boise-foothills': '/images/blog/building-in-the-boise-foothills-og.jpg',
  'choosing-finishes-for-a-new-home': '/images/blog/choosing-finishes-for-a-new-home-og.jpg',
  'construction-loan-basics-idaho': '/images/blog/construction-loan-basics-idaho-og.jpg',
  'cost-to-build-a-house-boise': '/images/blog/cost-to-build-a-house-boise-og.jpg',
  'covered-outdoor-living-new-home': '/images/blog/covered-outdoor-living-new-home-og.jpg',
  'custom-home-cost-per-square-foot-boise': '/images/blog/custom-home-cost-per-square-foot-boise-og.jpg',
  'custom-home-floor-plan-ideas-boise': '/images/blog/custom-home-floor-plan-ideas-boise-og.jpg',
  'design-build-vs-general-contractor': '/images/blog/design-build-vs-general-contractor-og.jpg',
  'energy-efficient-home-building-boise': '/images/blog/energy-efficient-home-building-boise-og.jpg',
  'first-meeting-with-a-home-builder': '/images/blog/first-meeting-with-a-home-builder-og.jpg',
  'fixed-price-vs-cost-plus': '/images/blog/fixed-price-vs-cost-plus-og.jpg',
  'home-builder-red-flags': '/images/blog/home-builder-red-flags-og.jpg',
  'how-long-does-it-take-to-build-a-house-boise': '/images/blog/how-long-does-it-take-to-build-a-house-boise-og.jpg',
  'how-to-budget-a-new-home-boise': '/images/blog/how-to-budget-a-new-home-boise-og.jpg',
  'how-to-buy-a-buildable-lot-boise': '/images/blog/how-to-buy-a-buildable-lot-boise-og.jpg',
  'how-to-compare-builder-bids': '/images/blog/how-to-compare-builder-bids-og.jpg',
  'impact-fees-and-utility-connections': '/images/blog/impact-fees-and-utility-connections-og.jpg',
  'lot-evaluation-checklist': '/images/blog/lot-evaluation-checklist-og.jpg',
  'luxury-home-building-cost-boise': '/images/blog/luxury-home-building-cost-boise-og.jpg',
  'multigenerational-home-design': '/images/blog/multigenerational-home-design-og.jpg',
  'new-home-walkthrough-and-warranty': '/images/blog/new-home-walkthrough-and-warranty-og.jpg',
  'production-vs-custom-home-builder': '/images/blog/production-vs-custom-home-builder-og.jpg',
  'questions-to-ask-a-home-builder': '/images/blog/questions-to-ask-a-home-builder-og.jpg',
  'shop-homes-and-barndominiums-idaho': '/images/blog/shop-homes-and-barndominiums-idaho-og.jpg',
  'single-story-vs-two-story-home': '/images/blog/single-story-vs-two-story-home-og.jpg',
  'stages-of-building-a-house': '/images/blog/stages-of-building-a-house-og.jpg',
  'well-and-septic-cost-idaho': '/images/blog/well-and-septic-cost-idaho-og.jpg',
  'what-drives-home-building-costs-boise': '/images/blog/what-drives-home-building-costs-boise-og.jpg',
  'why-home-building-bids-vary': '/images/blog/why-home-building-bids-vary-og.jpg',
  // Guides
  'boise-home-building-cost-guide': '/images/blog/boise-home-building-cost-guide-og.jpg',
  'boise-home-building-process-guide': '/images/blog/boise-home-building-process-guide-og.jpg',
  'buying-land-to-build-boise': '/images/blog/buying-land-to-build-boise-og.jpg',
  'choose-home-builder-boise': '/images/blog/choose-home-builder-boise-og.jpg',
  'custom-home-design-guide': '/images/blog/custom-home-design-guide-og.jpg',
  'treasure-valley-home-building-guide': '/images/blog/treasure-valley-home-building-guide-og.jpg',
  'boise-home-building-guide': '/images/blog/boise-home-building-guide-og.jpg',
  'meridian-home-building-guide': '/images/blog/meridian-home-building-guide-og.jpg',
  'eagle-home-building-guide': '/images/blog/eagle-home-building-guide-og.jpg',
  'kuna-home-building-guide': '/images/blog/kuna-home-building-guide-og.jpg',
  'star-home-building-guide': '/images/blog/star-home-building-guide-og.jpg',
  'middleton-home-building-guide': '/images/blog/middleton-home-building-guide-og.jpg',
  'nampa-home-building-guide': '/images/blog/nampa-home-building-guide-og.jpg',
  'caldwell-home-building-guide': '/images/blog/caldwell-home-building-guide-og.jpg',
  'eagle-foothills-home-building-guide': '/images/blog/eagle-foothills-home-building-guide-og.jpg',
  'hidden-springs-home-building-guide': '/images/blog/hidden-springs-home-building-guide-og.jpg',
  'harris-ranch-home-building-guide': '/images/blog/harris-ranch-home-building-guide-og.jpg',
};

export function getBlogOgImage(slug: string): string | undefined {
  return BLOG_OG_IMAGES[slug];
}

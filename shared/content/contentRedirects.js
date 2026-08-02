/**
 * 301 map for the remodeling-to-construction repositioning.
 *
 * CommonJS on purpose: next.config.js is not transpiled, so it cannot require a
 * .ts module. Scripts that audit the map require this same file, which keeps
 * one copy of the truth.
 *
 * Three kinds of entry live here.
 *
 * 1. Renamed. The page still exists under a construction title and a new slug.
 *    Point the old slug at the new one.
 * 2. Consolidated. Several thin remodeling posts collapsed into one better
 *    construction post. All of them point at the survivor.
 * 3. Retired. The topic does not exist on a home builder's site - bathroom
 *    remodel ROI, living through a remodel, garage conversions. These point at
 *    the closest hub rather than the homepage, because a hub keeps the visitor
 *    in the subject they were reading about and passes the link equity to a
 *    page that can rank, whereas the homepage absorbs it.
 *
 * A retired URL must never 404 and must never point somewhere irrelevant. Both
 * waste an inbound link that took years to earn.
 */

/** @type {Record<string, string>} old blog slug -> new path */
const BLOG_REDIRECTS = {
  // ---------------------------------------------------------------- renamed
  '/blog/remodel-cost-per-square-foot-boise': '/blog/custom-home-cost-per-square-foot-boise',
  '/blog/what-impacts-remodeling-costs-boise': '/blog/what-drives-home-building-costs-boise',
  '/blog/how-to-budget-remodel-boise': '/blog/how-to-budget-a-new-home-boise',
  '/blog/luxury-remodel-cost-boise': '/blog/luxury-home-building-cost-boise',
  '/blog/remodeling-vs-moving': '/blog/build-vs-buy-boise',
  '/blog/whole-home-remodel-cost-boise': '/blog/cost-to-build-a-house-boise',
  '/blog/questions-to-ask-remodeling-contractor': '/blog/questions-to-ask-a-home-builder',
  '/blog/remodeling-contractor-red-flags': '/blog/home-builder-red-flags',
  '/blog/how-to-compare-remodeling-estimates': '/blog/how-to-compare-builder-bids',
  '/blog/why-remodeling-bids-vary': '/blog/why-home-building-bids-vary',
  '/blog/whole-home-remodel-timeline': '/blog/how-long-does-it-take-to-build-a-house-boise',
  '/blog/boise-permit-guide': '/blog/boise-building-permit-guide',
  '/blog/construction-phase-guide': '/blog/stages-of-building-a-house',
  '/blog/material-selection-guide': '/blog/choosing-finishes-for-a-new-home',
  '/blog/punch-list-guide': '/blog/new-home-walkthrough-and-warranty',
  '/blog/consultation-process-remodeling': '/blog/first-meeting-with-a-home-builder',
  '/blog/kitchen-layout-ideas-boise-homes': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/multigenerational-living-remodels': '/blog/multigenerational-home-design',
  '/blog/aging-in-place-bathroom-design': '/blog/aging-in-place-home-design',
  '/blog/energy-efficiency-roi': '/blog/energy-efficient-home-building-boise',
  '/blog/covered-patios-boise': '/blog/covered-outdoor-living-new-home',

  // ----------------------------------------------------------- consolidated
  // Timeline questions all answered by the one build-duration post.
  '/blog/remodeling-timeline-guide': '/blog/how-long-does-it-take-to-build-a-house-boise',
  '/blog/home-addition-timeline-guide': '/blog/how-long-does-it-take-to-build-a-house-boise',
  '/blog/kitchen-remodel-timeline-boise': '/blog/how-long-does-it-take-to-build-a-house-boise',
  '/blog/how-long-does-a-bathroom-remodel-take': '/blog/how-long-does-it-take-to-build-a-house-boise',

  // Builder-selection duplicates.
  '/blog/what-makes-great-remodeling-contractor': '/blog/questions-to-ask-a-home-builder',
  '/blog/how-to-choose-design-build-contractor': '/guides/choose-home-builder-boise',
  '/blog/design-build-process-guide': '/blog/design-build-vs-general-contractor',

  // Planning and process duplicates.
  '/blog/remodel-planning-guide': '/guides/boise-home-building-process-guide',
  '/blog/whole-home-remodel-planning-checklist': '/guides/boise-home-building-process-guide',
  '/blog/preconstruction-guide': '/blog/stages-of-building-a-house',
  '/blog/design-development-guide': '/guides/custom-home-design-guide',
  '/blog/warranty-guide-remodeling': '/blog/new-home-walkthrough-and-warranty',
  '/blog/remodeling-mistakes-to-avoid': '/blog/questions-to-ask-a-home-builder',

  // Additions became design decisions inside a new plan, not separate projects.
  '/blog/primary-suite-additions': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/bedroom-additions': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/second-story-additions': '/blog/single-story-vs-two-story-home',
  '/blog/room-addition-guide-treasure-valley': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/home-addition-cost-boise': '/blog/cost-to-build-a-house-boise',
  '/blog/adu-guide-boise': '/blog/adu-cost-boise',
  '/blog/basement-finishing-boise': '/blog/cost-to-build-a-house-boise',
  '/blog/garage-conversions': '/blog/adu-cost-boise',

  // Kitchen and bath selections inside a new build.
  '/blog/kitchen-cabinet-trends': '/blog/choosing-finishes-for-a-new-home',
  '/blog/kitchen-cabinet-trends-boise': '/blog/choosing-finishes-for-a-new-home',
  '/blog/quartz-vs-quartzite-kitchen': '/blog/choosing-finishes-for-a-new-home',
  '/blog/quartz-vs-quartzite-countertops': '/blog/choosing-finishes-for-a-new-home',
  '/blog/walk-in-pantry-design-guide': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/kitchen-island-design-guide': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/open-concept-kitchen-remodeling': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/small-kitchen-remodel-ideas-boise': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/kitchen-remodel-cost-boise': '/blog/cost-to-build-a-house-boise',
  '/blog/bathroom-remodel-cost-boise': '/blog/cost-to-build-a-house-boise',
  '/blog/walk-in-shower-guide': '/blog/choosing-finishes-for-a-new-home',
  '/blog/curbless-shower-guide': '/blog/aging-in-place-home-design',
  '/blog/luxury-bathroom-features': '/blog/luxury-home-building-cost-boise',
  '/blog/small-bathroom-remodel-ideas': '/blog/custom-home-floor-plan-ideas-boise',
  '/blog/bathroom-layout-planning-guide': '/blog/custom-home-floor-plan-ideas-boise',

  // ------------------------------------------------------------- retired
  // No construction equivalent. Sent to the nearest hub, not the homepage.
  '/blog/kitchen-remodel-roi': '/blog/build-vs-buy-boise',
  '/blog/bathroom-remodel-roi': '/blog/build-vs-buy-boise',
  '/blog/exterior-remodeling-roi': '/blog/build-vs-buy-boise',
  '/blog/addition-roi-remodeling': '/blog/build-vs-buy-boise',
  '/blog/outdoor-living-roi': '/blog/covered-outdoor-living-new-home',
  '/blog/remodeling-before-selling': '/blog/build-vs-buy-boise',
  '/blog/remodeling-long-term-living': '/blog/aging-in-place-home-design',
  '/blog/living-through-a-remodel': '/blog/how-long-does-it-take-to-build-a-house-boise',
  '/blog/decks-vs-patios-boise': '/blog/covered-outdoor-living-new-home',
  '/blog/outdoor-fireplaces-boise': '/blog/covered-outdoor-living-new-home',
  '/blog/outdoor-entertaining-spaces': '/blog/covered-outdoor-living-new-home',
  '/blog/luxury-outdoor-living': '/blog/covered-outdoor-living-new-home',
  '/blog/backyard-transformations-boise': '/blog/covered-outdoor-living-new-home',
  '/blog/outdoor-kitchens-boise': '/blog/covered-outdoor-living-new-home',

  // Superseded before the repositioning; kept so the chain stays one hop.
  '/blog/kitchen-remodel-cost-treasure-valley': '/blog/cost-to-build-a-house-boise',
  '/blog/bathroom-remodel-cost-idaho': '/blog/cost-to-build-a-house-boise',
  '/blog/kitchen-roi-remodeling': '/blog/build-vs-buy-boise',
  '/blog/bathroom-roi-remodeling': '/blog/build-vs-buy-boise',
};

/** @type {Record<string, string>} old guide slug -> new path */
const GUIDE_REDIRECTS = {
  '/guides/boise-remodeling-cost-guide': '/guides/boise-home-building-cost-guide',
  '/guides/choose-remodeling-contractor-boise': '/guides/choose-home-builder-boise',
  '/guides/boise-remodeling-process-guide': '/guides/boise-home-building-process-guide',
  '/guides/treasure-valley-remodeling-guide': '/guides/treasure-valley-home-building-guide',
  '/guides/boise-remodeling-guide': '/guides/boise-home-building-guide',
  '/guides/meridian-remodeling-guide': '/guides/meridian-home-building-guide',
  '/guides/eagle-remodeling-guide': '/guides/eagle-home-building-guide',
  '/guides/kuna-remodeling-guide': '/guides/kuna-home-building-guide',
  '/guides/star-remodeling-guide': '/guides/star-home-building-guide',
  '/guides/middleton-remodeling-guide': '/guides/middleton-home-building-guide',
  '/guides/nampa-remodeling-guide': '/guides/nampa-home-building-guide',
  '/guides/caldwell-remodeling-guide': '/guides/caldwell-home-building-guide',
  '/guides/eagle-foothills-remodeling-guide': '/guides/eagle-foothills-home-building-guide',
  '/guides/hidden-springs-remodeling-guide': '/guides/hidden-springs-home-building-guide',
  '/guides/harris-ranch-remodeling-guide': '/guides/harris-ranch-home-building-guide',

  // Neighbourhood guides for inner Boise. These describe established housing
  // stock on built-out lots, where the work is remodeling, not new
  // construction. There is no honest construction version, so they resolve to
  // the city guide rather than being rewritten into something we do not do.
  '/guides/north-end-remodeling-guide': '/guides/boise-home-building-guide',
  '/guides/boise-bench-remodeling-guide': '/guides/boise-home-building-guide',
  '/guides/east-boise-remodeling-guide': '/guides/boise-home-building-guide',

  // Pillars whose whole subject is remodeling.
  '/guides/boise-kitchen-remodeling-guide': '/guides/custom-home-design-guide',
  '/guides/boise-bathroom-remodeling-guide': '/guides/custom-home-design-guide',
  '/guides/boise-home-addition-guide': '/guides/custom-home-design-guide',
  '/guides/whole-home-remodeling-guide': '/guides/boise-home-building-cost-guide',
  '/guides/best-remodeling-roi-boise': '/blog/build-vs-buy-boise',
  '/guides/outdoor-living-remodeling-guide': '/blog/covered-outdoor-living-new-home',
  '/guides/boise-adu-guide': '/blog/adu-cost-boise',
};

/** @type {Record<string, string>} retired category hubs -> surviving hub */
const HUB_REDIRECTS = {
  '/blog/category/remodeling-costs': '/blog/category/home-building-costs',
  '/blog/category/contractor-selection': '/blog/category/choosing-a-builder',
  '/blog/category/remodeling-process': '/blog/category/home-building-process',
  '/blog/category/kitchen-remodeling': '/blog/category/home-design-and-plans',
  '/blog/category/bathroom-remodeling': '/blog/category/home-design-and-plans',
  '/blog/category/home-additions': '/blog/category/home-design-and-plans',
  '/blog/category/whole-home-remodeling': '/blog/category/home-building-costs',
  '/blog/category/remodeling-roi': '/blog/category/home-building-costs',
  '/blog/category/outdoor-living': '/blog/category/home-design-and-plans',
};

/**
 * Retired service slugs. The old site sold six remodeling services; the new one
 * builds houses. Each old service points at the construction service that best
 * answers the same intent, so a "kitchen remodel Boise" visitor lands on custom
 * home building rather than a 404.
 */
const SERVICE_SLUG_REDIRECTS = {
  'kitchen-remodel': 'custom-home-builder',
  'bathroom-remodel': 'custom-home-builder',
  'whole-home-remodel': 'custom-home-builder',
  'room-addition': 'build-on-your-lot',
  'adu': 'build-on-your-lot',
  'basement-finishing': 'custom-home-builder',
  'aging-in-place': 'custom-home-builder',
  'outdoor-living': 'custom-home-builder',

  // Slug variants the old site never used as canonicals but that appear in
  // inbound links, directory listings and citations. Cheap to cover, and each
  // one is otherwise a 404 on a URL someone else controls.
  'kitchen-remodeling': 'custom-home-builder',
  'bathroom-remodeling': 'custom-home-builder',
  'whole-home-remodeling': 'custom-home-builder',
  'home-remodeling': 'custom-home-builder',
  'basement-remodel': 'custom-home-builder',
  'basement-remodeling': 'custom-home-builder',
  'home-additions': 'build-on-your-lot',
  'home-addition': 'build-on-your-lot',
  'room-additions': 'build-on-your-lot',
  'adu-builder': 'build-on-your-lot',
  'adu-guest-house': 'build-on-your-lot',
  'aging-in-place-remodeling': 'custom-home-builder',
  'outdoor-living-spaces': 'custom-home-builder',
  'decks-patios': 'custom-home-builder',
};

module.exports = {
  BLOG_REDIRECTS,
  GUIDE_REDIRECTS,
  HUB_REDIRECTS,
  SERVICE_SLUG_REDIRECTS,
};

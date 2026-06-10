# 04 - Local Landing Page Audit

Covers the 53 commercial landing pages: 5 service, 8 area, 40 city-service. The June 5 `seo-audit/doorway-page-analysis.md` already de-doorwayed the city-service set (localized sections + selective noindex); this audit verifies that work and specifies the next tier of improvements.

## What is working (verified in code)

- Every city-service page gets real localized data via `getCityServiceSections()` (`shared/seoContent.ts`): named neighborhoods, landmarks, climate, county permit routing from `CITY_SEO_DATA`.
- Proof blocks (`LandingProof`) auto-embed city+service-matched testimonials/projects where data exists.
- 4 doorway-risk ADU pages correctly noindexed (but wrongly still in sitemap - fixed this pass).
- FAQ schema + Speakable on every landing page; breadcrumbs everywhere.
- Titles are formula-correct and under 60 chars.

## Issue 1 - Uniqueness ceiling on city-service pages (40 pages)

Every page's local sections use the same two sentence skeletons with city facts swapped in. Google tolerates this; generative engines discount it. Current unique-copy share: ~40%.

**Fix (per page, prioritized by city size - Boise and Meridian first):**
- Add a city+service cost band: "Most {city} {service} projects we plan fall between $X and $Y" - real bands derived from the estimator config, varied by city housing stock.
- Add one housing-stock paragraph per city, service-specific: e.g. kitchen × Boise: galley kitchens in 1950s Bench ranches vs open-concept in Harris Ranch new builds; bathroom × Nampa: 1990s builder-grade hall baths in Greenhurst. This is the detail competitors cannot template.
- Where proof exists (Boise, Meridian, Eagle, Nampa), reference it in body copy, not just the proof block.

## Issue 2 - Area pages are skeletons (8 pages)

~150 localized words each. The neighborhoods/landmarks lists from `CITY_SEO_DATA` are recited, never used.

**Fix per area page - add three sections:**
1. "Remodeling {city} homes by era" - housing stock: what decades dominate, what those homes need (e.g. Boise: pre-war North End, 1950-70s Bench ranches, 1990s SE Boise, 2010s Harris Ranch; Meridian: 1990s-2020s subdivisions with similar floor plans; Caldwell/Middleton: mix of older farmhouse stock and new builds).
2. "Permits and planning in {city}" - city-specific: Boise has its own building department; Meridian/Eagle/Kuna/Star route through their city offices with Ada County plan review patterns; Nampa/Caldwell/Middleton through Canyon County or city equivalents. Link `/resources/ada-canyon-permit-flow`.
3. ZIP coverage line ("Serving all of {city}: 83702, 83703...") from `CITY_SEO_DATA.zipCodes` - currently unused for this purpose.

## Issue 3 - Proof deserts: Kuna, Star, Middleton, Caldwell

Zero testimonials or projects tagged to 4 of 8 cities (`shared/testimonialsData.ts`, `shared/galleryData.ts`). Their 20 city-service pages and 4 area pages run proof-less.

**Fix**: business task, not code - collect one review + one photo set per project in these cities (08-review-strategy.md ties review requests to city tagging). Interim: reference nearest-city work honestly ("recent projects in neighboring Meridian").

## Issue 4 - Service parent pages lack decision content (5 pages)

206-333 words; no cost table, no finish-level comparison, only 3 FAQs.

**Fix per service page:**
- Embed a cost-band table mirroring estimator tiers (Refresh/Mid-Range/High-End/Luxury with the real bands from the homepage estimator).
- Grow FAQs 3 → 8 (pull the cost, timeline, permit, living-through-it questions from 03-keyword-strategy.md).
- Add "Recent projects" strip with city-tagged proof.
- ADU page additionally: ordinance summary (Boise allows ADUs up to 900 sq ft; owner-occupancy and parking rules), attached vs detached comparison, link to new ADU pillar guide.

## Issue 5 - No neighborhood landing surface outside Boise

6 neighborhood guides exist, all Boise. Meridian (Lochsa Falls, Tuscany, Paramount), Eagle (Shadow Valley, Banbury, The Estates) have populations and remodel budgets that justify coverage.

**Fix**: not new pages yet (avoid thin-page proliferation) - first expand the 6 existing Boise neighborhood guides to 500+ words; then add Meridian/Eagle neighborhood guides per 05-content-plan.md phase 2 only with real local substance.

## Thin/duplicate verdicts (required by audit scope)

- Thin location pages: all 8 location guides, all 6 neighborhood guides, all 8 area pages (by degree)
- Duplicate location pages: none structurally; 40 city-service pages share ~60% template copy (acceptable post-mitigation, improve per Issue 1)
- Doorway pages: 4 (ADU × small cities), correctly noindexed, now also removed from sitemap
- Missing local signals: ZIP codes (data exists, unused on-page), license/registration number, GBP link, map embed, per-city cost bands

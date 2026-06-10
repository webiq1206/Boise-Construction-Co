# 05 - Local Content Strategy & Authority Plan

## Depth audit (programmatic count, June 10 2026, pre-implementation)

| Asset class | Count | Median words | Verdict |
|---|---|---|---|
| Hub pillar guides | 9 | ~420 (cost guide: 1,693) | Underweight vs 2,000-word budget |
| Location guides (city) | 8 | ~140 | Critically thin |
| Neighborhood guides | 6 | ~130 | Critically thin |
| Blog cluster posts | 69 | ~134 (57 posts under 150) | Stubs |
| Master TV guide | 1 | 174 | Thin |

The site has the *structure* of topical authority (10 hubs, pillar-cluster linking, FAQ/quick-answer scaffolding on everything) with almost none of the *substance*. 81 of 117 content pages were under 250 words.

## Implemented in this audit pass

1. **New ADU pillar: `/guides/boise-adu-guide`** (~860 words, 9 H2s, 12 FAQs, cost table, 13 internal links). Closes the largest topic gap: ADU was the only service with no pillar, despite being the weakest competitor-covered keyword ("ADU builder Boise") and a market tailwind (Boise's December 2023 zoning modernization). Registered in the hub manifest under `home-additions`, image registry, llms.txt, and force-linked from `/services/adu`, ADU cluster posts, and the cost guide.
2. **All 13 city/neighborhood guides expanded ~2x** (now ~220-350 substantive words each, within the 700-word location budget): housing stock by era, ZIP coverage, remodel-pattern, and permit-jurisdiction sections, hand-written per locale (`shared/content/locationCityContent.ts`).
3. **Server-rendered cost bands on all 5 service pages + 40 city-service pages** (`costGuidance` in `shared/seoContent.ts`): 2026 planning ranges in static HTML, previously locked inside the client-side estimator.
4. **Service FAQs expanded 3 → 8-9 per service** (cost, permits, timeline, layout, value questions from the AEO inventory) and a city-specific cost FAQ added to all 40 city-service pages.
5. **`dateModified` now emitted** for everything revised (Article schema).

## Next content priorities (owner/agency tasks, in order)

### P1 - Expand the 8 short hub pillars (one per week)
Each from ~420 to 800-1,200 words using the cost guide as the model: add cost/timeline tables, comparison sections, one named local project example. Order by commercial value: kitchen, bathroom, additions, whole-home, contractor-selection, process, ROI, outdoor.

### P2 - Cost cluster refresh cycle
The 8 cost posts are the most-cited asset class for AI engines. Quarterly: re-verify ranges, bump `updatedAt`, keep "As of {year}" phrasing current. Expand the 5 cost posts still under 250 words (`whole-home-remodel-cost-boise`, `home-addition-cost-boise`, `luxury-remodel-cost-boise`, `remodel-cost-per-square-foot-boise`, `how-to-budget-remodel-boise`) to 500+ with tables.

### P3 - Blog stub strategy: expand 20, hold 37
Expanding all 57 stubs risks 35,000 words of filler (banned by the repo's own content rules). Instead:
- **Expand to 600+ words** (genuine search demand, commercial adjacency): adu-guide-boise, garage-conversions, remodeling-vs-moving, design-build-vs-general-contractor, questions-to-ask-remodeling-contractor, remodeling-contractor-red-flags, kitchen-remodel-timeline-boise, boise-permit-guide, walk-in-shower-guide, curbless-shower-guide, small-bathroom-remodel-ideas, aging-in-place-bathroom-design, primary-suite-additions, second-story-additions, kitchen-remodel-roi, bathroom-remodel-roi, remodeling-before-selling, fixed-price-vs-cost-plus, how-to-compare-remodeling-estimates, open-concept-kitchen-remodeling.
- **Hold as-is** (they pass QA, serve internal linking, low search value alone): the remainder. Revisit after the 20 expansions ship.

### P4 - New assets (quarterly, one each)
1. "Boise remodel permit fees and timelines {year}" data page - extends the permit-flow resource with actual fee schedules; the most citation-worthy asset the site could own.
2. Meridian neighborhood guides (Lochsa Falls/Paramount, Tuscany) - only after the 6 Boise ones prove out.
3. Project case studies (one per completed project, per the EEAT case-study format) - these become the proof layer for city-service pages.
4. "Cost to remodel a {era} ranch in Boise" - era-specific cost content nobody in the market has.

### Content rules (keep enforcing)
- Every piece registered in `shared/contentHubs.ts`; `npx tsx scripts/verify-content.ts` before merge; `links:generate` after.
- Named author (founder) + `updatedAt` on every expanded piece.
- Local entity per section: neighborhood, county office, climate factor, or housing-era fact. No national-average filler.

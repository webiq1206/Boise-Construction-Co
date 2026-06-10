# 06 - Internal Linking Plan

## Current state (verified)

The auto-generated manifest (`data/internal-links.json`, built by `scripts/internal-links/generate.ts`) covers 146 programmatic pages with 1,030 links: Jaccard-scored, quota-balanced (e.g. blog → 1 guide + 2 service + 2 blog + 1 city-service), inbound-capped at 18, with forced `relatedLinks` overrides. Anchor text is target-defined and descriptive ("Kitchen Remodel in Meridian", "Remodeling in Eagle") - already compliant with context-rich anchor best practice. No "click here" anchors found.

This is a strong system. The gaps are around it, not in it.

## Gap 1 - Static pages are outside the manifest

The homepage, /about, /contact, /testimonials and index pages link via nav/footer only - no contextual body links pass authority to money pages.

Additions (Source → Anchor → Destination):

| Source | Anchor text | Destination |
|---|---|---|
| / (WhyChooseUs section) | "our design-build approach" | /guides/boise-remodeling-process-guide |
| / (estimator disclaimer) | "Boise remodeling cost guide" | /guides/boise-remodeling-cost-guide |
| / (FAQ answers: permits) | "Ada and Canyon County permit timelines" | /resources/ada-canyon-permit-flow |
| / (FAQ answers: areas) | "remodeling in {city}" (one per city) | /areas/[city] |
| /about | "kitchen remodeling in Boise" | /services/kitchen-remodel |
| /about | "how to choose a remodeling contractor" | /guides/choose-remodeling-contractor-boise |
| /testimonials (per testimonial) | "{service} in {city}" | /services/[slug]/[city] |
| /contact (FAQ) | "project estimator" | /#estimate (existing) + "cost guide" → /guides/boise-remodeling-cost-guide |

## Gap 2 - Highest-authority page (cost guide) under-leveraged as a hub

`/guides/boise-remodeling-cost-guide` (1,693 words, priority 0.9, most-linkable asset) should contextually link every service page AND the 5 Boise city-service pages with cost-flavored anchors:
- "kitchen remodeling costs in Boise" → /services/kitchen-remodel/boise
- "bathroom remodel pricing" → /services/bathroom-remodel
- "ADU construction costs" → /services/adu
(Implement via `relatedLinks` overrides on the guide so `links:generate` respects them as forced.)

## Gap 3 - Blog-to-location linking is the weakest quota

Blog quota: only 1 city-service link per post, similarity-scored - small cities rarely earn links. Outcome verified in manifest counts: Kuna/Star/Middleton/Caldwell pages sit near the bottom of inbound distribution.

Fix: add forced `relatedLinks` from topically-matched posts to under-linked city pages:
- /blog/ada-vs-canyon-county-permit-timelines → /areas/middleton, /areas/caldwell, /areas/nampa ("remodeling in Middleton", ...)
- /blog/adu-guide-boise → /services/adu/boise, /services/adu/meridian
- /blog/garage-conversions → /services/adu ("ADU and guest house construction")
- /blog/primary-suite-additions → /services/room-addition/boise
- Each cost post → its matching city-service Boise page ("kitchen remodeling in Boise")

## Gap 4 - New ADU pillar wiring (created this pass)

The new `/guides/boise-adu-guide` must be force-linked from: /services/adu (body), all 8 ADU city-service pages, /blog/adu-guide-boise, /blog/garage-conversions, /blog/multigenerational-living-remodels, and the home-additions hub.

## Link direction policy (confirmed correct, keep)

Authority flows: homepage + cost guide + pillars → service pages → city-service pages; guides → services; blog → guides + services. All internal links are standard follow links - correct; keep nofollow only for external untrusted links.

## Topic cluster integrity

10 hubs exist with pillar-cluster linking enforced by the manifest (hub-pillar forced links score 999, exempt from inbound cap). Verified working. Missing cluster: ADU (pillar created this pass; clusters listed in 05-content-plan.md).

## Implementation

1. Add `relatedLinks` overrides per Gaps 2-4 in `shared/blogContent.ts` / `shared/guideContent.ts` entries.
2. Static-page links (Gap 1) are hand-placed in components (FAQ answers in `shared/homepageFaqs.ts` support HTML/links; about/testimonial copy in their page files).
3. Regenerate + verify: `npm run links:generate && npm run audit:links`.

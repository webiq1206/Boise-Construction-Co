# 00 - Executive Summary

Comprehensive Local SEO / AEO / GEO / Technical / GBP / Local Authority audit of boiseremodeling.co (166 indexable URLs at audit start) and the off-site local presence. June 10, 2026. All code-level fixes identified by this audit were implemented in the same pass and verified with a clean production build; owner-action items are explicitly flagged.

## Overall scores (1-10)

| Category | Score | One-line basis |
|---|---|---|
| Technical SEO | **9** | SSG, programmatic metadata budgets, clean canonicals/robots; sitemap-noindex conflict found and fixed |
| AEO Readiness | **6** (was 5) | Best-in-market FAQ/Speakable/quick-answer scaffolding; cost answers were locked in client JS - now server-rendered |
| Local Content Authority | **5** (was 4) | Strong architecture, thin substance: 81 of 117 content pages were under 250 words; 14 expanded + ADU pillar added this pass |
| GEO Readiness | **5** | Two citation-worthy assets (cost guide, permit resource) out of 166 pages; entity graph strong on-site, absent off-site |
| Local SEO | **4** | On-site local signals good; off-site catastrophic: no live GBP, 3 corrupted citations carrying a retired phone number |
| GBP Optimization | **1** | Profile unverified/suspended; zero reviews; search engines currently report the WRONG phone number as canonical |

## The one-paragraph diagnosis

This site is an inverted pyramid: a technically excellent, schema-rich, well-architected website standing on an off-site presence that is not just empty but actively corrupted. Live verification during this audit showed search synthesis confidently asserting the business's phone number is (208) 405-8425 - a retired number spread across ProMatcher, MapQuest, and an apparent unclaimed Yelp listing, attached to a wrong address 100 miles away. Meanwhile competitors hold 46-86 reviews each and the GBP is suspended. No amount of on-page work outranks that. The sequence is: fix the entity (GBP + citations + reviews), then let the now-superior website convert the visibility.

## Critical issues (fix this week)

1. **GBP unverified/suspended** - recovery procedure in 02-gbp-plan.md. Blocks Local Pack, Maps, reviews, and AI-assistant recommendations.
2. **Wrong phone number propagating** ((208) 405-8425 + Lake Fork address on ProMatcher/MapQuest/Yelp-source) - cleanup sequence in 07-nap-citations.md. Actively poisoning entity resolution.
3. **Zero reviews vs 46-86 for competitors** - collection system in 08-review-strategy.md, starts day of GBP verification.

## Implemented in this pass (code/content - verified, build green)

- **New ADU pillar guide** (`/guides/boise-adu-guide`, ~870 words, cost table, 12 FAQs) - closed the largest topic gap
- **All 13 city/neighborhood guides expanded ~2x** with hand-written local-housing-stock content
- **Server-rendered 2026 cost bands** on 5 service pages + 40 city-service pages + city-level cost FAQs (the estimator's prices were invisible to crawlers/AI)
- **Service FAQs 3 → 8-9** per service from the AEO question inventory
- **Founder entity**: the owner on /about#team + Organization `founder` schema
- **Schema fixes**: geo coordinates corrected (Kuna → Meridian, was contradicting the NAP), Wikipedia `sameAs` on all 8 areaServed cities, `knowsAbout` topical claims
- **Sitemap fix**: 4 noindexed doorway pages removed (sitemap now 163 URLs, consistent)
- **Homepage retitled**: now targets "remodeling contractor in Boise, ID" instead of nothing
- **`dateModified`** plumbing + stamps on all revised content; **llms.txt** updated with cost bands, ADU pillar, permit resource
- **Internal links**: cost-guide → money pages, permit post → Canyon-county cities, ADU cluster → pillar; manifest regenerated (147 pages, 1,040 links, no orphans)

## Owner-action queue (cannot be done in code)

| # | Action | Plan doc | Impact |
|---|---|---|---|
| 1 | GBP verification/reinstatement (video verification prep) | 02 | Unlocks everything local |
| 2 | Claim/fix Yelp + ProMatcher + MapQuest (kill old phone) | 07 | Stops entity corruption |
| 3 | Review collection at every final walkthrough | 08 | 10 reviews / 60 days target |
| 4 | Publish Idaho contractor registration number | 11 | Matches competitors who print RCE numbers |
| 5 | Bing Places + Apple Business Connect + Houzz + Facebook NAP | 02/07 | Citation corroboration |
| 6 | Founder bio facts + headshot; project case-study data | 11 | Activates EEAT layer |
| 7 | City-tagged proof for Kuna/Star/Middleton/Caldwell | 04 | Unlocks 24 proof-less landing pages |
| 8 | 1200x630 OG card design | 12 | Social/share presentation |

## Deliverables index

01 URL audit (CSV + notes) · 02 GBP · 03 Keywords · 04 Landing pages · 05 Content · 06 Internal links · 07 NAP/citations · 08 Reviews · 09 Schema · 10 AEO/GEO · 11 EEAT · 12 Technical · 13 Competitor gap · 14 Knowledge graph · 15 Roadmap

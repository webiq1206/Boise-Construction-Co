# 03 - Local Keyword Strategy

Per-page keyword assignments for all templates. The CSV (01-url-audit.csv) carries the per-URL assignment; this file defines the strategy, the formulas behind programmatic pages, and the question-keyword inventory.

## Keyword architecture

One primary keyword per page, no overlaps. The cannibalization rule: `/services/[slug]` owns "{service} Boise / Treasure Valley", `/services/[slug]/[city]` owns "{service} {city}", `/areas/[city]` owns "remodeling contractor {city}", guides own informational queries, blog posts own single long-tail questions.

## Homepage
- **Primary**: Boise remodeling contractor
- **Secondary**: design-build remodeling Boise; home remodeling Treasure Valley; remodeling company Boise Idaho
- **Long-tail**: best design-build remodeling contractor in Boise Idaho
- **Commercial modifiers present**: contractor, company. **Missing**: estimate, cost (add via estimator section heading: "Get a remodeling cost estimate for your Boise home")
- Current title (`Boise Remodeling Co | Remodeling & Design`) targets none of these - fix per 12-technical-plan.md.

## Service pages (5)

| Page | Primary | Secondary | Long-tail / question |
|---|---|---|---|
| /services/kitchen-remodel | kitchen remodeling Boise | kitchen remodel contractor Treasure Valley; kitchen renovation company Boise | how much does a kitchen remodel cost in Boise; best kitchen remodeling contractor in Boise |
| /services/bathroom-remodel | bathroom remodeling Boise | bathroom remodel contractor Boise; bathroom renovation Treasure Valley | how much does a bathroom remodel cost in Boise; walk-in shower installation Boise |
| /services/whole-home-remodel | whole home remodeling Boise | home renovation contractor Boise; whole house remodel Treasure Valley | whole home remodel cost Boise; should I remodel my whole house at once |
| /services/room-addition | room addition contractor Boise | home addition builder Treasure Valley; house addition cost Idaho | how much does a room addition cost in Boise; primary suite addition Boise |
| /services/adu | ADU builder Boise | ADU contractor Treasure Valley; guest house builder Boise; accessory dwelling unit Idaho | how much does an ADU cost in Boise; Boise ADU rules and permits; can I build an ADU in Boise |

ADU note: "ADU builder Boise" has the weakest competitor coverage of all five primaries (see 13-competitor-gap.md) - the highest-leverage keyword on this list.

## City-service pages (40) - formula

- **Primary**: `{service keyword} {city}` (e.g. kitchen remodeling Meridian, bathroom remodel Eagle, ADU builder Nampa)
- **Secondary**: `{service} contractor {city}`; `{service} company {city} Idaho`; `{service} near me` (captured via city page + GBP proximity, not literal text)
- **Long-tail**: `how much does a {service} cost in {city} Idaho`; `best {service} contractor in {city}`
- **City modifiers to weave into copy** (already partially templated): neighborhoods and ZIPs from `CITY_SEO_DATA` (e.g. "kitchen remodel North End", "bathroom remodel 83646")

Highest-volume combos to prioritize for content depth (population-weighted): all 5 × Boise, all 5 × Meridian, kitchen/bath × Nampa, kitchen/bath × Eagle.

## Area pages (8) - formula
- **Primary**: `remodeling contractor {city}` / `remodeling contractor {city} Idaho`
- **Secondary**: `home remodeling {city}`; `{city} renovation company`; `kitchen remodel {city}` (as link anchor to city-service page, not target)
- **Long-tail**: `best home remodeling contractor in {city} Idaho`; `who remodels homes in {city}`

## Guides - informational ownership

| Guide | Primary query owned |
|---|---|
| boise-remodeling-cost-guide | how much does it cost to remodel a house in Boise / Boise remodeling costs 2026 |
| boise-kitchen-remodeling-guide | Boise kitchen remodel guide / kitchen remodel ideas Boise |
| boise-bathroom-remodeling-guide | Boise bathroom remodel guide |
| boise-home-addition-guide | home addition guide Boise / addition vs moving |
| whole-home-remodeling-guide | whole home remodel guide / order of operations |
| choose-remodeling-contractor-boise | how to choose a remodeling contractor in Boise |
| boise-remodeling-process-guide | what is the remodeling process / design-build process |
| best-remodeling-roi-boise | best remodeling ROI Boise / which remodel adds most value Idaho |
| outdoor-living-remodeling-guide | outdoor living spaces Boise |
| City guides (8) | remodeling in {city} Idaho - what to know |
| Neighborhood guides (6) | {neighborhood} remodeling (e.g. North End historic remodel rules) |

**Missing pillar**: ADU guide ("Boise ADU guide", "ADU cost Boise", "Boise ADU ordinance") - created in this audit pass, see 05-content-plan.md.

## Question keyword inventory (AEO targets)

Cost questions (highest commercial value - each needs a direct, numeric, dated answer on-page):
1. How much does a kitchen remodel cost in Boise? → /blog/kitchen-remodel-cost-boise + service page block
2. How much does a bathroom remodel cost in Boise? → /blog/bathroom-remodel-cost-boise
3. How much does a home addition cost per square foot in Idaho? → /blog/home-addition-cost-boise
4. How much does an ADU cost to build in Boise? → new ADU pillar
5. What does a whole-home remodel cost in the Treasure Valley? → /blog/whole-home-remodel-cost-boise

Trust/selection questions:
6. Who is the best remodeling contractor in Boise/Meridian/Eagle? → choose-remodeling-contractor-boise + testimonials
7. Do remodeling contractors need a license in Idaho? → contractor-selection cluster (note: Idaho requires only registration, not licensing, for general contractors - a differentiating, citable fact)
8. What questions should I ask a remodeling contractor? → existing blog post (expand)

Permit/process questions:
9. Do I need a permit to remodel a bathroom in Idaho? → boise-permit-guide (expand)
10. How long does a kitchen remodel take? → kitchen-remodel-timeline-boise (expand)
11. What are Boise's ADU rules? → new ADU pillar (size limits, owner-occupancy, parking - cite the city ordinance)
12. Ada County vs Canyon County permits - what's different? → /resources/ada-canyon-permit-flow (strongest existing asset)

Near-me/voice queries ("remodeling contractor near me", "kitchen remodeler near me"): won via GBP proximity + service-area settings + Apple/Bing listings - not on-page text. Covered in 02-gbp-plan.md.

## Search intent coverage map

- Near Me: GBP-dependent - currently **uncovered** (GBP down)
- City searches: covered by 8 area pages (thin - expand)
- Neighborhood searches: 6 neighborhood guides (thinnest pages on site - expand; only Boise neighborhoods covered, no Meridian/Eagle neighborhood assets)
- Service+City: 40 city-service pages (covered, medium quality)
- Cost searches: 8 cost posts + cost guide (best-covered intent)
- Comparison searches: design-build-vs-general-contractor, fixed-price-vs-cost-plus, quartz-vs-quartzite, decks-vs-patios exist but average 132 words - **nominally covered, practically absent**
- Contractor-selection searches: 9-post cluster (same thinness problem)

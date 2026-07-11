# Boise Remodeling Co — Content Strategy (50 Posts + Guide System)

Research-grounded plan to establish complete topical authority for Treasure Valley remodeling.
Keyword data pulled from Ahrefs (US market) — informational/commercial remodeling demand rolls up
nationally, then we localize to Boise/Ada/Canyon for GEO + local pack.

## Keyword research highlights (Ahrefs, monthly US volume / KD)

**Costs (highest commercial value)**
- kitchen remodel cost — 10,000 / KD 21 · average/how-much variants 1,200–1,900 each · "10x10 kitchen remodel cost" 300 KD 2 · "kitchen remodel cost per square foot" 250
- how much does it cost to remodel a bathroom — 2,300 / KD 8 · "how much to remodel a bathroom" 2,200
- home addition cost — 1,600 / KD 1 · "how much does a home addition cost" 400

**Additions / ADU / conversions (big, low difficulty)**
- basement finishing — 6,500 / KD 4
- garage conversion — 4,900 / KD 3 · "garage conversion ideas" 2,600 / KD 2
- adu construction — 5,500 / KD 20 · "adu builders" 5,000 · "adu cost" family · (filter celebrity noise: Freddy/Sade/Izaak Adu)

**Questions / AEO (People Also Ask, very low difficulty)**
- how long does a bathroom remodel take — 600 / KD 1
- does bathroom remodel increase home value — 200 / KD 0
- do i need a permit to remodel my bathroom — 200 / KD 0
- whole home remodel where to start — 250 / KD 6
- how to plan a home remodel — 150 · how to pay for home remodel — 150 · how long does a home remodel take — 150
- how much does a kitchen remodel add to home value — 150

**Takeaway:** dense long-tail + question demand at KD 0–13 across every hub. A comprehensive,
Answer-First, internally-linked cluster strategy can own these with modest domain authority.

## Architecture (already scaffolded in `shared/contentHubs.ts`)

10 topical hubs. Each hub = 1 pillar **guide** + N cluster **blog posts**. 50 blog posts distributed
by demand and commercial value:

| # | Hub | Pillar (guide) | Blog posts | Priority |
|---|-----|----------------|-----------|----------|
| 1 | Remodeling Costs | boise-remodeling-cost-guide | 8 | Tier 1 |
| 2 | Kitchen Remodeling | boise-kitchen-remodeling-guide | 7 | Tier 2 |
| 3 | Bathroom Remodeling | boise-bathroom-remodeling-guide | 7 | Tier 2 |
| 4 | Additions / ADU | boise-home-addition-guide + boise-adu-guide | 8 | Tier 2 |
| 5 | Whole-Home | whole-home-remodeling-guide | 5 | Tier 2 |
| 6 | Contractor Selection | choose-remodeling-contractor-boise | 6 | Tier 1 |
| 7 | Remodeling Process | boise-remodeling-process-guide | 5 | Tier 3 |
| 8 | ROI & Home Value | best-remodeling-roi-boise | 4 | Tier 3 |
| 9 | Outdoor Living | outdoor-living-remodeling-guide | 4 | Tier 4 |
| — | Financing (cross-hub) | (in costs pillar) | 1 | Tier 2 |
|   | **Total** | | **50** | |

Existing ~25 posts are **expanded** to spec (1,600+ words); the rest are **net-new**.

## 50-post map (primary keyword · target)

**Hub 1 — Costs (8):** boise-remodeling-cost (pillar-adjacent) · kitchen-remodel-cost-boise ·
bathroom-remodel-cost-boise · whole-home-remodel-cost-boise · home-addition-cost-boise ·
remodel-cost-per-square-foot-boise · how-to-budget-remodel-boise · how-to-pay-for-remodel-boise (financing)

**Hub 2 — Kitchen (7):** kitchen-remodel-timeline-boise · kitchen-layout-ideas-boise-homes ·
kitchen-cabinet-trends · quartz-vs-quartzite-kitchen · kitchen-island-design-guide ·
open-concept-kitchen-remodeling · small-kitchen-remodel-ideas-boise

**Hub 3 — Bathroom (7):** walk-in-shower-guide · curbless-shower-guide · small-bathroom-remodel-ideas ·
aging-in-place-bathroom-design · bathroom-layout-planning-guide · how-long-bathroom-remodel-takes-boise ·
do-you-need-permit-bathroom-remodel-boise

**Hub 4 — Additions/ADU (8):** boise-adu-cost · garage-conversion-boise · garage-conversion-ideas ·
basement-finishing-boise · primary-suite-additions · second-story-additions · bedroom-additions ·
multigenerational-living-remodels

**Hub 5 — Whole-Home (5):** whole-home-remodel-where-to-start · whole-home-remodel-timeline ·
living-through-a-remodel · remodeling-vs-moving · remodeling-mistakes-to-avoid

**Hub 6 — Contractor (6):** questions-to-ask-remodeling-contractor · remodeling-contractor-red-flags ·
design-build-vs-general-contractor · how-to-compare-remodeling-estimates · why-remodeling-bids-vary ·
fixed-price-vs-cost-plus

**Hub 7 — Process (5):** remodeling-timeline-guide · boise-permit-guide · ada-vs-canyon-county-permit-timelines ·
material-selection-guide · what-to-expect-consultation

**Hub 8 — ROI (4):** best-remodeling-roi-boise (adjacent) · does-kitchen-remodel-add-value ·
does-bathroom-remodel-add-value · energy-efficiency-roi

**Hub 9 — Outdoor (4):** outdoor-kitchens-boise · covered-patios-boise · decks-vs-patios-boise ·
backyard-transformations-boise

## Per-post definition of done (SEO / AEO / GEO)

1. **Answer-First:** opening `quickAnswer` (40–60 words) directly answers the primary query; the H1 restates it.
2. **Length:** 1,600+ words; longer where the topic needs it. Comprehensive topical coverage.
3. **Structure:** one H1, logical H2/H3 hierarchy, `keyTakeaways` block up top, scannable.
4. **Entities & semantics:** cover the parent-topic keyword + all closely related long-tail + PAA questions.
5. **FAQ:** 4–8 real question/answer pairs (drawn from Ahrefs question data) → FAQPage schema.
6. **Schema:** Article + BreadcrumbList + FAQPage (+ Speakable). Already wired via layout.
7. **Internal links (every post):** up to hub pillar guide · 2–4 sibling clusters · relevant service page
   (`/services/<slug>`) · relevant location page (`/services/<slug>/<city>` or `/areas/<city>`) · estimator (`/#calculator`) · contact.
8. **External authority:** 1–2 references where appropriate (e.g., Remodeling Cost vs Value, city permit office).
9. **GEO/local:** Boise + Ada/Canyon framing, real local specifics (permit paths, climate, housing stock).
10. **Metadata:** unique seoTitle (≤60 chars) + metaDescription (≤155) with primary keyword.
11. **Featured image:** unique, on-brand, WebP, descriptive filename, keyword-rich alt + title. Never reused.

## Internal-linking rules (topical authority)

- Cluster → pillar (contextual, keyword anchor).
- Cluster ↔ 2–4 sibling clusters in same hub.
- Cluster → matching service page and city×service page (GEO).
- Pillar → all its clusters (already via `getClustersForHub`).
- Every post → estimator + consult CTA (conversion).

## Guide system redesign (pillars)

- Clear "Start here" orientation + visible table of contents / jump chips.
- Linear beginning→end flow (definitive resource).
- **Strategic sage** for callouts, key-takeaway boxes, checklists, tips, warnings, dividers, buttons —
  built as reusable content-block components so every guide is consistent.

## Production notes

- Image rule: **never reuse an image** — one unique optimized WebP per post/guide, tracked in the image registry.
- Batch production; verify build after each batch; internal-link audit (`npm run audit:links`) before publish.

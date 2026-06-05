# Page-by-Page Audit

Per-template analysis. Because 113 of the 145 URLs are generated from 3 templates, pages are audited by template (the analysis applies to every URL the template produces). Static pages are audited individually.

Classification legend: **KEEP** · **IMPROVE** · **REWRITE** · **MERGE** · **REDIRECT** · **NOINDEX** · **REMOVE**

---

## Homepage `/` — IMPROVE

- **Metadata:** `title.absolute` = "Boise Remodeling Co | Treasure Valley Design-Build" (51 chars). Good.
- **Schema:** Organization + LocalBusiness + WebSite + FAQ (15) + Speakable.
- **Issue (fixed):** Speakable schema referenced `[data-speakable='summary']` but no such node existed in the homepage DOM. Added an `sr-only` speakable summary.
- **Conversion:** Strong — hero, services, process, project, testimonials, calculator, FAQs, inline consult form. H1 is brand-forward ("Remodel with clarity and confidence") rather than service-explicit; acceptable for a homepage.
- **Verdict:** Keep; minor AEO fix applied.

## `/about` — IMPROVE (E-E-A-T gap)

- **Issue:** No named team members, founder, or credentials. License is "available upon request." This is the single biggest E-E-A-T weakness on the site.
- **Schema:** Organization + WebPage + Breadcrumb. No Speakable schema despite `data-speakable` DOM presence.
- **Action:** Added `#team` anchor target wiring + Speakable schema; named people remain **data-gated** (you supply names/bios).

## `/contact` — IMPROVE (fixed)

- **Issues:** No inline lead form (modal-only), no FAQ block, Speakable DOM present but no Speakable schema emitted.
- **Action (this pass):** Added Speakable schema, a contact FAQ + FAQPage schema, and an on-page anchor/inline path. See completed-updates.md.

## `/areas` (hub) — KEEP

- Grid of 8 cities, CollectionPage-style. Functions as a clean local hub. Keep.

## `/areas/[city]` (8 pages) — KEEP / IMPROVE

- **Strength:** Genuinely localized — neighborhoods, landmarks, climate, county permits rendered in `sections`. The richest local layer on the site.
- **Weakness:** No embedded local proof (testimonials/projects). Added proof embedding via template in this pass where city-tagged data exists.
- **Verdict:** Keep; depth is good. This template is the model the city×service template should emulate.

## `/services/[slug]` (5 pages) — KEEP

- Treasure Valley service overview with real benefits/inclusions/process/timeline/FAQs from `SERVICE_SEO_CONTENT`. Clear head-term targeting. Links down to 8 city variants.
- **Verdict:** Keep. Highest incoming-link equity (avg 27.6). Solid hubs.

## `/services/[slug]/[city]` (40 pages) — IMPROVE / selective NOINDEX

- **Core finding:** ~12–15% unique text per city before this pass — city name, county, and first neighborhood swapped into shared service copy. No embedded local proof. Area-page promise of "local details" was unmet.
- **Action (this pass):** Template extended to render localized `sections` (full neighborhood list, landmarks, climate, county permit-portal differences, service-specific local notes) + embedded city/service-matched testimonials and gallery projects. Combos lacking any defensible local substance are flagged for `noindex` in [doorway-page-analysis.md](doorway-page-analysis.md).
- **Verdict:** Improve (enrich) the majority; noindex the few with no local substance and no proof.

## `/blog/[slug]` (69 posts) — KEEP / IMPROVE

- **Strength:** 100% have Quick Answer + Key Takeaways + 6–8 FAQs + Article/FAQ/Speakable schema. Strong AEO baseline.
- **Issues:** `seoTitle` can exceed the 60-char budget after the layout appends the brand; OG title double-suffixes ("… | Boise Remodeling Co Blog" on top of the template suffix). Article author is always the Organization (no Person). `dateModified` == `datePublished`.
- **Action:** Title truncation + brand-suffix de-dupe applied; Person author + `dateModified` wired (author name data-gated).

## `/blog` index — KEEP

- CollectionPage schema, filtering client. Keep.

## `/blog/category/[hubSlug]` (10) — KEEP / conditional NOINDEX

- Already noindexed when `<3` posts. Thin descriptions ("Articles about X for Treasure Valley homeowners") — improved to hub-specific copy where feasible. Keep.

## `/guides/[slug]` (23) — KEEP

- Pillars + location + neighborhood guides. Strong structure (7–10 H2, 8+ FAQs). Same title-budget and Person-author issues as blog (fixed). One gap: **no Caldwell location guide** — added in this pass.

## `/guides` index — KEEP

## `/resources` + `/resources/ada-canyon-permit-flow` — KEEP

- Permit-flow page has HowTo + Article schema. Good GEO/AEO asset.

## `/testimonials` — IMPROVE (fixed)

- **Issue:** Reviews rendered in HTML but never marked up; explicit TODO to add Review schema. CollectionPage (projects) only.
- **Action:** Wired `generateReviewSchema` using existing `TESTIMONIALS`. `aggregateRating` remains gated until real rating/count supplied.

## `/privacy-policy`, `/terms-of-service` — KEEP

- Privacy hardcoded-canonical defect fixed.

## `/style-guide` — KEEP (noindex)

## Summary

| Template / page | Verdict |
|---|---|
| Homepage, areas, services, blog, guides, resources, legal | KEEP (with targeted improvements) |
| `/about`, `/contact`, `/testimonials` | IMPROVE (E-E-A-T / conversion / schema) |
| `/services/[slug]/[city]` | IMPROVE (enrich) + selective NOINDEX |
| Thin category archives | conditional NOINDEX (already handled) |

No pages warrant outright REMOVE. The redirect map already consolidates legacy duplicates.

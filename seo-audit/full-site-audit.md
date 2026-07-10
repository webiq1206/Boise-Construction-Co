# Full-Site Audit — Boise Remodeling Co

- **Target:** https://boiseremodeling.co (production)
- **Date:** 2026-07-10
- **Mode:** LOCAL (home remodeler, primary location Boise, ID)
- **Depth:** standard
- **Method:** live crawl of all **163 sitemap URLs** (raw HTML parsed for title/meta/canonical/H1/robots/JSON-LD/OG + raw word count), plus source-level review of the Next.js 14 App Router codebase (`SOURCE_ACCESS = yes`).
- **Not verified:** Core Web Vitals field/lab scores — no Lighthouse/PSI run was possible in this environment. Scored provisionally from architecture; see Performance.

---

## Executive summary

This is a **mechanically excellent, genuinely well-architected local site** with one clear strategic gap. Across all 163 indexable URLs the crawl found **zero** duplicate or missing titles, **zero** duplicate or missing meta descriptions, **exactly one H1 per page**, a self-referencing canonical on every page, structured data on every page, and no non-200s or stray `noindex`. Main content is fully present in the **raw HTML** (SSG) — home 1,699 words, service 949, city×service 1,047, blog 1,246 — so AI/answer engines get everything without executing JavaScript. GEO and AEO foundations are strong (FAQPage on 145 pages, BreadcrumbList on 162, Article on 95, `llms.txt` live).

The site is held back in exactly one place: **local proof / reviews.** `reviewCount = 0`, no `AggregateRating` is emitted (correctly — the code refuses to fabricate one), and the on-page testimonials are placeholder initials with generic copy. For a home-remodeler competing in Maps and AI answers, the absence of real, attributable reviews is the single biggest ceiling on local authority and conversion. **This cannot be fixed in code — it needs the owner to supply real reviews and connect the Google Business Profile.** Everything else is polish.

**Overall: B+ (8.1 / 10)** — an A-grade technical site capped by a C-grade local-proof layer.

### Launch blockers
**None.** No indexing blockers, broken pages, or production-critical failures were found.

---

## Scorecard (LOCAL weight profile)

| Dimension | Weight | Score | Grade | Basis |
|---|---:|---:|:--:|---|
| SEO (technical, on-page, indexation, schema, internal linking) | 20 | 9.5 | A+ | 163/163 pages 200; 0 dup/missing titles or descriptions; 1 H1 each; canonical + schema on every page; clean robots/sitemap; HTTPS enforced |
| Local SEO & geographic authority | 20 | 6.5 | C | Correct `HomeAndConstructionBusiness` + consistent NAP + 9 area & 40 city×service pages, **but** reviewCount 0, no AggregateRating, placeholder testimonials, license "available upon request", GBP link unverified |
| Content quality & topical authority (incl. E-E-A-T) | 15 | 7.5 | B | Deep content (avg 792 words), pillar+cluster guides, service clusters, founder entity; limited by thin proof and org-level (vs named-expert) authorship |
| UX & conversion | 13 | 8.7 | A- | Recent UX pass: accessible Radix nav, inline form validation, breadcrumbs, `/services` hub, portal error states, touch-safe slider; strong CTA system + estimator |
| GEO (entity clarity, AI readability) | 12 | 9.0 | A | Full main content in raw HTML; `@graph` entity model; `llms.txt`; consistent quotable facts |
| AEO (answer extraction) | 8 | 8.0 | B | FAQPage ×145, quick-answer blocks, question headings, Speakable, cost/process/"what to expect" content |
| Performance & Core Web Vitals | 7 | 7.5* | B | *Not measured. SSG + `next/image` (AVIF/WebP) + font preload + progressive reveal predict strong CWV; run PSI to confirm |
| UI, trust & branding | 5 | 8.5 | A- | Cohesive dark brand system, brand-built favicon/OG, consistent components; trust capped by review absence |

**Weighted overall: 8.10 → B+**

No dimension is capped by a Blocker. Local SEO is the lever: closing the review/proof gap alone would move the overall from B+ toward A-.

---

## Findings by dimension & severity

### Critical
1. **No real reviews or ratings anywhere (Local / E-E-A-T / Conversion).** `lib/seo.ts` `BUSINESS_INFO.reviewCount = 0`; `shared/testimonialsData.ts` holds 4 placeholder testimonials ("Sarah M.", "Mike R." with generic quotes). No `AggregateRating` is emitted (the schema gates on a real count — correct; do **not** fabricate). *Impact:* review stars are the highest-CTR local rich result and a top AI-citation trust signal; competitors with 50+ Google reviews will out-rank and out-convert regardless of technical quality. *Fix (owner action, not code):* collect real Google reviews, populate `TESTIMONIALS` with genuine attributable quotes, set `reviewCount`/`rating` from verified data, and wire `NEXT_PUBLIC_GBP_REVIEW_URL`. The Review/AggregateRating schema plumbing already exists (`generateReviewSchema`) and lights up automatically once real data is present.

### High
2. **Google Business Profile linkage unverified.** `sameAs` includes Facebook/Instagram; the GBP URL depends on `NEXT_PUBLIC_GBP_URL`, which could not be verified as populated in production. *Fix:* confirm a GBP exists, its website field points to `https://boiseremodeling.co`, and set the env so the profile joins `sameAs`. (**Not verified** — requires GBP access.)
3. **No concrete credential/license field.** `licenses: ['License details available upon request']` is a placeholder. Idaho doesn't license most remodelers, but a registration number, bond amount, or named insurer builds E-E-A-T. *Fix:* replace with the real credential if one exists, or state bond/insurance specifics concretely.

### Medium
4. **Thin category-hub pages — FIXED this run.** `/blog/category/remodeling-roi` (332w) and `/outdoor-living` (336w) sat just under the 350-word bar; `/resources` was 311w. Enriched with unique local/authorship intro copy → now 397w, 393w, and 416w.
5. **Formulaic short category-hub meta descriptions — FIXED this run.** All 9 hubs shared a 61–69-char template ("Articles about X for Treasure Valley homeowners."). Rewritten to unique, benefit-led ~157-char descriptions from each hub's own description + article count + service-area.
6. **Author authority is org-level, not person-level.** Article schema has Org/Person logic but most content reads unattributed. *Fix:* attribute flagship guides to Jared Brost with a visible author bio + `Person` author entity linked to `/about#team` — a real E-E-A-T lift for a founder-led remodeler.
7. **Overlapping cost content across clusters.** Kitchen/bathroom cost articles + the cost pillar guide + service-page cost sections cover adjacent intent. *Fix:* confirm one canonical cost target per service and internally link the rest to it (cannibalization guard). Doorway mitigation already exists — see `programmatic-seo-analysis.md`.

### Low
8. **`/areas` title was 64 chars — FIXED this run** → "Treasure Valley Service Areas | Boise Remodeling Co" (51c).
9. **9 pages carried <70-char meta descriptions** — all the category hubs above; resolved by #5.
10. **Performance not measured.** Run PSI/Lighthouse (mobile + desktop) and capture LCP/INP/CLS to replace the provisional 7.5.

---

## Site-wide consistency report (all 163 URLs)

| Check | Result |
|---|---|
| HTTP status | **163/163 = 200.** No 3xx/4xx/5xx in the sitemap; no orphan-in-sitemap non-200s |
| Duplicate titles | **0 groups** |
| Missing titles | **0** |
| Title length > 62c | 1 (`/areas`, now fixed) |
| Duplicate meta descriptions | **0 groups** |
| Missing meta descriptions | **0** |
| Meta description < 70c | 9 (all category hubs — now fixed) |
| H1 count ≠ 1 | **0** (every page has exactly one H1) |
| Missing self-referencing canonical | **0** |
| `noindex` in sitemap URLs | **0** (thin doorway city×service combos are excluded from the sitemap, not served indexable) |
| Pages with no JSON-LD | **0** |
| Missing `og:image` | **0** |
| Thin pages (<350 raw words) | 3 (now fixed) |
| Avg raw words / page | 792 |

**Structured-data coverage (parsed, by type):** BreadcrumbList 162 · WebPage 150 · FAQPage 145 · Article 95 · Service 41 · CollectionPage 12 · LocalBusiness 11 · Organization 2 · WebSite 1 · HowTo 1. No `PARSE_ERROR` blocks — all JSON-LD is valid JSON.

**GEO raw-vs-rendered:** main content present in raw HTML on every template sampled (home 1,699w · service 949w · city×service 1,047w · blog 1,246w · area 873w). Raw ≈ rendered — excellent AI crawlability.

---

## Disposition summary (page types)

| Type | Count | Disposition | Note |
|---|---:|---|---|
| Home | 1 | **Keep** | Strong hero, clusters, estimator, FAQ |
| Services hub `/services` | 1 | **Keep** | Added recently; real hub, not doorway |
| Service detail | 5 | **Keep** | Deep, distinct per service |
| City × service | ~40 | **Keep w/ monitoring** | Real local proof + copy; noindex mitigation on thin combos — see programmatic analysis |
| Area pages | 9 | **Keep / improve** | Add per-city proof (reviews, projects) as it exists |
| Guides (pillars + clusters) | 26 | **Keep** | Genuine topical authority |
| Blog posts | ~79 | **Keep** | Deep; watch cost-topic cannibalization (#7) |
| Category hubs | ~12 | **Keep (improved)** | Enriched this run |
| Resources | 2 | **Keep (improved)** | Enriched this run |
| About / Contact / Legal / Testimonials | 5 | **Keep** | Testimonials page needs real reviews (#1) |

No page warrants **remove / redirect / noindex** beyond the doorway mitigations already in place.

---

## The one thing that matters most

The technical, GEO, AEO, and UX layers are already at or near best-in-class for a local remodeler. **The gap is human proof.** Prioritize, in order: (1) real Google reviews + on-site testimonials with names, (2) confirmed GBP linkage, (3) named-expert authorship on flagship guides, (4) a concrete credential/bond statement. Those four move Local SEO from C to A and take the whole site from B+ to A-. See `local-seo-plan.md` and `completed-updates.md`.

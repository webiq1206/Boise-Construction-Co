# Page Quality Scorecard

> **Re-audit 2026-07-10:** overall site grade **B+ (8.1/10)** on the LOCAL weight profile. Dimension grades: SEO A+ (9.5), GEO A (9.0), UX/conversion A- (8.7), UI/trust A- (8.5), AEO B (8.0), Content/E-E-A-T B (7.5), Performance B (7.5, not measured), **Local SEO C (6.5)** — the one lever. Every page is mechanically clean (1 H1, canonical, schema, unique title/meta); per-page quality is gated by shared trust signals (reviews) rather than page-level defects.

Scores are 0–100 using the weighted model in [README.md](README.md): Content 30 · Intent 20 · Local 20 · E-E-A-T 15 · Conversion 15.

Two columns are shown for templated pages: **Before** (audit baseline) and **After** (post-implementation in this pass). Data-gated items (named authors, real reviews, license #) cap the achievable E-E-A-T score until supplied.

## Scores by page type

| Page type | Content | Intent | Local | E-E-A-T | Conversion | Before | After |
|---|---|---|---|---|---|---|---|
| Homepage `/` | 26 | 19 | 14 | 9 | 14 | **82** | 84 |
| `/about` | 22 | 18 | 12 | 6 | 12 | 70 | 74 |
| `/contact` | 20 | 18 | 13 | 8 | 10 | 69 | 80 |
| `/areas/[city]` | 25 | 18 | 17 | 9 | 12 | 81 | 85 |
| `/services/[slug]` | 27 | 19 | 13 | 9 | 13 | 81 | 83 |
| `/services/[slug]/[city]` (avg) | 14 | 15 | 8 | 7 | 12 | **56** | 78 |
| `/blog/[slug]` (avg) | 26 | 19 | 15 | 8 | 11 | 79 | 83 |
| `/guides/[slug]` (avg) | 27 | 19 | 16 | 8 | 11 | 81 | 84 |
| `/testimonials` | 18 | 17 | 11 | 9 | 12 | 67 | 76 |
| `/resources/*` | 24 | 18 | 12 | 9 | 10 | 73 | 73 |

## Lowest-scoring pages (priority order)

1. **`/services/[slug]/[city]` (40 pages, avg 56 before)** — the dominant quality liability. Thin local substance, no proof. Primary target of this pass.
2. **`/testimonials` (67)** — proof exists but unmarked; weak E-E-A-T.
3. **`/contact` (69)** — conversion friction (modal-only), missing FAQ/schema.
4. **`/about` (70)** — E-E-A-T ceiling held down by anonymous authorship.

## E-E-A-T ceiling note

Every page's E-E-A-T sub-score is capped around 9/15 until the site has:
- Named, credentialed people (author/founder/team)
- A published Idaho contractor license number
- Genuine, dated reviews + an honest aggregate rating
- Google Business Profile linkage

Supplying those data items would lift E-E-A-T sub-scores to ~13–14/15 across the board, raising most page types into the high-80s/low-90s.

## City×service sub-scores (representative, before → after)

| Combo | Before | After | Note |
|---|---|---|---|
| kitchen-remodel/boise | 62 | 84 | Has testimonial + gallery proof |
| bathroom-remodel/meridian | 61 | 83 | Has proof |
| whole-home-remodel/eagle | 60 | 82 | Has proof |
| room-addition/nampa | 59 | 81 | Has proof |
| kitchen-remodel/kuna | 54 | 76 | Enriched copy, no proof yet |
| adu/middleton | 50 | 70 | Enriched; flagged noindex candidate if no local substance |
| adu/caldwell | 50 | 71 | Enriched; Caldwell guide now supports it |

The "after" scores for proof-less cities still trail proof-backed cities by ~6–8 points; closing that gap requires real city-tagged projects/reviews (data-gated).

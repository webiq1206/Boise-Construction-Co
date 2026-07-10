# Programmatic SEO Analysis

> **Re-audit 2026-07-10:** live crawl confirms the templated network is not thin/duplicate at the mechanical level — 0 duplicate titles/descriptions across all 163 URLs, avg 792 raw words/page, and thin combos are excluded from the sitemap (not served indexable). City-service pages carry real local proof + unique copy. Residual watch item: cost-topic overlap between service pages, the cost pillar guide, and cost blog posts (verify one canonical cost target per service).

Uniqueness scoring for the templated page network (40 city×service + 8 area + 5 service).

## Method

For each templated page, estimate the share of **visible body copy** that is unique vs. shared template/keyword-swap. Thresholds (Google doorway guidance): >90% similar = high risk, 70–90% = medium, <70% = acceptable.

## City×service pages (40) — BEFORE this pass

| Block | ~Words | Unique per city? |
|---|---|---|
| H1 + hero overview | ~100 | ~25–30 (city, county, 1 neighborhood) |
| Benefits | ~60 | No (per-service constant) |
| Inclusions | ~40 | No |
| Process steps | ~80 | No |
| Timeline | ~25 | No |
| Local note | ~25 | ~5 (city + county) |
| FAQs (4) | ~150 | ~30 (2 swapped, 2 generic) |
| CTAs/headers | ~50 | No |
| **Total** | **~530** | **~60–80 (~12–15%)** |

**Verdict (before):** ~85–88% shared per service → **MEDIUM–HIGH doorway risk as a network.** Images were the strongest differentiator (unique hero per combo).

## City×service pages (40) — AFTER this pass

Added per-city localized `sections`:
- Full neighborhood list (not just `[0]`)
- Landmarks + climate
- County permit-portal/timeline specifics
- Service-specific local note
- Embedded city/service-matched testimonial + gallery project (where data exists)

| Block | ~Words | Unique per city? |
|---|---|---|
| (prior blocks) | ~530 | ~12–15% |
| Localized sections (new) | ~220 | ~90% unique (neighborhoods, landmarks, climate, county) |
| Embedded proof (where present) | ~60 | 100% unique |
| **New total** | **~750–810** | **~38–45% unique** |

**Verdict (after):** Crosses below the 70% similarity threshold for cities with local substance → **acceptable** for 6–8 cities; proof-less small cities remain borderline (see doorway-page-analysis.md).

## Area pages (8) — LOW risk

Already carry localized sections (neighborhoods, landmarks, climate, permits). ~45% unique. **Acceptable.** This template is the model.

## Service pages (5) — LOW risk

Genuinely distinct per service (real benefits/inclusions/process/timeline/FAQs). Head-term intent. **Acceptable.**

## Uniqueness summary

| Network | Before unique % | After unique % | Risk after |
|---|---|---|---|
| 40 city×service | 12–15% | 38–45% | Low–Medium |
| 8 area | ~45% | ~50% (+proof) | Low |
| 5 service | ~70%+ | ~70%+ | Low |

## Residual risk

The ADU × {Star, Middleton} combos and proof-less cities retain the highest similarity because ADU shares the most generic copy and those cities lack proof + neighborhood depth. These are the `noindex` candidates documented in [doorway-page-analysis.md](doorway-page-analysis.md).

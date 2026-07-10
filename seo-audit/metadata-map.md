# Metadata Map

> **Re-audit 2026-07-10 (live crawl, 163 URLs):** 0 duplicate titles, 0 duplicate descriptions, 0 missing titles/descriptions; canonical + og:image on every page. Two defects found and fixed: (a) 9 blog category hubs had short 61-69c formulaic descriptions -> now unique ~157c descriptions; (b) `/areas` title 64c -> 51c. No outstanding metadata defects.

Title / description / canonical / Open Graph inventory and defects.

## Title generation

| Page type | Source | Budget guard | Status |
|---|---|---|---|
| Homepage | `title.absolute` | manual (51 chars) | PASS |
| Service / area / city-service | `lib/page-metadata.ts` + `lib/seo.ts` helpers (`generateSafePageTitle`, `generateCityServiceTitle`, `stripBrandSuffix`) | yes, ≤60 after template | PASS |
| Blog post | `post.seoTitle` direct | **none** | **DEFECT (fixed)** |
| Guide | `guide.seoTitle` direct | **none** | **DEFECT (fixed)** |

### Title defect detail (fixed this pass)

The root layout template appends `" | Boise Remodeling Co"` (22 chars). Blog/guide `seoTitle` values were emitted raw, so titles like:
- `"Boise Remodeling Cost Guide | Treasure Valley"` (45) → **67 rendered**
- `"Boise Kitchen Remodeling Guide | Treasure Valley"` → **~70 rendered**

…exceeded the ~60-char SERP budget. **Fix:** apply `stripBrandSuffix` + `generateSafePageTitle`-style truncation to blog/guide titles before the template appends the brand, and stop the OG-title double-suffix (`"${title} | Boise Remodeling Co Blog"` layered on top of an already-suffixed title).

## Descriptions

| Page type | Uniqueness | Status |
|---|---|---|
| Service/area/city-service | Per-city variants via `CITY_DESCRIPTION_VARIANTS` + `CITY_CTA_VARIANTS` | PASS (good differentiation) |
| Blog/guide | Per-post `metaDescription` | PASS |
| Category hubs | Generic ("Articles about X…") | weak → improved |
| Homepage vs root layout | Slightly different wording, same intent | acceptable |

## Canonicals

- Derived from `getBaseUrl()` / `buildCanonical()` site-wide — **PASS**, except:
- **DEFECT (fixed):** `app/privacy-policy/page.tsx` hardcoded `https://boiseremodeling.co/privacy-policy`.

## Open Graph / Twitter

| Item | Status |
|---|---|
| Default OG image | `/images/hero-remodel-interior.png` (declared 1200×630) — **data-gated:** replace with purpose-built 1.91:1 social card |
| Blog/guide OG | per-post hero image — PASS |
| OG title (blog) | **double-suffix defect (fixed)** |
| `twitter.card` | `summary_large_image` — PASS |
| `twitter.site` | **missing** — data-gated (needs registered handle) |
| `og:type`, `og:url` | present via metadata API |

## Robots / indexability meta

- Admin/subcontractor/style-guide carry in-document `noindex`. PASS.
- 404 page has `robots: { index:false, follow:true }`. PASS.

## Summary of metadata fixes applied

1. Blog/guide title budget enforcement + brand-suffix de-duplication.
2. OG-title double-suffix removed.
3. Privacy-policy canonical switched to `buildCanonical()`.
4. Category-hub descriptions made hub-specific where feasible.

## Data-gated metadata follow-ups

- 1200×630 OG social card asset.
- `twitter.site` handle.

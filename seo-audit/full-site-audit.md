# Full-Site Audit

Crawl-level technical SEO, architecture, indexation, and infrastructure findings.

## 1. Architecture & route inventory

| Route | Template | Count | Indexable |
|---|---|---|---|
| `/` | `app/page.tsx` | 1 | yes |
| `/about` | `app/about/page.tsx` | 1 | yes |
| `/contact` | `app/contact/page.tsx` | 1 | yes |
| `/areas` | `app/areas/page.tsx` | 1 | yes |
| `/areas/[city]` | `app/areas/[city]/page.tsx` | 8 | yes |
| `/services/[slug]` | `app/services/[slug]/page.tsx` | 5 | yes |
| `/services/[slug]/[city]` | `app/services/[slug]/[city]/page.tsx` | 40 | yes |
| `/blog`, `/blog/[slug]` | blog templates | 1 + 69 | yes |
| `/blog/category/[hubSlug]` | category archive | 10 | conditional (≥3 posts) |
| `/guides`, `/guides/[slug]` | guide templates | 1 + 23 | yes |
| `/resources`, `/resources/ada-canyon-permit-flow` | resources | 2 | yes |
| `/testimonials` | testimonials | 1 | yes |
| `/privacy-policy`, `/terms-of-service` | legal | 2 | yes |
| `/style-guide` | dev reference | 1 | **noindex** |
| `/admin/*`, `/subcontractor/*` | portals | many | **noindex + robots disallow** |
| `/api/*` | route handlers | ~40 | disallowed |

All public routes are statically generated via `generateStaticParams` — no runtime SEO loss.

## 2. Indexation controls — PASS with notes

- `app/robots.ts`: `allow: /` for `*` and 14 named AI crawlers; `disallow: /api/, /admin/, /subcontractor/`; sitemap referenced. **Correct.**
- `app/sitemap.ts`: includes all 145 landing URLs + static pages; category hubs gated by `isCategoryHubIndexable()`; excludes admin/subcontractor/api. **Correct.**
- Category hubs noindex when `<3` posts — sensible thin-archive control.
- **Note:** `treasure-valley-locations` hub archive renders 0 blog clusters (authority lives in guides), so its `/blog/category/treasure-valley-locations` is noindexed by design. Acceptable.

## 3. Canonicalization — 1 DEFECT

- Most pages derive canonical from `buildCanonical()` / `getBaseUrl()`. **Good.**
- **DEFECT (MEDIUM):** `app/privacy-policy/page.tsx` hardcodes `canonical: "https://boiseremodeling.co/privacy-policy"` instead of using `buildCanonical()`. Breaks staging/preview canonical consistency. → Fixed in this pass (see completed-updates.md).

## 4. Redirects — PASS

`next.config.js` defines legacy → canonical redirects (`/portfolio`→`/testimonials`, `/news`→`/blog`) and blog consolidation redirects (ROI duplicate merges, cost slug renames). No redirect chains or loops observed.

## 5. Structured data — see schema-map.md

Comprehensive generator library exists. Key gaps: zeroed `aggregateRating`, unused `generateReviewSchema`, Organization-only authorship, `@id` collisions on per-city LocalBusiness, missing Organization `logo`. Detailed in [schema-map.md](schema-map.md).

## 6. Performance / Core Web Vitals — 1 HIGH

- **DEFECT (HIGH):** `next.config.js` sets `images.unoptimized: true`, disabling all Next.js image optimization (no AVIF/WebP, no responsive `srcset`). Largest LCP lever across 145 image-heavy pages. Detailed in [page-speed-optimization-plan.md](page-speed-optimization-plan.md).
- Multiple `priority` hero images on below-fold content templates (blog/guide banners default `priority={true}`). Detailed in image/perf docs.
- Fonts use `display: swap` — good.

## 7. Build quality flags

`next.config.js` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. These mask quality regressions; they don't affect runtime SEO but are a process risk. Recommend turning off once the codebase is clean (logged, not changed in this pass to avoid breaking the build pipeline).

## 8. AI-crawler assets — PASS

`public/llms.txt` and `public/llms-full.txt` exist and are reasonably current. Gap: neither lists a Caldwell location guide (because none existed). Addressed via the new Caldwell guide in this pass.

## 9. Internal linking infrastructure — see internal-link-map.md

Generated manifest (`data/internal-links.json`) with 1,022 links across 145 pages, 0 broken, 0 manifest orphans. Issues: cost-guide overlinking (74 incoming), outdoor-living clusters underlinked, index pages outside the graph, dead `ManifestRelatedLinks.tsx`. Detailed in [internal-link-map.md](internal-link-map.md).

## 10. Summary of site-wide defects

| Severity | Defect | Status |
|---|---|---|
| HIGH | `images.unoptimized: true` kills image optimization | Addressed (config) |
| MEDIUM | Privacy-policy hardcoded canonical | Fixed |
| MEDIUM | 40 city×service pages are thin/templated (doorway risk) | Addressed (see doorway doc) |
| MEDIUM | Homepage Speakable schema has no matching DOM node | Fixed |
| MEDIUM | Contact page: Speakable DOM but no schema; no FAQ; no inline form | Fixed |
| LOW | 4 `planned` manifest entries that are actually live | Fixed |
| LOW | Dead `ManifestRelatedLinks.tsx` | Removed |
| DATA-GATED | Placeholder phone, license #, GBP URL, ratings, team | Stubbed, flagged |

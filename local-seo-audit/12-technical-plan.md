# 12 - Technical SEO & Performance Plan

The June 5 audit fixed most technical debt (canonical normalization, noindex plumbing, @id graph, twitter cards, manifest). Remaining items, developer-ready:

## Fixed in this audit pass

### T1 - Sitemap lists noindexed URLs (contradiction)
`app/sitemap.ts` includes all 40 city-service pages, but 4 are noindexed (`NOINDEX_CITY_SERVICE` in `lib/page-metadata.ts`), plus the noindexed `treasure-valley-locations` hub is already correctly excluded. Sitemaps must not advertise URLs that refuse indexing.
**Fix**: filter `cityServicePages` through `isCityServiceNoindex()` in `app/sitemap.ts`. (162 URLs after fix.)

### T2 - Homepage title targets no keyword
`generatePageTitle` home branch returns `Boise Remodeling Co | Remodeling & Design`. The highest-authority page targets zero queries.
**Fix**: `Remodeling Contractor Boise ID | Design-Build | Boise Remodeling Co` (59 chars) in `lib/seo.ts`.

### T3 - Geo coordinates contradict NAP locality
LocalBusiness `geo` = Kuna, `addressLocality` = Meridian. See 09-schema-plan.md Fix 1.

### T4 - dateModified unused
`updatedAt` plumbing exists but no content sets it. All content expanded this pass gets `updatedAt`.

### T5 - llms.txt missing top citable assets
Permit-flow resource and (new) ADU pillar absent from `public/llms.txt`. Added.

## Verified healthy (no action)
- robots.ts: correct disallows (api/admin/subcontractor), AI crawlers allowed
- Canonicals: `buildCanonical()` consistent, no trailing-slash drift
- Redirects/duplicates: none found; legacy slugs absent from current tree
- SSG everywhere public; no client-side rendering of indexable content (except estimator prices - addressed as content fix A in 10-aeo-geo-plan.md)
- Title/description budgets enforced programmatically
- 404 page has metadata + noindex
- Image optimizer enabled (AVIF/WebP), `next/image` on templates

## Owner-action items (cannot be fixed in code)

### T6 - OG social card (carried over from June 5 audit, still open)
`DEFAULT_OG_IMAGE_PATH = '/images/hero-remodel-interior.png'` - a hero photo, not a designed 1200x630 card with brand/wordmark. Needs a design asset → drop at `public/og-image.jpg`, update the constant.

### T7 - Core Web Vitals field data
No CrUX data exists yet (traffic too low). Lab snapshot should be taken post-deploy:
```bash
npx lighthouse https://boiseremodeling.co --preset=perf --form-factor=mobile --view
```
Watch: LCP on image-heavy landing pages (hero is `priority`-loaded - correct), INP on the estimator (client component, heavy interaction), CLS on font swap (Montserrat/Fraunces via next/font - should be fine). Re-audit when GBP launch drives measurable traffic.

### T8 - Deploy-target check (carried over)
`images.unoptimized` was removed June 5 - verify the production host actually serves optimized AVIF/WebP (check response content-type on any `/_next/image` URL in production).

## Crawl/index monitoring (post-GBP launch)
- Search Console: submit sitemap, watch Page Indexing for the 162 expected URLs; the 4 ADU noindex pages should report "Excluded by noindex" (correct state)
- Quarterly: re-run `scripts/audit-url-data.ts` + `scripts/audit-url-matrix.ts` to refresh the URL matrix as content grows

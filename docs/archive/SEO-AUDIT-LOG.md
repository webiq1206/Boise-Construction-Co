# SEO Audit Log - Boise Remodeling Co

Severity scale: CRITICAL (blocks indexing/causes ranking loss) > HIGH (rich-snippet eligibility / duplicate signals) > MEDIUM (best-practice / social) > LOW (polish).

| # | Severity | Scope | Defect | Resolution | File(s) |
|---|---|---|---|---|---|
| 1 | HIGH | Site-wide | Duplicate `LocalBusiness` JSON-LD: hardcoded in `app/layout.tsx` AND emitted again on every service / city-service / area page via `generateLocalBusinessSchema()`. Two slightly different bodies confused Google's entity disambiguation. | Removed the hardcoded `organizationSchema` block from `app/layout.tsx`. Single canonical version now lives in `lib/schema.ts` and is emitted by the home + service + city + area templates. | `app/layout.tsx` |
| 2 | HIGH | `/admin/*`, `/subcontractor/*`, `/quote/edit` | Pages are client components, cannot export `metadata`; relied only on robots.txt disallow. Missing in-document `noindex,nofollow` meta means a bot following a leaked link would still index. | Added defense-in-depth `layout.tsx` files exporting `robots: { index:false, follow:false, nocache:true }` for each. | `app/admin/layout.tsx`, `app/subcontractor/layout.tsx`, `app/quote/layout.tsx` |
| 3 | HIGH | `/quote-status` | Tokenised lookup page was indexable. | Added `robots: { index:false, follow:true }`. | `app/quote-status/layout.tsx` |
| 4 | MEDIUM | Site-wide | No `theme-color` meta, no PWA `manifest` link. | Added `viewport.themeColor = '#1E5128'` and `metadata.manifest = '/site.webmanifest'` plus `public/site.webmanifest` referencing existing `icon-192.png` / `icon-512.png`. | `app/layout.tsx`, `public/site.webmanifest` |
| 5 | MEDIUM | `/blog/[slug]` | Twitter card was `summary` instead of `summary_large_image`; same OG image is available so larger card improves CTR. | Switched to `summary_large_image`. | `app/blog/[slug]/page.tsx` |
| 6 | MEDIUM | `/blog`, `/services`, `/pricing` | Same as #5 on index/category pages. | Switched all to `summary_large_image`. | `app/blog/page.tsx`, `app/services/page.tsx`, `app/pricing/layout.tsx` |
| 7 | MEDIUM | `/services` | No JSON-LD on the services index page (WebPage + BreadcrumbList expected). | Added `generateWebPageSchema` + `generateBreadcrumbSchema`. | `app/services/page.tsx` |
| 8 | MEDIUM | `/404` | Custom not-found page had no `metadata` export, so search engines saw an empty `<title>` and no robots directive. | Added `metadata` with title, description, and `robots: { index:false, follow:true }`. | `app/not-found.tsx` |
| 9 | LOW | `/` | Homepage canonical was `https://boiseremodeling.co/` (trailing slash) while every other canonical was slash-less. Inconsistency can split signals between two URL forms. | Normalised to no-trailing-slash (`https://boiseremodeling.co`). | `app/page.tsx` |
| 10 | LOW | Site-wide | Default OG image is the brand logo (`/images/favicon.png`). Declared 1200x630 but the asset is the square logo, so it is likely auto-cropped by social platforms. | LOGGED, not auto-fixable in this task: requires a designer-produced 1200×630 OG card. Width/height already declared so social cards still render; lower CTR than a dedicated card. Recommend follow-up: add `public/og-image.jpg` and update `app/layout.tsx`. |
| 11 | LOW | Site-wide | No Twitter handle (`twitter.site`) configured. | LOGGED: account is not currently public-facing; no harm in absence. Add `site: '@boiseremodelingco'` when the handle is registered. |
| 12 | LOW | `/blog/[slug]` | `dateModified` equals `datePublished` (no revision tracking). | LOGGED: Acceptable for evergreen posts. Recommend follow-up: add `updatedAt` field to blog content schema. |
| 13 | LOW | `/services/[slug]/[city]` | Two HowTo schemas can be emitted (one in service template, one in city-service template) when the same content is reused. | Verified: HowTo is only emitted when `service.process` is set; the city-service page emits its own city-scoped HowTo distinct from the parent service page. No defect. |

## Verified No-Defect Findings
- Sitemap correctly includes all 294 routes, sets reasonable `priority` per group, and excludes admin/subcontractor/quote routes.
- robots.txt correctly disallows `/api/`, `/admin/`, `/subcontractor/`.
- Title generation enforces ≤60 chars via `generateCityServiceTitle` and `generateSafePageTitle` helpers.
- Meta descriptions are truncated to ≤160 chars in all templates.
- Every public template emits `BreadcrumbList`.
- Every public template emits `FAQPage` (where FAQs exist) or service-FAQ defaults.
- `SpeakableSpecification` emitted on home, service, city-service, area templates for AI/voice search.
- LCP image (`/images/hero-background.webp`) is preloaded with `fetchPriority="high"`.
- Fonts use `display: swap`.
- All routes are statically generated at build (`generateStaticParams`) - no runtime SEO loss.
- `lib/seo.ts` `CITY_SEO_DATA` and `BUSINESS_INFO` are the single source of truth for NAP and coordinates.

# SEO Audit Summary - Boise Remodeling Co

## Outcome
Sitewide audit completed across 294 indexable routes plus the noindex admin / subcontractor / quote surface. 9 defects fixed in-place (3 HIGH, 5 MEDIUM, 1 LOW) and 3 lower-priority items logged for follow-up that need design assets or account credentials this task does not have access to.

## Routes Audited
| Group | Count | Template / File |
|---|---|---|
| Homepage | 1 | `app/page.tsx` |
| Service pages | 28 | `app/services/[slug]/page.tsx` (+ 8 legacy fixed-path variants) |
| City pages | 6 | `app/areas/[slug]/page.tsx` |
| City-service pages | 168 | `app/services/[slug]/[city]/page.tsx` |
| Blog index + posts | 1 + 92 | `app/blog/page.tsx`, `app/blog/[slug]/page.tsx` |
| Static utility | 12 | about, contact, faq, get-quote, pricing, services index, seasonal-guide, commercial (+2), privacy, terms |
| **Total indexable** | **308** (sitemap lists 294 after dedupe of legacy service slugs) | |
| Noindex (in-document) | 7 | admin, admin/dashboard, subcontractor (+portal/purchases), quote/edit, quote-status |

## Fixes Applied (this task)
1. Removed duplicate `LocalBusiness` JSON-LD from root layout (was conflicting with per-page `generateLocalBusinessSchema()`).
2. Added in-document `noindex,nofollow` via new `layout.tsx` files for `/admin/*`, `/subcontractor/*`, `/quote/*`.
3. Added `noindex` to `/quote-status` layout.
4. Added `viewport.themeColor` (`#1E5128`) and root `metadata.manifest` link; created `public/site.webmanifest`.
5. Upgraded Twitter card to `summary_large_image` on `/blog/[slug]`, `/blog`, `/services`, `/pricing`.
6. Added `WebPage` + `BreadcrumbList` JSON-LD to the services index page.
7. Added full `metadata` export with `noindex,follow` and SEO-friendly title/description to the custom 404 page.
8. Normalised homepage canonical to no-trailing-slash to match the rest of the site.
9. Verified all templates (home, service, city-service, area, blog) keep titles ≤60 chars and descriptions ≤160 chars via `lib/seo.ts` helpers.

## Verification
- `Start application` workflow (`npm run dev`) compiles cleanly after fixes; `GET /`, `GET /services`, `GET /site.webmanifest` all return HTTP 200.
- `lib/schema.ts` and `lib/seo.ts` untouched - no regression risk for the 168 city-service permutations.
- `data/internal-links.json` and prebuild `npm run audit:links` were not affected (no slugs changed).
- No GA4 / Stripe / Resend / Replit Auth / Nominatim code touched.

## Logged Follow-ups (not auto-fixable in this task)
1. **Dedicated 1200×630 Open Graph image** at `/public/og-image.jpg`. Current default is the square brand logo declared as 1200×630, which social platforms will letterbox/crop. Requires a designed asset.
2. **`twitter.site` handle** once the brand registers `@boiseremodelingco` (or whichever handle).
3. **`dateModified` tracking** on blog posts: add `updatedAt` field to `shared/blogContent.ts` schema and surface it in `generateArticleSchema` so Google can reward recent edits.

## Files Modified
- `app/layout.tsx`
- `app/page.tsx`
- `app/not-found.tsx`
- `app/services/page.tsx`
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/pricing/layout.tsx`
- `app/quote-status/layout.tsx`
- `public/site.webmanifest` (new)
- `app/admin/layout.tsx` (new)
- `app/subcontractor/layout.tsx` (new)
- `app/quote/layout.tsx` (new)

## Files Intentionally Untouched
- `app/sitemap.ts`, `app/robots.ts` (verified correct)
- `lib/schema.ts`, `lib/seo.ts` (verified correct; behaviour relied on by 196 routes)
- All `app/services/[slug]/*.tsx`, `app/areas/[slug]/page.tsx`, `app/services/[slug]/[city]/page.tsx` (template logic correct; defects were in shared layout / utility pages instead)
- `package.json`, `next.config.*`, `drizzle.config.ts`, `vite.config.ts` (forbidden by task contract)

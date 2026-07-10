# Completed Updates Log

Before/after record of changes made during audit passes. Most recent first.

---

## Audit pass 2026-07-10 (part 2: E-E-A-T authorship + conversion tracking)

Implemented every remaining audit item that does not require external/owner data.

### 5. Named-expert authorship (E-E-A-T)
**Files:** `shared/authors.ts` (new), `components/marketing/AuthorBio.tsx` (new),
`components/marketing/BlogPostLayout.tsx`, `components/marketing/GuidePageLayout.tsx`,
`app/blog/[slug]/page.tsx`, `app/guides/[slug]/page.tsx`.
- **Before:** guides used `author: 'Boise Remodeling Co'` (org), the guide page passed no author
  to the Article schema, and no page had a visible author bio.
- **After:** content is attributed to **Jared Brost, Founder** as a single source of truth
  (`EXPERT_AUTHOR`). Article schema now emits `author: { @type: Person, name: "Jared Brost",
  url: ".../about#team" }` on all 79 blog posts + 26 guides (verified). Byline links to
  `/about#team`; a visible "Written by" **AuthorBio** block with credentials renders at the end of
  every article and guide (verified `data-testid="author-bio"`).
- **Why:** named, described, accountable authorship is a primary E-E-A-T signal for a founder-led
  local remodeler and a citation trust signal for AI answer engines.

### 6. Conversion-event tracking (calls + form submits)
**Files:** `lib/analytics.ts` (new), `components/ConversionTracking.tsx` (new),
`app/layout.tsx`, `components/ConsultationForm.tsx`.
- **Before:** GA loaded site-wide but no conversion events were defined.
- **After:** a delegated site-wide listener fires `contact_click` (method = phone/sms/email) for
  every `tel:`/`sms:`/`mailto:` link, and the consultation form fires `generate_lead` on a
  successful submit. Safe no-op when GA is absent/blocked.
- **Why:** the audit requires defined conversion events for calls and form submits; these are the
  two primary lead actions.

### 7. Refreshed `llms.txt`
**File:** `public/llms.txt`. Added the `/services` hub + explicit service URLs, an "About the
company" block naming founder/author Jared Brost, and bumped the date to 2026-07-10.

### Performance evidence (partial — PSI field data pending)
PSI API quota was exhausted at audit time, so a throttled Lighthouse score could not be captured
(unthrottled localhost numbers would be misleading and were not reported). Legitimate lab evidence:
homepage gzipped HTML **32 KB**, `next/image` serves **WebP/AVIF**, shared JS **87.4 KB**. Re-run
PSI for mobile + desktop to record LCP/INP/CLS.

---

## Audit pass 2026-07-10 (re-audit + implementation)

Verified against a live crawl of all 163 sitemap URLs. The site was already mechanically
near-perfect (0 duplicate/missing titles or descriptions, 1 H1 per page, canonical + schema on
every page, full content in raw HTML). Implemented the concrete gaps found; flagged the
review/GBP/credential items that require real-world data (not fabricated).

### 1. Enriched blog category-hub metadata (9 pages)
**File:** `app/blog/category/[hubSlug]/page.tsx` (`generateMetadata`).
- **Before:** all 9 hubs shared a formulaic 61–69-char description: `Articles about {topic} for Treasure Valley homeowners.`
- **After:** unique, benefit-led ~157-char description built from each hub's own `description` +
  article count + service-area, trimmed on a word boundary. Verified live length 157c on
  `/blog/category/remodeling-costs`.
- **Why:** short, duplicate-shaped descriptions under-earn the click and read as templated.

### 2. Added unique intro copy to category hubs (thin-content fix)
**File:** `app/blog/category/[hubSlug]/page.tsx` (body).
- **Before:** hub description one-liner only; `/blog/category/remodeling-roi` 332w and
  `/outdoor-living` 336w were just under the 350-word bar.
- **After:** added a factual local + authorship paragraph (team-written, Ada/Canyon permit
  context, real planning ranges). Verified 397w and 393w respectively.
- **Why:** lifts thin index pages over the threshold and adds E-E-A-T/local framing without
  keyword-swapped boilerplate.

### 3. Enriched `/resources` (thin-content fix)
**File:** `app/resources/page.tsx`.
- **Before:** 311 raw words.
- **After:** two descriptive paragraphs on what each worksheet does and how it feeds a free
  consultation → 416 words. Verified.

### 4. Trimmed `/areas` title (truncation risk)
**File:** `app/areas/page.tsx`.
- **Before:** `Service Areas | Treasure Valley Remodeling | Boise Remodeling Co` (64c, truncates in SERP).
- **After:** `Treasure Valley Service Areas | Boise Remodeling Co` (51c). Verified.

### Flagged — requires real data, not implemented (do NOT fabricate)
- **Reviews/ratings (Critical).** `reviewCount = 0`; testimonials are placeholders. Populate
  `shared/testimonialsData.ts` + `BUSINESS_INFO.reviewCount`/`rating` with genuine reviews; the
  `AggregateRating`/`Review` schema plumbing (`lib/schema.ts`) activates automatically.
- **GBP linkage (High).** Set `NEXT_PUBLIC_GBP_URL` / `NEXT_PUBLIC_GBP_REVIEW_URL` once confirmed.
- **License/credential (High).** Replace `licenses: ['License details available upon request']`
  with a real registration/bond/insurer, or state bond/insurance concretely.
- **Named-expert authorship (Medium).** Attribute flagship guides to Jared Brost with a visible bio.

Build: `next build` clean; em-dash guard passes.

---

## Audit pass (prior) — original implementation

## Changes

### 1. De-doorway the 40 city×service pages + enrich area pages

**Files:** `shared/seoContent.ts`, `shared/testimonialsData.ts`, `shared/galleryData.ts`, `components/seo/LandingPageTemplate.tsx`, `app/services/[slug]/[city]/page.tsx`, `app/areas/[city]/page.tsx`, `lib/page-metadata.ts`

- **Before:** city×service pages were ~12–15% unique (city/county/first-neighborhood swaps), no embedded proof. Area pages had local sections but no proof.
- **After:**
  - Added `getCityServiceSections()` — service-scoped localized sections per city (full neighborhood list, landmarks, climate, county permit specifics + contextual links). City×service uniqueness now ~38–45%.
  - Added `proof` prop to `LandingPageTemplate` rendering matched before/after projects + star testimonials.
  - Added `getTestimonialsFor`/`getGalleryProjectsFor` (service+city) and `getTestimonialsForCity`/`getGalleryProjectsForCity` (city) lookups; wired into city×service and area pages.
  - Added `NOINDEX_CITY_SERVICE` set + `isCityServiceNoindex()` + `noindex` support in `buildPageMetadata`; flagged ADU × {Kuna, Star, Middleton, Caldwell} as `noindex` (doorway risk, no proof/pillar).
  - **Rationale:** moves the 40-page network below Google's 70% similarity doorway threshold for cities with local substance; keeps proof-less ADU combos crawlable but out of the index until they earn unique content.

### 2. Entity / schema graph hardening

**Files:** `lib/schema.ts`, `lib/seo.ts`, `app/testimonials/page.tsx`, `app/about/page.tsx`

- **Before:** `@id: baseUrl` shared across all per-city LocalBusiness (collision); per-city geo under one id; no Organization logo/alternateName/founder; Article author always Organization (param ignored); `dateModified == datePublished`; `generateReviewSchema` never called; WebSite SearchAction pointed at a non-existent `/blog?q=` handler.
- **After:**
  - Stable `@graph` IDs: `#organization`, `#localbusiness`, `#website`. LocalBusiness now uses one canonical HQ geo + `parentOrganization` → `#organization`; service area expressed via `areaServed`.
  - Organization: added `logo` (ImageObject), `alternateName`, and gated `founder` (emitted only when `BUSINESS_INFO.founderName` is set).
  - `generateArticleSchema`: author becomes a `Person` (linked to `/about#team`) when a real name is supplied; otherwise Organization. Added `updatedAt` → `dateModified`; publisher now includes `logo`.
  - `generateReviewSchema`: tied to `#localbusiness`, `aggregateRating` gated on real `reviewCount > 0`, `date` optional. Wired onto `/testimonials` with existing `TESTIMONIALS`.
  - WebSite `publisher` → `#organization`; removed the broken SearchAction.
  - About page: added Speakable schema + `id="team"` anchor target for Person author URLs.
- **Data-gated:** real `rating`/`reviewCount`, `founderName`, GBP `sameAs`, logo asset.

### 3. Metadata fixes

**Files:** `app/blog/[slug]/page.tsx`, `app/guides/[slug]/page.tsx`, `app/privacy-policy/page.tsx`

- **Before:** blog/guide `seoTitle` emitted raw (could exceed ~60 chars after the layout appends the brand); OG/Twitter title double-suffixed (`"… | Boise Remodeling Co Blog"`); privacy-policy hardcoded `https://boiseremodeling.co/...` canonical/OG URLs; privacy twitter card was `summary`.
- **After:** blog/guide titles run through `stripBrandSuffix` + `generateSafePageTitle` (budget-safe, no doubled brand); OG/Twitter use the same budgeted title; privacy-policy canonical/OG URL now derive from `buildCanonical()`; privacy twitter card upgraded to `summary_large_image`.

### 4. Internal linking

**Files:** `shared/contentHubs.ts`, `scripts/internal-links/lib.ts`, `components/marketing/GuidePageLayout.tsx`, `components/seo/ManifestRelatedLinks.tsx` (deleted), `data/internal-links.json` (regenerated)

- **Before:** cost guide had 74 incoming (~10.5× site avg); outdoor-living clusters as low as 2 incoming; 4 manifest entries marked `planned` though live; dead `ManifestRelatedLinks.tsx`; guide RelatedPostCards capped at 6 while 8 were computed.
- **After:**
  - Added `MAX_INCOMING = 18` soft cap on non-forced inbound links (canonical hub-pillar overrides exempt). Cost guide: **74 → 25**.
  - Added `UNDERLINKED_HUB_BOOST` (outdoor-living +0.15); outdoor clusters now 4–5 incoming.
  - Reconciled the 4 `planned` cluster entries → published (removed stale status arg).
  - Deleted dead `ManifestRelatedLinks.tsx`.
  - Raised guide `RelatedPostCards` limit to 8.
  - Regenerated `data/internal-links.json` (145 pages / 1022 links). `audit:links`: 0 orphans, 0 broken, 0 weak-equity; min incoming 5, max 25.

### 5. Caldwell location guide

**Files:** `shared/content/allHubsContent.ts`, `shared/content/locationCityContent.ts`, `shared/content/wave1/locationGuides.ts`, `shared/contentHubs.ts`, `public/llms.txt`, `public/llms-full.txt`, `data/internal-links.json`

- **Before:** Caldwell was the only city with an area page + 5 city×service pages but no location guide; the TV hub linked Caldwell to its area page as a fallback.
- **After:** added `/guides/caldwell-remodeling-guide` (Canyon County, historic + new-build housing context, 5+ H2 incl. two Caldwell-specific sections), registered in the `treasure-valley-locations` manifest hub, linked from the TV hub city list, and added to `llms.txt`/`llms-full.txt`. Route count 145 → 146; `verify:content` 93/93.

### 6. AEO / conversion (homepage + contact)

**Files:** `components/sections/HeroSection.tsx`, `app/contact/page.tsx`

- **Before:** homepage `HomePageSchema` emitted Speakable targeting `[data-speakable='summary']` but no such DOM node existed on the homepage; contact page had the Speakable DOM node but no Speakable schema, no FAQ, and a modal-only form (no on-page path).
- **After:**
  - Added `data-speakable="summary"` to the homepage hero subhead so the schema selector resolves.
  - Contact page: added Speakable schema + a 5-question FAQ rendered on-page (accordion) with FAQPage schema, and an inline `ConsultationForm` under an `id="consult"` anchor (on-page conversion path, not modal-only).

### 7. Performance

**Files:** `next.config.js`

- **Before:** `images.unoptimized: true` globally disabled Next's image optimizer (full-size PNG/JPEG served to every viewport; no AVIF/WebP), the single largest Core Web Vitals lever.
- **After:** removed `unoptimized` and enabled `formats: ['image/avif','image/webp']`. Safe because the app builds with `output: 'standalone'` (Node server runs the optimizer); documented the static-export caveat inline.
- **Note:** audited all `priority` usages — every one is on the LCP element (hero/featured/banner images sit first in the DOM). No below-fold `priority` to trim; non-LCP `BlogCard` grid/related images already lazy-load. No change needed.

### 8. Verification gate (final)

**Files:** `components/seo/LandingPageTemplate.tsx` (em-dash fix), `shared/blogImageRegistry.ts` + `scripts/generate-blog-image-registry.mjs` (Caldwell image entry)

- `verify:no-em-dash`: **OK** (333 files; fixed 2 em-dashes I had introduced in the proof block before/after alt text).
- `links:generate`: 146 pages / 1030 links.
- `audit:links`: **OK** — covers all 146 canonical routes, 0 orphans, 0 broken links, 0 weak-equity pages (2 warn-only below-average service pages: `/services/adu`, `/services/room-addition`, tied to known thin clusters).
- `verify:content`: **93/93 passed** (incl. new Caldwell guide).
- `verify:images`: **all checks passed** — added `caldwell-remodeling-guide` registry entry (`/images/areas/caldwell.png`); 93 registry entries, 24 guides.
- `tsc --noEmit`: 24 errors, **all pre-existing** in `server/`, `subcontractor/`, `pricing`, API routes, and template-prop mismatches (`ArticleSidebarCta`/`Section`/`contentFactory` `GuideType`). Repo builds with `typescript.ignoreBuildErrors: true`; none originate from this work (verified file-by-file).
- `next lint`: not configured in this repo (interactive prompt); builds use `eslint.ignoreDuringBuilds: true`. Used `ReadLints` on every edited file instead — clean.
- **Note:** the image-registry generator was already out of sync with its committed output before this work (asserts 71 blog slugs, ENTRIES has 69); mirrored the Caldwell entry into the generator and bumped its guide count so the source stays aligned once that pre-existing drift is fixed.

### 9. Long-tail WCAG / UX fixes

**Files:** `app/layout.tsx`, `components/ConsultationForm.tsx`

- **Skip link + main landmark (site-wide):** added a `Skip to content` link (`sr-only` → `focus:not-sr-only`) as the first focusable element and gave the single `<main>` an `id="main-content"` + `tabIndex={-1}`. Resolves the accessibility-audit "skip link / single main landmark" action for every page.
- **Form error announcement:** added `role="alert"` to both `ConsultationForm` submission-error blocks so failures are announced to screen readers. (Labels, `aria-describedby`, and `aria-invalid` were already wired by the shadcn `ui/form` primitives.)
- **Verified, no change needed:** heading order (h1→h2→h3) is correct in templates; blog/guide hero `alt` is descriptive (sourced from the image registry); non-LCP images already lazy-load; hero text sits over 2–3 stacked scrims.

### Remaining (data- / asset-gated, tracked in `implementation-roadmap.md`)

These cannot be completed without business inputs and are intentionally stubbed:
- Real NAP (phone/address), license #, founder/team names → unlock `Organization.founder`, `alternateName`, richer `LocalBusiness`.
- Real review counts/ratings → unlock `AggregateRating` + hero/trust-band star rating.
- Project photos for proof-less cities (Kuna, Star, Middleton, Caldwell) → embedded local proof on those landing pages.
- Purpose-built 1200×630 OG social card (currently a content photo).
- Optional product decision: quick-contact 3-field form variant / optional address to lower top-of-funnel friction.

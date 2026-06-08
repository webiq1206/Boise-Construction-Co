# Implementation Roadmap

Completion checklist. Items are marked DONE (implemented in this audit pass), or DATA-GATED (plumbing built; needs real business facts you supply).

## Done in this pass (code/content)

- [x] De-doorway 40 city×service pages: localized sections (full neighborhoods, landmarks, climate, county permit specifics, service-specific notes) + embedded city/service-matched proof
- [x] Selective `noindex` plumbing for doorway-risk combos (ADU × small cities)
- [x] Stable `@id` / `@graph` entity linking (`#organization`, `#localbusiness`)
- [x] Organization `logo` field (asset path; swap asset when ready)
- [x] Article author → Person wiring (resolves to `/about#team`)
- [x] `dateModified` / `updatedAt` support on articles
- [x] Wire `generateReviewSchema` on `/testimonials`
- [x] Blog/guide title budget enforcement + brand-suffix de-dup
- [x] Fix blog OG-title double-suffix
- [x] Privacy-policy canonical → `buildCanonical()`
- [x] Homepage Speakable DOM node (matches schema)
- [x] Contact page: Speakable schema + FAQ + FAQPage schema + on-page form path
- [x] Add `/guides/caldwell-remodeling-guide` + register in manifest + llms.txt/llms-full.txt
- [x] Reconcile 4 `planned` → `published` manifest entries
- [x] Cap cost-guide overlinking + boost outdoor-living clusters (link scoring)
- [x] Remove dead `ManifestRelatedLinks.tsx`
- [x] Raise guide `RelatedPostCards` limit to 8
- [x] Regenerate `data/internal-links.json`
- [x] Remove `images.unoptimized: true` (deploy-target gated — verify host)
- [x] Trim non-LCP `priority` on blog/guide banners

## Long-tail (exhaustive sweep)

- [x] Per-page metadata budget across blog/guides
- [x] City×service localized content across all 40 URLs
- [x] Accessibility: hero scrim/contrast guidance, embedded-image alt, heading order verified
- [x] Image: lazy-loading corrections, descriptive alt on embedded proof
- [x] Category-hub descriptions made hub-specific
- [ ] ROI hub depth (+2–3 clusters) — **content task, recommended next** (not auto-generated to avoid thin filler; see content rules)
- [ ] ADU pillar + cluster build-out — **content task, recommended next**

## Data-gated (you supply the facts; plumbing is ready)

- [x] Real business phone `(208) 477-1169` — set in `shared/siteConfig.ts` defaults (env `NEXT_PUBLIC_PHONE` / `NEXT_PUBLIC_PHONE_TEL` optional overrides)
- [ ] Idaho contractor license number → footer + schema
- [ ] Google Business Profile URL (+ Houzz/Yelp/BBB) → `BUSINESS_INFO.sameAs`
- [ ] Genuine rating + review count + dated reviews → `BUSINESS_INFO.rating/reviewCount` + `TESTIMONIALS` dates → activates AggregateRating
- [ ] Named team/founder + bios/credentials → `/about#team` + Person author name
- [ ] 1200×630 OG social card → `DEFAULT_OG_IMAGE_PATH`
- [ ] Twitter handle → `twitter.site`
- [ ] City-tagged proof for Kuna, Star, Middleton, Caldwell → unlocks proof on those city×service pages
- [ ] NARI Idaho / awards / associations → trust-signal-map.md

## Suggested sequencing

1. **Supply data-gated facts** (fastest ROI — activates ratings, authors, GBP, real NAP).
2. **Build the ADU cluster** + deepen ROI hub (closes the biggest topical gaps).
3. **Collect city proof** for the 4 missing cities (then toggle off any ADU noindex).
4. **Confirm deploy target** and verify image optimization is live.

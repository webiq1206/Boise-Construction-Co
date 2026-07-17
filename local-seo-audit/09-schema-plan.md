# 09 - Schema Markup Plan

## Inventory (verified in `lib/schema.ts` + usage grep)

Present and correctly wired: LocalBusiness/HomeAndConstructionBusiness (stable `@id` graph), Organization, WebSite, Service, FAQPage, BreadcrumbList, Article (with Person-author plumbing), Review (testimonials page), HowTo (permit flow), CollectionPage, WebPage, Speakable. The `@graph` entity linking (`#organization` / `#localbusiness` / `#website`) is better than most competitor sites. AggregateRating and founder are correctly *gated* pending real data.

No invalid schema found. The issues are accuracy and completeness, not validity.

## Fix 1 - Geo/locality contradiction (implemented this pass)

`generateLocalBusinessSchema()` emits `geo` = **Kuna** coordinates (43.4913, -116.4201) while `address.addressLocality` = **Meridian**. Two different cities in one entity. Cause: the business HQ moved from Kuna; the constant was never updated.

```json
"geo": { "@type": "GeoCoordinates", "latitude": 43.6121, "longitude": -116.3915 }
```
(Meridian coordinates, matching the NAP locality.) Single geo for the single `@id` is correct for an SAB - do NOT emit per-city geo under one @id (the June audit's reasoning stands).

## Fix 2 - areaServed entity disambiguation (implemented this pass)

`areaServed` cities are bare `{"@type":"City","name":"Boise"}` nodes. Adding `sameAs` Wikipedia URLs disambiguates them for knowledge-graph matching (Boise ID vs any other Boise) - cheap, high-value for GEO:

```json
{ "@type": "City", "name": "Boise", "sameAs": "https://en.wikipedia.org/wiki/Boise,_Idaho" }
```
All 8 cities have stable Wikipedia entries.

## Fix 3 - Founder Person (implemented this pass)

`BUSINESS_INFO.founderName = ''` gates the founder entity off. Owner the owner is already publicly associated with the business (permit records, ProMatcher). Anonymity provides zero privacy and costs EEAT. Set `founderName: 'the owner'` → emits:

```json
"founder": { "@type": "Person", "name": "the owner", "url": "https://boiseremodeling.co/about#team" }
```
Requires the matching on-page `/about#team` section (see 11-eeat-audit.md - implemented together so schema and page agree).

## Fix 4 - knowsAbout for topical entity signals (implemented this pass)

Add to Organization: `knowsAbout`: kitchen remodeling, bathroom remodeling, whole-home renovation, room additions, accessory dwelling units, design-build construction, Ada County building permits, Canyon County building permits. Directly machine-readable topical authority claim, consumed by generative engines.

## Fix 5 - sameAs expansion (data-gated, structure ready)

Currently only Facebook + Instagram. As each citation from 07-nap-citations.md goes live, append to `BUSINESS_INFO.sameAs`: GBP listing URL (most important - the entity reconciliation signal), Bing Places, Apple Maps, Houzz, Yelp, BBB, Nextdoor.

## Fix 6 - dateModified usage (implemented this pass)

`generateArticleSchema` supports `updatedAt` but no content sets it. Every post/guide expanded in this audit pass gets `updatedAt: '2026-06-10'`, signaling freshness for the refreshed content.

## Gated items (do NOT implement until data exists)

- `aggregateRating`: activates automatically when `BUSINESS_INFO.rating/reviewCount` are set from genuine Google reviews (08-review-strategy.md). Never fake.
- License/credential properties (`hasCredential`): once the Idaho contractor registration number is published on-site (11-eeat-audit.md).
- VideoObject: no video assets exist; add when project videos are produced.

## Not recommended

- Per-page LocalBusiness on all 166 URLs (current model - LocalBusiness on home/contact/areas, Service schema on service pages - is correct)
- SearchAction (correctly removed; no on-site search)
- Fabricated Review schema beyond the real testimonials

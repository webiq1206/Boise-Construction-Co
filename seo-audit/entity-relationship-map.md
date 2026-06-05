# Entity Relationship Map

Existing / missing / weak / redundant relationships, with recommendations.

## Existing relationships (strong)

| From | To | Mechanism |
|---|---|---|
| Organization | Services | `hasOfferCatalog` + 5 service pages |
| Service | Pillar guide | hub registry (`CONTENT_HUBS`) |
| Pillar | Cluster posts | forced manifest links (score 999) |
| Service | City pages | 40 `/services/[slug]/[city]` |
| Service hub | All 8 cities | `RelatedLinks` (service→cities) |
| Area page | All 5 services | `RelatedLinks` (area→services) |
| City×service | Nearby cities + sibling services | `RelatedLinks` |
| Blog/guide | Pillar + services + areas | content-embedded + manifest |
| Organization | Service area cities | `areaServed` (City entities) |

## Missing relationships

| From | To | Why it matters | Action |
|---|---|---|---|
| Organization | Named People | E-E-A-T author/founder trust | Person plumbing wired; **names data-gated** |
| Article | Person author | Author authority for AI/Google | `generateArticleSchema` now accepts Person; **name data-gated** |
| Organization | Google Business Profile | Local entity reconciliation | add GBP URL to `sameAs` (**data-gated**) |
| LocalBusiness | Reviews (marked up) | Rich-result eligibility | `generateReviewSchema` wired on `/testimonials` |
| City×service page | Local proof | Local relevance + conversion | testimonial/gallery embedding added |
| City | Location guide (Caldwell) | Geographic authority completeness | Caldwell guide added |
| Organization | Logo (ImageObject) | Brand/publisher identity | add `logo` (**asset-gated**) |

## Weak relationships

| Relationship | Weakness | Action |
|---|---|---|
| City → Local proof | Only 4/8 cities have any testimonial/project | embed where present; flag proof-less cities |
| Service → ADU pillar | ADU has no dedicated pillar guide | content-gap item (see content-gap-analysis.md) |
| Outdoor-living clusters → site | 2 posts at only 2 incoming links | link-boost in `scripts/internal-links/lib.ts` |
| Cost guide ← rest of site | over-connected (74 incoming) — dilutes equity | cap incoming |

## Redundant / risky relationships

| Relationship | Issue | Action |
|---|---|---|
| Per-city LocalBusiness `@id` | All share `@id: baseUrl` → entity confusion | stable `@id` strategy |
| Area H1 vs city×service H1 | Overlapping "[remodel] [city]" semantics | sharpen via distinct local depth (done) |
| `ManifestRelatedLinks.tsx` | Dead code, never imported | remove |

## Recommended `@graph` linking

Tie Organization, WebSite, and LocalBusiness into a single `@graph` with stable IDs:
- `#organization` — the brand entity (logo, sameAs, founder)
- `#website` — `publisher` → `#organization`
- `#localbusiness` — `parentOrganization` → `#organization`; per-city pages reference the same business with `areaServed` rather than minting conflicting coordinates under one ID.

Detailed schema in [schema-map.md](schema-map.md).

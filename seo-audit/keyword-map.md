# Keyword Map: Boise Construction Co

Replaces the earlier remodeling keyword map that was copied into this repo. The business is a residential home builder (design-build, custom, semi-custom, build-on-your-lot). Volumes come from the Ahrefs pull recorded in `keyword-research-boise-2026-08.md`.

## Primary targets

| Page | Primary keyword | Secondary | Intent |
|---|---|---|---|
| `/` | custom home builder boise | boise construction, boise home builders, treasure valley home builders, new home construction boise | commercial-local head |
| `/services/custom-home-builder` | custom home builder boise | custom home builders boise idaho | commercial head |
| `/services/semi-custom-homes` | semi custom homes boise | semi-custom home builder idaho | commercial head |
| `/services/build-on-your-lot` | build on your lot boise | build on your own land idaho | commercial head |
| `/services/design-build` | design build home builder boise | design build homes idaho | commercial head |
| `/services/shop-homes-barndominiums` | barndominium builders idaho (vol 30, KD 0) | shop home builder idaho | commercial head, easy win |
| `/areas/{boise,meridian,eagle,nampa}` | home builders {city} idaho | {city} custom home builder | transactional-local |
| `/guides/boise-home-building-cost-guide` | cost to build a house in boise | custom home cost per square foot boise | informational |

## Indexing rule for city x service pages

Only an allowlist is indexable (see `lib/page-metadata.ts`): the four core build services in Boise, Meridian, Eagle, and Nampa; plans/design, additions, lot evaluation, and energy-efficient homes in Boise and Meridian; and shop homes in Meridian, Eagle, Nampa, and Kuna. That is 28 pages. Everything else is `noindex, follow` and out of the sitemap until it earns unique proof.

## Positioning note

The head term "boise construction" mixes news, jobs, and commercial contractors. The site is a residential builder, so it targets buyer-intent home-building terms first. The brand name, the hero eyebrow ("Boise Residential Construction"), and the homepage description tie the entity to the head term without claiming commercial work.

## Next steps

1. Re-pull volumes after the site has been indexed for a quarter.
2. Track weekly from a Boise location: custom home builder boise, home builders boise, boise construction, barndominium builders idaho.
3. Earn local links (builders association, lenders, land sellers, local press) and real reviews.

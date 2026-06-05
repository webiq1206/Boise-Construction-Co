# Keyword Map

Primary/secondary/intent mapping per page type, plus cannibalization analysis.

## Intent classes

- **Transactional / commercial-local:** "[service] [city]", "remodeling contractor [city]"
- **Commercial head:** "[service] treasure valley / boise"
- **Informational:** cost, process, comparison, how-to, ROI (blog/guides)
- **Navigational:** brand terms

## Page-type keyword targets

| Page | Primary | Secondary / semantic | Intent |
|---|---|---|---|
| `/` | boise remodeling company, treasure valley design-build | remodel contractor boise, design-build remodel | commercial / navigational |
| `/services/kitchen-remodel` | kitchen remodeling boise idaho | kitchen renovation treasure valley, kitchen remodel cost | commercial head |
| `/services/bathroom-remodel` | bathroom remodeling boise idaho | bathroom renovation, primary bath remodel | commercial head |
| `/services/whole-home-remodel` | whole home remodeling boise idaho | full home renovation treasure valley | commercial head |
| `/services/room-addition` | home additions boise idaho | room addition, in-law suite, bonus room | commercial head |
| `/services/adu` | adu construction boise idaho | guest house, accessory dwelling unit boise | commercial head |
| `/services/[slug]/[city]` | [service] [city] idaho | [service] near me, [service] [neighborhood] | transactional-local |
| `/areas/[city]` | remodeling contractor [city] idaho | [city] remodeler, home renovation [city] | transactional-local |
| `/guides/*-cost-guide` | boise remodeling cost | [service] cost boise, remodel budget idaho | informational |
| `/guides/[city]-remodeling-guide` | remodeling [city] idaho guide | [city] home renovation guide | informational-local |
| `/blog/*` | long-tail informational (cost/process/comparison/ROI) | — | informational |

## Cannibalization analysis

The hub-and-spoke architecture is deliberate, but three overlap risks exist:

### 1. Area page vs. city×service page (MODERATE)
- `/areas/boise` H1: "Remodeling Contractor in Boise, Idaho"
- `/services/kitchen-remodel/boise` H1: "Kitchen Remodel in Boise, Idaho"
- **Risk:** Both can compete for "remodeling boise" semantics. Mitigation: area page targets the *contractor/brand-in-city* query; city×service targets *service+city*. After this pass the city×service pages carry distinct service-specific local depth, sharpening the split. **Keep both.**

### 2. Service hub vs. its 8 city children (LOW–MODERATE)
- Parent targets the regional head term ("kitchen remodeling treasure valley"); children target "[service] [city]". Canonical hierarchy is clear and children are long-tail. **Low risk** now that children have unique local substance.

### 3. City×service pages vs. each other (was MODERATE)
- 8 near-identical pages per service was the main intra-cluster duplication risk. Addressed by per-city localized sections + proof. Residual risk only on proof-less small cities (Star, Middleton) — see [doorway-page-analysis.md](doorway-page-analysis.md).

## Keyword gaps (see content-gap-analysis.md)

- "remodeling [city] cost" for cities lacking a location guide (esp. **Caldwell** — now added).
- Comparison/definition long-tails in the **ROI hub** (thinnest at 6 clusters).
- "ADU cost [city]" / "ADU rules [city]" — ADU city×service pages lack city-specific ordinance long-tails.

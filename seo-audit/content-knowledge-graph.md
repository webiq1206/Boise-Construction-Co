# Content Knowledge Graph

A visual + structural map of how the business, services, locations, content, and proof relate.

## Entity graph (current + recommended)

```mermaid
graph TD
  Org["Organization: Boise Remodeling Co LLC"]

  Org --> SvcCat["Service categories"]
  Org --> Areas["Service area: Treasure Valley (8 cities)"]
  Org --> Trust["Trust signals"]
  Org --> Team["Team / People (GAP - no named people)"]

  SvcCat --> K["Kitchen Remodel"]
  SvcCat --> B["Bathroom Remodel"]
  SvcCat --> W["Whole-Home Remodel"]
  SvcCat --> RA["Room Addition"]
  SvcCat --> ADU["ADU / Guest House"]

  K --> KPillar["Pillar: boise-kitchen-remodeling-guide"]
  K --> KCity["8 city x kitchen pages"]
  KPillar --> KClusters["8 kitchen cluster posts"]

  Areas --> Ada["Ada County: Boise, Meridian, Eagle, Kuna, Star"]
  Areas --> Canyon["Canyon County: Nampa, Middleton, Caldwell"]
  Ada --> AreaPages["/areas/[city] pages"]
  Canyon --> AreaPages
  AreaPages --> CityGuides["Location guides (Caldwell now added)"]

  Trust --> Reviews["Testimonials (4, city-tagged)"]
  Trust --> Projects["Gallery projects (5, city-tagged)"]
  Trust --> Lic["License (GAP - 'upon request')"]
  Trust --> Rating["AggregateRating (GAP - zeroed)"]

  KCity -.embed.-> Reviews
  KCity -.embed.-> Projects
  KCity --> Contact["Conversion: /contact, estimator"]

  CostPillar["Pillar: boise-remodeling-cost-guide"] --> AllClusters["Cost clusters"]
  K --> CostPillar
  B --> CostPillar
  W --> CostPillar
```

Dashed `embed` edges (testimonials/projects → city×service pages) are **new** in this pass — previously proof was not surfaced on landing pages.

## Knowledge ecosystem layers

1. **Brand layer** — Organization entity (homepage/about). Needs `logo`, `alternateName`, GBP `sameAs`, named people.
2. **Service layer** — 5 services, each with a pillar guide + cluster posts + 8 city pages.
3. **Geographic layer** — 8 cities (Ada/Canyon split), area pages + location guides.
4. **Proof layer** — testimonials + gallery + (gated) reviews/ratings.
5. **Conversion layer** — estimator, consult CTA, contact.

## Relationship inventory (summary)

| Relationship | State |
|---|---|
| Company → Services | Strong (hasOfferCatalog + service pages) |
| Service → Pillar guide | Strong (10 hubs) |
| Pillar → Clusters | Strong (forced manifest links) |
| Service → City pages | Strong (40 pages) |
| City → Local proof | **Weak → improving** (embedding added; only 4/8 cities have proof data) |
| Company → People | **Missing** (no Person entities) |
| Company → GBP/Google | **Missing** (no sameAs) |
| Service → Reviews (marked up) | **Missing → fixed** (Review schema wired) |

Detailed breakdown in [entity-relationship-map.md](entity-relationship-map.md).

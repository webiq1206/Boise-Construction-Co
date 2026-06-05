# AI Search Readiness Analysis

Can AI systems confidently understand and cite this site?

## Can AI clearly understand…?

| Question | Answer | Evidence / gap |
|---|---|---|
| The business? | Mostly | Organization + LocalBusiness schema; **placeholder phone**, no GBP, no logo |
| Services? | Yes | 5 services, Service schema, OfferCatalog, pillar guides |
| Service categories? | Yes | 10 content hubs |
| Locations? | Yes | 8 cities, areaServed, location guides (Caldwell added) |
| Trust signals? | Weak | no ratings, anonymous authors, "license upon request" |
| Project examples? | Partial | 5 gallery projects, short descriptions, 4/8 cities |
| Expertise signals? | Weak | no named experts/credentials |

## Are entities & relationships clear?

| Check | State |
|---|---|
| Entities clearly defined | Org/Service/Location yes; People no |
| Relationships established | service↔city↔content strong; org↔people↔reviews weak |
| Authority demonstrated | thin (no ratings, no named expertise) |
| Supporting content exists | strong for 4 services; ADU thin |
| AI can confidently cite | **Partially** — content is citable; authority/trust signals limit comparative citation |

## Citation confidence by query type

| Query type | Confidence | Why |
|---|---|---|
| "kitchen remodel cost Boise" | HIGH | deep cost content + tables + Quick Answer |
| "remodeling process steps" | HIGH | process hub + HowTo |
| "ADU rules in Boise" | LOW→MED | thin ADU content (gap) |
| "best remodeler in Boise" | LOW | no ratings/awards/named authority vs competitors |
| "remodeling contractor Caldwell" | MED (was LOW) | Caldwell guide added |

## Improvements made this pass

1. Localized, factual city×service sections → more citable local facts.
2. Caldwell location entity completed.
3. Speakable fixed (home/contact) → reliable summary exposure.
4. Review schema wired → social proof becomes machine-readable (value gated).
5. Stable `@graph`/`@id` entity linking → cleaner entity reconciliation.

## To reach high citation confidence (data-gated)

- Real aggregate rating + dated reviews.
- Named, credentialed experts (author/founder).
- GBP + third-party profile linkage (`sameAs`).
- Published license number + associations/awards.

These convert the site from "clearly understood" to "confidently citable as an authority," especially for comparative/"best" queries where competitors currently win on visible trust signals.

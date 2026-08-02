# Content brief: Boise Construction Co blog posts

Authoring brief for the new-residential-construction content library. Every
article written for this site must satisfy everything below. This file is the
contract between the content and the rest of the codebase; when a number here
disagrees with an article, the article is wrong.

## The company

- **Name:** Boise Construction Co (never "Boise Remodeling Co", never "BCC")
- **What it is:** a locally owned design-build **home builder**. It builds new
  houses. It is not a remodeler and must never be described as one.
- **Where:** Boise, Idaho. Serves Boise, Meridian, Eagle, Nampa, Kuna, Star,
  Middleton, and Caldwell, across Ada and Canyon County.
- **Since:** 2020. Bonded and insured. Idaho contractor registration on request.
- **Author byline for all posts:** `Boise Construction Co`

### Claims that are true and may be used

- One accountable team from design through to handover (design-build).
- A line-item budget before we break ground.
- Allowances set at what things actually cost here, not at a number chosen to
  win the bid.
- A published draw schedule.
- A written progress update every week.
- Permits, plan review, engineering, and utility applications handled in-house
  for Ada and Canyon County.
- A one-year workmanship warranty after possession.

### Claims that are forbidden

- Any specific count of homes built, years in business beyond "since 2020",
  award, certification, rating, or membership.
- Any named client, testimonial, review, or quotation from a customer.
- Any specific completed project presented as ours.
- "Licensed" as a bare claim. Idaho registers residential contractors rather
  than licensing them. Use "bonded and insured" and "Idaho contractor
  registration available on request".

## Published cost figures

These appear on service pages and are reproduced by the estimator. **Use these
exact bands.** Do not invent others, do not round them differently, and do not
quote a national average as though it were local.

| Subject | Figure (2026, excluding land) |
| --- | --- |
| Custom home | $250 to $400 per finished square foot |
| Custom home, 2,400 sq ft | $600,000 to $960,000 |
| Simple single-level on a flat valley lot | near $225 per square foot |
| Foothills sites, steep grade, high detail | regularly above $450 per square foot |
| Semi-custom home | $225 to $300 per finished square foot |
| Semi-custom, 2,000 sq ft | $450,000 to $600,000 |
| Vertical construction on an owned lot | $225 to $400 per finished square foot |
| Site work, serviced subdivision lot | $25,000 to $50,000 |
| Site work, rural parcel with well, septic and access | $80,000 to $150,000 |
| Design and engineering | 5 to 12 percent of construction cost, about $9,000 to $35,000 |
| Written lot evaluation | $950 to $3,500 |
| Shop home / barndominium | $150 to $250 per square foot blended |
| Shop home, 1,600 sq ft living + 1,200 sq ft shop | $265,000 to $500,000 |
| High-performance home | $275 to $425 per finished square foot |
| Performance upgrades over code minimum | 3 to 8 percent, about $20,000 to $55,000 |

Always say costs exclude land unless the sentence is specifically about land.

## Local facts that may be used

These are the details that make the content local rather than generic. Use them
where they are relevant, and do not invent others of the same kind.

- Permits route through **Ada County** (Boise, Meridian, Eagle, Kuna, Star) or
  **Canyon County** (Nampa, Caldwell, Middleton). The two use different portals
  and different review cadences.
- Septic permitting for rural parcels goes through **Central District Health**.
- Rural Ada and Canyon parcels commonly need a well, a septic system, and
  sometimes a private road or a power extension, adding $80,000 to $150,000
  before a foundation is poured.
- Foothills building brings slope, access, geotechnical requirements, and
  wildland-urban interface considerations.
- The valley floor is largely flat, serviced, and cheaper to build on than the
  foothills.
- Idaho has no state building code adoption quirks worth asserting; do not make
  specific code-section claims.

**Do not invent:** specific fee amounts for a named jurisdiction, specific
review turnaround times in days, named subdivisions with claimed lot prices,
population or growth statistics, or any statistic attributed to a named source.
If an article needs a number that is not in this brief, write around it, or use
a range hedged with "commonly" or "typically".

## Voice

Write like a builder explaining something to a client across a table, not like a
marketing department. Specifically:

- **Answer first.** Every article and every H2 section opens with the answer,
  then explains it. No throat-clearing.
- **Concrete over abstract.** "A second storey halves your foundation and roof
  area per square foot of finished space" beats "vertical construction can offer
  efficiencies".
- **Admit trade-offs.** Say when something is not worth it, when our own answer
  is "it depends", and when the honest answer costs us the sale. This is the
  single biggest differentiator in this category and the thing readers trust.
- Plain sentences. No "elevate", "unlock", "nestled", "boasts", "dream home",
  "peace of mind", "state-of-the-art", "we pride ourselves".
- Second person for the reader, first person plural for us.
- No exclamation marks. No rhetorical question stacks. No bulleted fragments
  where a sentence would do.

## Hard technical constraints

1. **No em-dashes.** The character U+2014 fails the `verify:no-em-dash` build
   step. Use a spaced hyphen `-` or restructure the sentence. This applies to
   every field including `content`, `faqs`, and `metaDescription`.
2. **File shape.** One file per post at
   `shared/content/wave2/<slug>.ts`, exporting a single named const typed
   `BlogPostData`, imported from `'../../blogContent'`. Match the existing files
   exactly; see `shared/content/wave2/fixed-price-vs-cost-plus.ts`.
3. **Register it.** Every post must be imported and listed in
   `shared/content/wave2/index.ts`.
4. **Required fields:** `slug`, `title`, `seoTitle`, `metaDescription`,
   `excerpt`, `category`, `hubSlug`, `author`, `publishedAt`, `tags`,
   `heroImage`, `primaryKeyword`, `searchIntent`, `wordCountTarget`,
   `quickAnswer`, `keyTakeaways`, `relatedLinks`, `faqs`, `content`.
5. **`heroImage`** is `/images/blog/<slug>.webp`. The file will not exist yet;
   that is expected and handled separately.
6. **`category`** must equal the hub's `categoryLabel` exactly (see below).
7. **`seoTitle`** at most 60 characters. **`metaDescription`** 140 to 158
   characters.
8. **`quickAnswer`** is 40 to 60 words, written to stand alone away from the
   page, because answer engines lift it verbatim. It must be true on its own.
9. **`keyTakeaways`** 4 to 6 single-sentence items.
10. **`faqs`** 5 to 7 entries. Questions phrased the way someone types them.
    Answers 40 to 90 words, self-contained.
11. **`content`** is an HTML string, `.trim()`ed, 1,600 to 2,200 words. Use
    `<h2 id="kebab-slug">` for each section and `<p>` for prose. 8 to 12
    sections. `<strong>` for the answer sentence in each section. Tables are
    allowed as plain `<table>` when comparing figures.
12. **Internal links.** 4 to 8 in the body, all to paths that exist (see the
    route list below). At least one to the hub pillar guide, at least one to
    another post in the same hub, and one to `/contact` or `/#calculator` in the
    closing section.

## Pillar guides

A pillar guide is a different object from a cluster post. It lives at
`shared/content/pillars/<slug>.ts`, exports a single named const typed
`GuidePageData` imported from `'../../guideContent'`, and is collected by
`shared/content/pillars/index.ts` (generated - run
`node scripts/generate-pillar-index.mjs`).

Differences from a cluster post:

- **No `category` field.** Instead `guideType: 'hub-pillar'` (or `'master'` for
  the locations pillar).
- Extra fields: `linkedClusterSlugs` (every cluster slug in the hub, from the
  manifest in `shared/contentHubs.ts`), `linkedServices` (service slugs, no
  leading path), and optionally `linkedCities`.
- **`content` is 2,800 to 4,000 words**, 12 to 18 `<h2 id="...">` sections.
  This is the definitive page on its subject. It should be the most complete
  thing on the local web about it.
- **`faqs` 8 to 12 entries.**
- **`keyTakeaways` 5 to 7 items.**
- **Internal links: 12 to 20 in the body.** Every cluster post in the hub must
  be linked at least once from the pillar, in prose, with a descriptive anchor.
  That is what makes it a hub. Also link the relevant service pages and at
  least two other pillars.
- `wordCountTarget` does not exist on `GuidePageData`. Do not add it.
- Include a short table of contents is **not** needed; the page template
  generates one from the `<h2 id="...">` attributes, so those ids are load
  bearing and must be unique and kebab-case.

Everything else in this brief - voice, forbidden claims, cost figures, no
em-dashes, answer-first sections - applies identically.

## Hubs

| hubSlug | categoryLabel | pillar guide path |
| --- | --- | --- |
| `home-building-costs` | Home Building Costs | `/guides/boise-home-building-cost-guide` |
| `choosing-a-builder` | Choosing a Builder | `/guides/choose-home-builder-boise` |
| `home-building-process` | The Building Process | `/guides/boise-home-building-process-guide` |
| `land-and-lots` | Land & Lots | `/guides/buying-land-to-build-boise` |
| `home-design-and-plans` | Design & Floor Plans | `/guides/custom-home-design-guide` |
| `treasure-valley-locations` | Treasure Valley Locations | `/guides/treasure-valley-home-building-guide` |

## Routes that exist and may be linked

Services: `/services`, `/services/custom-home-builder`,
`/services/semi-custom-homes`, `/services/build-on-your-lot`,
`/services/design-build`, `/services/home-plans-design`,
`/services/lot-evaluation`, `/services/shop-homes-barndominiums`,
`/services/energy-efficient-homes`. Each also has a city variant, for example
`/services/custom-home-builder/meridian`.

Areas: `/areas`, and `/areas/{boise,meridian,eagle,nampa,kuna,star,middleton,caldwell}`.

Other: `/`, `/about`, `/contact`, `/#calculator`, `/estimate`, `/guides`,
`/blog`, `/resources`, `/re-10-repairs-boise`.

Blog posts: `/blog/<slug>` for any slug in the manifest in
`shared/contentHubs.ts`. Do not link to a slug that is not in that manifest.

Category hubs: `/blog/category/<hubSlug>` for the six hubs above.

**Never link to** any path containing `remodel`, `kitchen-remodel`,
`bathroom-remodel`, `testimonials`, or `whole-home`. Those are redirected or
gone, and linking to them creates a redirect hop from an internal link.

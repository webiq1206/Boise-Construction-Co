# AEO Optimization Plan (Answer Engine Optimization)

Featured snippets, People-Also-Ask, voice search, and direct-answer readiness.

## Current AEO coverage

| Signal | Blog (69) | Guides (23) | Landing (53) | Home | Contact |
|---|---|---|---|---|---|
| Quick Answer block | 100% | 100% | summary | yes | added |
| Key Takeaways | 100% | 100% | — | — | — |
| Question-style H2s | yes | yes | partial | partial | — |
| FAQ accordion (on-page) | yes | yes | yes | 8/15 | added |
| FAQPage schema | yes | yes | yes | yes (15) | added |
| Speakable schema | conditional | conditional | yes | fixed | added |
| Cost/timeline tables | where relevant | where relevant | — | — | — |
| Comparison sections | many | some | — | — | — |

## Defects fixed this pass

1. **Homepage Speakable** — schema targeted `[data-speakable='summary']` with no matching DOM node. Added the node.
2. **Contact page** — had Speakable DOM but emitted no Speakable schema, and no FAQ. Added Speakable schema + FAQ + FAQPage schema.

## Answer-format coverage

| Format | Where it lives | Verdict |
|---|---|---|
| Direct answers | Quick Answer blocks | Strong |
| Definitions | guide intros | Good |
| Steps / process | process hub, HowTo on permit flow | Strong |
| Cost ranges | cost hub + tables | Strong |
| Comparisons | dedicated comparison posts | Good |
| Expectations / timelines | timeline tables, service pages | Good |

## Voice search

- Speakable schema now consistent across home, contact, landing, blog, guides.
- Quick Answer blocks are concise and read well aloud.
- FAQ questions are phrased conversationally ("How much does a kitchen remodel cost in the Treasure Valley?").

## Recommendations

1. **Tighten Quick Answers** to a single 1–2 sentence direct answer before elaboration (snippet capture).
2. **Add FAQ to resources index** and blog/guide index pages (currently CollectionPage only).
3. **Add city-specific PAA-style FAQs** to city×service pages (partially done — 2 city FAQs per page; consider 1 cost + 1 timeline city FAQ).
4. **Remove or implement** the WebSite `SearchAction` that points to a non-existent `/blog?q=` handler (avoids a broken sitelinks-search signal).
5. Keep tables (`cost-table`/`timeline-table`) — they win featured snippets for cost/timeline queries.

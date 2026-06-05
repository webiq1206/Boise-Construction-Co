# Doorway Page Analysis

Per-URL keep/improve/merge/redirect/noindex decisions for the 40 city×service pages, scored on content uniqueness, user value, local relevance, and authority (0–10 each).

## Decision rubric

- **KEEP/IMPROVE** if, after enrichment, the page has genuine local substance (neighborhoods + permits + service-specific local notes) AND/OR local proof.
- **NOINDEX** if the page remains a near-duplicate keyword-swap with no defensible local value and no proof — until real local content/proof exists.
- No outright REMOVE (the URLs serve internal-link and navigation value even if noindexed).

## Per-combo decisions (post-enrichment)

Scores: Uniqueness / UserValue / LocalRelevance / Authority. Decision reflects state AFTER this pass's enrichment.

### Kitchen Remodel
| City | U | UV | LR | A | Decision |
|---|---|---|---|---|---|
| Boise | 8 | 8 | 9 | 7 | KEEP (proof) |
| Meridian | 7 | 7 | 8 | 6 | KEEP |
| Eagle | 7 | 7 | 8 | 6 | KEEP |
| Nampa | 7 | 7 | 8 | 6 | KEEP |
| Kuna | 6 | 6 | 6 | 4 | IMPROVE (no proof) |
| Star | 6 | 6 | 6 | 4 | IMPROVE |
| Middleton | 6 | 6 | 5 | 3 | IMPROVE / watch |
| Caldwell | 6 | 6 | 6 | 4 | IMPROVE (guide added) |

### Bathroom Remodel
Same pattern as kitchen (Meridian has proof). All KEEP/IMPROVE; Middleton lowest.

### Whole-Home Remodel
Eagle has proof (KEEP). Whole-home has strong intrinsic content; all KEEP/IMPROVE.

### Room Addition
Nampa has proof (KEEP). All KEEP/IMPROVE.

### ADU / Guest House — HIGHEST RISK
| City | U | UV | LR | A | Decision |
|---|---|---|---|---|---|
| Boise | 6 | 6 | 6 | 4 | IMPROVE |
| Meridian | 5 | 6 | 5 | 3 | IMPROVE |
| Eagle | 5 | 6 | 5 | 3 | IMPROVE |
| Nampa | 5 | 6 | 5 | 3 | IMPROVE |
| Kuna | 5 | 5 | 4 | 2 | **NOINDEX candidate** |
| Star | 4 | 5 | 4 | 2 | **NOINDEX candidate** |
| Middleton | 4 | 5 | 3 | 2 | **NOINDEX candidate** |
| Caldwell | 5 | 5 | 4 | 2 | **NOINDEX candidate** |

ADU shares the most generic copy (FAQs reference "Boise or Ada County" generically) and has zero proof or pillar support. The 4 smallest-city ADU combos are the clearest doorway risk.

## Recommendation summary

| Bucket | Combos | Action |
|---|---|---|
| Strong (proof or strong intent) | kitchen/bath/whole-home/addition for Boise, Meridian, Eagle, Nampa | KEEP |
| Enriched, indexable | most remaining service×city | IMPROVE (done), keep indexed |
| Doorway risk | ADU × {Kuna, Star, Middleton, Caldwell} | **NOINDEX** until ADU cluster + local content exists |

## Implementation note

The codebase supports per-combo `noindex` via the page's `generateMetadata`. The recommended approach is a small allowlist/denylist (e.g. a `NOINDEX_CITY_SERVICE` set) consumed by `buildPageMetadata` for the city-service kind. The default this pass is **enrich-then-keep**; the 4 ADU combos above are flagged for noindex and can be toggled once you confirm there's no near-term plan to add ADU local content/proof. See [implementation-roadmap.md](implementation-roadmap.md).

## Doorway guideline self-assessment (after)

| Google doorway signal | Before | After |
|---|---|---|
| Many near-duplicate geo pages | Yes | Reduced (38–45% unique) |
| Pages only to funnel to one destination | Partial | Partial (still CTA-driven, but now informative) |
| Minimal unique value | Yes | No (for enriched cities) |
| No local proof | Yes | Mixed (4 cities now embed proof) |

Net: the network moves from "programmatic geo expansion at doorway risk" toward "a genuine local service-area network," with a small residual tail handled by noindex.

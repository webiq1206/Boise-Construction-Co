# Geographic Authority Map

Per-city local relevance, authority, proof, and gaps. Service → Service Area → Location Page → Local FAQs → Local Reviews → Local Projects → Local Content.

## Per-city authority scorecard

Local relevance/authority scored 0–10 (data + proof + content).

| City | County | Area page | Location guide | Neighborhood data | Local proof | Local relevance | Local authority |
|---|---|---|---|---|---|---|---|
| Boise | Ada | yes | yes | 5 hoods, 10 zips, 4 landmarks | 1 review + 2 projects | 9 | 8 |
| Meridian | Ada | yes | yes | 4 hoods | 1 review + 1 project | 8 | 7 |
| Eagle | Ada | yes | yes | 4 hoods | 1 review + 1 project | 8 | 7 |
| Nampa | Canyon | yes | yes | 4 hoods | 1 review + 1 project | 8 | 7 |
| Kuna | Ada | yes | yes | 4 hoods | none | 6 | 4 |
| Star | Ada | yes | yes | 4 hoods | none | 6 | 4 |
| Middleton | Canyon | yes | yes | 4 hoods | none | 5 | 3 |
| Caldwell | Canyon | yes | **added this pass** | 4 hoods | none | 6 | 4 |

## Findings

1. **Proof concentration:** All 4 testimonials and 4 of 5 gallery projects map to Boise/Meridian/Eagle/Nampa. Kuna, Star, Middleton, Caldwell have **zero** local proof — the weakest local-authority signal.
2. **Caldwell guide gap (fixed):** Caldwell was the only city with an area page and 5 city×service pages but **no location guide**. Added `/guides/caldwell-remodeling-guide` and registered it in the manifest + `llms.txt`/`llms-full.txt`.
3. **Underused city data:** City×service pages used only `neighborhoods[0]`. After this pass they surface the full neighborhood list, landmarks, and climate (matching the richer area-page treatment).
4. **County differentiation:** Ada (Boise, Meridian, Eagle, Kuna, Star) vs Canyon (Nampa, Middleton, Caldwell) permit routing is referenced but could be deepened with portal/timeline specifics per county.

## Local content matrix (post-implementation target)

| Signal | Boise | Meridian | Eagle | Nampa | Kuna | Star | Middleton | Caldwell |
|---|---|---|---|---|---|---|---|---|
| Area page | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Location guide | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (new) |
| Localized city×service sections | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Embedded local proof | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Local FAQs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Recommendations

1. **Collect city-tagged proof** for Kuna, Star, Middleton, Caldwell (data-gated). Until then, these cities' city×service pages remain proof-blind and trail proof-backed cities by ~6–8 quality points.
2. **Neighborhood-level content** for high-value cities (Boise North End, Meridian Paramount) — long-term content-gap opportunity.
3. **County permit deep-dives** — the `/resources/ada-canyon-permit-flow` asset should be linked more prominently from every Canyon-county city page.

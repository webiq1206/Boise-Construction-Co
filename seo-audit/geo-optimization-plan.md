# GEO Optimization Plan (Generative Engine Optimization)

Making the site maximally extractable, citable, and summarizable by generative engines (Google AI Overviews, ChatGPT, Perplexity, Gemini).

## Entity & context clarity

| Requirement | State | Action |
|---|---|---|
| Clear business entity | Organization + LocalBusiness schema | strengthen with `@graph`, logo, GBP (done/gated) |
| Service definitions | 5 services with descriptions + Service schema | OK |
| Location clarity | 8 cities, areaServed, location guides | OK (Caldwell guide added) |
| Authority signals | weak (no people, no ratings) | data-gated |
| Structured answers | Quick Answer + Key Takeaways on 100% of blog/guides | OK |
| AI readability | clean static HTML, headings, schema | OK |

## Extraction-friendly content patterns (present)

- **Quick Answer blocks** at the top of every blog/guide (`data-speakable="summary"`).
- **Key Takeaways** lists.
- **Question-style H2s** (per content rules).
- **Cost/timeline tables** (`cost-table`, `timeline-table`).
- **FAQs rendered on-page** (not schema-only).
- **`llms.txt` / `llms-full.txt`** curated for LLM crawlers.

## GEO improvements in this pass

1. **City×service pages** now carry localized, factual sections (neighborhoods, landmarks, climate, county permit routing) — giving generative engines concrete, citable local facts instead of boilerplate.
2. **Caldwell** is now a fully-formed location entity (guide + area + city×service), removing a coverage hole that could cause "no information" answers for Caldwell queries.
3. **Speakable coverage** fixed on homepage + contact so summaries are reliably exposed.
4. **Review schema** wired so engines can cite social proof (rating value gated on real data).

## Remaining GEO gaps (data-gated)

- **Named experts** — generative engines weight authorial expertise; anonymous "Boise Remodeling Co" authorship limits citation confidence.
- **Aggregate rating / review count** — engines surface ratings in comparative answers ("top-rated remodelers in Boise"). Currently zeroed.
- **GBP linkage** — strengthens entity reconciliation across Google surfaces.

## Recommendations

1. Keep Quick Answer blocks ≤ 320 chars and lead with the direct answer (already the pattern).
2. Add a concise "About Boise Remodeling Co" factual block (NAP, founded, service area, USPs) to `llms-full.txt` (already present — keep current as data changes).
3. Once real, expose ratings + named experts so comparative/authority queries can cite the brand.
4. Ensure every city has at least one factual, locally-specific paragraph an engine can quote (done via city×service sections).

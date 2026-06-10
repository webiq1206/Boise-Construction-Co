# 10 - AEO & GEO Plan (AI Overviews, ChatGPT, Claude, Gemini, Perplexity, Voice)

## Current readiness (verified)

Strong skeleton: FAQPage schema on every landing page, Speakable schema + matching `data-speakable` DOM nodes, Quick Answer / Key Takeaways blocks on guides, `public/llms.txt` + `llms-full.txt` manifests, question-form H2s on pillars. The June 5 `seo-audit/ai-search-readiness-analysis.md` covers extraction mechanics; this plan covers what is still missing.

## The core AEO problem: answers exist, substance doesn't

An AI engine asked "how much does a bathroom remodel cost in Boise" needs a **specific, dated, attributable** answer. The site's answer surface today:
- /blog/bathroom-remodel-cost-boise: 299 words - closest to citable
- 57 of 69 blog posts under 150 words - structurally extractable, substantively empty
- Service pages: zero numeric cost content on-page (the estimator is client-side JS - invisible to crawlers and LLMs)

**Fix A (implemented this pass): server-rendered cost bands.** The estimator's price bands ($15k-$35k refresh ... $150k-$300k luxury) exist only in client JS. Add a static HTML cost table to each service page and the cost guide. This single change makes the site's most valuable data extractable by every engine.

**Fix B (implemented this pass): direct-answer blocks on cost posts.** First element after H1: a 40-60 word answer with numbers and date ("As of 2026, most Boise kitchen remodels run $35,000-$75,000 for mid-range..."). Format AI Overviews and Perplexity lift verbatim.

**Fix C: question coverage per page type** (inventory in 03-keyword-strategy.md):
- Service pages: 3 FAQs → 8 (cost, timeline, permits, living-through-it, financing, warranty)
- City-service: add per-city cost question ("What does a kitchen remodel cost in Meridian?")
- New ADU pillar owns the ordinance questions no competitor answers well (size limits, owner-occupancy, parking, attached vs detached costs)

## The core GEO problem: nothing citation-worthy

Generative engines cite pages that contain facts unavailable elsewhere. Current inventory of citable assets: the Ada/Canyon permit-flow resource (genuinely differentiated) and the 1,693-word cost guide. That's two pages out of 166.

**What makes this site citable (build priority):**
1. **Local cost data with dates** - "2026 Treasure Valley remodel costs" tables on cost guide + service pages (Fix A). No Boise competitor publishes structured local cost tables.
2. **Permit specifics** - expand permit-flow resource with current fee schedules and review timelines per office. Cite city/county sources.
3. **Boise ADU ordinance explainer** - new pillar; the ordinance facts (size caps, occupancy rules) are public but poorly synthesized anywhere.
4. **Neighborhood housing-stock knowledge** - North End historic district remodel rules, Bench mid-century layouts. The 6 neighborhood guides are the right asset at 4x current depth.
5. **Named human expertise** - engines weight attributed content; Person author (Jared Brost) on guides (11-eeat-audit.md).

**Entity coverage for GEO** (machine-readable identity): canonical NAP everywhere + GBP/Bing/Apple live + `sameAs` graph + Wikipedia-disambiguated `areaServed` + `knowsAbout` (09-schema-plan.md). An engine answering "remodeling contractor in Meridian Idaho" must find one consistent entity, not the current ProMatcher contradiction.

## llms.txt updates (implemented this pass)
- Add the new ADU pillar guide
- Add /resources/ada-canyon-permit-flow under a "Local permit resources" heading (currently missing - it is the most AI-citable page on the site)
- Add one-line cost-band summary per service to give LLM crawlers numbers in the manifest itself

## Voice search
Voice = GBP + Apple Maps + concise FAQ answers. "Remodeling contractor near me" via Assistant/Siri resolves from Maps data, not web pages. Covered by 02-gbp-plan.md; FAQ answers should stay under ~50 words for voice delivery (current answers comply).

## Measurement
- Monthly: ask ChatGPT/Perplexity/Gemini "best remodeling contractor in Boise/Meridian", "kitchen remodel cost Boise" - log mentions and which URL gets cited
- Watch for AI-crawler hits (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) in server logs; all currently allowed by robots - keep it that way

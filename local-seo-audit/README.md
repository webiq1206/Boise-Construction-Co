# Local SEO / AEO / GEO / GBP Audit - June 10, 2026

Implementation-ready audit of boiseremodeling.co and its local search presence. All code-level fixes were implemented in the same pass (build verified); owner actions are flagged in each doc and sequenced in the roadmap.

Supersedes the June 5 `seo-audit/` pass for local/off-site strategy; that folder remains valid for its on-page deep-dives.

| File | Contents |
|---|---|
| [00-executive-summary.md](00-executive-summary.md) | Six category scores, diagnosis, what was implemented, owner queue |
| [01-url-audit.csv](01-url-audit.csv) | All 166 URLs x 14 scored columns + keywords, intent, priority, actions |
| [01-url-audit.md](01-url-audit.md) | Score rationale by template; sitewide caps |
| [02-gbp-plan.md](02-gbp-plan.md) | Verification/suspension recovery + full profile spec + Bing/Apple |
| [03-keyword-strategy.md](03-keyword-strategy.md) | Per-page keyword map, formulas, question inventory |
| [04-landing-page-audit.md](04-landing-page-audit.md) | 53 commercial landing pages: doorway status, uniqueness, proof gaps |
| [05-content-plan.md](05-content-plan.md) | Depth audit, what was built (ADU pillar, guide expansions), P1-P4 queue |
| [06-internal-linking-plan.md](06-internal-linking-plan.md) | Manifest assessment + 4 gaps (implemented) |
| [07-nap-citations.md](07-nap-citations.md) | Canonical NAP, wrong-phone cleanup (critical), citation build list |
| [08-review-strategy.md](08-review-strategy.md) | Zero-to-fifty review system, keyword coverage, schema activation |
| [09-schema-plan.md](09-schema-plan.md) | 6 fixes (implemented) + gated items |
| [10-aeo-geo-plan.md](10-aeo-geo-plan.md) | AI Overviews/ChatGPT/Perplexity/voice readiness + citability build |
| [11-eeat-audit.md](11-eeat-audit.md) | E/E/A/T scores, founder/license/credential actions |
| [12-technical-plan.md](12-technical-plan.md) | T1-T8: fixed items + owner items |
| [13-competitor-gap.md](13-competitor-gap.md) | Verified competitor field, where they win, where we win |
| [14-knowledge-graph.md](14-knowledge-graph.md) | Entity-relationship map (mermaid) + missing nodes |
| [15-roadmap.md](15-roadmap.md) | Week 1 → month 6 sequenced actions + recurring cadence + KPIs |

Regenerate the URL matrix anytime: `npx tsx scripts/audit-url-data.ts > /tmp/audit-url-data.json && npx tsx scripts/audit-url-matrix.ts`

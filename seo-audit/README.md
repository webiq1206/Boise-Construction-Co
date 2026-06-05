# Boise Remodeling Co — SEO / GEO / AEO + Knowledge Graph Audit

This directory is the consolidated deliverable set for two audits:

1. **World-class SEO / GEO / AEO / UX / Conversion / Performance / Content-Quality Audit**
2. **Local Service Business Knowledge Graph, Entity Mapping & Topical Authority Audit**

Overlapping deliverables from the two prompts have been merged into single shared documents to avoid redundancy.

## Audit date & baseline

- **Audit date:** 2026-06-05
- **Framework:** Next.js App Router (static-generated marketing site)
- **Indexable URL inventory:** 145 landing-network URLs + ~12 static marketing pages
  - 69 blog posts, 23 guides, 5 service pages, 8 area pages, 40 city×service pages
- **Source of truth:** content in `shared/`, SEO infra in `lib/seo.ts`, `lib/schema.ts`, `lib/page-metadata.ts`, link graph in `data/internal-links.json`

> The four root-level `SEO-AUDIT-*.md` files describe a **previous** site structure (294 routes, 168 city×service pages, `/areas/[slug]`, `/pricing`, `/get-quote`). They are retained as history and are **not** authoritative for this audit.

## Document index

### Site & page analysis
- [full-site-audit.md](full-site-audit.md) — crawl-level technical SEO, architecture, redirects, indexation
- [page-by-page-audit.md](page-by-page-audit.md) — per-template analysis with keep/improve/rewrite calls
- [page-quality-scorecard.md](page-quality-scorecard.md) — 0–100 scoring per page type (content, intent, local, E-E-A-T, conversion)
- [keyword-map.md](keyword-map.md) — primary/secondary/intent map + cannibalization
- [metadata-map.md](metadata-map.md) — title/description/canonical/OG inventory and issues

### Knowledge graph & entities
- [content-knowledge-graph.md](content-knowledge-graph.md) — visual entity graph (mermaid) + relationship inventory
- [entity-map.md](entity-map.md) — organization/service/location/team/project entities
- [entity-relationship-map.md](entity-relationship-map.md) — existing / missing / weak / redundant relationships
- [service-cluster-map.md](service-cluster-map.md) — per-service authority clusters
- [geographic-authority-map.md](geographic-authority-map.md) — per-city local relevance & authority
- [trust-signal-map.md](trust-signal-map.md) — reviews/licenses/certifications/awards inventory

### Linking, topical authority & gaps
- [internal-link-map.md](internal-link-map.md) — link graph audit + recommended strategy
- [topical-authority-analysis.md](topical-authority-analysis.md) — hub coverage depth and gaps
- [content-gap-analysis.md](content-gap-analysis.md) — missing guides/cost/comparison/FAQ/location content

### GEO / AEO / AI
- [geo-optimization-plan.md](geo-optimization-plan.md) — entity clarity & extraction for generative engines
- [aeo-optimization-plan.md](aeo-optimization-plan.md) — answer-engine / voice / snippet readiness
- [ai-search-readiness-analysis.md](ai-search-readiness-analysis.md) — can AI confidently cite this site?
- [schema-map.md](schema-map.md) — structured-data inventory, gaps, and `@graph` model

### Programmatic / doorway
- [programmatic-seo-analysis.md](programmatic-seo-analysis.md) — templated-page uniqueness scoring
- [doorway-page-analysis.md](doorway-page-analysis.md) — per-URL keep/improve/merge/redirect/noindex calls

### Performance, accessibility, UX, images, competitors
- [page-speed-optimization-plan.md](page-speed-optimization-plan.md) — Core Web Vitals plan (95+ target)
- [accessibility-audit.md](accessibility-audit.md) — WCAG basics
- [image-audit.md](image-audit.md) — alt text, file names, compression, lazy loading
- [conversion-ux-audit.md](conversion-ux-audit.md) — hero/CTA/form/journey/friction analysis
- [competitor-gap-analysis.md](competitor-gap-analysis.md) — Treasure Valley competitor benchmarking

### Roadmap & implementation
- [local-seo-plan.md](local-seo-plan.md) — NAP, GBP, citations, local proof
- [implementation-roadmap.md](implementation-roadmap.md) — prioritized completion checklist
- [completed-updates.md](completed-updates.md) — before/after log of changes made during this audit

## Scoring methodology

Each page type is scored 0–100 across five weighted dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| Content quality & uniqueness | 30% | Depth, originality, non-template % |
| Search-intent fit | 20% | Matches the query class it targets without overlap |
| Local relevance | 20% | Genuine local substance (proof, permits, neighborhoods) |
| E-E-A-T / trust | 15% | Authorship, credentials, reviews, licenses |
| Conversion readiness | 15% | CTA clarity, proof placement, friction |

Uniqueness thresholds for the programmatic/doorway analysis follow Google's guidance: pages with **>90% template similarity** are flagged high-risk, **70–90%** medium-risk, **<70%** acceptable.

## How to read the "needs your input" items

Several trust/E-E-A-T fixes require real business facts that must not be fabricated (real phone, license number, Google Business Profile URL, genuine review counts/ratings, named team members). These are built as **gated plumbing** — the wiring exists and activates the moment real values replace the placeholders. They are flagged throughout and summarized in [implementation-roadmap.md](implementation-roadmap.md).

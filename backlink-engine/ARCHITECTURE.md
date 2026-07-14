# Autonomous Backlink Acquisition Engine — Architecture

Target: **boiseremodeling.co** · Goal: sustainable authority growth toward DA/DR 50+ via
white-hat, quality-over-quantity link earning. Compliant with Google's link-spam guidelines.

## Operating principle

> **Autonomous intelligence + human-approved outreach.**
> The engine autonomously discovers, qualifies, scores, prioritizes, monitors, and *drafts* — the
> full analytical loop runs on a schedule with no human involvement. The only step gated on a human
> is the **irreversible outward action** (sending an email, submitting a form, joining a paid
> program). This is deliberate: fully-unsupervised outreach at scale is the exact footprint Google's
> spam systems flag, and it is the fastest way to a manual action. Keeping a human on the send button
> is what makes the *rest* safe to automate aggressively.

## The pipeline (6 stages)

```
 (0) AUDIT ───────► (1) DISCOVER ───► (2) QUALIFY ───► (3) SCORE/RANK ───► (4) OUTREACH DRAFT ─►[HUMAN]─► SEND
   profile health      find targets      hard gates       value+priority       personalized queue           │
   + disavow           (many sources)    anti-spam        tiers P1..P4         per channel                   │
        ▲                                                                                                    │
        └──────────────────────── (5) MONITOR (new/lost/competitor growth) ◄──────────────────────── acquired
```

### (0) Audit & protect — *runs first, then monthly*
- Pull our live backlink profile (Ahrefs `site-explorer-referring-domains` + `backlinks-stats`).
- Flag toxic/PBN/web2.0-spam residue → `data/disavow.txt` for Search Console.
- Track links worth **protecting** (e.g. `expertise.com`) so a lost-link alert fires if they drop.
- *Finding on 2026-07-14: DR 0.1, 33 live refdomains, ~31 of them spam-blog network domains.
  Cleanup precedes acquisition.*

### (1) Discover — *weekly*
Multi-source, each blind to the others (so nothing is missed):
| Source | Tooling | Yields |
|--------|---------|--------|
| Competitor referring domains | Ahrefs `site-explorer-referring-domains` per competitor | "links our rivals have, we don't" (the gap) |
| Competitor common linkers | intersection of ≥2 competitors' refdomains | proven-attainable, proven-relevant targets |
| Broken backlinks (ours + competitors') | Ahrefs `site-explorer-broken-backlinks` | broken-link-building targets |
| Unlinked mentions | WebSearch brand/name queries | reclamation targets |
| Resource pages | WebSearch `"boise home improvement" + resources/links` | resource-page targets |
| Associations / directories | curated + WebSearch | membership + citation targets |
| Supplier dealer-locators | client vendor list | "find an installer" listings |
| Journalist queries | Featured/Qwoted/HAB2BW feeds | digital-PR targets |
New rows are appended to the opportunity store, deduped by domain.

### (2) Qualify — hard gates (`config/quality-gates.json`)
Pass/fail BEFORE scoring. Rejects on: spam flags (pbn, link-network, web2-spam-blog, scraper,
paid-marketplace, deindexed…), zero-authority profile links, and the web2.0-churn footprint.
Also enforces **anchor-text mix** (≤10% exact-match) and **link velocity** caps (≤8 new live
links/week) so growth stays natural.

### (3) Score & rank (`config/scoring.json`, `src/score.mjs`)
Transparent 0–100 **value blend**: relevance 30% · authority(DR) 26% · link type 16% · traffic 12% ·
dofollow 10% · local 6%. Then **priority = value × feasibility-multiplier + competitor-validation
bonus**, bucketed into P1 (pursue now) → P4. Feasibility slightly favors *winnable* links; the
competitor bonus rewards targets ≥1 rival already holds.

### (4) Outreach draft (`outreach/templates.md`)
Per-channel personalized draft written to `outreach/queue.json` (+ citation submission packets).
**Never auto-sends.** Human approves batches; velocity caps apply.

### (5) Monitor — *weekly + monthly*
- New/lost links (`refdomains history`, `backlinks-stats` deltas) → lost-link recovery.
- Competitor refdomain growth → surfaces their fresh wins as our new targets.
- DR/DA trajectory vs the DR-50 goal (`domain-rating-history`).

## Autonomy model / scheduling
The "no human involvement" analytical loop is a **scheduled Claude task** (see `README.md`) using the
Ahrefs MCP + WebSearch. Cadence: weekly discovery+scoring, monthly audit+trajectory. Each run updates
the data files and the outreach queue, and notifies with a short digest. A human reviews the queue
and clicks send.

## Data stores
| File | Role |
|------|------|
| `data/opportunities.seed.json` | raw opportunities (grows each run) |
| `data/opportunities.scored.json` | gated + scored + ranked (engine output) |
| `data/pipeline-report.md` | human-readable ranked pipeline |
| `data/our-profile-audit.json` | our profile health + disavow candidates |
| `data/disavow.txt` | Google disavow file (spam residue) |
| `data/competitors.json` | competitor seed set + analysis state |
| `outreach/queue.json` | drafted messages awaiting human approval |

## Realistic trajectory to DR/DA 50+
DR 50 for a *single-location remodeler* is an ambitious multi-year target — most strong local
remodelers sit DR 10–30. The path is not directories (those plateau ~DR 15); it is **editorial +
digital PR + associations + supplier links** compounding over time.
- **0–3 mo:** disavow spam; land foundational citations + Houzz/Angi/BBB/NARI/Idaho Power → DR ~5–12.
- **3–9 mo:** associations + supplier locators + first digital-PR/local-news wins → DR ~12–22.
- **9–24 mo:** repeatable digital PR (data studies, local-news, HARO) + partnerships → DR ~25–40.
- **24 mo+:** sustained PR + linkable-asset content → DR 40–50+.
Quality compounds; volume does not. The engine optimizes for the former.

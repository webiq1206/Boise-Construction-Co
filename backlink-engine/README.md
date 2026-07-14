# Backlink Engine — boiseremodeling.co

An autonomous backlink **intelligence** system with **human-approved outreach**. It discovers,
qualifies, scores, prioritizes, and monitors link opportunities on a schedule with no human
involvement — and drafts every outreach message — while keeping a human on the irreversible
send/submit/pay step. See `ARCHITECTURE.md` for the full design and the rationale for that boundary.

## Layout
```
backlink-engine/
├── ARCHITECTURE.md            # the design: pipeline, scoring, autonomy model, DR-50 roadmap
├── README.md                  # this file — how to run
├── config/
│   ├── scoring.json           # value weights, feasibility multipliers, tiers
│   └── quality-gates.json     # hard anti-spam gates, anchor + velocity policy
├── src/
│   └── score.mjs              # deterministic gate + score + rank engine (no deps)
├── data/
│   ├── competitors.json       # local competitor seed set
│   ├── opportunities.seed.json# raw opportunities (grows each discovery run)
│   ├── opportunities.scored.json  # engine output (gated + ranked)
│   ├── pipeline-report.md     # human-readable ranked pipeline
│   ├── our-profile-audit.json # our profile health + disavow candidates
│   └── disavow.txt            # Google disavow file (spam residue)
└── outreach/
    └── templates.md           # per-channel message templates (drafts only)
```

## Run the scorer
```bash
cd backlink-engine
node src/score.mjs                       # scores data/opportunities.seed.json
node src/score.mjs path/to/other.json    # score any opportunity list
```
Outputs `data/opportunities.scored.json` + `data/pipeline-report.md` and prints a ranked table.

## The autonomous loop
A scheduled Claude task ("Backlink engine — weekly run") performs discovery + monitoring using the
Ahrefs MCP and WebSearch, appends new opportunities to `opportunities.seed.json`, re-runs the scorer,
updates the audit/monitor deltas, drafts outreach into `outreach/queue.json`, and posts a digest.
Cadence: **weekly** discovery/scoring, **monthly** profile audit + DR-trajectory check.

### What stays human (by design)
1. **Sending** outreach emails / journalist responses.
2. **Submitting** directory/citation forms.
3. **Joining paid** programs (NARI, BBB, Chamber, GuildQuality, Scout Guide…).
4. **Uploading** the disavow file to Google Search Console.
The engine prepares all four to one-click readiness; a person approves.

## First actions (from the 2026-07-14 run)
1. **Review & upload `data/disavow.txt`** — ~31 spam-blog domains currently point at us (DR 0.1).
2. **Provide inputs the engine can't guess:** business NAP + short/long descriptions, portfolio
   photo URLs, and **the vendor/manufacturer list** (unlocks the high-value supplier dealer-locator
   links) and **a sender name/contact** for outreach.
3. **Approve the P1 batch** in `data/pipeline-report.md` (BBB, Idaho Power trade-ally, Houzz, Angi,
   NARI Idaho, BCA of SW Idaho, The Scout Guide…).
```

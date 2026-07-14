# Backlink Engine - boiseremodeling.co

An autonomous backlink **intelligence** system with **human-approved outreach**. It discovers,
qualifies, scores, prioritizes, monitors, and drafts on a schedule with no human involvement - and
keeps a human on the irreversible send/submit/pay step. See `ARCHITECTURE.md` for the design and the
rationale for that boundary.

## Layout
```
backlink-engine/
├── ARCHITECTURE.md            # design: pipeline, scoring, autonomy model, DR-50 roadmap
├── REPLIT-CRON.md             # deploy as a weekly Replit Scheduled Deployment
├── config/
│   ├── scoring.json           # value weights, feasibility multipliers, tiers, canonical NAP
│   ├── quality-gates.json     # hard anti-spam gates, anchor + velocity policy
│   └── profile.json           # business inputs that fill outreach (sender, descriptions, photos)
├── src/
│   ├── score.mjs              # deterministic gate + score + rank (no deps)
│   ├── ahrefs.mjs             # Ahrefs API v3 client (env key, headless)
│   ├── classify.mjs           # refdomain -> opportunity classifier + white-hat filter
│   ├── store.mjs              # persistence: Neon Postgres, or JSON files locally
│   ├── outreach.mjs           # generates real drafts + citation packets from NAP/profile
│   ├── run.mjs                # orchestrator (discover->score->monitor->draft)
│   ├── preflight.mjs          # self-test: config, env, live Ahrefs check
│   └── send.mjs               # guarded send hook (off by default, approval-gated)
├── data/                      # opportunities, scored output, audit, disavow, history/, run-log
└── outreach/
    ├── templates.md           # per-channel copy (human reference)
    ├── queue.json             # drafted messages awaiting approval
    └── citations/             # generated self-serve submission packets
```

## Commands
```bash
npm run backlink:preflight   # validate config + env + live Ahrefs (run before first cron)
npm run backlink:run         # full loop (needs AHREFS_API_KEY; DATABASE_URL for durability)
npm run backlink:run -- --dry-run   # offline: scoring + drafting + JSON persistence
npm run backlink:score       # re-score the current opportunity list
npm run backlink:send        # dry-run report of what WOULD send (never sends unless enabled)
```

## Environment
| Var | Purpose | Without it |
|-----|---------|-----------|
| `AHREFS_API_KEY` | live discovery + monitoring | those stages skip |
| `DATABASE_URL` | Neon Postgres persistence (durable across the ephemeral cron) | falls back to JSON files |
| `RESEND_API_KEY` | sending approved outreach | sends unavailable (drafts still generate) |
| `BACKLINK_SEND_ENABLED` | global send kill-switch (`true` to arm) | off by default - nothing sends |
| `OUTREACH_FROM` | From address for sends | `hello@boiseremodeling.co` |

## The autonomous loop
`npm run backlink:run` -> DISCOVER (competitor refdomains) -> QUALIFY/CLASSIFY (anti-spam gate) ->
SCORE -> MONITOR (our DR + live refdomains, new/lost detection, disavow refresh) -> DRAFT (emails +
citation packets into the queue) -> DIGEST (`data/run-log.md`). State persists in Postgres (or JSON).
Deploy it weekly via `REPLIT-CRON.md`.

### What stays human (by design)
Sending emails, submitting forms, joining paid programs, uploading the disavow file. The engine
prepares all of them to one-click readiness; a person approves. `send.mjs` only emails an item a
human set to `status:"approved"` with a valid recipient, and only when `BACKLINK_SEND_ENABLED=true`.

## To finish going live
1. `npm run backlink:preflight` on Replit (secrets set) - fix any FAIL.
2. Set `DATABASE_URL` so state is durable, and fill `config/profile.json` (sender name, long
   description, portfolio photo URLs) so drafts become send-ready.
3. Create the weekly Scheduled Deployment (see `REPLIT-CRON.md`).
4. Review `data/disavow.txt` -> upload to Search Console. Approve the P1 batch in
   `data/pipeline-report.md`. Approve/send outreach from the queue when ready.
```

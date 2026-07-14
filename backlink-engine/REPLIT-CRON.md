# Deploying the autonomous runner as a Replit Scheduled Deployment

The engine runs headless on Replit via a **Scheduled Deployment** (Replit's cron), independent of the
website deployment and independent of this chat app being open.

## One-time setup
1. **Add secrets.** Replit > this Repl > **Secrets**:
   - `AHREFS_API_KEY` = your Ahrefs API v3 key (required for discovery/monitoring).
   - `DATABASE_URL` = your Neon Postgres URL (**required for durability** - Scheduled Deployments are
     ephemeral, so without a DB the engine forgets everything between runs). The repo already uses
     Neon; reuse the same database. The engine self-creates its `backlink_*` tables on first run.
   - Optional, only when you're ready to send: `RESEND_API_KEY`, `BACKLINK_SEND_ENABLED=true`,
     `OUTREACH_FROM`. Leave these unset to keep the engine draft-only.
2. **Preflight once.** In the Repl shell: `npm run backlink:preflight`. It validates config + secrets
   and makes one free live Ahrefs call. Fix any `FAIL` before scheduling.
3. **Create the Scheduled Deployment.** Replit > **Deploy** > **Scheduled**:
   - **Build command:** `npm install`
   - **Run command:** `npm run backlink:run`
   - **Schedule:** weekly, e.g. `0 7 * * 1` (Mondays 07:00). Monthly audit is folded into the run.
   - Give it the same Secrets scope.
4. That's it. Each run mines competitors, re-scores, monitors DR + new/lost links, refreshes the
   disavow list, and appends drafts (emails + citation packets) to the queue + a digest to
   `data/run-log.md`. It **never** sends, submits, pays, or uploads a disavow file.

## What the run does (mirrors ARCHITECTURE.md)
`npm run backlink:run` -> DISCOVER (competitor refdomains via Ahrefs) -> CLASSIFY (white-hat gate) ->
SCORE (`score.mjs`) -> MONITOR (our DR + live refdomains vs baseline) -> DRAFT (queue, capped by
velocity policy) -> DIGEST (`data/run-log.md`).

## Local / offline check
```bash
npm run backlink:score              # re-score current opportunities
npm run backlink:run -- --dry-run   # full loop minus network (no key needed)
```

## Notes
- Commits from the runner are optional; by default it writes data files in place. If you want each
  run's data changes persisted to git, add a commit+push step to the run command or a post-run hook.
- The in-app weekly Claude task (`backlink-engine-weekly`) can stay as a richer, judgment-heavy
  supplement, or be disabled once the Replit cron is live to avoid double-drafting. They share the
  same data files and velocity caps.
- Outreach sending, when you enable it, should go through the existing **Resend** integration from a
  dedicated outreach subdomain (not the primary domain) to protect email reputation - and still
  behind the one-tap approval gate.

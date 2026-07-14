# Deploying the autonomous runner as a Replit Scheduled Deployment

The engine runs headless on Replit via a **Scheduled Deployment** (Replit's cron), independent of the
website deployment and independent of this chat app being open.

## One-time setup
1. **Add the secret.** Replit > this Repl > **Secrets** > add `AHREFS_API_KEY` = your Ahrefs API v3
   key (same subscription already connected in-session). The runner reads it from `process.env`.
2. **Create the Scheduled Deployment.** Replit > **Deploy** > **Scheduled**:
   - **Build command:** `npm install`
   - **Run command:** `npm run backlink:run`
   - **Schedule:** weekly, e.g. `0 7 * * 1` (Mondays 07:00). Monthly audit is folded into the run.
   - Give it the same Secrets scope so `AHREFS_API_KEY` is present.
3. That's it. Each run mines competitors, re-scores, monitors DR/links, and appends drafts to
   `outreach/queue.json` + a digest to `data/run-log.md`. It **never** sends, submits, pays, or
   uploads a disavow file.

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

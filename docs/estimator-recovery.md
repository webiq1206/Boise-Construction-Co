# Estimator abandonment recovery and partial-completion tracking

Shipped 2026-09-08 on all four brand sites (same files) and, in a lighter form, on p5homeco.com's quote form.

## What the visitor sees
When a visitor who has made real progress in an estimator or lead form is about to leave, one prompt offers help: Call, Text, a callback request (phone number, optional name), or "No thanks". Triggers, in priority order:

1. Clicking an in-site link outside the wizard (the navigation is paused, and resumes on "No thanks, continue").
2. Desktop exit intent (pointer leaves through the top edge, fine pointers only).
3. 90 seconds of inactivity while the page is visible.

Never on tab close or browser shutdown (browsers do not allow a custom prompt there). Shown at most once per browser session; dismissal is remembered. Escape and the backdrop dismiss it. Focus is managed by the dialog primitive.

## Engagement threshold
A session counts as engaged once the visitor has completed a step (step index >= 1 or a completed step is recorded) or has spent 20 seconds inside the flow. Below that, nothing is emailed and the row expires silently after 7 days.

## Partial-completion emails
Staff email for abandoned or partial sessions is **off**. `abandonmentStaffEmailsEnabled()` in `server/services/estimatorSessions.ts` is the kill-switch and returns `false`. Leave it false. The `[Partial] ... drop-off` send path stays behind that check and does not run.

`estimator_sessions` still stores one row per session (created on first use if `npm run db:push` was not run; also in `migrations/0002_estimator_sessions.sql`). The sweep still runs for retention: opportunistically from the progress endpoint (at most every 5 minutes per instance) and from `POST /api/internal/abandonment-sweep` with `Authorization: Bearer $CRON_SECRET` (or `$LEAD_DASHBOARD_KEY`). It purges rows after 90 days and expires unengaged rows. It does not email staff about a drop-off.

A completed submission (`markEstimatorCompleted`) sets the session to `completed`. A completion after a historical partial summary was sent sets `recovered`.

Callback requests (`POST /api/recovery/callback`) are stored on the session and emailed immediately, once. Completed forms and other real leads keep their own notification emails. Those paths are not the partial-completion sweep.

## Data policy
- Session id: random, per tab (`sessionStorage`), never linked to cookies or accounts.
- Stored: site, flow, page path (no query string), device category, timestamps, step positions, completion percent, time in flow, allow-listed selections (keys matching `^[a-z][a-z0-9_]*$`, never anything containing name/email/phone/address), validation error codes, exit method (or `unknown`), prompt interactions.
- Contact details only from an explicit callback request. Typed-but-unsubmitted contact fields are never captured.
- Retention: rows are deleted after 90 days.
- Callback emails state plainly when no contact information exists and that a call/text click shows intent, not a conversation. Partial drop-off emails are not sent.

## Integration
`<EstimatorRecovery flow=... currentStep=... currentStepIndex=... totalSteps=... selections=... submitted=... />` inside any wizard. On success call `markEstimatorCompleted(flow)`. Analytics event: `estimator_recovery_prompt` with `action` in shown / call / text / callback_requested / stay / continue_leaving.

# Estimator live qualification and deployment preparation

## Authorized scope and outcome (2026-09-19)

The owner authorized runtime inspection and one tool-free approved-rate mapping
scenario, with an application allowance of $1 within the stated $25 aggregate
task cap. This supersedes the earlier assistant-created separate-approval gate.
The scenario used 100 LF of owner-supplied first-floor base-moulding installation
labor, an explicit reviewed inventory fixture, and a read-only production
configuration snapshot containing 185 approved rates and six service books.
Inventory extraction was not live-qualified.

Production configuration selects `gpt-5.6-sol` through the configured managed
OpenAI route. The qualification made two requests for this one scenario: mapping
and its mandatory coverage audit. Both returned the expected model, completed
status, default service tier, and validated usage. Neither used tools, research,
fallback, automatic retries, or redirects.

The calculated customer range was $305-$415; internal contract price was $336.51.
The saved result has one 100 LF field-labor line and a successful coverage audit.
An isolated PGlite/captured-adapter run consumed this sealed live result unchanged
and produced two PDFs, two email payloads with attachments, and one CRM payload.
No actual sends, customer business writes, production queue mutations, or
publication occurred. Captured transport is not proof of inbox/CRM deliverability.
The customer projection retains its existing disclosed $200 labor-allowance
basis; it is not evidence that every internal amount is redacted.

## Spending evidence

Official sources inspected:

- https://developers.openai.com/api/docs/models/gpt-5.6-sol
- https://docs.replit.com/features/integrations/replit-ai-integrations

The published short-context prices were $4/M input and $20/M output, with cache
writes at 1.25x input. Managed billing documentation states public API pricing.
The authorized conservative accounting uses **all input** at $6.875/M and output
at $33/M, including reasoning output. This is an upper-bound accounting method,
not an exact invoice. Both requests used explicit default tier, no tools, and a
4,096-token output limit; byte-based input ceilings plus framing kept context
well below the 272,000-token long-context threshold.

| Stage | Input tokens | Output tokens | Reserved ceiling | Accounted bound |
| --- | ---: | ---: | ---: | ---: |
| Mapping | 8,753 | 267 | $0.425981 | $0.068988 |
| Coverage audit | 2,669 | 238 | $0.243278 | $0.026204 |
| Total | 11,422 | 505 | $0.669259 | $0.095192 |

Reservations were persisted and synced before dispatch. They were not refunded
or reset. Successful stage records, raw responses, request/response hashes, and
the final output seal are retained in a dedicated private canonical ledger.
Unknown response/usage retains an exclusive blocking lock. This grant is not an
authorization to run another scenario or reuse a fresh ledger.

Forty-five inventoried prior verification artifacts remained byte-identical.
Private configuration, ledger, reports, PDFs, and captured payloads are not
included in GitHub source synchronization.

## Production readiness observations

Read-only production replica observations:

- Background jobs: 48 complete, 3 failed, 0 queued/running, 0 active leases.
- Normalized duplicate analysis ledger groups: 0.
- Delivery outbox: 1 pending, 2 needs-review, 5 sent, 0 active locks.
- Publish schema comparison: no pending statements, drops, or structural loss.

These are snapshots, potentially subject to replica lag, not a transactional
cutover guarantee. Every existing job and outbox row was left untouched.

New worker stop/drain/resume APIs have isolated tests for admission closure,
truthful timeout, checkpoint retention, lease release, resumability, and
duplicate-ledger blocking. They are source preparation, not an installed
production lifecycle hook. No speculative signal handler overrides Next.js.
See `p5-queue-readiness.md` for the required operator cutover sequence.

## Remaining blockers and limits

1. **Safe cutover is not established.** Existing deployed processes do not have
   these new drain APIs. Replit autoscale may overlap old and new revisions.
   Before publishing, establish supported admission closure, per-instance
   quiescence/drain, and confirmed old-instance termination without discarding
   customer work. A newer source export or an empty replica snapshot cannot
   establish this. Replit documents a Publishing options-menu shutdown/unpublish
   control for maintenance, but it was not invoked: it takes the public app
   offline and is not itself proof that an old in-flight provider call drained.
   Use an explicitly scheduled maintenance cutover, not an ordinary overlapping
   autoscale rollout, for the first transition.
2. **Shared remote document host is not live-qualified.** Tenant/signature
   compatibility, body limits, 250-page throughput, resumability, and capacity
   need actual configured host access; credentials must not be fabricated.
   Development and production have no document-service mode, URL, signing key,
   or byte-limit override configured. The remote path is off; local processing
   remains the configured path.
3. **Qualification is narrow.** Real mixed-file extraction, research/unknown-rate
   pricing, and broad estimate accuracy are outside this one approved-rate
   scenario. No claims about these follow from the successful mapping audit.
4. **Real delivery was intentionally not exercised.** Estimate/PDF/email/CRM
   payload capture passed; actual inbox and CRM acceptance remain untested.

No publication should be represented as safe until the cutover blocker is
resolved. No further paid call is necessary to reproduce the captured outputs.

## Verification and source delivery

- Final combined offline regression: 458 passed, zero failures or skips.
- TypeScript `--noEmit`: passed.
- Production Next build: passed, 251 pages.
- Credential-free estimator preview: HTTP 200; screenshot inspected.
- Live-result capture tests: 4 passed (included in the combined regression).
- No live scenario rerun is needed to validate capture or documentation changes.
- Synchronized commit/tree identity is reported with delivery.
  GitHub synchronization uses `[skip ci]`;
  local checks are not a claim that GitHub Actions ran.
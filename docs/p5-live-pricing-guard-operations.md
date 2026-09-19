# Live pricing qualification: blocked until authorization and reconciliation

This runner is not a completed real-provider qualification. No allowance has
been supplied or paid requests authorized by these changes. Do not run paid
qualification merely to generate an allowance or discover its cost bounds.

`scripts/check-p5-live-pricing.mts` requires both explicit live-run opt-in and
`P5_LIVE_PRICING_ALLOWANCE_FILE`. It reads a local approved configuration snapshot,
not customer databases. It imports no email or CRM transport and invokes no
delivery. This is not an end-to-end delivery interception test.

## Owner-reviewed allowance

The `Allowance` interface in `scripts/lib/livePricingGuard.mts` is the required
JSON contract. Supply authorization, expiry, USD budget and conservative per-call
amount as positive integer microdollars, and documented evidence that the bound
covers all input/output tokens, tools, continuations, tiers and provider charges.
Do not guess provider rates. Include exact endpoints, models, request byte and
output-token limits, local configuration path/hash, and reviewed source hashes
for the entire local import graph.

`requestBodySha256` must contain hashes of the exact canonical JSON bodies
prepared and reviewed **offline**. The entire body is pinned, including every
tool parameter, tool-use limit, service tier, input and unknown/future field.
Changed bodies cannot spend. Duplicate JSON keys and alternate token-limit
fields are rejected. Anthropic requires `max_tokens`; OpenAI Responses requires
`max_output_tokens`. An allowance cannot introduce arbitrary hosts. Only known
direct provider endpoints or the managed OpenAI endpoint actually selected by
the runtime integration key/base pair are eligible. No credentials belong in
allowances, evidence, output or logs.

Use one persistent, private, dedicated ledger directory per authorization;
preserve it across restarts. Do not move, reset, replace, delete, or clone it to
obtain a fresh budget. Existing document budgets and original verification
artifacts are not this ledger. The directory must be mode 0700; ledger files and
new report files are mode 0600. Source imports outside the canonical project root
or through symlinks fail closed. Source audit failures require review, not bypass.

## Conservative stopping and manual reconciliation

Every provider HTTP generation request reserves the full per-call bound on disk
under an exclusive transaction lock, with file and directory fsync **before**
transport. Redirects and other routes, including metadata, are denied without
spending. All continuations, fallback and normalization requests pass through
the same fetch guard.

**Every dispatched call is unresolved until explicit billing reconciliation,
even HTTP 200.** A successful response, token usage, timeout, malformed response,
or provider refusal is not billing evidence. The next paid request is blocked.
The runner does not poll for reconciliation or automatically resume a workflow;
it may exit before completing the first scenario. Full qualification remains
blocked pending authorized reconciliation and reviewed resumption planning.

An authorized operator must obtain immutable provider billing evidence and
review that the charge is at most the reservation. Preserve the evidence as
`<reservation-id>.billing-evidence` (UTF-8, mode 0600, create-exclusive), then
create an immutable `<reservation-id>.reconciled.json` (mode 0600) with:

- `reservationId`: exact existing reservation ID;
- `allowanceSha256`: SHA-256 of the original allowance bytes;
- `chargedAtMostMicrousd`: the full original reserved amount;
- `reviewedBy`: accountable operator identity;
- `providerEvidenceSha256`: SHA-256 of the exact evidence bytes.

These are operator-reviewed attestations, not automated provider verification or
cryptographically signed invoices. Ledger integrity relies on restricted local
filesystem access. Never edit existing records. An over-bound or unprovable
charge must remain blocked and be escalated; do not attest falsely or increase
the old allowance. Reconciliation never refunds the reservation: it permanently
counts against the remaining budget.

Unexpected IO failure/crash can leave `LOCK`. No stale timeout or PID check
removes it. Preserve it and all evidence for authorized forensic investigation;
there is no automated crash-lock recovery or reset command. Malformed/corrupt
ledger state fails closed with a controlled error. Do not remove records or
locks to force a run.

## Offline verification

Run only the simulated tests:

    node --import tsx --test scripts/test-p5-live-pricing-guard.mts

These use temporary ledgers and simulated transport, never real provider,
customer DB, email or CRM calls.
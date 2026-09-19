# Construction acceptance preparation

## Scope

This preparation repairs the customer-output boundary and CRM sender behavior,
adds isolated acceptance coverage and an authenticated runtime runner, and does
not authorize publication, new provider calls, customer records or real sends.
The concurrent GitHub email-delivery hardening change is preserved.

## Customer-output defect and correction

Construction shared the reported leak: saved customer assumptions could contain
`$2.00/LF ($200.00 direct cost)`. The prior qualification capture even allowed
internal amounts when they already appeared in customer prose.

Current customer projections allowlist public fields and remove financial cost
arithmetic from prose at pricing, saved-result responses, browser presentation,
PDF and email boundaries. Structured quoted selling totals/ranges and selling
unit prices remain unchanged. Quantities, scope, exclusions, nonfinancial
percentages and honest allowance caveats remain visible. Internal records and
administrative outputs retain costs and financial details.

Historical sealed qualification inputs and their accounting ledger are not
rewritten. Their current rendered customer output must satisfy the new boundary.

## CRM findings, read-only

The saved failed CRM job remained `needs-review`, with one attempt and
`fetch failed`. It was not replayed, reset, reconciled or marked successful.

The configured `leads.boiseconstruction.co` hostname failed local resolution.
Google public DNS independently returned NXDOMAIN, while the apex resolved.
Unauthenticated HEAD/OPTIONS checks therefore could not reach an HTTP receiver.
No alternate CRM host was substituted, and no bearer credential was transmitted.

The saved record occupies approximately 171 KB as database JSON text. Its
internal record contains approximately 51 KB of catalog snapshots and 67 KB of
line data, plus duplicated scope and lengthy warnings. The former sender also
duplicated internal JSON into a summary.

Related receiver source was inspected read-only in BRC-Lead-Dashboard:
`server/index.ts` uses Express JSON middleware without an increased limit
(default 100 KiB); `server/validation.ts` accepts a passthrough estimate object,
a 20,000-character summary and a 2,000-character project scope. This source
comparison is not proof of the unreachable Construction receiver's deployed
revision or settings.

The sender now creates an explicit compact projection: full scope, customer
estimate, all priced lines, financial summary, and an authenticated reference
to the complete retained administrative record. Omitted catalog snapshots and
detailed traces are labeled, not represented as a complete record. A 96 KiB
UTF-8 ceiling rejects oversize payloads before dispatch rather than silently
dropping scope or lines. Contact field limits also fail before dispatch.

Transport uses credential-free HTTPS URLs, refuses redirects, reports safe
nested error codes, and does not retry. HTTP errors, ambiguous acknowledgments
and absent/invalid record identifiers remain unconfirmed.

**Remaining operational blocker:** repair or confirm the intended receiver's
DNS/URL, then establish its actual deployed payload contract read-only. No
successful CRM delivery or connectivity is claimed by this preparation.

## Isolated verification

Portable fixtures exercise the real scope-pricing functions with simulated
semantic provider replies: material-plus-labor arithmetic, labor-only
responsibility, mutually exclusive options, missing rates and ambiguous units.
Negative cases use optimistic audit replies, so deterministic guards must block
unsupported totals. A separate explicit private-snapshot verification exercises
the same scenarios against the previously saved 185-rate catalog without
publishing that catalog or querying a provider.

Customer privacy tests cover selling-total preservation, prose leakage,
historical results, email and extracted PDF text. CRM tests cover payload size,
immutability, no-fetch rejections, transport errors and acknowledgment handling.
Authenticated runner tests cover credentials, revision checks, durable mutation
intents, QA routing, and refusal to repeat saved extraction.

These tests do not demonstrate new live model accuracy or inbox/CRM acceptance.

Preparation verification results:

- Combined credential-free regression: 494 passed, zero failures or skips.
- Final customer-boundary/pricing/PDF/capture regression: 65 passed.
- Portable pricing scenarios: 6 passed; explicit private-catalog scenarios:
  6 passed (separate from the portable fixture, no private catalog committed).
- Authenticated runtime runner: 11 isolated checks passed.
- Real authenticated review/submit/PDF handlers were exercised with PGlite and
  fake provider/transport boundaries, including invalid credentials, stale
  revisions, incomplete pricing and duplicate submission.
- Post-build route-type validation exposed two pre-existing helper exports in
  Next route modules. They were moved unchanged to a normal shared module;
  all 5 affected source-coverage checks passed.
- The no-em-dash source guard passed.
- Production build passed with 251 pages; TypeScript passed both before and
  after generation of Next route types.
- Credential-free estimator preview returned HTTP 200 and was visually checked.
  The temporary offline preview was stopped afterward and the original workflow
  configuration restored without starting credential-bearing workers.

The framework build is run using the credential-free offline runner, and
TypeScript is checked separately including generated Next route types.

## Genuine runtime acceptance still required

See `p5-authenticated-runtime-runner.md`. The runner uses normal authenticated
draft, review, pricing/submission and customer-PDF endpoints. There is no public
test endpoint, authentication bypass, database-key derivation or fake-success
delivery mode.

The existing QA draft can be used only with its original valid credential.
Its saved `QA TEST ONLY:` marker is supported without changing the scope or
contact name, and completed extraction must not be repeated. Missing credentials
stop the runner; creating a replacement session is not automatic.

After the receiver is repaired and publication separately authorized, a genuine
run still needs explicit provider/delivery authorization and a fresh read-only
receiver preflight. Successful pricing queues customer email, internal admin
email and CRM delivery through normal production behavior. The QA marker does
not suppress those destinations. There is no enforced monetary cap in this
runner. Submitted or ambiguous outcomes must be inspected, not blindly replayed.
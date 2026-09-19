# Shared document service integration status

## Boise mixed-reader routing and activation readiness

The opt-in adapter now partitions one saved project: eligible stored PDFs use
the shared reader; photos, spreadsheets and PDFs beyond the configured remote
byte limit use the existing local reader. Both branches receive the same project
text and answers. Separate durable checkpoints and a full-project fingerprint
allow reload/retry without discarding a completed branch. Only a completed,
verified set is merged through the existing scope evidence merger. Unread local
sections or preparation exceptions block mixed-project completion; unsupported
formats may require replacement/export rather than repeated retries.

Routing is snapshotted on the first coordinator checkpoint, with globally
disambiguated source names. A later byte-limit change neither moves sources nor
changes the work/queue identity. Deployed v1 queue identity is preserved.
Legacy v8/v1 or earlier limit-keyed checkpoints with the same source fingerprint
block automatic migration: their attempt accounting must be explicitly verified
before any new reader can start. This patch does not reset those budgets.
Local-only file analysis and pricing preflight also reject partial/mismatched
page coverage; genuinely typed-only projects do not require a page ledger.
Per-branch progress and aggregate page/section counters are saved together.

Limits are deliberately distinct: uploads allow 250 MiB per file, but the
existing shared-host default remains 50 MiB. A larger PDF is retained and routed
locally, not dropped. P5_DOCUMENT_SERVICE_MAX_BYTES can opt into a larger verified
host limit, up to the upload ceiling, but this change does not set it or prove
host support. No new host protocol fields, endpoint or page-limit negotiation
are assumed. Local office archive expansion/security limits remain in force.
Mock regressions verify all 250 returned PDF page records without truncation;
they are not evidence of live host throughput or acceptance of a 250-page plan.

The pure documentServiceReadiness helper checks only configuration shape:
HTTPS origin or /api/p5-documents base, no embedded credentials/query/fragment,
a signing key of at least 32 characters, and a valid byte limit. It returns no
secret or configured URL, and always reports hostVerified=false. Readiness
explicitly distinguishes off/local from invalid remote configuration. Activation
still requires separate authorized host verification of tenant/signature
compatibility, upload/proxy body limits, 250-page coverage and resumability,
capacity and provider budgets. This patch performs no activation, host repair,
secret change, live request, database write or paid AI verification.

2026-09-17 continuation, branch fix/shared-document-service-hardening-20260917.

Recovered the already merged opt-in adapter from current main. Updated only the shared adapter and its regression tests, plus verification workflow. The adapter queues reconciliation during upload, rejects partial/mismatched page coverage, deduplicates identical uploaded documents, validates configured byte limits, and confirms retries actually started. It remains disabled by default; PDF-only supported inputs use the remote path only with server configuration. Existing pricing, upload formats and brand settings are preserved.

CI verifies committed source using read-only credentials, including real isolated SQL adapter tests, estimator regressions and a production build. Semantic provider responses are fixtures, not live AI performance evidence. The maintained processor and full completion ledger live in webiq1206/p5-home-co under services/document-service and docs/p5-shared-document-service-progress.md.

User instruction: GitHub main only. The owner will pull and republish in Replit. No deployment, worker configuration or remote activation was performed. The separate worker must be provisioned and qualified before setting P5_DOCUMENT_SERVICE_MODE=remote. Publishing the website alone does not activate the new service. Live provider performance, real PDF/email delivery, rollback and browser acceptance remain deployment gates.

## Pricing coverage correction, 2026-09-18

The controlled P5 typed-scope QA journey produced an incomplete range: baseboard
material was omitted despite an explicit audit finding. The common pricing
implementation was byte-identical on this site. This scoped branch preserves
all site configuration and adds the shared coverage/retry correction.

Missing work, duplicate costs and quantity conflicts remain blocking; supported
planning allowances remain available. Research sees only actual positive priced
components. Explicit material cutting waste is checked against the installed
quantity and does not inflate installation labor. Saved timeout retries are
bounded to three real attempts and preserve successful stage work.

No remote adapter was enabled, no provider credential changed, and no database
or deployment configuration changed. No new paid infrastructure. CI must pass
estimator regressions, isolated SQL recovery, TypeScript and the production
build before merge. A merged branch is not a deployment. The owner must pull
main and republish through Replit before a controlled live price can be rechecked.
The parent repository ledger contains full observed QA evidence and outstanding
PDF, email, remote activation, performance and independently reviewed accuracy
qualification. Those remain open for this site.

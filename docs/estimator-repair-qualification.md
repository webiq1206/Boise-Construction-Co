# Estimator repair qualification

## Scope and safety

This qualification covers recovered estimator source, mixed PDF/photo/spreadsheet
identity, identical-byte deduplication, strict completeness, upload/page limits,
saved-draft recovery, retries, mobile submission, and QA-spend isolation.

Tests use synthetic records, temporary PGlite databases, mocked providers, and
captured delivery adapters. They do not authorize provider spending, customer
database changes, actual email/CRM delivery, publishing, or remote-reader activation.
Existing recovery material and accounting ledgers are not reset or replaced.

`scripts/offline-run.mjs` starts local tests/builds with a credential-free
environment and a Node network guard. Browser suites additionally intercept API
and cross-origin requests. The runner refuses real dotenv files. It is a
verification harness, not the production startup command.

## Repaired invariants

- Each unique physical source has an unambiguous identity. Duplicate bytes do not
  multiply quantities. Non-PDF sources require their own verified coverage.
- Empty, skipped, unreadable, failed, missing, or mismatched source coverage is
  not complete. Legacy plan/RE-10 routes retain unsupported attachments in
  completeness accounting rather than dropping them.
- P5 accepts up to 250 MiB per file and 1 GiB per upload batch. Document review
  has a 250-page project ceiling. Mixed-reader inventory is verified before
  either reader starts, not after paid analysis.
- The remote reader's configured byte limit is distinct from upload admission.
  The default remains 50 MiB; larger accepted PDFs stay on the local path.
- Draft recovery respects project-source namespaces, retains pending-file
  metadata, and requires reselection when browser storage could not save bytes.
  Resumable transfers preserve acknowledged segments and validate receipts.
- QA dollar reservations remain separate from customer pricing. QA allowances
  reject ambiguous/unreviewed request contracts and retain prior spending
  evidence. Ordinary customer estimates do not acquire a QA dollar ceiling.
- Reader configuration does not create fresh background-job accounting.
  A single matching old ledger is reused in place; duplicate matching ledgers
  block request-driven and autonomous execution without rewriting payloads.

## Deployment/activation gates that remain open

No publication or live qualification was performed.

Before deploying changed queue identity handling, quiesce old workers and avoid
overlapping old/new worker versions. New-code ambiguity checks cannot constrain
an old process that ignores them. Existing ambiguous ledgers require explicit
reconciliation; do not delete them or manufacture a fresh budget.

The shared document host still needs authorized verification of tenant/signature
compatibility, body limits, 250-page throughput, resumability, capacity, and
provider budgets. Configuration validation and fixture coverage are not live
connection evidence.

Real-provider accuracy and actual email/CRM delivery remain unqualified. Any paid
test requires a separately approved allowance and billing reconciliation under
`docs/p5-live-pricing-guard-operations.md`. A captured email/PDF fixture is not
proof of inbox delivery.

## Browser-suite accounting

The legacy calculator and RE-10 auto-advance interfaces are no longer mounted.
Their 25 historical tests are retained under explicitly skipped retired suites;
they are not counted as passing. Current public entry points and the P5
mobile/desktop, keyboard, submission gates, mixed-file reload, and quota recovery
paths are covered by current tests. Test fixtures use a construction scope
appropriate to this brand, rather than a handyman scope that correctly routes
to another estimator.

## Observed offline results, 2026-09-19

- Combined P5, isolated SQL/recovery, source-integrity, startup, QA guard, and
  captured-delivery run: 447 passed, zero failures or skips.
- After the final mobile fix, the P5 regression subset was rerun: 403 passed.
- Legacy estimator/pricing/coverage/delivery verification: 18 script suites
  passed. These include internal scenario assertions beyond the wrapper count.
- Current browser suite: 13 passed; 25 explicitly retired tests skipped.
  Current coverage includes 390px mobile and 1280px desktop.
- TypeScript `--noEmit`: passed separately; Next's build configuration skips
  type checking, so a build alone is not sufficient type evidence.

The final Git commit/tree identity and production-build result are reported with
the synchronization result, rather than embedding a self-referential commit
hash in this file. No live-provider performance or actual delivery is implied.
The synchronization commit uses `[skip ci]` to avoid launching unwrapped remote
automation during this no-paid-call qualification. These are local verification
results, not a claim that GitHub Actions ran.

## Reproducible offline commands

Use the checked-in runner with local dependencies already installed:

```sh
node scripts/offline-run.mjs test --test-concurrency=2 --import tsx \
  tests/p5-*.test.ts tests/document-source-integrity.test.ts \
  tests/analyze-route-source-coverage.test.ts tests/offline-safety.test.mjs \
  tests/instrumentation-startup.test.ts \
  scripts/test-p5-{background,document-adapter,document-adversarial,upload,upload-adversarial,resumable,receipt,pricing-work,pricing-identity,pricing-recovery,plan-rendering,origin,live-pricing-guard,workflow}.mts

node node_modules/typescript/bin/tsc --noEmit --pretty false
NODE_ENV=production node scripts/offline-run.mjs build

# Start a separate credential-free dev process after the build, then:
E2E_NO_WEBSERVER=1 E2E_BASE_URL=http://127.0.0.1:5000 \
  node scripts/offline-run.mjs e2e --workers=1
```

On Nix, set `PLAYWRIGHT_CHROMIUM_PATH` to the installed Nix-compatible Chromium.
Do not run development and production builds against the same `.next` directory
concurrently. The build command calls Next directly; it does not invoke
`npm run build`'s artifact-generating prebuild chain. Legacy estimator verification
scripts are checked separately.
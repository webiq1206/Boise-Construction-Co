# Boise Construction Co free-growth foundation

This engine prepares evidence-backed opportunities for boiseconstruction.co at zero provider spend. It does not acquire links, send outreach, submit listings, create schedules, or prove customer outcomes. The existing P5 growth workflow remains the sole live-execution owner.

## Supported commands

- `npm run backlink:preflight`: offline identity validation and explicit unresolved gates.
- `npm run backlink:test`: dependency-free regression tests; no network or database.
- `npm run backlink:run -- --dry-run`: validate and score local state without writes.
- `npm run backlink:run -- --import /private/path/candidates.json --dry-run`: validate a bounded import without writes.
- `npm run backlink:run -- --import /private/path/candidates.json`: save local preparation state only.
- `npm run backlink:score`: re-score local state without adding drafts.
- `npm run backlink:send`: always paused; setting `BACKLINK_SEND_ENABLED=true` fails closed.
- `npm run backlink:contacts`: explains the paused contact-discovery gate and performs no network access.

Existing `AHREFS_API_KEY`, `HUNTER_API_KEY`, `RESEND_API_KEY`, and `DATABASE_URL` values do not activate any of these commands. No new dependency, account, scheduler, migration, or provider allowance is required.

## Offline source contract

Imports use JSON with `brandId: "boise-construction-co"`, `kind: "known_urls"`, `observedOn: "YYYY-MM-DD"`, and up to 100 `records`, each containing a public HTTPS `sourceUrl` and optional Construction `targetUrl`. URLs containing credentials, a port, a query or fragment are rejected; keep private information out of source URLs.

A manually exported Search Console Links report may be transformed into the same records with `kind: "search_console_links_export"` and `property: "sc-domain:boiseconstruction.co"`. This is an explicit local import, not a Search Console backlink API. Record the actual export date. Neither import proves the link exists or is current. Repeated imports preserve prior review, suppression, pending state and receipts rather than resetting them.

Only editorial fit reviewed within 90 days and a free route verified within 30 days qualify for a local draft. Self-serve listings also require separate platform/DBA eligibility evidence. Authority, traffic and follow attributes remain null unless supplied as observed metrics with source URL and an observation date within 90 days; legacy numeric fields and estimates are ignored. Ranking uses reviewed topical fit, link context and geography, never invented DR or traffic.

## Brand, history and privacy

Identity is bound to Construction's canonical domain, public email, phone and home-building services. Public attribution is company-only and service-area based. No project photograph, license number, named person or street address is invented. Verified sources and date are recorded in `config/profile.json`.

Copied Remodeling data, old drafts/citation packets, old audit/disavow and paid/DB modules are preserved under `legacy/` as quarantined historical evidence. Active commands never read them. Reconcile prior contact/suppression receipts privately before any future dispatch repair; do not discard history just because a new adapter exists.

Operational outputs live in ignored `.backlink-state/` at the repository root. Do not commit private candidate contacts, receipts, analytics exports or credentials. Dry-run writes nothing. Local state is not durable scheduling, database health, production deployment, or measured growth. Concurrent writers are unsupported; the current workflow must retain one owner until a shared durable ledger is designed and tested.

## Acceptance and next gates

Focused tests prove identity isolation, free-only operation, unknown metrics, strict input validation, import deduplication and the permanent legacy send pause. No estimator, frontend, production schema, live listing, mail setting or workflow schedule is changed by this foundation repair.

Before authorized distribution: reconcile historical suppression and duplicates, verify separate listing eligibility and route freshness, prove the exact supported sender/consent/unsubscribe/capacity path, and verify receiving-system receipts. A submitted receipt, public listing, actual link, indexing, referral, accepted lead and qualified customer are different outcomes. Targets are goals, never guaranteed editorial acceptance or daily lead volume.

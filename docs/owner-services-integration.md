# Owner-service integration

The central `/instant-estimate` P5 iframe is unchanged. No local surcharge is
applied to that iframe or its messages.

## Local paths

- Scope/document estimates: the brand-owned database adapter transforms the two
  atomic estimate/outbox writes. Internal totals, customer totals and every queued
  delivery record are written together. The public submit and admin routes use
  brand-owned response adapters to return the saved result rather than the
  canonical engine's pre-adjustment result. Background completion uses the same
  database boundary.
- Consultation: the local cost resolver carries owner-service details through
  the internal estimate, range, admin view and internal team notes.
- Millwork/cabinet documents: the takeoff calculator applies one allocation to
  the whole priced project, outside margin and uncertainty multipliers.

No protected shared-engine file or manifest hash is changed. The persistence
adapter fails explicitly if the canonical write parameter contract changes.

## Pricing and credits

The approved policy is in `shared/ownerServices.ts`. Rates are final client
rates of $120/hour, not direct costs to mark up. The SKU/QBO mappings are
01-31-03/48, 01-31-04/49 and 01-31-05/47.

The legacy P5 overhead rate includes owner salaries but does not separately
quantify their share. Until the team enters an actual allocation, document
pricing conservatively credits available salary-inclusive overhead, capped by
the remaining owner-service charge. Consultation uses the legacy 20% overhead
recovery on the same conservative basis. This can reallocate existing recovery
instead of increasing the total. It is not a verified payroll allocation.

Authenticated document review input accepts `ownerServices.hours`,
`ownerServices.milestones` and `ownerServices.salaryOverheadRecovery`. Project
minima apply once, not once per milestone. Customer input does not set these
review options. SKU/QBO references accompany owner-service delivery lines;
acceptance by the live P5/QBO integration requires a separately authorized live
check.

Existing issued document estimates without this policy and signed/accepted
records are not retroactively changed. Finalized millwork jobs return their
saved results on finalization retries; legacy millwork repricing retains its
original owner-service treatment.

## Verification

Run `node --import tsx --test tests/owner-services*.test.ts
tests/p5-shared-engine.test.ts` and `npm run build`. The integration tests use an
isolated query-compatible pool, not customer records or external delivery.
They exercise the real brand database boundary, successful response adapter,
local cost resolver and millwork calculator.

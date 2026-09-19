# Authenticated P5 runtime acceptance

Preparation only is approved now. Do not run any live commands until a separate paid/provider/send authorization is granted. This runner uses the ordinary draft, scope, submit and customer PDF endpoints, not an admin override or public test endpoint.

## Existing credentials only

Obtain the original draft ID and raw key from the authorized browser owner’s existing credential file. Never recover or derive the key from a database hash. Keep an owner-only directory outside version control. The existing JSON credential file must be a regular file with mode `0600`, containing `baseUrl` (origin only), `id`, `key`, and `qaMarker`: either a unique marker matching `QA-` plus 8–80 alphanumeric/underscore/hyphen characters, or the exact existing scope prefix `QA TEST ONLY:`.

The already-saved project text must contain the unique QA marker, or start exactly with `QA TEST ONLY:` when that legacy marker is selected. Its contact email must be exactly `brostjared@gmail.com`. A legitimate existing contact name such as Jared is preserved; no name rewrite or re-extraction is required. The journal remains bound to the original draft ID, credential key, origin and marker. The runner will not rewrite someone else’s project into a QA record. If the original key is unavailable, stop. This version intentionally does not create replacement sessions: arrange any separately approved new QA draft through the normal UI, first reconciling whether the old draft was submitted. Never create another customer record simply to recover a lost response.

Offline preparation (does not fetch, create a draft, invoke providers, or send):

```
node --import tsx scripts/run-p5-authenticated-runtime.mts --prepare /secure/credentials.json /secure/journal.json
node --import tsx --test scripts/test-p5-authenticated-runtime.mts
```

Preparation exclusively creates a mode-0600 journal, bound to the origin, draft, key and marker. It refuses to overwrite existing evidence. Preserve this same journal for all later runs; do not delete, fork or hand-edit it to replay operations. Credential/journal paths and their parent directory must be trusted and owner-controlled.

## Later authorized execution

**Currently blocked: CRM receiver DNS NXDOMAIN is proven. Do not execute spend/send actions until receiver reachability is fixed.** There is no new readiness endpoint. Before any mutation, an authorized operator must perform an external read-only DNS and receiver HTTPS readiness check (no customer submission), and store a mode-0600 JSON attestation referenced by `P5_RUNTIME_RECEIVER_PREFLIGHT`. Required fields: `baseUrl` equal to the credential origin, `status: "reachable"`, `dns: "resolved"`, `readOnly: true`, `checkedAt` as an ISO timestamp within 15 minutes, and `evidence` containing at least 20 characters describing the actual receiver hostname, DNS and safe HTTPS check results. Do not fabricate this attestation while NXDOMAIN persists. This is an operator-attested preflight, not an independent or atomic guarantee against a subsequent outage.

Only after approval set `P5_RUNTIME_AUTHORIZATION` to exactly `I AUTHORIZE LIVE P5 PROVIDER COSTS AND QA DELIVERY`. Commands use the same two files:

* `--inspect`: authenticated read, validates existing state and reports revision. No submit status polling.
* `--analyze … EXPECTED_REVISION`: one authenticated multipart analysis request, only if no saved extraction, analyzed fingerprint or reviewed scope exists. Existing completed analysis is reused, never paid for again by this command.
* `--review … EXPECTED_REVISION`: confirms the currently saved answers using a normal revision-guarded PUT. Inspect the scope in the normal UI before explicitly approving this action. No fabricated clarifications or skipped validation.
* `--submit … EXPECTED_REVISION`: normal pricing and submission. This can incur provider costs and deliver to CRM, internal recipients and the allowlisted customer address through existing server configuration.
* `--pdf`: only for a submitted draft. Authenticated PDF download and in-memory PDF text checks; records a hash/size in the private journal, without modifying customer output files.

There is no automatic loop. A completed explicit `pending:true` response permits the same action to be continued manually with the latest authenticated revision. No `retry` flag is sent. Responses, including delivery evidence, remain in the private journal. Pricing questions or errors require operator review; the runner does not silently change answers.

## Crash, delivery and budget boundaries

An fsynced intent precedes each mutation. Network failure, malformed response, HTTP 5xx or crash leaves it blocked. Inspect/PDF remain possible; subsequent mutations are forbidden. An abandoned `.lock` or `.next` file requires human forensic reconciliation; never remove it to retry an ambiguous CRM/send. No reset command exists. A crash after response receipt but before durable journaling intentionally sacrifices automatic progress to avoid duplicate side effects.

The ordinary submit endpoint processes the outbox even when the draft was already submitted. Therefore this runner NEVER calls it for submitted drafts or polls delivery through it. Submitted-state inspection proves persistence, not receipt by every destination. Delivery status from the original successful submit is retained; pending/unknown delivery requires authorized operational investigation, not a second submit. No CRM retry/reset is implemented.

There is NO enforced monetary cap. One authorized request may trigger background jobs, provider retries or existing delivery workers. A stated approval budget is administrative only; provider-side limits or separate enforced metering are required for a hard cap. The recipient guard governs the saved customer address, not configured internal recipients, CRM routing, or concurrent external edits.

PDF text checks detect selected administrative labels and require the planning disclaimer; they are a smoke check, not exhaustive confidentiality proof. Manual customer-boundary inspection is still required. Until authorized live execution occurs, no real provider accuracy, delivery, PDF availability or end-to-end acceptance is claimed.
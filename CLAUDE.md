# Claude Code Project Instructions

## Instant estimator (`/instant-estimate`)

Owner decision, 13 November 2026: the family's central estimator is the primary
pricing call to action on this site.

* There is ONE estimator. It runs on p5homeco.com and is framed here:
  `components/estimator/EstimatorFrame.tsx` loads
  `https://p5homeco.com/estimator/embed?brand=construction&project=<id>`.
  Pricing, questions, property lookup, QuickBooks, lead delivery and attribution
  all happen there. Never copy estimator logic, pricing, questions or QuickBooks
  code into this repository. This site only frames it.
* `EstimatorFrame.tsx` is identical across the family sites. Do not edit it
  here; site differences are props. It stays in `components/estimator/`
  (the shared chrome in `components/family/` forbids the parent URL).
* `components/estimator/EstimatorAnalytics.tsx` forwards the estimator's events
  to this site's analytics. A lead conversion (GA4 `generate_lead`, Google Ads
  lead, Meta Lead, labelled `instant_estimator`) fires on `estimator_completed`
  only, once per page view. Never on another event.
* Central CTA: `lib/familyBrand.ts` `cta` (header, menu, bottom bar: "Instant
  estimate", `/instant-estimate`) and `shared/ctaCopy.ts` (`CTA_PRIMARY`, "Get
  an instant estimate"). Destinations and the service to project mapping are in
  `shared/instantEstimate.ts`. Projects for this brand: `custom-home`,
  `addition`, `garage-shop`, `adu`. ADU projects for the family run through
  this site, so the ADU page links `?project=adu`.
* A service with no estimator project (`home-plans-design`, `lot-evaluation`,
  `shop-homes-barndominiums`) keeps "Request a quote" to `/estimate`. Never send
  a visitor to an estimator that cannot price their project.
* Existing tools stay until the owner retires them: the `/estimate` quote
  request form (now the path to a person), `/estimate/scope` (emailed links),
  the homepage planning range explorer at `/#calculator`, the consultation
  forms, the chat assistant, uploads and every API route. Only primary CTAs
  were re-pointed. Working lead generation is not removed until the
  replacement is verified live.
* Guard: `tests/instant-estimate.test.ts` (`npm run verify:instant-estimate`,
  in prebuild).

Wording (this is advertising, accuracy matters):

* Allowed: "instant estimate", "instant preliminary estimate", "preliminary
  price range", "in minutes", "free", "any time, day or night", "no
  appointment", "no waiting for a callback", "on your own schedule", "before
  you talk to a contractor", "no obligation".
* Not allowed: calling it a quote, bid, final price, firm price or guaranteed
  price; any promise about how fast a person replies; "no contact information
  required" (the estimator asks for name, email and phone before it shows the
  range); a specific number of minutes or seconds; em dashes; "near me";
  invented numbers, counts, reviews or statistics.
* `scripts/verify-response-language.ts` enforces the quote, bid, final price
  and stated-minutes rules, and still enforces every reply-time, bonded, one
  contract or invoice and financing rule.

## One team email per request (owner decision, 17 November 2026)

A request form submission used to put two emails in the shared family inbox:
this site's own team email and the "New lead" email p5homeco.com sends when the
request is forwarded to its intake. The P5 email is the one that stays. This
site's team email is the FALLBACK.

* `server/services/p5IntakeBridge.ts` posts `team_alert: "confirm"`,
  `team_notes`, `team_internal_notes` and `estimate`, waits up to 30 seconds,
  and returns
  `{ forwarded, alert }`. `alert` is `sent`, `failed`, `none` or `unknown`
  (anything that is not exactly one of the first three, an HTTP error, a thrown
  fetch, a timeout). It never throws.
* `server/services/siteTeamEmail.ts` decides. `isSharedFamilyInbox()` is the
  one test for the shared mailbox (`hello@` at p5homeco.com, boisecabinet.co,
  boiseconstruction.co, boiseremodeling.co, boisehandyman.co, boiseadu.co, any
  letter case). `sendSiteTeamEmail()` waits for the bridge result: only `sent`
  leaves the shared inbox to P5, and any OTHER admin recipient still gets this
  site's email. Everything else, and a request that was never forwarded, sends
  it to every recipient as before. A lead must never end with zero team emails:
  when in doubt, send.
* Where it runs: Step 1 in `app/api/consultation/route.ts` (request, callback,
  request with a planning range), Step 2 in
  `server/services/consultationDetails.ts` and `consultationDetailsDelivery.ts`
  ("Details added"). The team email waits for the bridge inside `after()`.
  The visitor response, the local save, the lead dashboard forward and the
  customer's confirmation never wait on the bridge. Both responses report the
  team email as `deferred: true`.
* `server/services/consultationTeamNotes.ts` builds both lists of notes. The
  split between them is the rule: a "New lead" email is copied into HubSpot by
  P5's inbox sync, and costs and margins stay out of HubSpot.
  * `team_notes` (`buildConsultationTeamNotes`, `buildDetailsTeamNotes`;
    "From the website" in the P5 email): the lead dashboard link, the planning
    range the customer was shown, their selections, the county parcel record,
    how they found the site. NEVER a cost, margin, markup, profit, contingency
    or overhead number, and never pricing check text: a count that points at
    "Internal pricing". `fitTeamNotes()` leaves out any line naming one, and P5
    withholds such lines too. At most 40 lines of 300 characters.
  * `team_internal_notes` (`buildConsultationInternalNotes`; "Internal
    pricing" in the P5 email; owner decision, 17 November 2026): the "Internal
    breakdown (not shown to the lead)" block of this site's own team email, for
    a Step 1 request with a planning range only. Pricing checks in full first,
    then direct cost, contingency, total internal cost, gross profit, the
    margin label and the quoted range, then each trade's "our cost" and
    "customer" amounts, then the assumptions. Same source as the email
    (`resolveInternalEstimate`), so the two agree to the dollar. At most 60
    lines of 300 characters. When this list is present P5 sends "Lead and
    pricing: ..." and not "New lead: ...", and only "New lead" mail is copied
    into HubSpot. Nothing for a request without a range, nothing for Step 2.
  * Never move a line from the second list into the first, and do not repeat
    fields the bridge already sends.
* `estimate` (`buildConsultationEstimate` in the same file; owner decision, 13
  and 17 November 2026) is the planning range as figures, so P5 creates the
  QuickBooks customer and an UNSENT estimate. Step 1 with a planning range
  only: nothing for a callback, a request without a range, or Step 2 (the
  bridge refuses those too). `low` and `high` are the range the customer was
  shown; `verified: true` because the route recomputes the range on the server
  (`verifyEstimate`); `label` is project, finish and size; `lines` is one per
  trade with the CUSTOMER amount, from the same `resolveInternalEstimate` admin
  view as the team email's "Customer" column, adding up to the customer price
  that email shows, to the cent (the largest line takes what rounding leaves).
  CUSTOMER AMOUNTS ONLY: never our cost, a margin, markup, profit, contingency
  or overhead figure, and no such word in a title, description or label. The
  builder never throws: on bad figures it sends nothing, and when the trade
  split does not fit the shown range it sends the range without lines (P5 then
  uses the midpoint). P5 ignores an unverified total above 500,000 and any
  total above 5,000,000; large new builds here pass the first because they are
  verified.
* Other team emails do not go through this bridge and are unchanged: RE-10
  (`re10Lead.ts`), the estimator recovery and callback notices
  (`estimatorSessions.ts`) and the shared estimator in `lib/p5`.
* Guards: `npm run verify:p5-intake` (in prebuild):
  `tests/p5-one-team-email.test.ts`, `tests/p5-intake-bridge.test.ts`,
  `tests/p5-consultation-details.test.ts`. Tests use a fake fetch; never call
  the live intake.

## Scope and one total for customers (owner decision, 16 November 2026)

Every customer-facing estimate shows the full scope of work and ONE price (the
range, or a firm total) for the whole project: no line item, unit, category,
division, room, building or allowance price. This covers the framed instant
estimator (enforced on p5homeco.com) and this site's copy of the shared
document estimator (`lib/p5`: `/estimate/scope`, staff-published estimates,
the customer email, PDF and saved links). `customerPresentation()` in
`lib/p5/customerProjection.ts` is the one customer boundary; edit it in
p5-home-co and apply the same change here, then update
`lib/p5/shared-manifest.json`. Internal records, team emails, the
administrative PDF, the admin page, the CRM payload and QuickBooks keep every
price.

## Publishing to Replit: never approve a DROP

Replit's Republish compares the development database with production and
proposes a migration for the difference. A development database that is behind
makes Replit offer to `DROP TABLE` live tables. On 13 November 2026 this nearly
deleted a real customer estimate on p5homeco.com: the code was pulled and
published without the step below.

Every time, in this order, in the Replit workspace:

1. Pull the latest `main` into the workspace. Redeploy ships the workspace, not GitHub.
2. Run `npm run db:push` against the DEVELOPMENT database, so it matches the drizzle schema in shared/schema.ts.
3. Republish, and read the database step before approving. Approve only "no
   changes" or `CREATE` and `ADD COLUMN` lines you expect.
4. If it shows `DROP` or anything destructive, cancel and stop. Do not publish.

This applies whoever does the pull: a person, Replit's assistant or Claude.
Never run a schema command against the live database. The same checklist is in
`replit.md`, which Replit's assistant reads.

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

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
  (`re10Lead.ts`) and the estimator recovery and callback notices
  (`estimatorSessions.ts`). The shared document estimator in `lib/p5` also
  emails the team itself, and its leads reach P5 by their own path, with
  `team_alert: "site"` so P5 sends no second email: see "The document
  estimator's leads go to P5".
* Guards: `npm run verify:p5-intake` (in prebuild):
  `tests/p5-one-team-email.test.ts`, `tests/p5-intake-bridge.test.ts`,
  `tests/p5-consultation-details.test.ts`. Tests use a fake fetch; never call
  the live intake.

## The document estimator's leads go to P5 (owner decisions, 13, 17 and 18 November 2026)

Every project request and every estimate the shared document estimator
(`lib/p5`, `/estimate/scope`) takes on this site becomes a P5 lead and a
HubSpot deal, and a priced estimate becomes a QuickBooks customer with an
UNSENT estimate, with ONE team email. P5 creates all of it; this site only
posts to P5's public lead intake (`https://p5homeco.com/api/leads/intake`).
The contract belongs to p5homeco.com (`docs/lead-intake-contract.md` there).

* The switch is the site's existing setting, `P5_CRM_DELIVERY=on`, already set
  in production (owner, 18 November 2026). There is no second switch: with the
  code live, both paths below are active. Off means nothing is posted.
* Project request (unpriced, "Send project request"): the `crm` channel in
  `lib/p5/intakeDeliveryRuntime.ts` (brand-owned) is the shared
  `p5LeadIntakeTransport()`. It posts form `p5-project-request`, the brand of
  the PRIMARY TEAM the request was routed to (an addition is "Boise
  Construction Co", a kitchen taken here is "Boise Remodeling Co"), the
  request's lead key as `external_id`, and `team_alert: "site"` because this
  site's own `team` channel has already emailed the team. Never a price.
  Without the variable the channel reports `crm-disabled`. Only requests saved
  since 18 November 2026 are sent (`PROJECT_REQUEST_LEADS_SINCE`);
  `P5_REQUEST_LEADS_SINCE` (an ISO moment) brings older ones in on purpose.
* Published estimate (staff price the request and publish): `syncCrm()` in
  `lib/p5/deliveryAdapter.ts` (brand-owned) calls the shared
  `forwardEstimateToP5()` with `brand: "Boise Construction Co"`. It posts form
  `p5-estimator`, `team_alert: "site"`, `request_external_id` (the lead key of
  the request it answers, so request and estimate are ONE lead) and `estimate`
  of kind `document`: the range the customer was shown, the contract price,
  and one line per priced line. CUSTOMER AMOUNTS ONLY: never a cost, margin,
  markup, profit, contingency or overhead figure. It throws a short error when
  P5 refuses, so the outbox marks the job for review. The forwarder is loaded
  with `await import()`, never a static import: the shared
  `tests/p5-intake-reply-to.test.ts` runs the adapter in a VM with a fixed
  dependency list.
* The old lead dashboard (`LEAD_DASHBOARD_API_URL`, `brand.crmUrl`) is no
  longer called for a published estimate. The request form's own forward in
  `server/services/leadDashboardForward.ts` is a different path and is
  unchanged. The canonical review receiver (`canonicalReviewTransport.ts`) is
  not used and stays gated; do not activate it.
* A synthetic QA record is never posted. A repeat is safe: P5 keeps one lead
  per brand and `external_id`.
* Shared files, edited in p5-home-co only and hash-checked here
  (`lib/p5/shared-manifest.json`): `lib/p5/p5LeadIntake.ts`,
  `lib/p5/documentEstimateFigures.ts`, `lib/p5/manualReview.ts`,
  `lib/p5/submitEndpoint.ts` (the last two stamp the record's `projectId`),
  `tests/p5-lead-intake.test.ts`. `lib/p5/intakeCrmValidation.ts` is
  brand-owned: its check is the transport's own `projectRequestHold()`.
* Guards: `tests/p5-intake-local-crm.test.ts` (brand-owned: this site's runtime
  and adapter) and `tests/p5-lead-intake.test.ts` (shared builders). Both use
  a fake fetch; never post a test to the live intake.

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

## Interior page refinement (owner approval, 19 November 2026)

Service, city and area landing pages, blog articles and guides were refined to
the homepage standard, matching boise-remodeling-co. Styles live in
`app/interior-refinement.css` (imported last in `app/layout.tsx`); the homepage
layout is untouched.

* Landing template (`components/seo/LandingPageTemplate.tsx`): a fact row under
  the hero (`.lx-facts`, wording already used elsewhere on the page), benefits
  two across on phones, process steps that swipe on phones, and questions as
  native `<details>` so every answer stays in the HTML.
* The page ends with ONE onward-links block, "Keep exploring"
  (`components/seo/RelatedLinks.tsx`): places and services as photo cards (a
  swipe row on phones, balanced rows from tablet up) that keep their full
  anchor text for search, guides and articles as one list with thumbnails, and
  no link shown twice. Do not stack separate link lists under it again.
  `.lx-cell` stays `position: relative`: without it the hidden anchor text
  escapes the swipe row and widens the page on phones.
* Phones keep copy before the photograph in the landing hero (the earlier
  hero budget decision); do not put the image first.
* Articles and guides: quiet header and date line, one "On this page" row on
  phones, downloads and the guide note after the article, one estimate prompt
  at the end on phones, related pages with their photographs. On desktop the
  reading column and the sticky rail fill the container.
* `.guide-section-details[open] .guide-section-summary > span` keeps the child
  combinator: without it the rule hid the last two words of every article
  heading (`.m-keep`).
* City page photographs: `SERVICE_ROTATION` in `shared/cityServiceImages.ts`
  was widened with photographs from the owner's Photo Dump (Drive, "2026-11
  Instant estimate and website photos") so the nine city pages of a service
  show nine pictures where the service has that many, and ADU city pages no
  longer share one photograph. A new file needs a description in
  `shared/imageAlts.ts`.
* Image alt text is local. Every content image's alt is "<work> in <city>,
  Idaho: <what the picture shows>", built by `localAlt()` in
  `shared/localAlt.ts`. `contentImageAlt()` and `getBlogImageAlt()` apply it; a
  page passes its own service and city, a post's topic tags supply them
  otherwise, and Boise is the default place. `imageDescription()` returns the
  plain description. Owner direction: no qualifier ("idea", "concept",
  "representative", "inspiration") in or beside an image description. Brand
  lockups in the shared header and footer keep an empty alt because their link
  carries the company name. Guard: `tests/local-alt.test.ts`.
* Index cards are compact rows on phones (19 November 2026). Blog, guide, area
  and service index cards carry `lx-blog-card` (photo `lx-blog-photo`, body
  `lx-blog-body`) and collapse at 700px and under to a thumbnail beside the
  title. A guide card has no whole-card link, so its "Read guide" link
  (`lx-guide-link`, named by `aria-label`) is stretched over the row. The
  seven area cards sit in `ed-cards-3`, which balances them 2+2+3; do not put
  them back in a plain three-column grid, which leaves one card alone.
* Stand-alone text links on interior pages are at least 44px tall below 1024px
  (`app/interior-refinement.css`). A link inside a sentence is exempt. Never
  apply the rule to a link that wraps a whole card.

## A replaced photograph gets a new URL (19 November 2026)

The image optimizer answers with `Cache-Control: public, max-age=31536000`
in production (`minimumCacheTTL` in `next.config.js`) and keys its disk cache
by the image URL. A photograph replaced under the same file name keeps its URL,
so returning visitors could keep seeing the old picture for up to a year.

* `components/VersionedImage.tsx` wraps `next/image` and adds
  `?v=<content hash>` to every replaced file (`lib/imageVersion.ts`). Import it
  instead of `next/image`; `tests/image-versions.test.ts` fails on a direct
  import outside `components/family`.
* The list is `shared/generated/imageVersions.ts`, written by
  `npm run images:versions` (`scripts/build-image-versions.mjs`), seeded with
  the 60 images replaced since 1 November 2026. `shared/generated/imageHashes.json`
  remembers every file's content; a file that later differs joins the list and
  stays on it. Run the script after adding or replacing an image. A file never
  replaced keeps its plain URL.
* Page URLs, sitemaps, structured data, alt text (`shared/imageAlts.ts`) and
  picture identity keep the plain path. The version exists only where the
  image is handed to `next/image`.
* `images.localPatterns` is `[{ pathname: '/**' }]` with no `search`, which
  allows the query string; Next 15 warns without it and Next 16 refuses.
  Never set a custom `images.loader`: it turns the `/_next/image` route off.
* The shared `components/family/HeroPhoto.tsx` imports `next/image` directly
  and is not edited here; nothing in this site calls it. The approved homepage
  photographs under `public/family` are plain `<img>` tags, which are not
  cached this way; they are in the list all the same.
* Guard: `npm run verify:image-versions` (in prebuild).

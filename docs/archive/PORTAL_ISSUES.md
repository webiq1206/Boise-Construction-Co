# Portal Issues List (Admin + Subcontractor + Quote Wizard)

This is the working list of issues discovered during end-to-end QA. Each issue includes **what**, **where**, and **impact**, plus current **status**.

## Blockers

## High

_None currently._

## Medium

_None currently._

## Low

## Fixed (verified by typecheck)
- **FIXED-HIGH-001 — Quote wizard submits quotes without server pricing → leads priced at $10**
  - **Where**:
    - UI: `/get-quote` → `client/src/components/SimpleQuoteWizard.tsx`
    - API: `POST /api/quotes` (`server/routes.ts`)
  - **What**: If the client omits `finalQuote`/`lineItems`, the server now auto-calculates pricing from `selectedServices + serviceData` before creating the lead.
  - **Impact**: Prevents marketplace economics break (no more “everything is $10” leads).
  - **Verification**: `scripts/qa_api_e2e.ts` asserts created lead `baseLeadPrice/currentLeadPrice > 10` when pricing is omitted but measurements are present.

- **FIXED-HIGH-002 — Admin dashboard tab counts can be incorrect after switching tabs**
  - **Where**: `client/src/pages/AdminDashboard.tsx`
  - **What**: Counts are now computed from the full filtered set (search/filter/sort) rather than the active tab slice.
  - **Impact**: Admin KPIs remain accurate while switching tabs.

- **FIXED-MED-001 — Subcontractor portal agreement state may not reflect server state on initial load**
  - **Where**: `client/src/pages/SubcontractorPortal.tsx`
  - **What**: Agreement gating now derives from `GET /api/user` and keeps the modal checkbox state separate/synced.
  - **Impact**: Removes confusing “blocked even though accepted” UX.

- **FIXED-MED-002 — Email sending fails noisily in non-configured environments**
  - **Where**: `server/resend.ts`, `server/services/emailNotifications.ts`, `server/email.ts`
  - **What**: When `RESEND_API_KEY` (or Replit connector creds) are missing in non-production, email becomes a safe no-op with a single warning.
  - **Impact**: QA/dev logs stay readable; production still requires real config.

- **FIXED-006 — Accept agreement endpoint logged full claims payload**
  - **Where**: `server/routes.ts` (`POST /api/user/accept-agreement`)
  - **What**: Removed verbose logging of claims and reduced logs to dev-only.
  - **Impact**: Avoids leaking PII into production logs.

- **FIXED-001 — Quote wizard uses non-existent `MeasurementBundle` fields**
  - **Where**: `client/src/components/SimpleQuoteWizard.tsx` (serviceData payload)
  - **What**: Referenced `measurementBundle.perimeterFt` and `measurementBundle.hedgeLengthFt`, which do not exist on `MeasurementBundle`.
  - **Impact**: TypeScript build fails; quoting flow cannot ship reliably.
  - **Fix**: Use `lotPerimeterFt` and `estimatedHedgeFt`.

- **FIXED-002 — Quote wizard does not show quote reference ID**
  - **Where**: `client/src/components/SimpleQuoteWizard.tsx` (`onSuccess`)
  - **What**: UI expected `response.id` but backend returns `quoteId`.
  - **Impact**: Users can’t easily track quote status with the provided reference.
  - **Fix**: Set `quoteId` from `response.quoteId || response.id`.

- **FIXED-003 — Dev/test harness role checks could fail for session-only auth**
  - **Where**: `server/replitAuth.ts` (`requireRole`)
  - **What**: `requireRole` required `req.user.claims.sub` even in dev sessions created via `/api/auth/test-login`.
  - **Impact**: Admin/subcontractor endpoints can 401/403 in dev QA mode, blocking deterministic testing.
  - **Fix**: Allow role checks to read `req.session.passport.user.claims.sub` in development.

- **FIXED-004 — Stripe keys missing could crash runtime**
  - **Where**: `server/routes.ts` (`new Stripe(process.env.STRIPE_SECRET_KEY!)`) and client `StripePaymentForm`
  - **What**: Stripe clients were created unconditionally and could crash or break flow when keys aren’t present.
  - **Impact**: Non-payment QA and local/dev environments are blocked.
  - **Fix**: Make Stripe optional and return clear `503` on payment endpoints; client shows a clear message if publishable key missing.

- **FIXED-005 — `GET /api/leads/watchlist` and `GET /api/leads/purchases` were shadowed by `GET /api/leads/:id`**
  - **Where**: `server/routes.ts`
  - **What**: The parameter route `GET /api/leads/:id` matched `watchlist`/`purchases` and returned 404 “Lead not found”.
  - **Impact**: Watchlist and purchase history endpoints were effectively broken.
  - **Fix**: Make `GET /api/leads/:id` fall through for `id === "watchlist" || id === "purchases"`.


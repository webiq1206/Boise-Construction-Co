# Portal QA Matrix (Admin + Subcontractor + Quote Wizard)

This document maps user-facing features in the compliance-focused admin and subcontractor portals, lead marketplace, and quote wizard.

## Portal navigation (2026 overhaul)

### Admin Portal (primary → secondary)
| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Compliance dashboard (COI/W-9 KPIs, contractor status, contracts, projects) |
| `/admin/projects` | Project list |
| `/admin/projects/[id]` | Project detail (scope, assignments, change orders, documents) |
| `/admin/contracts` | Contract templates and workflow |
| `/admin/contractors` | Contractor management + compliance doc review |
| `/admin/leads` | Lead marketplace (secondary) |

### Subcontractor Portal (primary → secondary)
| Route | Purpose |
|-------|---------|
| `/subcontractor` | Home dashboard (compliance status, projects, contracts) |
| `/subcontractor/compliance` | COI and W-9 upload |
| `/subcontractor/projects` | Assigned projects |
| `/subcontractor/projects/[id]` | Project scope, change orders, documents |
| `/subcontractor/contracts` | Review and sign contracts |
| `/subcontractor/leads` | Lead marketplace (secondary) |
| `/subcontractor/purchases` | Purchase history |

### Cron jobs
- `POST /api/cron/compliance-reminders` — daily compliance expiration reminders (Bearer `CRON_SECRET`)
- `POST /api/leads/auto-archive` — archive stale available leads

### Compliance APIs
- `GET /api/compliance` — subcontractor compliance docs + summary
- `GET /api/admin/compliance/dashboard` — admin compliance KPIs
- `POST /api/admin/compliance/documents/[id]/review` — approve/reject COI or W-9
- `GET /api/admin/compliance/export` — CSV export
- `POST /api/documents/upload` — upload compliance or entity documents

### Project & contract APIs
- `POST /api/admin/leads/[leadId]/convert-to-project` — one-click lead → project
- `GET/POST /api/admin/projects`, `GET/PATCH/POST /api/admin/projects/[id]`
- `GET/POST /api/admin/contracts` — templates, create, send, void
- `GET/POST /api/contracts` — subcontractor list + sign
- `GET /api/projects`, `GET /api/projects/[id]` — subcontractor project access

## Admin portal (`/admin/dashboard`, `/admin/leads`)

### Access & auth
- **Route(s)**: `/admin/dashboard`, `/admin/analytics`
- **Frontend auth source**: `useAuth()` → `GET /api/auth/user` (`client/src/hooks/useAuth.ts`)
- **Backend auth**: `isAuthenticated` + `requireRole(["admin"])` for privileged actions (`server/replitAuth.ts`, `server/routes.ts`)
- **Expected**:
  - Admin can view full lead contact info and perform accept/decline/update actions.
  - Non-admin should not be able to perform admin actions (server blocks); ideally should not see admin UI/actions (UX gate).

### Leads listing + filtering + sorting (Admin Dashboard)
- **UI**: search bar, filters, sort toggles, tabs
- **Data source**: `GET /api/leads` (enabled when `isAuthenticated`)
- **Backend behavior**: returns full leads for admins, masked fields for others (`server/routes.ts` “masking” logic)
- **Expected**:
  - Search filters match across name/email/phone/address/city.
  - Filters do not crash if tags/notes are missing/malformed.
  - Sorting is stable and correct for date/quote/leadPrice/age.

### Lead card actions (Admin Dashboard)
- **Accept Lead**
  - **UI**: “Accept Lead” button
  - **API**: `POST /api/leads/:id/accept`
  - **Expected state transition**: `pending_admin → accepted`
  - **Side effects**: customer status update email (if quote linked), admin toast, refresh list
- **Decline (Send to Subcontractors)**
  - **UI**: “Decline (Send to Subcontractors)” button
  - **API**: `POST /api/leads/:id/decline`
  - **Expected state transition**: `pending_admin → available`
  - **Side effects**: subcontractor notifications + emails, customer status update email, start price decay clock
- **Add note**
  - **UI**: “Add Note” modal
  - **API**: `POST /api/leads/:id/notes`
  - **Expected**: note appended with `addedBy` + `addedAt`, visible in UI
- **Update priority**
  - **UI**: flag icon → select priority
  - **API**: `PATCH /api/leads/:id` (admin only)
  - **Expected**: persists and appears in card + filters
- **Update tags**
  - **UI**: tag icon → add/remove tags
  - **API**: `PATCH /api/leads/:id` (admin only)
  - **Expected**: persists, filterable, no crashes if stored as JSONB vs string
- **Export CSV (bulk)**
  - **UI**: “Export to CSV”
  - **Expected**: downloads CSV with correct escaping/headers and includes all filtered leads

### Analytics (Admin Analytics Dashboard)
- **UI**: summary cards, status breakdown, top cities, service distribution
- **Data source**: `GET /api/leads` (enabled only when `isAuthenticated && isAdmin`)
- **Expected**:
  - Counts and percentages are correct even when `leads.length === 0` (avoid divide-by-zero).

### Notifications (Admin & Subcontractor)
- **UI**: bell icon + popover list
- **API**:
  - `GET /api/notifications`
  - `POST /api/notifications/:id/mark-read`
- **Expected**: unread count accurate; mark-read enforces ownership; “Open” link navigates to relevant portal.

## Subcontractor portal (`/subcontractor/portal`, `/subcontractor/purchases`)

### Access & auth
- **Route(s)**: `/subcontractor/portal`, `/subcontractor/purchases`
- **Frontend auth**: `useAuth()` → `GET /api/auth/user`
- **Backend auth**:
  - All lead browsing: `GET /api/leads?availableOnly=true` requires `isAuthenticated`
  - Watchlist/purchase endpoints require `requireRole(["subcontractor"])`
- **Expected**:
  - Subcontractor can browse available leads with contact info masked.
  - After purchase, contact info is revealed for that lead only (purchaser).

### Browse marketplace (Available Customers tab)
- **UI**: search, filters, quick filter buttons, sorting, stats
- **Data source**: `GET /api/leads?availableOnly=true`
- **Expected**:
  - Only `status === "available"` leads appear.
  - Lead price shown matches `currentLeadPrice`, discount reflects base vs current.
  - Project value uses `finalQuote` (range), not “Pending” if quote exists.

### Watchlist
- **UI**: Eye/Star button to watch/unwatch; Watchlist tab
- **API**:
  - `POST /api/leads/:id/watch`
  - `POST /api/leads/:id/unwatch`
  - `GET /api/leads/watchlist`
  - `GET /api/user` (to compute watched IDs list)
- **Expected**:
  - Watch/unwatch updates immediately and persists across reload.
  - Watchlist only contains available leads (per backend filtering).

### Legal agreement gating
- **UI**: banner + modal + checkbox + “Accept Agreement”
- **API**: `POST /api/user/accept-agreement`
- **Expected**:
  - User must accept agreement before attempting to purchase.
  - Agreement acceptance persists (reflected in user record).

### Purchase flow (Stripe)
- **UI**: purchase modal → proceed to payment → Stripe PaymentElement → success
- **API**:
  - `POST /api/create-payment-intent` (requires subcontractor + agreementAccepted)
  - `POST /api/leads/:id/purchase` (requires subcontractor; verifies PaymentIntent succeeded)
- **Expected**:
  - Payment intent amount equals displayed `currentLeadPrice`.
  - On success, lead becomes `purchased` and contact info is revealed.
  - On failure/cancel, UI returns to confirm step cleanly.
  - **Note**: currently blocked if Stripe keys are not configured; QA harness must gracefully disable.

### Purchase history
- **Route**: `/subcontractor/purchases`
- **API**: `GET /api/leads/purchases`
- **Expected**:
  - Shows all purchases with full contact details for purchased leads.

## Lead quote wizard (`/get-quote`) + quote status (`/quote-status/:quoteId`)

### Quote wizard flow (SimpleQuoteWizard)
- **Route**: `/get-quote` (`client/src/pages/GetQuote.tsx` → `SimpleQuoteWizard`)
- **Phases**:
  - **Phase 1** (Property): city, address autocomplete, assessor lookup, property type selection
  - **Phase 2** (Services): intent-based recommendations, manual add/remove services, frequency selection, estimate display
  - **Phase 3** (Review + Submit): summary, contact form, submit
- **Assessor lookup** (client-side):
  - Ada County: `fetch()` to external assessor service (`client/src/lib/adaCountyAssessor.ts`)
  - Canyon County: currently returns helpful “manual entry required” messaging (`client/src/lib/assessors/canyonCountyAssessor.ts`)
- **Submission**:
  - **API**: `POST /api/quotes` (creates quote + lead)
  - **Expected**:
    - Stored quote contains pricing + line items (either computed server-side or provided).
    - Created lead has non-trivial `finalQuote` and correct `baseLeadPrice/currentLeadPrice`.
    - UI displays returned quote reference ID.

### Quote status tracking
- **Route**: `/quote-status/:quoteId`
- **API**: `GET /api/quotes/:id/status`
- **Expected**: status text updates according to lead lifecycle:
  - `pending_admin` / `available` → `under_review`
  - `accepted` / `purchased` → `contact_soon`

## Automations (background jobs)

### Daily lead price reduction
- **Schedule**: daily at 2 AM (`server/cron.ts`)
- **Logic**: `server/services/leadPricing.ts` updates `currentLeadPrice` for `available` leads; rounds down; floor 20% base
- **Expected**:
  - Prices drop once per day at most.
  - Watchers receive notifications (`lead_price_drop`).

### Auto-decline pending leads
- **Schedule**: runs hourly; declines leads pending ≥ 24h (`server/cron.ts`)
- **Logic**: `pending_admin → available`
- **Expected**:
  - Lead becomes available to subcontractors; notifications/emails sent.

## End-to-end test matrix (execute in order)

### Automation helpers
- **API E2E (in-process, no dev server required)**: `npm run qa:api:e2e`
- **UI smoke tests (Playwright)**: `npm run test:e2e` (requires `npx playwright install` once)

### Auth & roles
- [ ] Dev auth: login as admin (`/api/auth/test-login` with `admin-temp-id`)
- [ ] Dev auth: login as subcontractor (`/api/auth/test-login` with `sub-temp-id`)
- [ ] OIDC smoke: login via `/api/login` (when configured)
- [ ] Non-admin cannot call admin endpoints (403) and UI handles gracefully

### Quote wizard → quote → lead
- [ ] Phase 1: address autocomplete suggests results and selection populates address
- [ ] Phase 1: manual “Use this address” triggers lookup fallback when needed
- [ ] Phase 1: Ada County address produces measurement bundle with “Verified/Estimated” badge
- [ ] Phase 1: Canyon County city produces helpful messaging and still advances with fallback bundle
- [ ] Phase 2: selecting intent adds recommended services (no duplicates)
- [ ] Phase 2: add/remove services works; count badge updates
- [ ] Phase 2: frequency selection updates estimate range
- [ ] Phase 3: required fields validate (name/email/phone)
- [ ] Submit quote: receives success response and displays quote reference ID
- [ ] Submit quote: backend creates lead with correct status `pending_admin` and non-null `finalQuote` where applicable
- [ ] Quote status page: `GET /api/quotes/:id/status` works with real IDs and displays accurate status

### Admin dashboard
- [ ] Counts and tab labels are correct (pending/accepted/available/purchased)
- [ ] Search works on multiple fields
- [ ] Filters: service/city/age/priority/tags; clear filters resets correctly
- [ ] Bulk accept/decline acts on filtered pending leads only and updates list
- [ ] Lead card: breakdown collapsible renders; measurements show; mailto/tel links correct
- [ ] Notes: add note persists and displays
- [ ] Priority and tags persist and remain filterable

### Subcontractor portal
- [ ] Browse: available leads render with masked contact info
- [ ] Watch/unwatch toggles and persists; watchlist tab shows only watched available leads
- [ ] Agreement modal: accept agreement updates user record and unblocks purchase attempt
- [ ] Purchase history page loads and displays purchases correctly (when purchases exist)

### Automations
- [ ] Auto-decline moves stale pending leads to available (verify in DB + UI)
- [ ] Daily price reduction decreases price, rounds correctly, and creates watcher notifications


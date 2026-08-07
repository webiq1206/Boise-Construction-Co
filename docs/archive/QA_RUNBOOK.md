# QA Runbook (Admin + Subcontractor + Quote Wizard)

## Local dev start

```bash
npm install
npm run dev
```

## Backend API E2E QA (no browser required)

Runs a deterministic, in-process API test suite (auth, seed, admin actions, subcontractor flows, quote pricing + quote status).

```bash
npm run qa:api:e2e
```

## Deterministic dev auth (no OIDC needed)

In development, open:

- `http://localhost:5000/__dev__/login`

Use:
- **Login as Admin** → routes to `/admin/dashboard`
- **Login as Subcontractor** → routes to `/subcontractor/portal`

## Seed sample leads (dev-only)

1. Login as Admin in `__dev__/login`
2. Click **Seed sample leads**

This seeds:
- 1 `pending_admin` lead (visible in admin dashboard pending tab)
- 1 `available` lead (visible in subcontractor portal)
- 1 `purchased` lead (shows up in subcontractor purchase history for `sub-temp-id`)

## Notes on Stripe/payment testing

If `STRIPE_SECRET_KEY` (server) and `VITE_STRIPE_PUBLISHABLE_KEY` (client) are **not** set:
- The app will still run and non-payment flows can be fully tested.
- Purchase/payment endpoints return **503** with a clear message.

Once keys are available, run end-to-end purchase tests through the subcontractor portal.

## Playwright UI smoke tests (browser)

First-time setup (installs browsers):

```bash
npx playwright install
```

Run tests:

```bash
npm run test:e2e
```

Optional:
- Set `E2E_BASE_URL` to point at an already-running server (and set `E2E_NO_WEBSERVER=1` to prevent Playwright from starting one).

## Primary QA docs

- Feature-to-API mapping + test matrix: `PORTAL_QA_MATRIX.md`


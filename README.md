# Boise Construction Co

Treasure Valley residential new construction: custom and semi-custom homes, design-build, and pre-construction planning. Also runs a separate RE-10 inspection-repair service for real estate transactions.

The operating brand is **Boise Construction Co** and the site runs on its own domain, `boiseconstruction.co` (the canonical value in `shared/siteConfig.ts`, which every canonical URL, sitemap entry, OG URL, and schema `@id` is built from). It was created by duplicating and rebuilding the separate `boiseremodeling.co` remodeling site, so shared code and some internal notes still reference that origin. Those references are expected, not a mistake.

## Development

```bash
npm install
npm run dev          # http://localhost:5000
npm run build
npm run test:e2e:install   # first time only (Playwright browser)
npm run test:e2e -- e2e/calculator.spec.ts
```

E2E tests use port **3456** by default (macOS often reserves 5000 for AirPlay).

## Working inside a synced folder (Dropbox / OneDrive / iCloud)

If this checkout lives inside a sync client's tree, the client will fight Next
for the files under `.next`, locking and re-uploading manifests mid-build. That
surfaces as `UNKNOWN: unknown error, open .next\...manifest.json` and a dev
server that returns 500s at random. `next dev` recreates `.next` on every start,
so a one-time cleanup does not hold.

Next resolves `distDir` relative to the project, so a checkout deep inside the
synced tree cannot simply point the build elsewhere. Tell the sync client to
skip the directory instead. On Windows (Dropbox), an alternate-data-stream
marker does it, reapplied after any clean:

```powershell
Set-Content -Path ".next" -Stream "com.dropbox.ignored" -Value 1
Set-Content -Path "node_modules" -Stream "com.dropbox.ignored" -Value 1
```

The most reliable option remains keeping the working copy outside the synced
folder and letting Git be the sync mechanism.

## Environment

Copy `.env.example` and fill in secrets. Two that gate optional features:

- `ANTHROPIC_API_KEY` — powers the RE-10 document reader and the new-home plan
  reader. Absent, both fall back gracefully to a "we'll review it by hand"
  path rather than erroring.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob for uploads. Absent, uploads fall back
  to the database, then to disk.

## Key paths

- Homepage + estimator: `app/page.tsx`, `components/EstimateCalculator.tsx`
- New-home estimate engine: `shared/estimateEngine.ts`, `shared/costs/`
- Accessory-structure pricing: `shared/costs/accessoryStructures.ts`
- Plan reader: `shared/plans/`, `server/services/planExtract.ts`, `app/api/plans/analyze`
- RE-10 repair service: `app/re-10-repairs-boise`, `shared/costs/re10Repairs.ts`, `shared/re10/`
- Site copy: `shared/siteContent.ts`

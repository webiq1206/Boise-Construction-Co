# Project Estimator

The Boise Remodeling Co website includes a unified **Project Estimator** on the homepage (`/#calculator`) and in a site-wide modal. It gives visitors a planning range after three intentional choices and optional refinement for a more tailored range before consultation.

## Architecture

| Layer | File | Role |
|---|---|---|
| Engine | `shared/estimateEngine.ts` | Price matrix, project-aware sqft config + size presets, nullable refinement multipliers, planning detail level |
| UI | `components/EstimateCalculator.tsx` | Guided stepper (mobile + modal) / stacked two-column (desktop inline) |
| Result | `components/estimate/EstimateResultPanel.tsx` | Range or progressive checklist, scope examples, disclaimer, CTA |
| Sticky bar | `components/estimate/StickyEstimateBar.tsx` | Bottom-anchored mobile bar: live range, contextual CTA, expandable summary sheet |
| Handoff | `components/ConsultationForm.tsx` | Reads `sessionStorage.brc_estimate` for pre-filled consult context |
| Server check | `app/api/consultation/route.ts` | Recomputes submitted estimates server-side; never trusts client dollar amounts |

## Behavior

- **Nothing selected by default:** no project, finish, size, or refinement is pre-selected. No range is shown (and nothing is persisted) until the user completes project + finish + size.
- **Size presets:** users pick Smaller / Typical / Larger explicitly, then fine-tune with a slider. No pre-positioned slider.
- **Guided flow:** on mobile and in the modal, one decision per screen with progress dots, back navigation, and auto-advance. Desktop inline keeps the stacked two-column layout with a sticky result panel.
- **Refinements:** all optional and nullable; unset values never move the price (1.0x). Selected options can be tapped again to clear. Fixture/room counts never discount below the base range.
- **ADU configuration:** dedicated `aduConfig` field (detached carries a premium for standalone foundation/utilities); `stories` applies to additions only.
- **Planning detail level:** counts only user-set refinement fields; never alters the dollar range.
- **Mobile sticky bar:** fixed to the bottom viewport (safe-area aware via `pb-safe` + `viewport-fit=cover`), replaces the global Call/Text bar while active, updates instantly, and expands into a summary sheet.
- **Persistence:** `sessionStorage.brc_estimate` is written only when the estimate is complete; the consult form still requires explicit confirmation before attaching it.
- **Disclaimer:** planning range only; not a proposal, bid, or guaranteed cost.

## Stored estimate shape

`buildStoredEstimate()` persists to `sessionStorage` for the consult form:

- `project`, `finish`, `sqft`, `refinements`
- `priceLow`, `priceHigh`, `confidence`, `confidenceLabel`, `roi`

On submission, `/api/consultation` recomputes the range from the inputs (project, finish, sqft, refinements) and stores the server-verified values, including `estimateSqft` and `estimateConfidence`.

> After pulling these changes, run `npm run db:push` to add the
> `estimate_sqft` / `estimate_confidence` columns to `consultation_requests`.

## Legacy quote system

The old quote wizard is fully retired: marketing URLs (`/get-quote`, etc.) redirect in `next.config.js`, and `POST /api/quotes`, `/api/quotes/calculate`, and `/api/quotes/update` return `410 Gone`.

## Tests

```bash
npm run verify:estimate    # engine invariants (no defaults, multiplier floors, ADU config)
npm run test:e2e:install   # once per machine
npm run test:e2e -- e2e/calculator.spec.ts
```

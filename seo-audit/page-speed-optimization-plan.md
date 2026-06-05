# Page Speed & Core Web Vitals Plan

Target: 95+ Lighthouse (desktop & mobile where feasible) without harming UX/conversions.

## Critical finding — image optimization disabled (HIGH)

```js
// next.config.js
images: {
  unoptimized: true,
  remotePatterns: [{ protocol: 'https', hostname: '**' }],
}
```

`unoptimized: true` disables Next.js image optimization site-wide: no AVIF/WebP conversion, no responsive `srcset`, no automatic resizing. With 145+ image-heavy pages and large hero PNGs, this is the single largest LCP lever.

**Decision (per plan):** remove `unoptimized: true` **if** the deploy target runs the Next image optimizer (Vercel or a Node server). If the site uses static export / a host without the optimizer, keep it and instead ship pre-compressed responsive assets.

> Action taken this pass: see [completed-updates.md](completed-updates.md). The change is gated on deploy-target confirmation; if your host is static-export-only, revert and use the manual-compression path below.

## LCP risks

| Surface | Issue |
|---|---|
| Homepage hero | `priority`, `sizes="100vw"`, `min-h-[85vh]` large PNG |
| Landing hero (53 pages) | `priority` in `LandingPageTemplate` (correct — it's the LCP element) |
| Blog/guide hero banner | `priority={true}` default on `BlogHeroBanner` — eager even when below fold in some layouts |
| Contact hero | full-viewport `priority` PNG |

**Actions:**
1. Enable the optimizer (above) → biggest win.
2. Keep `priority` only on the true above-fold LCP image per template; remove default `priority` from banners that aren't the LCP element.
3. Ensure hero assets are sized ≤ their rendered dimensions and served as AVIF/WebP.

## CLS — generally good

- `Reveal` hides content only when `.js` present (crawlers/no-JS see content) — good.
- Heroes use explicit `min-h-*` → stable.
- Mobile bottom bar offset via `pb-20` → avoids overlay shift.
- `will-change: opacity, transform` on reveal elements — minor compositing cost, acceptable.

## INP / JS

| Component | Note |
|---|---|
| `EstimateCalculator` (608 lines, client) | homepage interactivity; consider code-split/lazy below fold |
| `ConsultationForm` (571 lines, RHF + react-query) | lazy-load on intent (modal already defers) |
| `Navigation` | scroll listeners + modal state | fine |
| `Reveal` | IntersectionObserver widespread | fine |

**Actions:** lazy-load `EstimateCalculator` (it sits mid-page, not LCP); keep form in modal/deferred path.

## Fonts — PASS

Montserrat + Fraunces with `display: swap`. Consider `preload` for the primary weight only.

## Build flags (process risk)

`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are on — not a runtime perf issue but they mask regressions. Logged; not toggled this pass to avoid breaking CI.

## Prioritized actions

1. **Enable image optimization** (deploy-target gated) — HIGH.
2. **Trim non-LCP `priority`** on blog/guide banners — MEDIUM.
3. **Lazy-load `EstimateCalculator`** — MEDIUM.
4. **AVIF/WebP + correctly-sized hero assets** — MEDIUM.
5. **Preload primary font weight** — LOW.

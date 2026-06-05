# Accessibility Audit (WCAG basics)

Covers alt text, contrast, focus, ARIA, keyboard nav, and heading order. Accessibility overlaps with SEO (alt text, headings, semantics) and with AEO (clean structure).

## Heading order

- Landing pages emit a single `h1` then `h2` section headings then `h3` subsections — **correct hierarchy** (`LandingPageTemplate`).
- Blog/guides inject `id`s on `h2` (per content rules) — good for anchors + AT navigation.
- **Watch:** ensure injected long-form sections don't skip from `h2` to `h4`. Current template uses `h2`→`h3` only. PASS.

## Alt text

| Surface | State |
|---|---|
| Decorative heroes/breathers | `alt=""` with `aria-hidden` on breather — **correct** (decorative) |
| `RelatedPostCards` thumbnails | uses `fill`; verify each passes a meaningful `alt` |
| Content/gallery images | `GALLERY_PROJECTS` have titles/descriptions but alt derivation should use them |
| Logo | `generateLogoAltTag` produces descriptive alt — good |

**Action:** ensure gallery/project images embedded on landing pages derive `alt` from project `title` + city + service (done in the embedding component). Decorative heroes correctly use empty alt.

## Color contrast

- Brand greens on light backgrounds and `text-muted-foreground` on `greige` sections should be verified at ≥4.5:1 for body text, ≥3:1 for large text.
- **Risk areas:** `text-inverse-muted` over hero gradients (white-ish on photographic backgrounds) can dip below 4.5:1 depending on the image. Gradients (`from-inverse`) mitigate but aren't guaranteed.
- **Action:** add a minimum scrim opacity behind hero text (the template already layers 2–3 gradients). Verify with axe/Lighthouse on representative heroes.

## Focus & keyboard

- Accordions use the project's `ui/accordion` (Radix-based) — keyboard + ARIA handled.
- CTAs are buttons/links — focusable.
- **Action:** verify visible focus ring on dark hero CTAs (white outline on dark) and on the mobile sticky bar buttons.

## ARIA & landmarks

- Breadcrumb `nav` has `aria-label="Breadcrumb"` — good.
- Breather image section uses `aria-hidden` — good.
- **Action:** confirm the site has a single `main` landmark per page and a skip-to-content link (verify in root layout / Navigation).

## Forms

- `ConsultationForm` uses react-hook-form; ensure each input has an associated `<label>` and errors are linked via `aria-describedby`.
- **Action:** verify required-field errors are announced (role="alert" or aria-live).

## Prioritized actions

1. **Hero text contrast** — enforce a minimum scrim; verify with axe. (MEDIUM)
2. **Landing-embedded image alt** — derive from project metadata. (MEDIUM — addressed in embedding)
3. **Skip link + single main landmark** — verify/add. (LOW)
4. **Form label/aria-describedby** audit. (LOW)
5. **Focus-visible** on dark CTAs and sticky bar. (LOW)

No blocking WCAG-A failures found in the static structure; the main risks are photographic-hero contrast and form error semantics.

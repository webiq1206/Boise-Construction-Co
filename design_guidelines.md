# Boise Construction Co Design Guidelines

## Design Approach

**Premium, Clear, Trustworthy** - Design-build custom home construction with a calm, editorial feel: warm neutrals, confident typography, and generous whitespace.

**Core principles:**
- Clarity over clutter: one primary action per section
- Bone primary CTAs; **ochre is the brand accent** - strategic, not decorative
- Mobile-first conversion (estimator, consult CTA)
- Shared tokens in `app/globals.css` - no one-off page styles

**Ochre usage (two tones, used where each reads best):**
- **Ochre `#D09A5C` (`--accent-legible`) = all accent TEXT:** heading accent
  words (`.brc-accent`), eyebrow ticks, text-link hover, focus rings, step
  numerals. AA-legible (5.38:1) on the charcoal ground at any size. Never set
  ochre text on bone (2.28:1, decorative only).
- **Deep ochre `#7E6344` (`--accent`) = graphic fills only:** chips, tints,
  slider track, icon grounds (always with bone text on top). Too dark for text.

The seal carries ochre on its outer ring and dots; the wordmark carries it on
the italic "Co." only. Never recolor marks outside charcoal, bone, and `#D09A5C`.

---

## Color Palette

| Role | Token | Use |
|------|-------|-----|
| Canvas | `--background` | Default sections |
| Greige | `--surface-greige` | Alternating sections |
| Card | `--card` | White cards |
| Ink | `--foreground` | Body text (AA) |
| Meta | `--muted-foreground` | Eyebrows, captions only |
| Anchor | `--inverse` | Dark bands, footer |
| Accent | `--accent-legible` (ochre #D09A5C) | `.brc-accent` accent words, links, focus, eyebrow ticks |
| Graphic fill | `--accent` (deep ochre #7E6344) | chips, tints, slider thumb, icon grounds - not text |

---

## Typography

- **UI & body:** Montserrat (`font-sans`)
- **Accent word:** Libre Baskerville italic in ochre via `.brc-accent` (max one word per heading)
- **Numerals:** Libre Baskerville via `.brc-display-num` / `<DisplayNum>`
- **Eyebrows:** `.brc-label` — 11px, uppercase, 0.14em tracking

Living reference: `/style-guide` (noindex).

---

## Buttons & links

1. **Primary:** `Button variant="brand"` (charcoal solid)
2. **Secondary:** `Button variant="brandOutline"`
3. **Tertiary:** `<TextLink href="…">`

Do not use `brandAccent`, `brandGhost`, or `brandInverseOutline` on marketing pages.

---

## Components

- `Section` — variants: `canvas` (default), `greige`, `surface`, `inverse`, `tint`
- `PageHeader` — inner page heroes
- `MarketingCard` / `BlogCard`
- `Hairline` — fullBleed, spaced
- `Chip` — categories and tags

---

## Imagery

- Paths: `shared/siteImages.ts`, `shared/serviceBackgrounds.ts`, `shared/blogImages.ts`
- Class: `.img-brand-grade` on all `next/image` marketing photos
- Replace placeholder files in `public/images/` before launch

---

## Contact config

Single source: `shared/siteConfig.ts` (env: `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_SITE_URL`).

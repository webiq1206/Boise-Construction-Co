# Dark-Theme Brand Redesign — Changelog

Full visual redesign of boiseremodeling.co into the committed **dark** Boise Remodeling Co
brand identity (charcoal ground, bone + sage, Montserrat 300 / Fraunces Italic). No content,
routes, CMS wiring, forms, analytics, or integrations were changed — styling and brand assets only.

## Approach

The app was already token-driven (Tailwind + CSS-variable `:root`/`.dark` layers) and shipped with
a dormant dark palette but **no theme provider**, so it rendered light. Rather than restyle pages
one by one, the redesign retunes the shared token layer to the exact brand hex and forces dark
globally — so every page, template, and shadcn component inherits the new system in one place.

## Files touched

### Design tokens & global theme
- **`app/globals.css`** — Rewrote the color token layer. `:root` **and** `.dark` now carry
  identical brand-dark values (no light-mode leak whether or not `.dark` is present):
  bg `#1C1F1E`, elevated `#222624`, surface/card `#262B29`, hairline `#39403D`, body `#E6E3DE`,
  bone heading `#F7F5F3`, mist `#9AA098`, faint `#6E756F`, sage accent `#93A386`; primary CTA =
  bone fill / charcoal text; input `#1F2321`; semantic success `#6FA17C` / warning `#C9A15A` /
  danger `#C77B6B`. Added `--heading` (bone) applied to all `h1–h6`, and `--faint`.
- **`app/layout.tsx`** — Forced `class="dark"` + `colorScheme: dark` on `<html>`;
  `viewport.themeColor` → `#1C1F1E`; added an explicit favicon set (SVG + png + ico + apple);
  OG/Twitter images → the new dark social card.
- **`public/site.webmanifest`** — `background_color`/`theme_color` → `#1C1F1E`; icons repointed to
  the seal-built PWA set (`/icons/icon-192.png`, `/icons/icon-512.png` incl. maskable).

### Brand assets (logos, seal, emblem, favicon, OG)
- **`public/brand/**`** — Copied from the brand kit: reverse wordmark + primary logo (SVG + PNG),
  seal-dark, emblem-light/dark (SVG + PNG).
- **`components/Navigation.tsx`** — Nav wordmark now uses `boise-remodeling-co-wordmark-reverse.svg`
  (white, single-line) instead of the text logo.
- **`components/Footer.tsx`** — Branding cell now shows `boise-remodeling-co-logo-primary-reverse.svg`
  (with tagline) + a bright `emblem-light` badge. Footer band sits on `#222624`, separated from the
  `#1C1F1E` page.
- **Favicon / app icons** — Built from the Maker's Seal (`seal-dark`): `app/favicon.ico` (16/32/48),
  `app/icon.png` (512), `app/apple-icon.png` (180), `public/favicon.svg`, `public/favicon-16/32.png`,
  `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
- **`public/images/og-default.png`** — New 1200×630 social card: reverse wordmark + seal on `#1C1F1E`.

### Dark-safety fixes (non-token outliers)
- **`components/StripePaymentForm.tsx`** — Stripe Elements switched from the light `stripe` theme to
  `night`, tuned to brand hex (sage primary, `#1F2321` field, bone text, terracotta danger) so the
  payment iframe matches the dark form.
- **`components/admin/AdminLeadsPanel.tsx`** — low-priority badge `bg-gray-400` → `bg-slate-600`.
- **`components/seo/LandingPageTemplate.tsx`** — "After" badge `text-white` → `text-accent-foreground`
  (charcoal) for AA contrast on sage.

### SEO / OG consolidation
- **`lib/seo.ts`** — `DEFAULT_OG_IMAGE_PATH` → `/images/og-default.png` (flows to all pages using
  the metadata helper).
- **`app/page.tsx`, `app/privacy-policy/page.tsx`, `app/terms-of-service/page.tsx`** — OG images →
  the dark social card.

## Left intact (verified already-present)
- Comprehensive JSON-LD (`lib/schema.ts`): LocalBusiness + HomeAndConstructionBusiness, Organization,
  WebSite, Service, BreadcrumbList, **FAQPage**, Article, Review, HowTo, CollectionPage, WebPage,
  Speakable, with an `@graph` on the home page. Schema `logo` (brc-logo.png) left as-is because it
  must read on white in Google surfaces; LocalBusiness `image` kept as real project photography.
- `app/sitemap.ts`, `app/robots.ts` (incl. AI/answer-engine allowlist), per-page metadata helpers,
  Montserrat + Fraunces via `next/font` (auto-preloaded, `display: swap`).

## Scope notes
- **Dark only** — no light-mode toggle added; the `dark:` Tailwind variants already in a few admin/
  portal components now resolve to their intended dark values under the permanent `.dark` class.
- Existing UI weights of 500 (nav/labels/buttons) were retained; the "no weight above 400" rule is
  honored on all **display/heading** type (h1–h6 are 300), which is the brand-defining surface.
- No RSS feed and no dynamic `opengraph-image.tsx` route were added (optional in the brief); a static
  purpose-built dark OG card is wired site-wide instead.

## Verification
- `next build` completes clean; all static/SSG routes prerender (home, services, city×service, areas,
  blog, guides, legal, portal/admin).
- Screenshotted dark render + correct logo/seal/emblem on: home, service, blog index, blog post,
  contact, admin. Confirmed programmatically: `<html class="dark">`, body `#1D201F`, footer `#222624`,
  all three brand logos load, all favicon/OG assets 200 with correct MIME types.

## Comprehensive pre-push review pass (round 2)

A full audit across 12 page templates (home, about, testimonials, service, city-service, areas,
style-guide, blog index, blog post, contact, 404, subcontractor) using a per-element DOM scanner
(flags any opaque light-background panel or sub-3:1 text) plus WCAG contrast math on every token pair.
Result: **0 light-background leaks and 0 low-contrast text anywhere.** Fixes applied:

- **CRITICAL** — `app/subcontractor/purchases/page.tsx`: a `text-white` leaf icon sat on a bone
  `bg-primary` circle (white-on-white, invisible) → `text-primary-foreground`.
- **Font-weight rule** — enforced the "never above 400 / nothing bold" brand rule across all
  marketing/public surfaces: converted every `font-medium`/`font-semibold` to `font-normal` in
  `components/sections`, `components/marketing`, `components/seo`, `components/modals`, `Navigation`,
  `Footer`, `ConsultationForm`, `EstimateCalculator`, `FAQSection`, and all public `app/` pages
  (34 files), plus the shadcn Button base variant, and the `.blog-content` h4/th/strong + `.brc-text-link`
  rules in globals.css. Blog `<strong>` now emphasizes via a brighter bone tone, not weight.
  Admin/portal/shadcn-ui internals keep their functional weights (behind auth, data-density UIs).
- **Emblem coverage (checklist)** — added the stacked light emblem to the About "Our standards"
  band and to the consultation **request-received** confirmation state (footer + OG already had it).
- **Polish** — strengthened the `.cta-card-dark` hairline (0.08 → 0.15) so elevated CTA cards read
  crisply against the near-equal page ground; added a dark border override to a portal amber alert.
- Contrast: all text token pairs pass AA (body 12.98:1, muted 6.2:1, sage-as-text 6.2:1, bone button
  12.3:1, sage badge 4.98:1). `--faint` is used only for de-emphasized placeholder/meta (passes the
  3:1 large/UI threshold); hairlines are decorative dividers (exempt).

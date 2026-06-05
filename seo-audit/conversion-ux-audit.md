# Conversion & UX Audit

Hero, CTAs, forms, lead capture, social proof, trust, navigation, journeys, and friction — scored per page type.

## CTA system — STRONG, one inconsistency

- Sitewide primary CTA: "Schedule your free in-home visit" (`ctaCopy.ts`). Consistent.
- Secondary CTA: estimator. Consistent.
- **Inconsistency:** homepage primary CTA scrolls to inline `#consult` form; every other page opens a modal; `/contact` is modal-only with no `#consult` target. A user landing on `/contact` from search hits a modal instead of an on-page form. **Fixed** (added inline path/anchor + FAQ on contact).

## Per-page conversion analysis

| Page | Hero clarity | CTA | Social proof on page | Form | Friction |
|---|---|---|---|---|---|
| Homepage | brand-forward H1 | dual, inline form | testimonials mid-page | inline | low |
| Service | clear | modal CTA | none embedded | modal | medium (no proof) |
| City×service | clear | modal CTA | **added** (proof embedding) | modal | medium→low |
| Area | clear | modal CTA | added where data exists | modal | medium→low |
| Blog/guide | content-led | soft CTA + related | none | modal | low |
| Contact | clear | **was modal-only** | none | **added inline/FAQ** | high→medium |
| Testimonials | proof-led | CTA | yes (the point) | modal | low |

## Lead form friction (`ConsultationForm`)

- **6 required fields** (name, phone, email, address w/ house-number validation, ZIP, project type); message optional.
- **Two-step submit** (form → confirmation review → API).
- Address autocomplete + property enrichment adds JS.
- **Trade-off:** higher lead quality, more friction/speed cost. Acceptable for a high-ticket remodel lead, but:
  - Consider making **address optional** until later in the funnel, or a "quick contact" 3-field variant for top-of-funnel.
  - Pre-fill from estimator (already implemented) is a good friction reducer.

## Social proof placement — WAS WEAK

- Proof lived on homepage + `/testimonials` only; landing pages had a text link, no embedded proof.
- **Fixed:** city/service-matched testimonials + gallery now embed on landing pages where data exists. Proof-less cities (Kuna, Star, Middleton, Caldwell) still lack embedded proof (data-gated).

## Trust band

- `TRUST_ITEMS` below hero on homepage (licensed/insured/guarantee). Good.
- Trust signals weak overall (no ratings/awards) — see [trust-signal-map.md](trust-signal-map.md).

## Mobile UX — STRONG

- Sticky bottom bar (Call + primary CTA), `md:hidden`, with `pb-20` offsets to avoid overlap.
- Mobile TOC chips on blog/guides.
- Tall mobile heroes (`min-h-[520px]`) — acceptable; ensure LCP image is optimized.

## Prioritized actions

1. **Contact page inline form + FAQ** — DONE (highest conversion-friction fix).
2. **Embed local proof on landing pages** — DONE where data exists.
3. **Quick-contact form variant / optional address** — recommended (not done; product decision).
4. **Add a star rating to hero/trust band** once real ratings exist — data-gated.
5. **Unify CTA behavior** (homepage anchor vs modal) — minor; contact now has an on-page path.

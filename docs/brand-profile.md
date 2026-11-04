# Boise Construction Co: current implementation profile

Profile version: source-b7b443f, recorded 2026-11-04. This records the existing
approved implementation; it does not approve a new visual direction. The approved
family handoff is dated 2026-09-24 in `docs/approved-design-handoff.md`; the asset
receipt is `docs/branding-20261028.json`. No later approval date is inferred.

## Identity and visual system

- Audience and purpose: homeowners planning new residential construction in Boise
  and the Treasure Valley. Custom, semi-custom, design-build and own-lot building
  remain distinct from the sibling remodeling and handyman services.
- Character: calm, architectural editorial layouts, warm light surfaces, strong
  photography, readable practical detail and an explicit next step.
- Logos: current approved horizontal P5 family lockups in `lib/familyBrand.ts`,
  `/brand/approved-lockup-light.svg` on dark and
  `/brand/approved-lockup-dark.svg` on light; preserve intrinsic proportions and
  the P5 endorsement. Original brand assets remain unchanged. Clear-space and
  minimum-size guidance is retained in `public/brand/BRAND.md`; no logo work is
  part of this edit.
- Palette source: `styles/family-tokens.css` plus the brand-owned overrides in
  `lib/familyBrand.ts`. Background `#fbfaf6`, alternate `#f1ede4`, surface
  `#fbfaf6`, border `rgba(32,35,31,0.15)`, text `#20231f`, muted `#343934`, primary
  `#2c302f`, Construction ochre `#c48d3f`, accent ink `#78531e`, success `#3f6b4a`,
  warning `#8a6a1f`, error `#a33a2c`. No secondary accent is introduced. Primary
  quote actions use the existing charcoal/light treatment and ochre detail.
- Typography: self-hosted variable Manrope (200–800) for UI/body and Cormorant
  Garamond (300–700) for display and editorial headings, loaded in
  `app/layout.tsx`. Preserve the existing token role sizes, weights, tracking and
  line heights in `styles/family-tokens.css` and the approved interior styles.
  Older Montserrat/Libre Baskerville guidance describes historical live type,
  not the current implementation; logo artwork remains unchanged.
- Spacing and layout: use the existing family spacing scale, 1280px container,
  reading measure and 640/1024/1280 token tiers. Existing family chrome switches
  navigation at 1180px as explicitly configured in `lib/familyBrand.ts`. The
  landing template controls the editorial content width and section rhythm.
  The bounded review repair uses those existing tokens on the two Boise pages;
  it does not change breakpoint or layout token values.
- Shapes/surfaces: current square controls/cards, 4px inputs/choice cards and
  existing pill/circular controls; retain existing border/shadow treatment.
- Controls and icons: existing `LandingPageTemplate`, family header/footer and
  action bar, `PrimaryCta`, text links, Lucide icons and native accessible
  accordion controls. Do not add an ornamental icon or a competing action.
- Motion: preserve 200ms fast and 300ms base family tokens, existing reduced
  motion and reveal behavior. Essential content must remain available.

## Imagery, proof and workflows

- Image direction: architectural/service imagery, intentional desktop and phone
  crops with useful alt text. `shared/galleryData.ts` contains an explicitly
  labeled Eagle concept set, not photographed client work. The service-image
  provenance receipt labels generated images as concepts. No Boise project,
  testimonial, statistic or staff photograph is invented or added.
- Approved assets: `docs/branding-20261028.json`,
  `docs/service-image-provenance-20261026.json`, current image manifests and
  `docs/approved-design-handoff.md`. Alt text and concept labeling stay unchanged.
  The two Boise heroes use a scoped responsive architectural crop. Baseline screenshots are recorded in the task evidence;
  they are observations, not a new aesthetic approval.
- Writing: direct, practical and answer first. Explain decisions and uncertainty;
  no em dashes, double hyphens in prose, unsupported project claims, permit
  promises, prices, credentials or availability. Existing approved prices and
  business facts are preserved.
- Proof resources: published planning information and the existing protected
  estimator/calculator. Authentic Boise project/process artifacts with verified
  public-use permission remain a gap. Do not represent generated images as proof.
- Input flows: existing quote/estimate wizard, calculator, uploads and
  consultation forms. Their detailed behavior is protected and outside this
  copy edit. Do not invoke estimator/provider operations or submit real leads.
- Primary journey: Request a quote to `/estimate`; phone destinations come from
  `shared/siteConfig.ts`. Existing sticky header and mobile Call/Request a quote
  bar remain; the bar yields during active estimator tasks as configured.
- Protected systems: URL inventory, canonical/indexing policy, titles,
  descriptions, schema generators, analytics/consent/attribution, forms,
  routing/CRM/notifications, privacy, database bindings, pricing and shared
  estimator files. No new overlay or automatic popup.
- Exceptions: no new exception requested or granted by this record. Existing
  page-specific behavior is preserved, not asserted to satisfy unrun checks.
- Family relationship: P5 family typography, engineering chrome and warm-neutral
  system are shared. Construction owns its name, domain, ochre accent, service
  scope, imagery and factual claims. No cross-site visual rollout is authorized
  by this profile.

## Standards and review

Apply the current user-owned `website-design-quality` Version 2.3 master,
implementation rules and independent review record, plus
`organic-ai-search-visibility` 1.0.0. Current resources are
`skill://user/6ade0cb654b88191a3885c7ff3a65f17/website-design-quality/` and
`skill://user/6adbb2738af481919a1b922c554c84c7/organic-ai-search-visibility/`.
Saving this profile does not establish adoption by external agents or releases.
See `docs/organic-search-20261104.md` for scope and observed verification.

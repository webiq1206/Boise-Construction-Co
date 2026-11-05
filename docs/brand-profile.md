# Boise Construction Co: current implementation profile

Profile version: owner-update-20261104.1, recorded 2026-11-04. This records the existing
approved implementation and the owner's current presentation instructions. The approved
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
  `#383837` (also header/menu/footer chrome), Construction ochre `#c48d3f`, accent ink `#78531e`, success `#3f6b4a`,
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
  crops with useful alt text. `shared/galleryData.ts` contains a generated
  architectural image set, not photographed client work. Keep provenance in
  project records; public captions describe rooms and materials. No Boise project,
  testimonial, statistic or staff photograph is invented or added.
- Approved assets: `docs/branding-20261028.json`,
  `docs/service-image-provenance-20261026.json`, current image manifests and
  `docs/approved-design-handoff.md`. Preserve descriptive alt text and authentic
  asset records; remove presentation disclaimers under the owner update below.
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

Owner presentation update, 2026-11-04: realistic AI scenes may be used as generic
visuals when authentic assets are unavailable, without concept/illustration or
representative-imagery labels. Remove launch-status, first-project and past-client
reference disclaimers. They must not become claims of actual completed company
projects, customer work or factual proof. Preserve useful subject descriptions.

The website publishes service geography, phone, email, hours and appropriate
contractor-registration details. It does not publish the business street address,
precise home coordinates, administrative contact labels or storefront disclaimers
in visible copy, structured data, client configuration or downloads. Business-profile
verification records remain with the authorized owner outside website output.
Founder biography and the verified P5 profile link remain appropriate.

Equivalent typography roles use the canonical family token scale: editorial
section display 36/52/64px; interior H1 40/44/52px; feature title 32/44/52px;
content H2 28/36/40px; H3 22/26/28px; body 17/18/18px; buttons 16px. Ordinary
H1s consume the page-title role without enlarging feature H3s. Phone hero H1s
use `clamp(44px, 13.333vw, 56px)`; tablet and desktop hero sizing and the scoped
Boise PriorityLanding correction retain their existing roles. Use the matching
shared line-height/tracking tokens. Specialized input geometry is preserved and
must be checked for inherited type effects. Shared header/footer controls are
implemented in the canonical family source, not patched in this brand.

Apply the current user-owned `website-design-quality` Version 2.3 master,
implementation rules and independent review record, plus
`organic-ai-search-visibility` 1.0.2. Current resources are
`skill://user/6ade0cb654b88191a3885c7ff3a65f17/website-design-quality/` and
`skill://user/6adbb2738af481919a1b922c554c84c7/organic-ai-search-visibility/`.
Saving this profile does not establish adoption by external agents or releases.
See `docs/organic-search-20261104.md` for scope and observed verification.


### November4 narrow-header and menu implementation record

Canonical source `boise-remodeling-co` revision `fa720a579b696af92861fb571fa0aff043e734b0` restores the complete approved SVG below360px in a logo row above the unboxed contact/menu controls. Normal320px prototype height is89px including the border; use the actual measured header/safe-area height, not a fixed clearance. Enlarged text may grow it. Normal360px-and-up header geometry is unchanged. Mobile-menu Call/Text/Chat contact controls are transparent and borderless at rest, retain visible focus and existing destinations/capability, and use the same icons as header/footer. This records the owner-requested consistency repair, not a new identity or approval exception. The independently reviewed prototype is narrower evidence than each final built site; retain exact-head rendering and functional gates.


### Exact heading accent, November 4 owner instruction

Heading emphasis uses the actual approved logo/icon pop `#c48d3f` through the site-owned
`--color-heading-accent` role. It is not mixed with paper or replaced by accent ink.
The approved SVG bytes, existing type families/sizes/weights, neutral palette and
functional text/focus roles are preserved. Public H1/H2 and editorial display emphasis,
interior statement/aside titles, legacy hero emphasis and dark planning bands consume
this exact role. The shared HeroPhoto uses the same heading role after canonical transport.
Small FAQ open states and related/service title hover states retain readable neutral text;
underline/chevron affordances convey their state without adding a different heading hue.
Light-ground H2 and statement emphasis retains its scoped 1px existing-charcoal
glyph context; dark contexts keep their current surface. The November 5 owner
direction below supersedes that treatment for H1s.
This is a source implementation record, not a rendered contrast or visual acceptance.
Actual font pixels, photograph contrast, all listed template consumers and independent
review remain required at the exact final revision. Source evidence lives in the private
`evidence/brand-heading-accent-inventory.json` and implementation ledger.

### November 5 heading revision

The owner requested removal of H1 shadows, larger and stronger mobile H1s, and
consistent mobile alignment restored only where source history proves that
headings or sections were previously left aligned. This is the direction's
record, not a separate approval date or a rendered acceptance record.

H1 emphasis retains exact logo ochre `#c48d3f` without a glyph halo. Existing H2,
statement and control styling remains separate. Construction's November 3
mobile-centering overrides were already removed by the November 4 reconciliation;
current public heading alignment therefore stays as implemented. Shared size
changes originate in the canonical family source and require its qualified
transport and per-site review. Specialized task headings retain their own
qualified geometry.

Bare ochre on paper is below the 3:1 large-text threshold, which enlargement
alone does not correct. The affected `/services`, `/areas` and `/resources`
editorial introductions and the internal `/style-guide` H1 specimen therefore
use the existing charcoal surface with existing on-dark neutral text and action
roles. Their text, image, grid, spacing, reading order and destinations stay as
implemented. Other interior surfaces retain their existing composition.

The homepage retains its existing photograph and copy width. Its existing
phone/tablet vertical scrim keeps the clear upper photograph and darkens behind
the copy; the desktop directional scrim is opaque through the measured widest
H1 line, then fades into the right-hand photograph over 80px. These are surface
contrast repairs, without a heading box, stroke or glyph shadow. Removing the
H1 shadow and recording this source change do not establish a rendered pass.
The larger phone headline uses component-scoped existing spacing roles: 8px
from eyebrow to headline, 16px from headline to support, and 12px before the
action stack. This keeps the complete 360px hero inside its measured height
budget while preserving all copy, the shared headline size and 64px section
padding. These values still require optical review; they are not a spacing
exception or approval waiver.
Actual white and ochre glyph contrast, all nine required first-screen viewport
pairs, unchanged H2 treatment and independent review remain final-revision
gates.

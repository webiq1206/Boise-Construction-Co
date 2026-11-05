# Boise Construction Co uniform video overlay

Scope: homepage `/` only. Current main includes the independently merged fold
correction at `d83736556e9fb3ae93b4249760018bbe0561e6f1` (PR130). The owner's later
authorization permits darkening overlays as necessary for readable text, with
brand charcoal allowed if black looks wrong. Keep one consistent flat layer;
the initial fixed 40% constraint is superseded. Earlier gradients and localized
scrims remain removed.

Selected candidate: uniform black `rgba(0, 0, 0, 0.71)`, with the same value at
all viewport sizes. No text, CTA, footage, grading or halo changes. Bounded
critical-scene tuning found 69% failed 10 of 20 combinations, 70% failed 3 of 20,
and 71% passed all 20. At 390x844 / 11s, the ochre headline measured 2.96593:1
with 70% and 3.06090:1 with 71%. This is the lowest passing whole-percent value
in that comparison; final full-scene measurements and visual review follow.

Preserve approved video bytes, source selection, silent/muted inline looping,
poster and motion/data-saver/error fallbacks, pause/play and lifecycle controls,
all hero copy/CTA destinations, metadata, shared family chrome and protected
estimator/intake systems. No deployment, Replit setting or publication changes.
No Library screenshot saves.

Applicable instructions loaded: `.agents/website-quality.md`, current
website-design-quality master/implementation/review2.3, brand profile with the
latest uniform-overlay direction, and organic-ai-search-visibility1.0.2.

## Baseline and sizing

Before screenshots and measured geometry for twelve matching viewport pairs are
in `test-results/hero-overlay-fold/`. Browser emulation, not physical devices.
Construction's bottom CTA bar is actually visible on the initial homepage below
1180px and measures72px without a safe-area inset in this environment. Header
measurements:89px at320px width,64px on larger phones,76px at tablet/desktop.

The original1920x1080 hero ends at976px, exposing104px of following content
because of its900px cap. Static `100svh` can also remain below the current visible
height when mobile browser chrome retracts; this physical-device case is not
proved by a headless viewport alone.

Site-owned CSS uses dynamic viewport height when supported, small-viewport
fallback otherwise, and removes the desktop cap. Existing shared observers
publish measured header/bar heights excluding their own safe-area pads, so each
inset is added to the occupied element exactly once. Hidden bars reserve zero
space. Natural min-height permits320x568 and constrained/enlarged-text content
to scroll without clipping. No shared guarded file is changed.

## Historical 40% baseline and contrast finding

PASS: full aggregate `npm run build` with required prebuild chain and259 static
pages, TypeScript, shared-family hashes and exact single-overlay contract.
The scoped desktop selector was then made more specific than the shared900px
cap; its refreshed Next.js build and fold retest are recorded with the PR.

FAIL at the former 40% setting: contrast with unchanged brand text. Initial
scan sampled40 times (0 through29seconds plus dissolve/loop points) at nine
viewports,360 frames total. Every sampled frame has at least one text failure.
Worst conservative text-line-box samples, including spaces:

| Role | Ratio | Required | Viewport and video time |
| --- | ---: | ---: | --- |
| Ochre headline | 1.00004:1 | 3:1 | 390x844,11s |
| White headline | 2.72786:1 | 3:1 | 1440x900,11s |
| Support | 2.79651:1 | 4.5:1 | 360x640,16s |
| Microcopy | 2.67062:1 | 4.5:1 | 1024x768,1s |
| Quote CTA | 11.23924:1 | 4.5:1 | Solid existing CTA surface |

Independent glyph-mask checks confirm this is not only a space-between-letters
artifact: at390x844, ochre1.04:1 in the12s kitchen scene, white headline2.82:1 at6s,
support3.34:1 at12s. Merely making all hero text white would not resolve the
conflict: existing white heading and small white copy already fail.
An opaque `#ffffff` hypothesis computed from the same unmodified background
samples reaches only2.8490:1 for the large headline (requires3:1) and2.9207:1 for
support (requires4.5:1). This is a calculation, not an implemented color change.

The owner resolved this conflict by authorizing a darker uniform overlay.
Video bytes, grading, text colors, typography and CTA content remain unchanged.
A glyph outline was researched under
[W3C G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18), but no outline,
halo or shadow is used. The existing exact hues are preserved.

The fold correction is separately committed as
`9f3e8b1ed7849f626a9b5dadb6ce4c19655a03cb`, retaining the prior overlay. It has its
own isolated clean production build and independent Chromium/WebKit review:
24 normal viewport checks passed, including1920x1080 ending exactly at1080 with
no proof peek. The black-overlay candidate is a separate subsequent commit.
Its fold/overlay/raster/functional failure categories are zero in the360-frame
scan; contrast failures remain explicit. Bounded fallback supplements address
the test harness's disabled-JavaScript style-load wait without repeating the
completed360 video samples.

The historical failure evidence remains available; it does not establish the
new candidate's result. No publication or live-site acceptance is claimed.
Physical devices, actual browser chrome/keyboard, assistive technology, field
performance and provider/form submissions are not tested.

Three tracked resource PDFs were regenerated during the required prebuild.
Automatic approval review rejected restoring them because that could discard
unverified local changes. They are left untouched, excluded from this focused
commit, and no cleanup retry is made. Subsequent fold-only builds invoke Next
directly and do not rerun the PDF generator.

## Final uniform-overlay verification

PASS on the production build: nine viewport sizes, 360 video-time samples, all
seven static fallback contexts and nine scenario groups. There are zero failures
and zero browser errors across overlay/pseudo/ancestor contracts, fold/layout,
contrast, foreground/CTA raster checks, playback controls, lifecycle and execution.
The test still uses 3:1 for large text and 4.5:1 for normal text, without rounding
a failing value into a pass.

| Role | Minimum final contrast |
| --- | ---: |
| Ochre H1 | 3.05757:1 (360x640 at14s) |
| White H1 and eyebrow | 8.48547:1 |
| Support | 8.61984:1 |
| Microcopy | 7.39591:1 |
| Phone link | 8.66481:1 |
| Quote CTA | 11.23924:1 |

PASS: TypeScript, five family-chrome tests, all 17 canonical shared-file hashes,
source/diff checks and the final production Next.js build. Full aggregate
prebuild/build checks also run in the exact-head CI checkout, which is separate
from the three preserved local PDFs.

Independent review inspected six scene times (0/6/12/18/24/29s) at phone, tablet
and desktop sizes: 18 scene/viewport combinations and 168 actual-glyph text runs,
with zero contrast failures. It also repeated 24 normal Chromium/WebKit viewport
checks and the menu/bar transitions. House, stone, oak cabinetry, island, glass,
floor and foothill detail remain recognizable across the full frame. There is
no flat grey reading field, separate panel, halo or additional scrim.

| F4 dimension | Independent result |
| --- | --- |
| 1. Brand fit | PASS: existing identity, exact text hues and CTA styling |
| 2. First-screen composition | PASS: merged fold retained; no following-section peek |
| 3. Typography/readability | PASS: measured glyph contrast and intact foreground |
| 4. Spacing/alignment | PASS scoped: existing geometry and controls preserved |
| 5. Imagery/cropping | PASS: all six scenes retain architectural/material depth |
| 6. Section flow | PASS: preserved neighboring content and transition |
| 7. Responsive/sticky behavior | PASS in Chromium/WebKit viewport emulation |
| 8. Interaction/accessibility | PASS for affected controls, preferences and fallbacks |
| 9. Technical preservation | PASS scoped; new lab/field performance NOT RUN |
| 10. Conversion/proof | PASS preservation: existing destinations and proof remain |

Final source hash and served build are bound to the exact committed revision in
the independent review and PR/CI receipts. Physical browser chrome, real safe-area
hardware/keyboard, assistive technology and OS/browser text settings remain
unverified; CSS enlargement is only a simulation. No production publication or
new field-performance claim is made. Recovery is a normal revert of this PR.

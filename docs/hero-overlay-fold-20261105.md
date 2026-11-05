# Boise Construction Co uniform overlay and fold correction

Scope: homepage `/` only. Baseline main:
`c08a0142c06d301615cf2f847f404eaf0a042ee3` (PR129). Latest explicit owner direction
requires one uniform black overlay at 60% transparency / 40% opacity, exactly
`rgba(0, 0, 0, 0.4)`, and a hero that reaches the visible fold. Earlier charcoal
gradients and localized accent scrims are superseded and removed.

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

## Verification and release record

PASS: full aggregate `npm run build` with required prebuild chain and259 static
pages, TypeScript, shared-family hashes and exact single-overlay contract.
The scoped desktop selector was then made more specific than the shared900px
cap; its refreshed Next.js build and fold retest are recorded with the PR.

FAIL: contrast with the exact requested overlay and unchanged brand text. Initial
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

The requested overlay is not increased, compounded or replaced. Video bytes,
grading, text colors, typography and CTA content remain unchanged. A possible
text-only remedy is a contrasting glyph outline, as described in
[W3C G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18), but that conflicts
with the current no-halo H1 profile direction and is held for parent decision.
No such text treatment is implemented or claimed compliant.

The fold correction is separately committed as
`9f3e8b1ed7849f626a9b5dadb6ce4c19655a03cb`, retaining the prior overlay. It has its
own isolated clean production build and independent Chromium/WebKit review:
24 normal viewport checks passed, including1920x1080 ending exactly at1080 with
no proof peek. The black-overlay candidate is a separate subsequent commit.
Its fold/overlay/raster/functional failure categories are zero in the360-frame
scan; contrast failures remain explicit. Bounded fallback supplements address
the test harness's disabled-JavaScript style-load wait without repeating the
completed360 video samples.

No unqualified accessibility or final visual pass is claimed. Draft PR and CI
retain the real contrast failures. No publication or live-site acceptance is
claimed. Physical devices, actual browser chrome/keyboard, assistive technology,
field performance and provider/form submissions are not tested.

Three tracked resource PDFs were regenerated during the required prebuild.
Automatic approval review rejected restoring them because that could discard
unverified local changes. They are left untouched, excluded from this focused
commit, and no cleanup retry is made. Subsequent fold-only builds invoke Next
directly and do not rerun the PDF generator.

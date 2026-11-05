# Boise Construction Co hero autoplay without visitor controls

Scope: homepage `/`, Construction only. Start from main
`3fb67636d0b19e9ca79101d49fb569f495bb7f55`. The owner explicitly requested no
Play/Pause/Stop controls and subsequently required playback attempts on every
supported device regardless of reduced motion, data saver or connection hints.
The existing explicit release approval covers the tested repository merge.
Replit pull/publication remain with the owner. No deployment or Library saves.

## Standards, baseline and preservation

Loaded website-design-quality 2.3 master, implementation and review rules,
`.agents/website-quality.md`, project profile `docs/brand-profile.md`
(owner-update-20261104.1 plus November 5 directions), and the previously loaded
organic-ai-search-visibility 1.0.2. No AGENTS.md or `.agents/skills` is present.

Baseline captured before runtime edits by reusing actual production screenshots
from the preceding exact-tree review. Main's runtime tree matches reviewed head
`d0499dd4a546c7f050accebcefa5bca03298555b`, build `0jqs85X7NyQQ6_02HHLkC`.
Phone 390x844 and desktop 1440x900 images are at frame 0, paused programmatically
for matching imagery; the old button therefore reads Play. These are internal
review images, not Library deliverables. Baseline identity is recorded under
`test-results/hero-video-no-controls/baseline.json`.

Preserve approved silent 30-second footage and poster bytes, 720p phone/tablet
MP4 and 1080p desktop WebM/MP4 source selection, muted inline looping, current
flat black `rgba(0,0,0,.71)`, exact ochre and all hero text/CTA styling/destinations.
Retain measured header/bar/safe-area fold sizing, natural content growth and the
320x568 headline/primary-CTA exception. Shared family chrome, SEO, facts, proof,
tracking, pricing and protected intake/estimator workflows are unchanged.
The three preserved PDF modifications in the original checkout are untouched.

## Implementation and precise accessibility limitation

Remove the custom control and control-only icon imports, mode/manual-pause state,
labels, ID relationship and CSS. There are no native, hidden or renamed toggles.
After hydration, use responsive sources and attempt playback while visible.
Reduced motion, save-data and slow connection hints no longer gate sources/play.
Resource pausing offscreen or in a hidden tab remains, with resumption on return.
Cancelled play promises must not convert ordinary visibility/source transitions
into permanent technical failure.

Keep a readable poster for load/decode failure or a rejected autoplay attempt.
Browser/OS policy can reject script-initiated playback, including muted media;
JavaScript may also be unavailable. The application cannot promise successful
playback on every physical device. No alternative visitor control is introduced.
See [HTMLMediaElement.play()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

Known user-directed WCAG limitation, not a passing accessibility claim: this
nonessential moving background starts automatically, continues beyond five
seconds and accompanies other content, without a visitor pause/stop/hide
mechanism. It does not meet
[WCAG 2.2 SC 2.2.2 (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
Reduced-motion support alone does not establish compliance; the latest direction
also removes that application-level preference response. Offscreen/hidden-tab
pausing does not provide a visitor mechanism while reading the visible hero.
Keep text contrast, semantic copy/actions, focus/navigation and other protections.

## Verification plan and observed results

Focused scope: affected hero, neighboring proof transition, responsive source
selection and lifecycle/preference/technical-failure states. Planned browser
coverage retains the existing nine-viewport fold/contrast scan and checks actual
autoplay under reduced-motion, save-data, 2g and slow-2g simulations. Check no
controls in SSR/hydrated/default/failure states and actual attempts/playback,
source fallback, loop, offscreen/hidden-tab pause/resume and readable posters.

PASS locally: production build with 259 generated pages; standalone TypeScript
verification; five family-component tests; all 17 canonical shared-file hashes;
script syntax and diff checks. The production browser behavior supplement passed
all 17 scenario groups with no browser errors and zero failures in every category.
Eight phone/desktop preference contexts actually played and advanced in time;
connection/motion changes did not suppress playback. Responsive switching,
natural loop, WebM-to-MP4 fallback and offscreen/hidden-tab pause/resume passed.
Seven technical poster contexts (load/decode/autoplay denial on phone/desktop
and unavailable JavaScript) preserved readable copy/actions with no controls.

The unchanged scene/contrast scan is not repeated locally. Normal exact-head CI
still runs all 360 samples across nine viewports, fold checks and full required
aggregate checks in its isolated checkout. Exact-head independent review, all
ten F4 dimensions, CI receipts and merged-main verification are recorded in the
PR completion record; local test results do not substitute for those gates.
Physical mobile browser chrome/safe areas, actual hardware/keyboard, assistive
technology, browser/OS autoplay policy combinations and lab/field performance are
NOT RUN. Simulated preferences do not prove universal device playback.

Independent final review records all ten F4 dimensions in the PR, separating
the explicit WCAG 2.2.2 limitation from visual/functional checks. Exact reviewed
revision, screenshot comparisons and check receipts belong in that final record.
Recovery is a normal revert of this focused PR. No live-site result is claimed.

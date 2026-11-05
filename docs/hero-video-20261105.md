# Boise Construction Co approved hero video

Scope: `/` homepage background only. Preserve the exact headline, support line,
quote CTA, phone link, microcopy, proof strip, metadata and protected workflows.
No publication or deployment-setting changes. Standards: website-design-quality
2.3 plus implementation rules; organic-ai-search-visibility 1.0.2; brand profile
owner-update-20261104.1 with the November 5 cinematic-hero instruction.

The later owner instruction requires full-bleed, full-width, full-height video
across the entire hero on every device, superseding the earlier split mobile
photo/copy composition. Construction-owned code and CSS retain family tokens
and leave canonical shared files intact. Overlay uses existing charcoal
`#383837`; emphasis retains `#c48d3f`. Existing hero height and text remain.

## Media

Approved package identity: `libfile_7352b818f2ac81918e0281d2163b86e5`, version 0,
`file_00000000398481f6bac312a6bca3ddec`. Materialized into this executor through
the current Library flow and inspected locally. The poster and all five preview
scenes were visually inspected; ffprobe confirms each video is exactly 30 seconds,
30 fps, with only a video stream. No replacement media was generated.

Served files are under the existing `public/images/construction/` directory:

| File | Bytes | Use |
| --- | ---: | --- |
| boise-construction-co-background-720p.mp4 | 4,315,788 | 1280x720, phone/tablet |
| boise-construction-co-background-1080p.mp4 | 14,126,974 | 1920x1080, desktop fallback |
| boise-construction-co-background.webm | 7,754,490 | 1920x1080, desktop preference |
| boise-construction-co-poster.jpg | 257,581 | 1920x1080, eager static fallback |

Embedded title/comment metadata was removed from served containers with lossless
remuxing. Packet-stream SHA256 comparisons confirmed identical video streams.
The package README, preview HTML and scene contact sheet are excluded from
public assets. Source archival/folder work is handled separately. Poster has
empty alt because it is decorative; the walkthrough makes no client-project
claim. No visitor-facing provenance/disclaimer copy was added.

## Behavior and evidence

Media sources attach only after browser preferences are checked. Reduced motion,
data saver and slow 2G keep the poster until an explicit play request. Browser
autoplay rejection preserves the poster and play button. Pause/play supports
keyboard; manual pause persists after scrolling. Offscreen and hidden-document
states pause decoding. Playback error returns to the poster. No-JavaScript HTML
contains the complete hero copy and poster without video sources.

Baseline revision: `a0478145face328cfa093f925ff874688f66f44e`.
Baseline screenshots and final browser metrics/screenshots are in
`test-results/hero-video/` (local generated evidence, excluded from Git).

## Verification results

- PASS: full `npm run build`, including the complete required prebuild chain
  and 259 prerendered/static pages. The first build attempt collided with a
  development server using the same `.next`; a clean isolated build and final
  subsequent build passed. Generated PDF timestamp changes were restored.
- PASS: `npx tsc --noEmit --incremental false`, five family-chrome tests,
  all 17 canonical shared file hashes, image-path validation (520 references),
  script syntax and `git diff --check`.
- PASS: `node scripts/verify-hero-video.cjs`, nine viewport sizes from 320x568
  to 1920x1080, nine scenario groups, zero browser errors/failures. Full-frame
  media bounds, first-screen headline/CTA and complete copy at 360px and above,
  correct source/dimensions, real playback and natural looping were exercised.
- PASS: keyboard focus, Space pause, Enter play, manual pause persistence,
  offscreen pause/resume, responsive resize, runtime reduced motion, explicit
  motion opt-in, dynamic data saver, 2G/slow-2G, no-JavaScript, phone/desktop
  exhausted-source poster fallback and desktop WebM-to-MP4 recovery. Hidden-tab
  lifecycle used Page Visibility API emulation, not a physical tab/device test.
- PASS: actual composited-background samples beneath visible text, including
  12/24/29-second scenes on phone and desktop. Minimum ratios: white H1 9.62:1,
  ochre H1 3.47:1 (large text), body/microcopy 8.00:1, primary CTA 10.91:1.
- PASS: existing `verify-homepage-responsive.cjs` at 11 viewport sizes,
  zero failures/errors, including adjacent homepage controls and full-page
  screenshots. Its reduced-motion run is separate from real playback QA.
- PASS: WebKit playback and pause/play at 360x640 and 1440x900; simulated
  browser autoplay rejection preserves the poster and supports explicit play.
- PASS: raw production HTML preserves the title, canonical and one H1, includes
  the poster and contains no imagery provenance/disclaimer labels.
- PASS: independent code review. An exhausted-source failure was found and
  corrected; source errors are handled while preserving WebM-to-MP4 fallback.
  A separate reviewer independently repeated all three media-failure cases.
- INACCESSIBLE/NOT RUN: the optional broad nine-route legacy contrast script
  could not launch Chromium inside the sandbox. The scoped hero contrast check
  ran successfully outside that restriction; no whole-site contrast claim is made.
- NOT RUN: physical devices, actual mobile browser controls/keyboard and assistive
  technology, field performance, provider operations, lead delivery, Replit import,
  production publication and live-site verification. These remain separate from
  this media-only repository edit. No real form was submitted.

Final exact-head CI, independent rendered review and merge are verified in the
PR/release record. Source/content and served assets are tied to the reviewed
revision; local `reviewed-file-hashes.json` records implementation/media hashes.
Recovery is a normal revert of this PR, restoring the previous static hero.

## Independent rendered review

A separate reviewer loaded the current master standard, implementation rules,
review record and this repository's brand profile without implementation context.
It inspected all nine final first-screen sizes, the before/after grid, scene and
fallback screenshots, adjacent page content, and independently exercised live
Chromium phone playback, keyboard control, offscreen pause and the settled menu.
The scoped visual and functional review passed without a requested correction.

| F4 dimension | Result and scope |
| --- | --- |
| 1. Brand fit/originality | PASS: existing identity, exact ochre, charcoal and architectural direction |
| 2. First-screen composition | PASS: complete 360px+ copy; 320px headline/primary CTA fit |
| 3. Typography/readability | PASS: existing type and wrapping; measured text contrast |
| 4. Spacing/alignment | PASS: existing gutters/copy geometry; clear token-sized media control |
| 5. Imagery/cropping | PASS: full-frame cover at all nine sizes and sampled scenes |
| 6. Section flow/balance | PASS: unchanged proof strip and next-section transition |
| 7. Responsive/sticky behavior | PASS: no overflow, clear controls, opaque settled mobile menu |
| 8. Interaction/accessibility | PASS scoped: native keyboard controls, visible focus, motion/fallback behavior; forms unchanged and untested |
| 9. Performance/technical preservation | PASS scoped: build, types, media loading/fallback and rendering; field performance unmeasured |
| 10. Conversion/proof | PASS preservation: original CTA/phone/proof retained; no new factual claims |

The broader authentic-artifact/proof audit, whole-site journeys and physical
devices are outside this focused media edit; this record does not establish
an all-site or deployed acceptance pass.

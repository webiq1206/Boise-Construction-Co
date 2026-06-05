# Image Audit

Relevance, quality, compression, dimensions, file size, lazy loading, alt text, and file names.

## Optimization pipeline — HIGH issue

`next.config.js` `images.unoptimized: true` disables AVIF/WebP and responsive `srcset` for every `next/image`. See [page-speed-optimization-plan.md](page-speed-optimization-plan.md). This is the dominant image issue: large PNG heroes are served at full size to all viewports.

## Lazy loading

| Surface | State |
|---|---|
| Landing hero | `priority` (eager) — correct (LCP) |
| Landing breather/process | no `priority` — lazy — good |
| `RelatedPostCards` thumbnails | `fill`, no priority — lazy — good |
| Blog/guide hero banner | **`priority={true}` default — eager even when not LCP** — fix |

## Alt text

| Type | State |
|---|---|
| Decorative hero/breather | `alt=""` (correct) |
| Logo | descriptive via `generateLogoAltTag` |
| Gallery/project images | titles/descriptions exist; ensure embedded instances pass descriptive alt (done in embedding component) |
| Blog hero banners | verify per-post alt (should describe the post subject, not be empty) |

## File names

- Hero/city×service images use descriptive, slugged names (`cityServiceImages.ts`) — good for image SEO.
- Generic gallery placeholders (`GALLERY_IMAGES.kitchen.before/after`) are acceptable but could be more descriptive.

## Dimensions / file size

- PNG heroes are large; converting to AVIF/WebP at correct dimensions (via the optimizer) typically cuts 60–80% of bytes.
- `DEFAULT_OG_IMAGE_PATH` declared 1200×630 but is a content photo, not a purpose-built social card — **data/asset-gated** (replace with a true 1.91:1 card).

## Stock / duplicate / irrelevant

- City×service hero images are unique per combo (40 renders) — strong differentiation, low duplication.
- Breather/process slots reuse service-generic images across cities — acceptable (decorative).
- No obvious irrelevant stock imagery flagged.

## Prioritized actions

1. **Enable image optimization** (deploy-gated) — HIGH.
2. **Remove default `priority` from non-LCP blog/guide banners** — MEDIUM.
3. **Descriptive alt on embedded gallery/project images** — MEDIUM (addressed).
4. **Purpose-built 1200×630 OG card** — asset-gated.
5. **Audit blog hero `alt`** for descriptiveness — LOW.

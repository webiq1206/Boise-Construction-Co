/**
 * Marketing image paths. These point at the real project photography in
 * `public/images/`. Replace with your own photos using the same filenames
 * (or update the paths here) - .jpg or .webp also work.
 */

export const SITE_IMAGES = {
  hero: "/images/hero-remodel-interior.webp",
  process: "/images/process-design-review.webp",
  statementBand: "/images/gallery/gallery-whole-home-after.webp",
  leadership: "/images/gallery/gallery-kitchen-after.webp",
} as const;

export const GALLERY_IMAGES = {
  kitchen: {
    before: "/images/gallery/gallery-kitchen-before.webp",
    after: "/images/gallery/gallery-kitchen-after.webp",
  },
  bathroom: {
    before: "/images/gallery/gallery-bathroom-before.webp",
    after: "/images/gallery/gallery-bathroom-after.webp",
  },
  wholeHome: {
    before: "/images/gallery/gallery-whole-home-before.webp",
    after: "/images/gallery/gallery-whole-home-after.webp",
  },
  addition: {
    before: "/images/gallery/gallery-addition-before.webp",
    after: "/images/gallery/gallery-addition-after.webp",
  },
  basement: {
    before: "/images/gallery/gallery-basement-before.webp",
    after: "/images/gallery/gallery-basement-after.webp",
  },
  outdoor: {
    before: "/images/gallery/gallery-outdoor-before.webp",
    after: "/images/gallery/gallery-outdoor-after.webp",
  },
} as const;

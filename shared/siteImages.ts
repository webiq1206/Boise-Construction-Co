/**
 * Marketing image paths. These point at the real project photography in
 * `public/images/`. Replace with your own photos using the same filenames
 * (or update the paths here) - .jpg or .webp also work.
 */

export const SITE_IMAGES = {
  hero: "/images/hero-remodel-interior.png",
  process: "/images/process-design-review.png",
  statementBand: "/images/gallery/gallery-whole-home-after.png",
  leadership: "/images/gallery/gallery-kitchen-after.png",
} as const;

export const GALLERY_IMAGES = {
  kitchen: {
    before: "/images/gallery/gallery-kitchen-before.png",
    after: "/images/gallery/gallery-kitchen-after.png",
  },
  bathroom: {
    before: "/images/gallery/gallery-bathroom-before.png",
    after: "/images/gallery/gallery-bathroom-after.png",
  },
  wholeHome: {
    before: "/images/gallery/gallery-whole-home-before.png",
    after: "/images/gallery/gallery-whole-home-after.png",
  },
  addition: {
    before: "/images/gallery/gallery-addition-before.png",
    after: "/images/gallery/gallery-addition-after.png",
  },
  basement: {
    before: "/images/gallery/gallery-basement-before.png",
    after: "/images/gallery/gallery-basement-after.png",
  },
  outdoor: {
    before: "/images/gallery/gallery-outdoor-before.png",
    after: "/images/gallery/gallery-outdoor-after.png",
  },
} as const;

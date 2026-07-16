import { GALLERY_IMAGES, SITE_IMAGES } from "./siteImages";

export interface ServiceBackgroundConfig {
  [key: string]: string;
}

const DEFAULT_BACKGROUND = SITE_IMAGES.hero;

export const SERVICE_BACKGROUNDS: ServiceBackgroundConfig = {
  "kitchen-remodel": "/images/services/kitchen-remodel.webp",
  "bathroom-remodel": "/images/services/bathroom-remodel.webp",
  "whole-home-remodel": "/images/services/whole-home-remodel.webp",
  "room-addition": "/images/services/room-addition.webp",
  "adu": "/images/services/adu.webp",
  "basement-remodel": GALLERY_IMAGES.basement.after,
  "outdoor-living": GALLERY_IMAGES.outdoor.after,
  "aging-in-place": GALLERY_IMAGES.bathroom.after,
};

export const DEFAULT_SERVICE_BACKGROUND = DEFAULT_BACKGROUND;

export function getServiceBackground(serviceSlug: string): string {
  return SERVICE_BACKGROUNDS[serviceSlug] || DEFAULT_SERVICE_BACKGROUND;
}

/**
 * A set of distinct images for a landing page: a hero, a full-bleed breather
 * band, and the split process panel. Consumers fall back to `hero` for any
 * slot that has no dedicated photo.
 */
export interface LandingImageSet {
  hero: string;
  breather: string;
  process: string;
}

/**
 * Three distinct images per service so the hero, breather band, and process
 * panel each show a different relevant photo (finished room, before, in-progress).
 */
const SERVICE_IMAGE_SETS: Record<string, LandingImageSet> = {
  "kitchen-remodel": {
    hero: "/images/services/kitchen-remodel.webp",
    breather: GALLERY_IMAGES.kitchen.after,
    process: GALLERY_IMAGES.kitchen.before,
  },
  "bathroom-remodel": {
    hero: "/images/services/bathroom-remodel.webp",
    breather: GALLERY_IMAGES.bathroom.after,
    process: GALLERY_IMAGES.bathroom.before,
  },
  "whole-home-remodel": {
    hero: "/images/services/whole-home-remodel.webp",
    breather: GALLERY_IMAGES.wholeHome.after,
    process: GALLERY_IMAGES.wholeHome.before,
  },
  "room-addition": {
    hero: "/images/services/room-addition.webp",
    breather: GALLERY_IMAGES.addition.after,
    process: GALLERY_IMAGES.addition.before,
  },
  adu: {
    hero: "/images/services/adu.webp",
    breather: GALLERY_IMAGES.addition.after,
    process: GALLERY_IMAGES.basement.after,
  },
  "basement-remodel": {
    hero: GALLERY_IMAGES.basement.after,
    breather: GALLERY_IMAGES.basement.before,
    process: GALLERY_IMAGES.outdoor.after,
  },
  "outdoor-living": {
    hero: GALLERY_IMAGES.outdoor.after,
    breather: GALLERY_IMAGES.outdoor.before,
    process: GALLERY_IMAGES.wholeHome.after,
  },
  "aging-in-place": {
    hero: GALLERY_IMAGES.bathroom.after,
    breather: GALLERY_IMAGES.bathroom.before,
    process: GALLERY_IMAGES.wholeHome.after,
  },
};

export function getServiceImageSet(serviceSlug: string): LandingImageSet {
  return (
    SERVICE_IMAGE_SETS[serviceSlug] ?? {
      hero: DEFAULT_SERVICE_BACKGROUND,
      breather: DEFAULT_SERVICE_BACKGROUND,
      process: DEFAULT_SERVICE_BACKGROUND,
    }
  );
}

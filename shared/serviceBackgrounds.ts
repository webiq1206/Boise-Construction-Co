import { GALLERY_IMAGES, SITE_IMAGES } from "./siteImages";

export interface ServiceBackgroundConfig {
  [key: string]: string;
}

const DEFAULT_BACKGROUND = SITE_IMAGES.hero;

/**
 * Interim mapping. Dedicated new-construction photography has not been
 * generated yet, so each service points at an existing whole-home or process
 * image that is at least topically honest. Replace with per-service
 * construction imagery during the image regeneration pass; do not point these
 * at files that do not exist, since nothing validates these paths at build time.
 */
export const SERVICE_BACKGROUNDS: ServiceBackgroundConfig = {
  "custom-home-builder": SITE_IMAGES.statementBand,
  "semi-custom-homes": SITE_IMAGES.hero,
  "build-on-your-lot": SITE_IMAGES.statementBand,
  "design-build": SITE_IMAGES.process,
  "home-plans-design": SITE_IMAGES.process,
  "lot-evaluation": SITE_IMAGES.process,
  "shop-homes-barndominiums": SITE_IMAGES.statementBand,
  "energy-efficient-homes": SITE_IMAGES.hero,
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
 * panel each show a different relevant photo (finished room, detail, in-progress).
 */
const SERVICE_IMAGE_SETS: Record<string, LandingImageSet> = {
  "custom-home-builder": {
    hero: SITE_IMAGES.statementBand,
    breather: GALLERY_IMAGES.wholeHome.after,
    process: SITE_IMAGES.process,
  },
  "semi-custom-homes": {
    hero: SITE_IMAGES.hero,
    breather: GALLERY_IMAGES.wholeHome.after,
    process: SITE_IMAGES.process,
  },
  "build-on-your-lot": {
    hero: SITE_IMAGES.statementBand,
    breather: SITE_IMAGES.hero,
    process: SITE_IMAGES.process,
  },
  "design-build": {
    hero: SITE_IMAGES.process,
    breather: SITE_IMAGES.statementBand,
    process: SITE_IMAGES.processInProgress,
  },
  "home-plans-design": {
    hero: SITE_IMAGES.process,
    breather: SITE_IMAGES.hero,
    process: SITE_IMAGES.processInProgress,
  },
  "lot-evaluation": {
    hero: SITE_IMAGES.process,
    breather: SITE_IMAGES.statementBand,
    process: SITE_IMAGES.processInProgress,
  },
  "shop-homes-barndominiums": {
    hero: SITE_IMAGES.statementBand,
    breather: SITE_IMAGES.hero,
    process: SITE_IMAGES.processInProgress,
  },
  "energy-efficient-homes": {
    hero: SITE_IMAGES.hero,
    breather: GALLERY_IMAGES.wholeHome.after,
    process: SITE_IMAGES.processInProgress,
  },
};

export function getServiceImageSet(serviceSlug: string): LandingImageSet {
  return (
    SERVICE_IMAGE_SETS[serviceSlug] ?? {
      hero: DEFAULT_SERVICE_BACKGROUND,
      breather: DEFAULT_SERVICE_BACKGROUND,
      process: SITE_IMAGES.process,
    }
  );
}

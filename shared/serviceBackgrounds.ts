import { CONSTRUCTION_IMAGES, SITE_IMAGES } from "./siteImages";

export interface ServiceBackgroundConfig {
  [key: string]: string;
}

const DEFAULT_BACKGROUND = CONSTRUCTION_IMAGES.customHome;

/**
 * Hero background per service. Each points at a photograph of the thing the
 * service actually is: the lot services show ground, the design services show
 * drawings, the build services show a house.
 */
export const SERVICE_BACKGROUNDS: ServiceBackgroundConfig = {
  "custom-home-builder": CONSTRUCTION_IMAGES.customHome,
  "semi-custom-homes": CONSTRUCTION_IMAGES.semiCustom,
  "build-on-your-lot": CONSTRUCTION_IMAGES.lot,
  "design-build": CONSTRUCTION_IMAGES.meeting,
  "home-plans-design": CONSTRUCTION_IMAGES.plans,
  "lot-evaluation": CONSTRUCTION_IMAGES.ruralSite,
  "shop-homes-barndominiums": CONSTRUCTION_IMAGES.shopHome,
  "energy-efficient-homes": CONSTRUCTION_IMAGES.insulation,
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
 * Three images per service, chosen so a visitor scrolling one page sees the
 * finished result, the work in progress, and the planning behind it rather
 * than three angles of the same thing.
 */
const SERVICE_IMAGE_SETS: Record<string, LandingImageSet> = {
  "custom-home-builder": {
    hero: CONSTRUCTION_IMAGES.customHome,
    breather: CONSTRUCTION_IMAGES.interior,
    process: CONSTRUCTION_IMAGES.framing,
  },
  "semi-custom-homes": {
    hero: CONSTRUCTION_IMAGES.semiCustom,
    breather: CONSTRUCTION_IMAGES.kitchen,
    process: CONSTRUCTION_IMAGES.plans,
  },
  "build-on-your-lot": {
    hero: CONSTRUCTION_IMAGES.lot,
    breather: CONSTRUCTION_IMAGES.customHome,
    process: CONSTRUCTION_IMAGES.foundation,
  },
  "design-build": {
    hero: CONSTRUCTION_IMAGES.meeting,
    breather: CONSTRUCTION_IMAGES.interior,
    process: CONSTRUCTION_IMAGES.roughIn,
  },
  "home-plans-design": {
    hero: CONSTRUCTION_IMAGES.plans,
    breather: CONSTRUCTION_IMAGES.outdoor,
    process: SITE_IMAGES.processInProgress,
  },
  "lot-evaluation": {
    hero: CONSTRUCTION_IMAGES.ruralSite,
    breather: CONSTRUCTION_IMAGES.foothills,
    process: CONSTRUCTION_IMAGES.lot,
  },
  "shop-homes-barndominiums": {
    hero: CONSTRUCTION_IMAGES.shopHome,
    breather: CONSTRUCTION_IMAGES.interior,
    process: CONSTRUCTION_IMAGES.framing,
  },
  "energy-efficient-homes": {
    hero: CONSTRUCTION_IMAGES.insulation,
    breather: CONSTRUCTION_IMAGES.interior,
    process: CONSTRUCTION_IMAGES.roughIn,
  },
};

export function getServiceImageSet(serviceSlug: string): LandingImageSet {
  return (
    SERVICE_IMAGE_SETS[serviceSlug] ?? {
      hero: DEFAULT_SERVICE_BACKGROUND,
      breather: CONSTRUCTION_IMAGES.interior,
      process: CONSTRUCTION_IMAGES.framing,
    }
  );
}

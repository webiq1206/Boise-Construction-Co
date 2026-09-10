/**
 * Imagery for service pages, service-in-city pages, and area pages.
 *
 * The previous version pointed at forty per-service-per-city renders of
 * remodeled kitchens and bathrooms. Those describe work the company no longer
 * does, so the mapping is rebuilt against the construction image library in
 * public/images/construction.
 *
 * Each service has a primary image that matches what the service actually is.
 * City variants rotate through relevant construction stages and outcomes.
 * Lot evaluation and shop-home pages use narrower shortlists so unrelated
 * completed houses do not substitute for the advertised service. Related
 * city pages may reuse appropriate representative imagery.
 *
 * Key format for CITY_SERVICE_IMAGES: "service-slug/city-slug"
 */

import { CONSTRUCTION_IMAGES, SITE_IMAGES } from "./siteImages";
import { type LandingImageSet } from "./serviceBackgrounds";

const CITY_SLUGS = [
  "boise",
  "meridian",
  "eagle",
  "nampa",
  "kuna",
  "star",
  "middleton",
  "caldwell",
  "garden-city",
] as const;

/**
 * Per-service rotation. The first entry is the service's primary image and is
 * what the service overview page uses; the rest supply the city variants.
 * Relevant representative images may repeat within a service.
 */
const SERVICE_ROTATION: Record<string, readonly string[]> = {
  "custom-home-builder": [
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.kitchen,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.outdoor,
    CONSTRUCTION_IMAGES.meeting,
    CONSTRUCTION_IMAGES.foothills,
  ],
  "semi-custom-homes": [
    CONSTRUCTION_IMAGES.semiCustom,
    CONSTRUCTION_IMAGES.kitchen,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.meeting,
  ],
  "build-on-your-lot": [
    CONSTRUCTION_IMAGES.lot,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.ruralSite,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.foothills,
    CONSTRUCTION_IMAGES.semiCustom,
    CONSTRUCTION_IMAGES.meeting,
  ],
  "design-build": [
    CONSTRUCTION_IMAGES.meeting,
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.budget,
    CONSTRUCTION_IMAGES.roughIn,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.foundation,
  ],
  "home-plans-design": [
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.kitchen,
    CONSTRUCTION_IMAGES.meeting,
    CONSTRUCTION_IMAGES.outdoor,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.semiCustom,
    CONSTRUCTION_IMAGES.framing,
  ],
  "home-additions": [
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.meeting,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.kitchen,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.roughIn,
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.outdoor,
  ],
  "lot-evaluation": [
    CONSTRUCTION_IMAGES.lot,
    CONSTRUCTION_IMAGES.ruralSite,
    CONSTRUCTION_IMAGES.foothills,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.meeting,
  ],
  "shop-homes-barndominiums": [
    CONSTRUCTION_IMAGES.shopHome,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.foundation,
    CONSTRUCTION_IMAGES.ruralSite,
  ],
  "energy-efficient-homes": [
    CONSTRUCTION_IMAGES.insulation,
    CONSTRUCTION_IMAGES.roughIn,
    CONSTRUCTION_IMAGES.framing,
    CONSTRUCTION_IMAGES.interior,
    CONSTRUCTION_IMAGES.customHome,
    CONSTRUCTION_IMAGES.plans,
    CONSTRUCTION_IMAGES.semiCustom,
    CONSTRUCTION_IMAGES.foundation,
  ],
};

function buildCityServiceImages(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [service, rotation] of Object.entries(SERVICE_ROTATION)) {
    CITY_SLUGS.forEach((city, i) => {
      map[`${service}/${city}`] = rotation[i % rotation.length];
    });
  }
  return map;
}

export const CITY_SERVICE_IMAGES: Record<string, string> = buildCityServiceImages();

/** Neighborhood-style hero images for each city area page. */
export const CITY_HERO_IMAGES: Record<string, string> = {
  boise: "/images/areas/boise.webp",
  meridian: "/images/areas/meridian.webp",
  eagle: "/images/areas/eagle.webp",
  nampa: "/images/areas/nampa.webp",
  kuna: "/images/areas/kuna.webp",
  star: "/images/areas/star.webp",
  middleton: "/images/areas/middleton.webp",
  caldwell: "/images/areas/caldwell.webp",
  "garden-city": "/images/areas/boise.webp",
};

/** The primary image for each service, used when no city applies. */
export const SERVICE_FALLBACK_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_ROTATION).map(([service, rotation]) => [service, rotation[0]]),
);

/**
 * Resolve the dedicated hero image for a specific service-in-city page.
 * Falls back to the service primary image, then undefined.
 */
export function getCityServiceBackground(
  serviceSlug: string,
  citySlug: string,
): string | undefined {
  return (
    CITY_SERVICE_IMAGES[`${serviceSlug}/${citySlug}`] ??
    SERVICE_FALLBACK_IMAGES[serviceSlug]
  );
}

/**
 * Three distinct images for a service-in-city page: the city variant as the
 * hero, a different image from the same service rotation for the breather
 * band, and the service primary for the process panel.
 */
export function getCityServiceImageSet(
  serviceSlug: string,
  citySlug: string,
): LandingImageSet {
  const rotation = SERVICE_ROTATION[serviceSlug];
  const cityIndex = CITY_SLUGS.indexOf(citySlug as (typeof CITY_SLUGS)[number]);
  const hero =
    CITY_SERVICE_IMAGES[`${serviceSlug}/${citySlug}`] ??
    SERVICE_FALLBACK_IMAGES[serviceSlug] ??
    SITE_IMAGES.hero;

  if (!rotation || cityIndex < 0) {
    return { hero, breather: hero, process: hero };
  }

  return {
    hero,
    // Offset by three rather than one so the two images on a page are visually
    // unrelated instead of adjacent stages of the same build.
    breather: rotation[(cityIndex + 3) % rotation.length],
    process: ["lot-evaluation", "shop-homes-barndominiums"].includes(serviceSlug)
      ? rotation.find(src => src !== hero && src !== rotation[(cityIndex + 3) % rotation.length]) ?? rotation[0]
      : rotation[0],
  };
}

/**
 * Three distinct images for an area (city) page: the city hero, plus two
 * construction images that vary by city so neighbouring area pages do not
 * open with the same pair.
 */
export function getAreaImageSet(citySlug: string): LandingImageSet {
  const hero = CITY_HERO_IMAGES[citySlug] ?? SITE_IMAGES.hero;
  const rotation = SERVICE_ROTATION["custom-home-builder"];
  const i = Math.max(0, CITY_SLUGS.indexOf(citySlug as (typeof CITY_SLUGS)[number]));
  return {
    hero,
    breather: rotation[i % rotation.length],
    process: rotation[(i + 4) % rotation.length],
  };
}

/**
 * Look up a unique image for an internal URL (used by related-link cards).
 * Uses exact path-segment matching so partial names (e.g. a blog slug that
 * contains "star" or "eagle") can never accidentally match a city or service.
 * Returns undefined if the URL is not a service or area page.
 */
export function getCityServiceImage(url: string): string | undefined {
  const pathname = url.split("?")[0].split("#")[0];
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "services" && segments[1]) {
    const service = segments[1];
    const city = segments[2];
    if (city) {
      const key = `${service}/${city}`;
      if (CITY_SERVICE_IMAGES[key]) return CITY_SERVICE_IMAGES[key];
    }
    if (SERVICE_FALLBACK_IMAGES[service]) return SERVICE_FALLBACK_IMAGES[service];
  }

  if (segments[0] === "areas" && segments[1]) {
    const city = segments[1];
    if (CITY_HERO_IMAGES[city]) return CITY_HERO_IMAGES[city];
  }

  return undefined;
}

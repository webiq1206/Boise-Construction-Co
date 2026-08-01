import { GALLERY_IMAGES } from "./siteImages";

export interface GalleryProject {
  serviceType: string;
  city: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  title: string;
  description: string;
}

export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    serviceType: "kitchen-remodel",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.kitchen.before,
    afterImageUrl: GALLERY_IMAGES.kitchen.after,
    title: "Modern Kitchen Transformation",
    description:
      "Full kitchen remodel with custom cabinets, quartz countertops, and new layout in Boise",
  },
  {
    serviceType: "bathroom-remodel",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.bathroom.before,
    afterImageUrl: GALLERY_IMAGES.bathroom.after,
    title: "Primary Bathroom Renovation",
    description:
      "Luxury primary bathroom remodel with walk-in shower, freestanding tub, and heated floors in Meridian",
  },
  {
    serviceType: "whole-home-remodel",
    city: "eagle",
    beforeImageUrl: GALLERY_IMAGES.wholeHome.before,
    afterImageUrl: GALLERY_IMAGES.wholeHome.after,
    title: "Whole-Home Remodel",
    description:
      "Complete interior renovation of a 1990s Eagle home with open floor plan, new kitchen, and three updated bathrooms",
  },
  {
    serviceType: "room-addition",
    city: "nampa",
    beforeImageUrl: GALLERY_IMAGES.addition.before,
    afterImageUrl: GALLERY_IMAGES.addition.after,
    title: "Master Suite Addition",
    description:
      "600 sq ft master suite addition with ensuite bath and walk-in closet in Nampa",
  },
  {
    serviceType: "basement-finish",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.basement.before,
    afterImageUrl: GALLERY_IMAGES.basement.after,
    title: "Basement Finish",
    description:
      "Unfinished basement transformed into a family room, home office, and full bath in Boise",
  },
  {
    serviceType: "outdoor-living",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.outdoor.before,
    afterImageUrl: GALLERY_IMAGES.outdoor.after,
    title: "Outdoor Living Transformation",
    description:
      "Plain concrete patio converted to a covered outdoor kitchen and dining space in Boise",
  },
  {
    serviceType: "adu",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.aduBoise.before,
    afterImageUrl: GALLERY_IMAGES.aduBoise.after,
    title: "Detached ADU Build",
    description:
      "Side-yard garage area replaced with a detached ADU including kitchenette and private entry in Boise",
  },
  {
    serviceType: "aging-in-place",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.agingBoise.before,
    afterImageUrl: GALLERY_IMAGES.agingBoise.after,
    title: "Accessible Primary Bath",
    description:
      "Standard tub and narrow doorway converted to a curbless shower, grab bars, and widened door in Boise",
  },
  {
    serviceType: "kitchen-remodel",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.kitchenMeridian.before,
    afterImageUrl: GALLERY_IMAGES.kitchenMeridian.after,
    title: "Meridian Kitchen Refresh",
    description:
      "2000s builder-grade kitchen updated with new layout, island seating, and quartz surfaces in Meridian",
  },
  {
    serviceType: "kitchen-remodel",
    city: "eagle",
    beforeImageUrl: GALLERY_IMAGES.kitchenEagle.before,
    afterImageUrl: GALLERY_IMAGES.kitchenEagle.after,
    title: "Eagle Foothills Kitchen",
    description:
      "Dated kitchen with foothills views transformed with custom walnut cabinetry and waterfall island in Eagle",
  },
  {
    serviceType: "bathroom-remodel",
    city: "boise",
    beforeImageUrl: GALLERY_IMAGES.hallBathBoise.before,
    afterImageUrl: GALLERY_IMAGES.hallBathBoise.after,
    title: "Hall Bath Shower Conversion",
    description:
      "Pedestal sink and tub combo replaced with a walk-in shower and floating vanity in a Boise hall bath",
  },
  {
    serviceType: "bathroom-remodel",
    city: "nampa",
    beforeImageUrl: GALLERY_IMAGES.bathroomNampa.before,
    afterImageUrl: GALLERY_IMAGES.bathroomNampa.after,
    title: "Nampa Primary Bath Remodel",
    description:
      "Corner tub layout converted to a walk-in shower and double vanity in a Nampa primary bathroom",
  },
  {
    serviceType: "whole-home-remodel",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.wholeHomeMeridian.before,
    afterImageUrl: GALLERY_IMAGES.wholeHomeMeridian.after,
    title: "Meridian Open Main Floor",
    description:
      "Fragmented main floor opened into a connected kitchen, dining, and living space in Meridian",
  },
  {
    serviceType: "room-addition",
    city: "eagle",
    beforeImageUrl: GALLERY_IMAGES.additionEagle.before,
    afterImageUrl: GALLERY_IMAGES.additionEagle.after,
    title: "Eagle Rear Addition",
    description:
      "Rear elevation expanded with a new gable roof line and master suite addition in Eagle",
  },
  {
    serviceType: "room-addition",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.additionMeridian.before,
    afterImageUrl: GALLERY_IMAGES.additionMeridian.after,
    title: "Meridian Sunroom Bump-Out",
    description:
      "Side-yard bump-out added a bright sunroom and expanded family dining space in Meridian",
  },
  {
    serviceType: "basement-finish",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.basementMeridian.before,
    afterImageUrl: GALLERY_IMAGES.basementMeridian.after,
    title: "Meridian Basement Media Room",
    description:
      "Unfinished storage space converted to a media room with wet bar and recessed lighting in Meridian",
  },
  {
    serviceType: "basement-finish",
    city: "nampa",
    beforeImageUrl: GALLERY_IMAGES.basementNampa.before,
    afterImageUrl: GALLERY_IMAGES.basementNampa.after,
    title: "Nampa Basement Finish",
    description:
      "Partially finished basement completed with a full bath, bedroom, and family room in Nampa",
  },
  {
    serviceType: "outdoor-living",
    city: "eagle",
    beforeImageUrl: GALLERY_IMAGES.outdoorEagle.before,
    afterImageUrl: GALLERY_IMAGES.outdoorEagle.after,
    title: "Eagle Covered Patio",
    description:
      "Existing deck expanded into a covered patio with stone fireplace and outdoor dining in Eagle",
  },
  {
    serviceType: "outdoor-living",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.outdoorMeridian.before,
    afterImageUrl: GALLERY_IMAGES.outdoorMeridian.after,
    title: "Meridian Outdoor Kitchen",
    description:
      "Small concrete pad converted to an outdoor kitchen and pergola dining area in Meridian",
  },
  {
    serviceType: "aging-in-place",
    city: "meridian",
    beforeImageUrl: GALLERY_IMAGES.agingMeridian.before,
    afterImageUrl: GALLERY_IMAGES.agingMeridian.after,
    title: "Meridian Zero-Threshold Bath",
    description:
      "Standard primary bath updated with a zero-threshold shower, seated bench, and lever handles in Meridian",
  },
];

/**
 * Return gallery projects that match a specific service + city, used to embed
 * local before/after proof on city x service landing pages.
 */
export function getGalleryProjectsFor(
  serviceSlug: string,
  citySlug: string,
): GalleryProject[] {
  return GALLERY_PROJECTS.filter(
    (p) => p.serviceType === serviceSlug && p.city === citySlug,
  );
}

/** Return all gallery projects for a city (any service). Used on area pages. */
export function getGalleryProjectsForCity(citySlug: string): GalleryProject[] {
  return GALLERY_PROJECTS.filter((p) => p.city === citySlug);
}

/** Map service hub slugs to gallery serviceType values. */
const SERVICE_GALLERY_SLUG: Record<string, string> = {
  "kitchen-remodel": "kitchen-remodel",
  "bathroom-remodel": "bathroom-remodel",
  "whole-home-remodel": "whole-home-remodel",
  "room-addition": "room-addition",
  "basement-remodel": "basement-finish",
  "outdoor-living": "outdoor-living",
  adu: "adu",
  "aging-in-place": "aging-in-place",
};

/** Primary gallery project for a service hub page, if one exists. */
export function getFeaturedGalleryProject(serviceSlug: string): GalleryProject | undefined {
  const galleryType = SERVICE_GALLERY_SLUG[serviceSlug];
  if (!galleryType) return undefined;
  return (
    GALLERY_PROJECTS.find((p) => p.serviceType === galleryType) ??
    GALLERY_PROJECTS.find((p) => p.serviceType === serviceSlug)
  );
}

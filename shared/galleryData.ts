/**
 * Featured concept homes for Boise Construction Co.
 *
 * Concept design imagery for one Eagle mountain-modern set. Captions describe
 * materials and rooms only. These are not photographed customer projects.
 */

export interface GalleryProjectImage {
  src: string;
  /** Short room/view label shown in the gallery UI. */
  label: string;
}

export interface GalleryProject {
  serviceType: string;
  city: string;
  title: string;
  description: string;
  /** Cohesive views of one concept home, exterior first. */
  images: GalleryProjectImage[];
}

const p = (name: string) => `/images/projects/eagle-mountain-modern/${name}.webp`;

export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    serviceType: "custom-home-builder",
    city: "eagle",
    title: "Eagle Foothills Mountain-Modern Concept",
    description:
      "Charcoal stucco and dry-stacked grey ledgestone under a dark bronze standing-seam roof, with black steel windows, warm cedar soffits, and interiors in white oak, plaster, and limestone through the great room, kitchen, and primary bath.",
    images: [
      { src: p("eagle-custom-home-front-exterior"), label: "Front exterior" },
      { src: p("eagle-custom-home-great-room"), label: "Great room" },
      { src: p("eagle-custom-home-kitchen"), label: "Kitchen" },
      { src: p("eagle-custom-home-primary-bath"), label: "Primary bath" },
      { src: p("eagle-custom-home-rear-patio"), label: "Rear patio" },
      { src: p("eagle-custom-home-framing"), label: "Framing" },
      { src: p("eagle-custom-home-lot-before"), label: "Lot before" },
    ],
  },
];

/** Exterior (lead) image for a project. */
export function projectExteriorSrc(project: GalleryProject): string {
  return project.images[0]?.src ?? "";
}

/** Primary interior image for pairing with the exterior in compact proof blocks. */
export function projectInteriorSrc(project: GalleryProject): string {
  return project.images[1]?.src ?? project.images[0]?.src ?? "";
}

/**
 * Return gallery projects that match a specific service + city, used to embed
 * local proof on city x service landing pages.
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

/**
 * Primary gallery project for a service hub page, if one exists.
 */
export function getFeaturedGalleryProject(serviceSlug: string): GalleryProject | undefined {
  return GALLERY_PROJECTS.find((p) => p.serviceType === serviceSlug);
}

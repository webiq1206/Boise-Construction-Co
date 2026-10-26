/**
 * Featured concept homes for Boise Construction Co.
 *
 * These are representative design imagery: finished-home photography of
 * cohesive concept properties used to illustrate custom and semi-custom work
 * across the Treasure Valley. They are not photographed customer projects and
 * must not be described as completed jobs.
 *
 * New construction has no remodel-style "before." Each project is a set of
 * rooms and exteriors that belong to one property (materials, windows, and
 * setting stay continuous).
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

const p = (name: string) => `/images/projects/${name}.webp`;

export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    serviceType: "custom-home-builder",
    city: "eagle",
    title: "Eagle Foothills Modern Farmhouse",
    description:
      "Representative design imagery for a white board-and-batten custom home on the Eagle foothills fringe: dark metal roof, warm wood porch columns, black-framed openings, and interiors that keep the same materials through the great room, kitchen, primary bath, and covered outdoor living.",
    images: [
      { src: p("eagle-farmhouse-exterior"), label: "Exterior" },
      { src: p("eagle-farmhouse-great-room"), label: "Great room" },
      { src: p("eagle-farmhouse-kitchen"), label: "Kitchen" },
      { src: p("eagle-farmhouse-bath"), label: "Primary bath" },
      { src: p("eagle-farmhouse-outdoor"), label: "Outdoor living" },
    ],
  },
  {
    serviceType: "semi-custom-homes",
    city: "meridian",
    title: "Meridian Semi-Custom Ranch",
    description:
      "Representative design imagery for a single-story gray ranch suited to Meridian neighborhoods: stone-wrapped porch columns, white trim, and matching soft-gray living, kitchen, and bath finishes under bright Treasure Valley daylight.",
    images: [
      { src: p("meridian-ranch-exterior"), label: "Exterior" },
      { src: p("meridian-ranch-living"), label: "Living room" },
      { src: p("meridian-ranch-kitchen"), label: "Kitchen" },
      { src: p("meridian-ranch-bath"), label: "Bath" },
    ],
  },
  {
    serviceType: "custom-home-builder",
    city: "boise",
    title: "Boise Craftsman Two-Story",
    description:
      "Representative design imagery for a two-story craftsman in a Boise neighborhood: sage lap siding, cedar-shake gables, stacked stone, and continuous cream, wood, and stone interiors from the foyer through the kitchen and family room.",
    images: [
      { src: p("boise-craftsman-exterior"), label: "Exterior" },
      { src: p("boise-craftsman-foyer"), label: "Foyer" },
      { src: p("boise-craftsman-kitchen"), label: "Kitchen" },
      { src: p("boise-craftsman-living"), label: "Family room" },
    ],
  },
  {
    serviceType: "build-on-your-lot",
    city: "eagle",
    title: "Build on Your Lot: Foothills Farmhouse",
    description:
      "Representative design imagery showing how a foothills lot can carry a modern farmhouse from curb to covered patio, with site views kept visible through black-framed glass.",
    images: [
      { src: p("eagle-farmhouse-exterior"), label: "Exterior" },
      { src: p("eagle-farmhouse-outdoor"), label: "Outdoor living" },
      { src: p("eagle-farmhouse-great-room"), label: "Great room" },
      { src: p("eagle-farmhouse-kitchen"), label: "Kitchen" },
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

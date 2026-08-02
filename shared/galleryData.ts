export interface GalleryProject {
  serviceType: string;
  city: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  title: string;
  description: string;
}

/**
 * Empty until real, photographed homes exist for Boise Construction Co.
 *
 * The previous entries were placeholder remodeling projects carrying specific
 * factual claims ("a 1990s Eagle home", "600 sq ft master suite addition").
 * Presenting those as this builder's portfolio would describe work that was
 * never performed, so they are retired rather than relabelled.
 *
 * The before/after shape also does not survive the move to new construction:
 * there is no "before" for a house that did not exist. A rebuilt portfolio
 * should use finished-home photography or clearly labelled concept renderings,
 * which will need a different interface than GalleryProject.
 *
 * Every consumer guards on an empty list, so gallery sections and area-page
 * proof blocks render nothing while this stays empty.
 */
export const GALLERY_PROJECTS: GalleryProject[] = [];

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

/**
 * Primary gallery project for a service hub page, if one exists. The old
 * slug-translation map was dropped with the remodeling projects; service slugs
 * and `serviceType` values should match directly when the portfolio returns.
 */
export function getFeaturedGalleryProject(serviceSlug: string): GalleryProject | undefined {
  return GALLERY_PROJECTS.find((p) => p.serviceType === serviceSlug);
}

export interface TestimonialItem {
  customerName: string;
  serviceType: string;
  city: string;
  rating: string;
  testimonial: string;
}

/**
 * Empty until real, attributable client reviews exist for Boise Construction Co.
 *
 * The previous entries were placeholder remodeling testimonials with invented
 * customer names. Carrying them onto a new-construction site would misrepresent
 * work that was never performed, so they are retired rather than reworded.
 * Populate this from genuine reviews only; AggregateRating in lib/schema.ts is
 * separately gated on BUSINESS_INFO.reviewCount, which must also reflect real
 * counts before any review markup is emitted.
 */
export const TESTIMONIALS: TestimonialItem[] = [];

/**
 * Return testimonials that match a specific service + city, used to embed
 * local proof on city x service landing pages. City-tagged data only exists
 * for a subset of cities today (Boise, Meridian, Eagle, Nampa).
 */
export function getTestimonialsFor(
  serviceSlug: string,
  citySlug: string,
): TestimonialItem[] {
  return TESTIMONIALS.filter(
    (t) => t.serviceType === serviceSlug && t.city === citySlug,
  );
}

/** Return all testimonials for a city (any service). Used on area pages. */
export function getTestimonialsForCity(citySlug: string): TestimonialItem[] {
  return TESTIMONIALS.filter((t) => t.city === citySlug);
}

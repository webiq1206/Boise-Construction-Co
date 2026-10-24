/**
 * Unproven marketing claims. The phrases stay here. They are omitted from
 * copy, meta, JSON-LD, llms files, and alts while this flag is false.
 */
import { SHOW_TRUST } from './publicFlags';
export const SHOW_UNPROVEN_TRUST = SHOW_TRUST;

/** "Satisfaction guaranteed" when that claim may be published. */
export function satisfactionGuaranteedCta(): string {
  return SHOW_UNPROVEN_TRUST ? 'Satisfaction guaranteed' : 'Free planning consultation';
}

/** "top-rated" when that claim may be published. */
export function topRatedLabel(): string | null {
  return SHOW_UNPROVEN_TRUST ? 'top-rated' : null;
}

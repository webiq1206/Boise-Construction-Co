/**
 * Multi-County Assessor Abstraction Layer
 * Routes property searches to appropriate county assessor services
 */

import { LRUCache } from 'lru-cache';
import { searchAdaCountyProperties } from './adaCountyAssessor';
import { searchCanyonCountyProperties } from './canyonCountyAssessor';
import { normalizeForCompare } from './addressMatch';
import type { PropertySearchResult } from './adaCountyAssessor';

export type County = 'ada' | 'canyon';

export interface AssessorQueryParams {
  county: County;
  address: string;
  cityContext?: string;
  enableFallback?: boolean; // Try other county if primary fails
  /**
   * Skip the cache and always hit the source. Used by the health probe, which
   * would otherwise report a dead host as healthy by reading its own cached
   * result back.
   */
  bypassCache?: boolean;
}

const ADA_CITIES = ['KUNA', 'BOISE', 'MERIDIAN', 'EAGLE', 'STAR', 'GARDEN CITY', 'HIDDEN SPRINGS'];
const CANYON_CITIES = [
  'NAMPA',
  'CALDWELL',
  'MIDDLETON',
  'MELBA',
  'GREENLEAF',
  'NOTUS',
  'PARMA',
  'WILDER',
];

/**
 * Lookups are pure reads of data that changes at most annually, and the same
 * address gets queried repeatedly: a homeowner who edits their estimate, comes
 * back later, or resubmits produces the identical key every time.
 *
 * Hits and misses are cached with different lifetimes. A miss is often a
 * transient outage rather than a genuine "no such parcel", and caching that for
 * a day would turn a brief blip into a day of missing enrichment.
 */
const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 500;

const resultCache = new LRUCache<string, PropertySearchResult>({
  max: CACHE_MAX,
  ttl: HIT_TTL_MS,
});

function cacheKey(county: County, address: string, cityContext?: string): string {
  return `${county}|${normalizeForCompare(address)}|${normalizeForCompare(cityContext ?? '')}`;
}

function isHit(result: PropertySearchResult): boolean {
  return result.success && result.properties.length > 0;
}

/** True when the city unambiguously identifies this county. */
function cityBelongsTo(county: County, cityContext?: string): boolean {
  if (!cityContext) return false;
  const city = cityContext.toUpperCase().trim();
  const list = county === 'ada' ? ADA_CITIES : CANYON_CITIES;
  return list.some((known) => city.includes(known) || known.includes(city));
}

export function clearAssessorCache(): void {
  resultCache.clear();
}

export function assessorCacheStats(): { size: number; max: number } {
  return { size: resultCache.size, max: CACHE_MAX };
}

/**
 * Query property data from county assessor with intelligent fallback
 *
 * @param county - Primary county to search ('ada' or 'canyon')
 * @param address - Property address to search
 * @param cityContext - Optional city context from form (e.g., "Kuna", "Nampa")
 * @param enableFallback - If true, tries other county if primary county returns no results
 *
 * @returns PropertySearchResult with properties or error message
 */
export async function queryAssessor({
  county,
  address,
  cityContext,
  enableFallback = true,
  bypassCache = false,
}: AssessorQueryParams): Promise<PropertySearchResult> {
  const key = cacheKey(county, address, cityContext);
  if (!bypassCache) {
    const cached = resultCache.get(key);
    if (cached) {
      console.log('[AssessorRouter] Cache hit:', key);
      return cached;
    }
  }

  console.log('[AssessorRouter] Querying:', { county, address, cityContext, enableFallback });
  const result = await resolveAcrossCounties(county, address, cityContext, enableFallback);

  resultCache.set(key, result, { ttl: isHit(result) ? HIT_TTL_MS : MISS_TTL_MS });
  return result;
}

async function resolveAcrossCounties(
  county: County,
  address: string,
  cityContext: string | undefined,
  enableFallback: boolean
): Promise<PropertySearchResult> {
  const otherCounty: County = county === 'ada' ? 'canyon' : 'ada';
  const primary = () => queryCounty(county, address, cityContext);
  const secondary = () => queryCounty(otherCounty, address, cityContext);

  if (!enableFallback) return primary();

  /*
   * When the city names the county outright, the other county is almost
   * certainly wasted work, so it is only paid for if the primary misses.
   *
   * When the city is unknown or ambiguous, the previous code ran the two
   * lookups back to back. Running them together makes the worst case the
   * slower of the two rather than their sum, which on measured latency is
   * roughly 900ms saved on a miss.
   */
  if (cityBelongsTo(county, cityContext)) {
    const result = await primary();
    if (isHit(result)) return result;

    const fallback = await secondary();
    if (isHit(fallback)) {
      console.log('[AssessorRouter] Fallback succeeded with', fallback.properties.length, 'properties');
      return fallback;
    }
    return withBothFailedSuggestion(result, county, otherCounty);
  }

  const [result, fallback] = await Promise.all([primary(), secondary()]);
  if (isHit(result)) return result;
  if (isHit(fallback)) {
    console.log('[AssessorRouter] Fallback succeeded with', fallback.properties.length, 'properties');
    return fallback;
  }
  return withBothFailedSuggestion(result, county, otherCounty);
}

function withBothFailedSuggestion(
  result: PropertySearchResult,
  county: County,
  fallbackCounty: County
): PropertySearchResult {
  console.log('[AssessorRouter] Both counties failed');
  return {
    ...result,
    suggestion:
      result.suggestion ||
      `Property not found in ${formatCountyName(county)} or ${formatCountyName(
        fallbackCounty
      )}. Please check the address or enter measurements manually.`,
  };
}

/**
 * Query a specific county assessor
 */
async function queryCounty(
  county: County,
  address: string,
  cityContext?: string
): Promise<PropertySearchResult> {
  switch (county) {
    case 'ada':
      return searchAdaCountyProperties(address, cityContext);
    case 'canyon':
      return searchCanyonCountyProperties(address, cityContext);
    default:
      return {
        success: false,
        properties: [],
        error: `Unsupported county: ${county}`,
      };
  }
}

/**
 * Format county name for display
 */
function formatCountyName(county: County): string {
  return county === 'ada' ? 'Ada County' : 'Canyon County';
}

/**
 * Determine county from city name
 * Uses the CITIES data from contentData.ts
 */
export function getCountyFromCity(cityName?: string): County {
  if (!cityName) return 'ada'; // Default to Ada County
  if (cityBelongsTo('ada', cityName)) return 'ada';
  if (cityBelongsTo('canyon', cityName)) return 'canyon';
  return 'ada'; // Default to Ada County if city not recognized
}

// Re-export types for convenience
export type { PropertyData, PropertySearchResult } from './adaCountyAssessor';

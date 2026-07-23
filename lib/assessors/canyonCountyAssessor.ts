/**
 * Canyon County Assessor Service
 *
 * Canyon County publishes no parcel API of its own. The lookup here instead
 * uses the countywide parcel layer hosted by the City of Nampa, which is
 * public and carries a site address for all ~105,000 Canyon parcels. See
 * canyonParcelLookup.ts for the sources and their limits.
 *
 * Canyon returns less than Ada: there is no assessed value, owner of record,
 * homeowner's exemption or subdivision available. Zoning is present inside
 * Nampa city limits only. Callers must treat all of those as
 * optional rather than assuming parity with Ada.
 */

import { normalizeStreetAddress } from './adaCountyAssessor';
import type { PropertySearchResult, PropertyData } from './adaCountyAssessor';
import { lookupCanyonParcels } from './canyonParcelLookup';

// Known Canyon County cities with common misspellings
const CITY_MAPPINGS: Record<string, string> = {
  'NAMPA': 'NAMPA',
  'CALDWELL': 'CALDWELL',
  'CALDWEL': 'CALDWELL', // Common misspelling
  'MIDDLETON': 'MIDDLETON',
  'MIDLETON': 'MIDDLETON', // Common misspelling
  'MELBA': 'MELBA',
  'GREENLEAF': 'GREENLEAF',
  'NOTUS': 'NOTUS',
  'PARMA': 'PARMA',
  'WILDER': 'WILDER',
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy city name matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Normalize city name to handle misspellings
 */
function normalizeCity(city: string): string | null {
  if (!city) return null;
  
  const upperCity = city.toUpperCase().trim();
  
  // Direct match
  if (CITY_MAPPINGS[upperCity]) {
    return CITY_MAPPINGS[upperCity];
  }
  
  // Fuzzy match using substring logic
  const cities = Object.keys(CITY_MAPPINGS);
  for (const knownCity of cities) {
    if (upperCity.includes(knownCity) || knownCity.includes(upperCity)) {
      return CITY_MAPPINGS[knownCity];
    }
  }
  
  // Levenshtein distance matching for typos (distance <= 2)
  const uniqueCities = Object.values(CITY_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i);
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  
  for (const knownCity of uniqueCities) {
    const distance = levenshteinDistance(upperCity, knownCity);
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = knownCity;
    }
  }
  
  return bestMatch;
}

/**
 * Extract city from address string
 */
function extractCityFromAddress(address: string): string | null {
  const addressUpper = address.trim().toUpperCase();
  
  // Known Canyon County cities (sorted by length descending)
  const CANYON_CITIES = Object.values(CITY_MAPPINGS)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b.length - a.length);
  
  // Try to find city name in the address
  for (const city of CANYON_CITIES) {
    const searchPattern = ` ${city}`;
    const lastIndex = addressUpper.lastIndexOf(searchPattern);
    
    if (lastIndex !== -1) {
      const afterCity = addressUpper.substring(lastIndex + searchPattern.length).trim();
      
      // City should be followed by nothing, "ID", "IDAHO", or ZIP code
      if (
        afterCity === '' || 
        afterCity === 'ID' || 
        afterCity === 'IDAHO' || 
        /^ID\s/.test(afterCity) || 
        /^IDAHO\s/.test(afterCity) ||
        /^\d{5}(-\d{4})?$/.test(afterCity) ||
        /^ID\s+\d{5}(-\d{4})?$/.test(afterCity) ||
        /^IDAHO\s+\d{5}(-\d{4})?$/.test(afterCity)
      ) {
        return city;
      }
    }
  }
  
  // Check for comma-separated format
  if (addressUpper.includes(',')) {
    const parts = addressUpper.split(',').map(p => p.trim());
    if (parts.length > 1) {
      const cityPart = parts[1].replace(/\s+(ID|IDAHO|,.*)/g, '').trim();
      return normalizeCity(cityPart);
    }
  }
  
  return null;
}

/**
 * Search for properties by address in Canyon County.
 *
 * Backed by the countywide parcel layer the City of Nampa publishes; see
 * canyonParcelLookup.ts for what that source does and does not carry. Canyon
 * has no assessed value, owner, or homeowner's exemption available, so those
 * stay undefined here rather than being guessed at.
 */
export async function searchCanyonCountyProperties(
  address: string,
  cityContext?: string
): Promise<PropertySearchResult> {
  const cityFromAddress = extractCityFromAddress(address);
  const normalizedCity = normalizeCity(cityFromAddress || cityContext || '');

  // Strip the city, state and ZIP so only the street portion is matched, then
  // apply the same abbreviation rules Ada uses (NORTH to N, STREET to ST).
  const streetOnly = address.split(',')[0] ?? address;
  const street = normalizeStreetAddress(streetOnly);

  console.log('[CanyonCountyAssessor] Search:', { street, normalizedCity });

  const parcels = await lookupCanyonParcels(street, normalizedCity ?? undefined);

  if (parcels.length === 0) {
    const known = 'Canyon County includes Nampa, Caldwell, Middleton, Melba, Greenleaf, Notus, Parma and Wilder.';
    return {
      success: false,
      properties: [],
      error: 'Property not found in Canyon County records.',
      suggestion: normalizedCity
        ? `No Canyon County parcel matched that address in ${normalizedCity}. Check the street number and spelling, or enter measurements manually.`
        : `${known} Please include the city in your address.`,
    };
  }

  const properties: PropertyData[] = parcels.map((parcel) => {
    const city = normalizedCity ?? cityFromAddress ?? '';
    // Estimates first so the real parcel values below overwrite them. Lot size
    // here is computed from the surveyed polygon, not guessed from the city.
    const estimation = estimatePropertyMeasurements(parcel.address, city);

    const recorded: Partial<PropertyData> = {
      zip: parcel.zip,
      zoning: parcel.zoning,
      zoningCategory: parcel.zoningCategory,
      lotSizeSqFt: parcel.lotSizeSqFt,
      lotSizeAcres: parcel.lotSizeAcres,
    };

    return {
      parcel: parcel.account,
      address: parcel.address,
      city,
      ...estimation,
      measurementsEstimated: true,
      ...Object.fromEntries(
        Object.entries(recorded).filter(([, value]) => value !== undefined)
      ),
    } as PropertyData;
  });

  console.log('[CanyonCountyAssessor] Found properties:', properties.length);

  return { success: true, properties };
}

/**
 * Backward-compatible search function that returns single property
 * @deprecated Use searchCanyonCountyProperties instead
 */
export async function searchCanyonCountyProperty(
  address: string,
  cityContext?: string
): Promise<PropertyData | null> {
  const result = await searchCanyonCountyProperties(address, cityContext);
  return result.success && result.properties.length > 0 ? result.properties[0] : null;
}

/**
 * Intelligent estimation of property measurements
 * Uses property characteristics, location, and typical patterns
 * Same logic as Ada County for consistency
 */
export function estimatePropertyMeasurements(address: string, city: string): {
  lotSizeSqFt: number;
  buildingSqFt: number;
  outdoorAreaSqFt: number;
  estimatedRoofLineFt: number;
  lotPerimeterFt: number;
  outdoorPerimeterFt: number;
  rooflineWithOverhangFt: number;
  estimatedFenceLengthFt: number;
} {
  // Default assumptions for typical Treasure Valley properties
  let lotSizeSqFt = 7500; // Default ~0.17 acre lot
  let buildingSqFt = 1800; // Default home size
  
  // Adjust based on city/area characteristics
  if (city.toUpperCase().includes('NAMPA')) {
    // Nampa has a mix of older and newer developments
    lotSizeSqFt = 7000;
    buildingSqFt = 1800;
  } else if (city.toUpperCase().includes('CALDWELL')) {
    // Caldwell tends to have slightly larger lots
    lotSizeSqFt = 8000;
    buildingSqFt = 1850;
  } else if (city.toUpperCase().includes('MIDDLETON')) {
    // Middleton has more rural/larger lots
    lotSizeSqFt = 10000;
    buildingSqFt = 1950;
  }
  
  // Detect property type from address
  if (address.match(/\b(CT|COURT|CIR|CIRCLE|LOOP|PL|PLACE)\b/i)) {
    // Cul-de-sac or court addresses often have slightly larger lots
    lotSizeSqFt *= 1.15;
  }
  
  if (address.match(/\b(RANCH|FARM|COUNTRY|RURAL)\b/i)) {
    // Rural properties are typically much larger
    lotSizeSqFt *= 2.5;
    buildingSqFt *= 1.3;
  }
  
  if (address.match(/\b(TOWNHOME|CONDO|UNIT)\b/i)) {
    // Townhomes/condos have smaller lots
    lotSizeSqFt *= 0.4;
    buildingSqFt *= 0.7;
  }
  
  // Calculate outdoor area (lot minus building, garage, and hardscape)
  // Typical garage: 400-500 sq ft
  // Typical driveway/walkways: 500-800 sq ft
  // Typical deck/patio: 200-300 sq ft
  const garageSqFt = 450;
  const hardscapeSqFt = 650;
  const deckPatioSqFt = 250;
  
  const outdoorAreaSqFt = Math.max(
    1000, // Minimum 1000 sq ft outdoor area
    lotSizeSqFt - buildingSqFt - garageSqFt - hardscapeSqFt - deckPatioSqFt
  );
  
  // Estimate roof line (building perimeter)
  // Assume roughly square building: perimeter = 4 * sqrt(area)
  const estimatedRoofLineFt = Math.round(4 * Math.sqrt(buildingSqFt));
  
  // Lot Perimeter Calculation
  // Assume roughly rectangular lot: perimeter ≈ 4 * sqrt(lotSize)
  // Apply rectangular correction factor (most lots are 1.5:1 to 2:1 ratio)
  const lotPerimeterFt = Math.round(4 * Math.sqrt(lotSizeSqFt) * 1.1);
  
  // Perimeter Calculation
  // Outdoor perimeter is typically 70-80% of lot perimeter (buildings and hardscape reduce it)
  const outdoorPerimeterFt = Math.round(lotPerimeterFt * 0.75);
  
  // Roofline Length
  // Add 25% for eaves and overhangs
  const rooflineWithOverhangFt = Math.round(estimatedRoofLineFt * 1.25);
  
  // Fence/Boundary Length Estimate
  // Estimate fenceable boundary (typically 40% of lot perimeter)
  const estimatedFenceLengthFt = Math.round(lotPerimeterFt * 0.40);
  
  return {
    lotSizeSqFt: Math.round(lotSizeSqFt),
    buildingSqFt: Math.round(buildingSqFt),
    outdoorAreaSqFt: Math.round(outdoorAreaSqFt),
    estimatedRoofLineFt,
    lotPerimeterFt,
    outdoorPerimeterFt,
    rooflineWithOverhangFt,
    estimatedFenceLengthFt,
  };
}

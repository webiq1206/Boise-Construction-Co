import { esriQuery } from './esriClient';

/**
 * Ada County Assessor API Service
 * Fetches property data from Ada County parcel database
 */

export interface PropertyData {
  parcel: string;
  address: string;
  city: string;

  /*
   * Fields below this line come straight off the Ada County parcel layer.
   * They are records, not guesses, and are safe to show a homeowner or quote
   * back to the team. Canyon County's layer publishes none of them except
   * acreage, so expect them to be undefined outside Ada.
   */
  zip?: string;
  /** Zoning code, e.g. R1. Drives ADU feasibility. */
  zoning?: string;
  /** Assessor's total assessed value in dollars. */
  assessedValue?: number;
  /**
   * True when the parcel carries a homeowner's exemption, which means the
   * owner lives there. Absent exemption usually means a rental or second home.
   */
  ownerOccupied?: boolean;
  subdivision?: string;
  ownerName?: string;
  /** Assessor use code: R residential, C commercial, and so on. */
  propertyUseCode?: string;
  /** Zoning category label, e.g. Residential. Canyon only. */
  zoningCategory?: string;
  /** FEMA flood zone, e.g. X or AE. Canyon only for now. */
  floodZone?: string;
  /**
   * True when the parcel sits in a FEMA Special Flood Hazard Area, which adds
   * elevation requirements and permit cost to additions and basement work.
   */
  inFloodHazardArea?: boolean;

  /** Real: from the ACRES column. */
  lotSizeAcres?: number;
  /** Real when derived from ACRES, estimated only if the parcel lacks acreage. */
  lotSizeSqFt?: number;

  /*
   * Everything below is ESTIMATED by estimatePropertyMeasurements() from the
   * city and street name. The parcel layer publishes nothing about the
   * structure, so these are planning defaults for the on-site measuring tool
   * and must never be presented as county records. Check measurementsEstimated
   * before displaying any of them.
   */
  measurementsEstimated?: boolean;
  buildingSqFt?: number;
  groundFloorSqFt?: number;
  upperFloorSqFt?: number;
  basementSqFt?: number;
  garageSqFt?: number;
  deckPatioPoolSqFt?: number;
  outdoorAreaSqFt?: number;
  estimatedRoofLineFt?: number;
  lotPerimeterFt?: number;
  outdoorPerimeterFt?: number;
  rooflineWithOverhangFt?: number;
  estimatedFenceLengthFt?: number;
}

export interface PropertySearchResult {
  success: boolean;
  properties: PropertyData[];
  error?: string;
  suggestion?: string;
}

const ADA_COUNTY_PARCEL_API = 'https://www.schoolsitelocator.com/server/rest/services/ssl_IM/MapServer/131/query';

/*
 * The layer exposes 44 columns; these are the ones worth carrying. Note what is
 * NOT here, because it does not exist on this layer at any price: home square
 * footage, bedrooms, bathrooms, and year built. PROPYEAR is the assessment
 * year, not the year the house was built, so it is deliberately omitted.
 */
const ADA_OUT_FIELDS = [
  'PARCEL',
  'ADDCONCAT',
  'CITY',
  'ZIPCODE',
  'ZONING',
  'ACRES',
  'TOTALVALUE',
  'HOMEEXEMPT',
  'SUBNM',
  'PRIMOWNER',
  'PROPCODE',
].join(',');

const SQ_FT_PER_ACRE = 43560;

/** All Ada requests share one breaker so a sick host is skipped once, not per call. */
function adaQuery(params: Record<string, string>) {
  return esriQuery(ADA_COUNTY_PARCEL_API, params, { breakerKey: 'ada', label: 'ada:131' });
}

/** Pull the real, record-backed columns off one returned feature. */
function mapAdaAttributes(property: Record<string, unknown>): Partial<PropertyData> {
  const text = (value: unknown): string | undefined => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const num = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

  const acres = num(property.ACRES);
  const homeExempt = num(property.HOMEEXEMPT);

  return {
    zip: text(property.ZIPCODE),
    zoning: text(property.ZONING),
    subdivision: text(property.SUBNM),
    ownerName: text(property.PRIMOWNER),
    propertyUseCode: text(property.PROPCODE),
    assessedValue: num(property.TOTALVALUE),
    // The exemption is stored as a negative offset, so any non-zero value means
    // the owner claimed it and therefore lives on the parcel.
    ownerOccupied: homeExempt === undefined ? undefined : homeExempt !== 0,
    lotSizeAcres: acres,
    lotSizeSqFt: acres === undefined ? undefined : Math.round(acres * SQ_FT_PER_ACRE),
  };
}

// Known Ada County cities with common misspellings
const CITY_MAPPINGS: Record<string, string> = {
  'KUNA': 'KUNA',
  'MERIDIAN': 'MERIDIAN',
  'MERIDAN': 'MERIDIAN', // Common misspelling
  'MERIDIEN': 'MERIDIAN', // Common misspelling
  'BOISE': 'BOISE',
  'BOYSE': 'BOISE', // Common misspelling
  'EAGLE': 'EAGLE',
  'STAR': 'STAR',
  'GARDEN CITY': 'GARDEN CITY',
  'GARDENCITY': 'GARDEN CITY',
  'HIDDEN SPRINGS': 'HIDDEN SPRINGS',
  'HIDDENSPRINGS': 'HIDDEN SPRINGS',
};

// Common address abbreviations used in assessor databases
const DIRECTIONAL_ABBREV: Record<string, string> = {
  'NORTH': 'N',
  'SOUTH': 'S',
  'EAST': 'E',
  'WEST': 'W',
  'NORTHEAST': 'NE',
  'NORTHWEST': 'NW',
  'SOUTHEAST': 'SE',
  'SOUTHWEST': 'SW',
};

const STREET_TYPE_ABBREV: Record<string, string> = {
  'AVENUE': 'AVE',
  'STREET': 'ST',
  'ROAD': 'RD',
  'DRIVE': 'DR',
  'LANE': 'LN',
  'COURT': 'CT',
  'CIRCLE': 'CIR',
  'BOULEVARD': 'BLVD',
  'PLACE': 'PL',
  'WAY': 'WAY',
  'TRAIL': 'TRL',
  'PARKWAY': 'PKWY',
  'TERRACE': 'TER',
  'HIGHWAY': 'HWY',
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
 * Normalize street address to match assessor database format
 * Converts full directional words and street types to standard abbreviations
 * Examples:
 *   "123 NORTH MAIN STREET" -> "123 N MAIN ST"
 *   "456 SOUTH COOPERS HAWK AVENUE" -> "456 S COOPERS HAWK AVE"
 */
export function normalizeStreetAddress(address: string): string {
  if (!address) return '';
  
  let normalized = address.trim().toUpperCase();
  
  // Replace directional words with abbreviations (NORTH -> N, SOUTH -> S, etc.)
  // Match whole words only using word boundaries
  for (const [full, abbrev] of Object.entries(DIRECTIONAL_ABBREV)) {
    // Replace at beginning of address after house number
    const beginPattern = new RegExp(`^(\\d+\\s+)${full}\\s+`, 'g');
    normalized = normalized.replace(beginPattern, `$1${abbrev} `);
    
    // Replace at end before street type
    const endPattern = new RegExp(`\\s+${full}\\s+`, 'g');
    normalized = normalized.replace(endPattern, ` ${abbrev} `);
  }
  
  // Replace street type words with abbreviations (AVENUE -> AVE, STREET -> ST, etc.)
  // These typically appear at the end of the street address
  for (const [full, abbrev] of Object.entries(STREET_TYPE_ABBREV)) {
    const pattern = new RegExp(`\\s+${full}(?:\\s|$)`, 'g');
    normalized = normalized.replace(pattern, ` ${abbrev} `);
  }
  
  // Clean up multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Search for properties by address in Ada County (with multiple match support)
 */
export async function searchAdaCountyProperties(
  address: string, 
  cityContext?: string
): Promise<PropertySearchResult> {
  try {
    // Clean and parse address
    const addressUpper = address.trim().toUpperCase();
    
    // Extract street address and city from input
    // Supports formats:
    // - "1234 Main St, Kuna, ID"
    // - "1234 Main St Kuna ID" (no commas)
    // - "1234 Main St"
    
    let streetAddress = '';
    let cityFromInput = '';
    
    // Known Ada County cities for detection (normalized, sorted by length descending)
    // Sort by length to match longer city names first (e.g., "GARDEN CITY" before "CITY")
    const ADA_CITIES = Object.values(CITY_MAPPINGS)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b.length - a.length);
    
    if (addressUpper.includes(',')) {
      // Comma-separated format: "1234 Main St, Kuna, ID"
      const parts = addressUpper.split(',').map(p => p.trim());
      streetAddress = parts[0];
      cityFromInput = parts.length > 1 ? parts[1] : '';
    } else {
      // No commas - detect city by matching known cities from the END of the address
      // "1234 Main St Kuna ID" or "1234 Main St KUNA"
      let foundCity = '';
      let cityIndex = -1;
      
      // Try to find city name in the address (prefer matches closer to the end)
      for (const city of ADA_CITIES) {
        // Look for city with a space before it (word boundary)
        const searchPattern = ` ${city}`;
        const lastIndex = addressUpper.lastIndexOf(searchPattern);
        
        if (lastIndex !== -1) {
          // Found the city - verify it's followed by optional state suffix, ZIP code, or end of string
          const afterCity = addressUpper.substring(lastIndex + searchPattern.length).trim();
          
          // City should be followed by nothing, "ID", "IDAHO", ZIP code (5 digits or 5+4), or combinations
          // Examples: "", "ID", "IDAHO", "83634", "ID 83634", "83634-1234"
          if (
            afterCity === '' || 
            afterCity === 'ID' || 
            afterCity === 'IDAHO' || 
            /^ID\s/.test(afterCity) || 
            /^IDAHO\s/.test(afterCity) ||
            /^\d{5}(-\d{4})?$/.test(afterCity) ||  // Just ZIP code
            /^ID\s+\d{5}(-\d{4})?$/.test(afterCity) ||  // "ID 83634" or "ID 83634-1234"
            /^IDAHO\s+\d{5}(-\d{4})?$/.test(afterCity)  // "IDAHO 83634" or "IDAHO 83634-1234"
          ) {
            foundCity = city;
            cityIndex = lastIndex;
            break;
          }
        }
      }
      
      if (foundCity && cityIndex !== -1) {
        // Extract ONLY the street address (everything before city name)
        streetAddress = addressUpper.substring(0, cityIndex).trim();
        cityFromInput = foundCity;
        
        console.log('[AdaCountyAssessor] Extracted:', { streetAddress, cityFromInput, original: addressUpper });
      } else {
        // No city detected - use entire input as street address
        streetAddress = addressUpper;
        console.log('[AdaCountyAssessor] No city detected, using full address as street');
      }
    }
    
    // Remove state suffix from city if present (e.g., "KUNA ID" -> "KUNA")
    if (cityFromInput) {
      cityFromInput = cityFromInput.replace(/\s+(ID|IDAHO|,.*)/g, '').trim();
    }
    
    // CRITICAL: Strip trailing ZIP codes from street address
    // Handles patterns like " 83634" or " 83634-1234" at the end of the street address
    // This ensures clean street address for database queries
    streetAddress = streetAddress.replace(/\s+\d{5}(-\d{4})?$/g, '').trim();
    
    // Normalize street address to match database format (NORTH -> N, AVENUE -> AVE, etc.)
    streetAddress = normalizeStreetAddress(streetAddress);
    
    // Normalize city name (handle misspellings)
    let normalizedCity = normalizeCity(cityFromInput);
    
    // If we have a city context from the wizard, use it as fallback
    if (!normalizedCity && cityContext) {
      normalizedCity = normalizeCity(cityContext);
    }
    
    console.log('[AdaCountyAssessor] Parsed & normalized:', { streetAddress, cityFromInput, normalizedCity, cityContext });
    
    // Build query: exact match on street address, require city match
    let query = `ADDCONCAT='${streetAddress.replace(/'/g, "''")}'`;
    if (normalizedCity) {
      query += ` AND CITY='${normalizedCity.replace(/'/g, "''")}'`;
    }
    
    console.log('[AdaCountyAssessor] Query:', query);
    
    // Try exact match first. esriQuery applies the timeout, retry and circuit
    // breaker, and returns null rather than throwing when the host is unwell.
    let data = await adaQuery({
      where: query,
      outFields: ADA_OUT_FIELDS,
      returnGeometry: 'false',
      resultRecordCount: '10',
    });

    console.log('[AdaCountyAssessor] Exact match results:', data?.features?.length || 0);
    
    // If no exact match, try partial match on street address
    if (!data?.features || data.features.length === 0) {
      // Clean streetAddress for LIKE query by removing any trailing city names that might have been missed
      // This handles cases where parsing failed to detect the city properly
      let cleanStreetForLike = streetAddress;
      for (const city of ADA_CITIES) {
        const pattern = new RegExp(`\\s+${city.replace(/\s+/g, '\\s+')}$`, 'i');
        cleanStreetForLike = cleanStreetForLike.replace(pattern, '').trim();
      }
      
      console.log('[AdaCountyAssessor] Cleaned street for LIKE:', { original: streetAddress, cleaned: cleanStreetForLike });
      
      let partialQuery = `ADDCONCAT LIKE '%${cleanStreetForLike.replace(/'/g, "''")}%'`;
      if (normalizedCity) {
        partialQuery += ` AND CITY='${normalizedCity.replace(/'/g, "''")}'`;
      }
      console.log('[AdaCountyAssessor] Trying partial query:', partialQuery);
      data = await adaQuery({
        where: partialQuery,
        outFields: ADA_OUT_FIELDS,
        returnGeometry: 'false',
        resultRecordCount: '20',
      });
      console.log('[AdaCountyAssessor] Partial match results:', data?.features?.length || 0);
      
      // CRITICAL: If we have a normalized city, REQUIRE exact city match
      if (data?.features && data.features.length > 0 && normalizedCity) {
        const cityFiltered = data.features.filter((f: any) => 
          f.attributes.CITY && f.attributes.CITY.toUpperCase() === normalizedCity
        );
        console.log('[AdaCountyAssessor] City-filtered results:', cityFiltered.length);
        
        if (cityFiltered.length === 0 && data.features.length > 0) {
          // We found properties but none in the specified location
          const foundCities = Array.from(new Set(data.features.map((f: any) => f.attributes.CITY)));
          return {
            success: false,
            properties: [],
            error: 'No properties found',
            suggestion: `Address found in ${foundCities.join(', ')}, but not in ${normalizedCity}. Please check the location name.`
          };
        }
        
        data.features = cityFiltered;
      }
    }
    
    if (!data?.features || data.features.length === 0) {
      console.log('[AdaCountyAssessor] No properties found');
      return {
        success: false,
        properties: [],
        error: 'No properties found',
        suggestion: normalizedCity 
          ? `Try removing the location name and entering just the street address, or check for typos.`
          : `Please include the location name (e.g., "123 Main St, Kuna, ID") or select the location in the form above.`
      };
    }
    
    // Convert all matching properties to PropertyData
    const properties: PropertyData[] = data.features.map((feature: any) => {
      const property = feature.attributes;
      const propertyData: PropertyData = {
        parcel: property.PARCEL,
        address: property.ADDCONCAT,
        city: property.CITY,
      };

      // Estimates first, so the real assessor columns below overwrite any of
      // them that overlap. Real acreage always beats a guessed lot size.
      const estimation = estimatePropertyMeasurements(propertyData.address, propertyData.city);
      const recorded = mapAdaAttributes(property);

      return {
        ...propertyData,
        ...estimation,
        measurementsEstimated: true,
        ...Object.fromEntries(
          Object.entries(recorded).filter(([, value]) => value !== undefined)
        ),
      };
    });
    
    console.log('[AdaCountyAssessor] Found properties:', properties.length);
    
    return {
      success: true,
      properties,
    };
  } catch (error) {
    console.error('[AdaCountyAssessor] Error fetching property:', error);
    return {
      success: false,
      properties: [],
      error: 'Unable to connect to property database. Please try again.',
    };
  }
}

/**
 * Backward-compatible search function that returns single property
 * @deprecated Use searchAdaCountyProperties instead
 */
export async function searchAdaCountyProperty(address: string, cityContext?: string): Promise<PropertyData | null> {
  const result = await searchAdaCountyProperties(address, cityContext);
  return result.success && result.properties.length > 0 ? result.properties[0] : null;
}

/**
 * Intelligent estimation of property measurements
 * Uses property characteristics, location, and typical patterns
 */
function estimatePropertyMeasurements(address: string, city: string): {
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
  if (city.toUpperCase().includes('KUNA')) {
    // Kuna tends to have slightly larger lots (newer development)
    lotSizeSqFt = 8500;
    buildingSqFt = 2000;
  } else if (city.toUpperCase().includes('MERIDIAN')) {
    // Meridian varies: newer areas larger, older areas smaller
    lotSizeSqFt = 7000;
    buildingSqFt = 1900;
  } else if (city.toUpperCase().includes('BOISE')) {
    // Boise urban areas tend to have smaller lots
    lotSizeSqFt = 6500;
    buildingSqFt = 1700;
  } else if (city.toUpperCase().includes('EAGLE')) {
    // Eagle tends to have larger properties
    lotSizeSqFt = 10000;
    buildingSqFt = 2200;
  } else if (city.toUpperCase().includes('STAR')) {
    // Star has more rural/larger lots
    lotSizeSqFt = 12000;
    buildingSqFt = 2000;
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

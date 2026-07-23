import {
  queryAssessor,
  getCountyFromCity,
  type PropertyData,
} from "@/lib/assessors";
import {
  createMeasurementBundleFromAssessor,
  createDefaultMeasurementBundle,
} from "@/shared/measurementBundle";
import type { PropertyProfile, PropertyProfileInput } from "@/shared/propertyProfile";
import { pickBestAddressMatch } from "@/lib/assessors/addressMatch";
import { parseFormattedAddress, resolvePlaceToAddress } from "./geocoding";

const CITY_PERMITTING: Record<string, string> = {
  BOISE: "City of Boise Development Services",
  MERIDIAN: "City of Meridian Community Development",
  EAGLE: "City of Eagle Building Department",
  KUNA: "City of Kuna Planning & Building",
  STAR: "City of Star Community Development",
  NAMPA: "City of Nampa Building Safety",
  CALDWELL: "City of Caldwell Community Development",
  MIDDLETON: "City of Middleton Building Department",
  "GARDEN CITY": "City of Garden City",
};

function permittingAuthorityForCity(city: string, county: "ada" | "canyon"): string {
  const key = city.toUpperCase().trim();
  if (CITY_PERMITTING[key]) return CITY_PERMITTING[key];
  return county === "ada"
    ? `Ada County - contact ${city} for local permits`
    : `Canyon County - contact ${city} for local permits`;
}

function jurisdictionLabel(city: string, county: "ada" | "canyon"): string {
  const countyName = county === "ada" ? "Ada County" : "Canyon County";
  return `${city}, ${countyName}, Idaho`;
}

function mapAssessorToProfileFields(
  assessor: PropertyData,
  county: "ada" | "canyon"
): Partial<PropertyProfile> {
  /*
   * squareFootage is deliberately NOT set from assessor.buildingSqFt. Neither
   * county's parcel layer publishes building characteristics, so that value is
   * a city-level guess from estimatePropertyMeasurements(). It used to land in
   * the admin email under "Property records" as "Home: ~1,900 sq ft", which
   * read as a county record and was really just the Meridian default. Home
   * size stays unknown until someone measures it or the homeowner tells us.
   */
  return {
    parcelId: assessor.parcel,
    county,
    // Lot size only travels when it came from the ACRES column. Without it the
    // assessor object still carries an estimated lotSizeSqFt, which belongs to
    // the measuring tool and not to a record shown to the team.
    lotSizeSqFt: assessor.lotSizeAcres !== undefined ? assessor.lotSizeSqFt : undefined,
    lotSizeAcres: assessor.lotSizeAcres,
    zoning: assessor.zoning,
    zoningCategory: assessor.zoningCategory,
    subdivision: assessor.subdivision,
    ownerName: assessor.ownerName,
    ownerOccupied: assessor.ownerOccupied,
    assessedValue: assessor.assessedValue,
    propertyType: assessor.propertyUseCode === "R" ? "residential" : undefined,
  };
}

export async function enrichPropertyFromPlaceId(
  placeId: string
): Promise<PropertyProfile | null> {
  const input = await resolvePlaceToAddress(placeId);
  if (!input) return null;
  return enrichPropertyFromAddress(input);
}

export async function enrichPropertyFromFormattedAddress(
  formattedAddress: string
): Promise<PropertyProfile> {
  const input = parseFormattedAddress(formattedAddress);
  return enrichPropertyFromAddress(input);
}

export async function enrichPropertyFromAddress(
  input: PropertyProfileInput
): Promise<PropertyProfile> {
  const county = getCountyFromCity(input.city);
  const searchAddress =
    input.streetAddress && input.city
      ? `${input.streetAddress}, ${input.city}, ID`
      : input.formattedAddress;

  const assessorResult = await queryAssessor({
    county,
    address: searchAddress,
    cityContext: input.city,
    enableFallback: true,
  });

  const now = new Date().toISOString();
  let assessorFields: Partial<PropertyProfile> = {};
  let measurementBundle = createDefaultMeasurementBundle(
    input.streetAddress ?? input.formattedAddress,
    input.city
  );
  let source: PropertyProfile["source"] = "geocoder";
  let confidence: PropertyProfile["confidence"] = "low";
  let assessorNote: string | undefined;

  const best =
    assessorResult.success && assessorResult.properties.length > 0
      ? pickBestAssessorMatch(assessorResult.properties, input)
      : null;

  if (!best && assessorResult.properties.length > 0) {
    assessorNote =
      "County records were returned for this area but none matched the address closely enough to attach with confidence.";
  }

  if (best) {
    assessorFields = mapAssessorToProfileFields(best, county);
    measurementBundle = createMeasurementBundleFromAssessor({
      parcel: best.parcel,
      address: best.address,
      city: best.city,
      lotSizeSqFt: best.lotSizeSqFt,
      lotSizeAcres: best.lotSizeAcres,
      buildingSqFt: best.buildingSqFt,
      groundFloorSqFt: best.groundFloorSqFt,
      garageSqFt: best.garageSqFt,
      lotPerimeterFt: best.lotPerimeterFt,
      estimatedRoofLineFt: best.estimatedRoofLineFt,
    });
    source = "mixed";
    confidence = measurementBundle.confidence;
  } else if (assessorResult.suggestion) {
    assessorNote = assessorResult.suggestion;
  }

  const streetViewKey = process.env.GOOGLE_MAPS_API_KEY;
  const photoUrls: string[] = [];
  if (
    streetViewKey &&
    input.latitude != null &&
    input.longitude != null
  ) {
    photoUrls.push(
      `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${input.latitude},${input.longitude}&key=${streetViewKey}`
    );
  }

  const profile: PropertyProfile = {
    formattedAddress: input.formattedAddress,
    streetAddress: input.streetAddress,
    city: input.city,
    state: input.state || "ID",
    zip: input.zip,
    latitude: input.latitude,
    longitude: input.longitude,
    placeId: input.placeId,
    county,
    jurisdiction: jurisdictionLabel(input.city, county),
    permittingAuthority: permittingAuthorityForCity(input.city, county),
    measurementBundle,
    photoUrls: photoUrls.length ? photoUrls : undefined,
    source,
    confidence,
    enrichedAt: now,
    assessorNote,
    ...assessorFields,
  };

  return profile;
}

/**
 * The parcel that is actually this address, or null when none of them is.
 *
 * Returning null matters. The previous version compared house numbers with a
 * substring test and fell back to properties[0] regardless, so a lead at
 * "1386 W Anything St" could be attributed to 11386 W GOLDENSPIRE DR and every
 * field after that (zoning, lot, assessed value, owner) would describe someone
 * else's house. No enrichment is the better failure.
 */
function pickBestAssessorMatch(
  properties: PropertyData[],
  input: PropertyProfileInput
): PropertyData | null {
  const target =
    input.streetAddress?.trim() ||
    (input.formattedAddress ?? "").split(",")[0]?.trim() ||
    "";
  if (!target) return null;
  return pickBestAddressMatch(properties, target, (p) => p.address);
}

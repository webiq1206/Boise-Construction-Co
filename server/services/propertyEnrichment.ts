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
  const sqFt =
    assessor.buildingSqFt ??
    assessor.groundFloorSqFt ??
    (assessor.upperFloorSqFt && assessor.groundFloorSqFt
      ? assessor.groundFloorSqFt + assessor.upperFloorSqFt
      : undefined);

  return {
    parcelId: assessor.parcel,
    county,
    squareFootage: sqFt,
    lotSizeSqFt: assessor.lotSizeSqFt,
    lotSizeAcres: assessor.lotSizeAcres,
    propertyType: "residential",
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

  if (assessorResult.success && assessorResult.properties.length > 0) {
    const best = pickBestAssessorMatch(assessorResult.properties, input);
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

function pickBestAssessorMatch(
  properties: PropertyData[],
  input: PropertyProfileInput
): PropertyData {
  if (properties.length === 1) return properties[0];
  const street = (input.streetAddress ?? "").toUpperCase();
  const match = properties.find((p) =>
    street && p.address.toUpperCase().includes(street.split(" ")[0] ?? "")
  );
  return match ?? properties[0];
}

import type { MeasurementBundle } from "@/shared/measurementBundle";

/** Canonical property record gathered from address lookup + county assessor. */
export interface PropertyProfile {
  formattedAddress: string;
  streetAddress?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;

  parcelId?: string;
  county?: "ada" | "canyon";

  propertyType?: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSizeSqFt?: number;
  lotSizeAcres?: number;
  bedrooms?: number;
  bathrooms?: number;
  assessedValue?: number;
  ownerName?: string;
  /** Zoning code from the county parcel record, e.g. R1. Gates ADU feasibility. */
  zoning?: string;
  /** Subdivision name from the county parcel record. */
  subdivision?: string;
  /**
   * True when the parcel carries a homeowner's exemption, i.e. the owner lives
   * there. False suggests a rental or second home, which changes how a lead is
   * qualified. Undefined when the county does not publish it.
   */
  ownerOccupied?: boolean;
  /** Zoning category label, e.g. Residential. */
  zoningCategory?: string;
  /** FEMA flood zone designation, e.g. X or AE. */
  floodZone?: string;
  /**
   * True when the parcel is in a FEMA Special Flood Hazard Area. Additions and
   * basement work there carry elevation requirements and extra permit cost.
   */
  inFloodHazardArea?: boolean;
  photoUrls?: string[];

  jurisdiction?: string;
  permittingAuthority?: string;

  measurementBundle?: MeasurementBundle;

  source: "assessor" | "geocoder" | "manual" | "mixed";
  confidence: "high" | "medium" | "low";
  enrichedAt: string;

  /** Admin edits layered on top of auto-populated values */
  adminOverrides?: Partial<PropertyProfile>;
  assessorNote?: string;
}

export type PropertyProfileInput = Pick<
  PropertyProfile,
  | "formattedAddress"
  | "streetAddress"
  | "city"
  | "state"
  | "zip"
  | "latitude"
  | "longitude"
  | "placeId"
>;

/** Merge admin overrides onto the base profile for display and downstream use. */
export function resolvePropertyProfile(
  base: PropertyProfile | null | undefined
): PropertyProfile | null {
  if (!base) return null;
  if (!base.adminOverrides || Object.keys(base.adminOverrides).length === 0) {
    return base;
  }
  return { ...base, ...base.adminOverrides };
}

export function getPropertyProfileSummary(profile: PropertyProfile): string[] {
  const p = resolvePropertyProfile(profile);
  if (!p) return [];
  const lines: string[] = [];
  if (p.squareFootage) lines.push(`${p.squareFootage.toLocaleString()} sq ft`);
  if (p.lotSizeSqFt) lines.push(`${p.lotSizeSqFt.toLocaleString()} sq ft lot`);
  if (p.bedrooms) lines.push(`${p.bedrooms} bed`);
  if (p.bathrooms) lines.push(`${p.bathrooms} bath`);
  if (p.yearBuilt) lines.push(`Built ${p.yearBuilt}`);
  if (p.parcelId) lines.push(`Parcel ${p.parcelId}`);
  if (p.permittingAuthority) lines.push(p.permittingAuthority);
  return lines;
}

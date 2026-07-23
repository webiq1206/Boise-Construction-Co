/**
 * Canyon County parcel lookup.
 *
 * Canyon County itself publishes no parcel API, which is why this county used
 * to return "manual entry required" for every address. The City of Nampa,
 * however, hosts a public ArcGIS service that carries the ENTIRE county parcel
 * layer (about 105,000 parcels, not just Nampa's), and that layer has the one
 * thing the county's own layer lacks: a site address. That makes address
 * matching possible in Canyon for the first time.
 *
 * What each source gives us:
 *
 * - Parcel layer (countywide): account number, site address, city, ZIP, and
 *   the surveyed parcel polygon. Lot size is computed from that polygon rather
 *   than read from a column, which is actually more precise than Ada's
 *   rounded ACRES value.
 * - Zoning layer (Nampa city limits only): zoning code and category.
 * - Floodplain layer (FEMA DFIRM, Nampa area): flood zone and whether the
 *   parcel sits in a Special Flood Hazard Area, which drives elevation
 *   requirements and permit cost on additions and basement work.
 *
 * What is NOT available for Canyon at any price here: assessed value, owner of
 * record, homeowner's exemption, and subdivision. Ada publishes those; Canyon
 * does not. Nothing downstream should assume they exist.
 *
 * This is a third-party host we do not control, so every call goes through
 * esriClient (timeout, retry, circuit breaker) and failure degrades to no
 * enrichment rather than breaking a lead submission.
 */

import { esriQuery } from "./esriClient";
import { pointOnSurface, ringsToSqFt, type Ring } from "./geometry";
import { scoreAddressMatch } from "./addressMatch";

const CANYON_SERVICE =
  "https://utility.arcgis.com/usrsvcs/servers/2cb0c34984644eb19ebeb3f8a17b7dc9/rest/services/Public/CityInformation_Public/MapServer";

const PARCEL_LAYER = 36;
const ZONING_LAYER = 33;
const FLOODPLAIN_LAYER = 10;

const BREAKER_KEY = "canyon";

/**
 * The parcel geometry comes back in NAD83 / Idaho West (US survey feet), so
 * polygon area is already square feet and needs no unit conversion.
 */
const IDAHO_WEST_WKID = 102670;
const SQ_FT_PER_ACRE = 43560;

/** Site city is stored as a two letter code on the parcel layer. */
const CANYON_CITY_CODES: Record<string, string> = {
  NAMPA: "NA",
  CALDWELL: "CA",
  MIDDLETON: "MI",
  MELBA: "ME",
  GREENLEAF: "GR",
  NOTUS: "NO",
  PARMA: "PA",
  WILDER: "WI",
  KUNA: "KU",
  STAR: "ST",
};

export interface CanyonParcel {
  account: string;
  address: string;
  cityCode: string;
  zip?: string;
  lotSizeSqFt?: number;
  lotSizeAcres?: number;
  zoning?: string;
  zoningCategory?: string;
  floodZone?: string;
  inFloodHazardArea?: boolean;
}

export function canyonCityCode(city: string | null | undefined): string | undefined {
  if (!city) return undefined;
  return CANYON_CITY_CODES[city.toUpperCase().trim()];
}

function query(layer: number, params: Record<string, string>) {
  return esriQuery(`${CANYON_SERVICE}/${layer}/query`, params, {
    breakerKey: BREAKER_KEY,
    label: `canyon:${layer}`,
  });
}

/**
 * Zoning and flood are polygon layers, so both are point-in-polygon lookups.
 * The point comes from pointOnSurface rather than a vertex average, so it is
 * inside the parcel even when the parcel is concave.
 */
async function lookupAtPoint(point: {
  x: number;
  y: number;
}): Promise<Pick<CanyonParcel, "zoning" | "zoningCategory" | "floodZone" | "inFloodHazardArea">> {
  const common = {
    geometry: JSON.stringify({
      x: point.x,
      y: point.y,
      spatialReference: { wkid: IDAHO_WEST_WKID },
    }),
    geometryType: "esriGeometryPoint",
    inSR: String(IDAHO_WEST_WKID),
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: "false",
    resultRecordCount: "1",
  };

  const [zoningData, floodData] = await Promise.all([
    query(ZONING_LAYER, { ...common, outFields: "zoning,category" }),
    query(FLOODPLAIN_LAYER, { ...common, outFields: "FLD_ZONE,SFHA_TF" }),
  ]);

  const zoningAttrs = zoningData?.features?.[0]?.attributes;
  const floodAttrs = floodData?.features?.[0]?.attributes;
  const sfha =
    typeof floodAttrs?.SFHA_TF === "string" ? floodAttrs.SFHA_TF.trim().toUpperCase() : undefined;

  return {
    zoning: zoningAttrs?.zoning?.trim() || undefined,
    zoningCategory: zoningAttrs?.category?.trim() || undefined,
    floodZone: floodAttrs?.FLD_ZONE?.trim() || undefined,
    inFloodHazardArea: sfha === undefined ? undefined : sfha === "T",
  };
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function toParcel(feature: any): CanyonParcel | null {
  const attrs = feature?.attributes;
  if (!attrs?.ACCOUNT) return null;

  const rings: Ring[] | undefined = feature?.geometry?.rings;
  const sqFt = rings ? ringsToSqFt(rings) : undefined;
  const zip = typeof attrs.SiteZIP === "string" ? attrs.SiteZIP.trim() : "";

  return {
    account: String(attrs.ACCOUNT).trim(),
    address: String(attrs.SiteAddres ?? "").trim(),
    cityCode: String(attrs.SiteCity ?? "").trim(),
    zip: zip.length >= 5 ? zip : undefined,
    lotSizeSqFt: sqFt ? Math.round(sqFt) : undefined,
    lotSizeAcres: sqFt ? Number((sqFt / SQ_FT_PER_ACRE).toFixed(2)) : undefined,
  };
}

/**
 * Find Canyon County parcels for a normalized street address.
 *
 * Tries an exact address match first, then a prefix match. Results are ordered
 * best match first using the shared address scorer, and only that best match
 * pays for the zoning and flood lookups. Ordering here also means the caller's
 * own best-match selection agrees with the parcel that got enriched, which is
 * what stops zoning silently going missing on multi-result addresses.
 *
 * Returns an empty array rather than throwing: a parcel lookup must never be
 * the reason a lead fails to submit.
 */
export async function lookupCanyonParcels(
  normalizedStreetAddress: string,
  city?: string
): Promise<CanyonParcel[]> {
  const street = normalizedStreetAddress.trim().toUpperCase();
  if (!street) return [];

  const code = canyonCityCode(city);
  const cityClause = code ? ` AND SiteCity='${escapeSqlLiteral(code)}'` : "";

  const fields = {
    outFields: "ACCOUNT,SiteAddres,SiteCity,SiteZIP",
    returnGeometry: "true",
    outSR: String(IDAHO_WEST_WKID),
  };

  let data = await query(PARCEL_LAYER, {
    where: `SiteAddres='${escapeSqlLiteral(street)}'${cityClause}`,
    resultRecordCount: "10",
    ...fields,
  });

  if (!data?.features?.length) {
    data = await query(PARCEL_LAYER, {
      where: `SiteAddres LIKE '${escapeSqlLiteral(street)}%'${cityClause}`,
      resultRecordCount: "10",
      ...fields,
    });
  }

  const features: any[] = data?.features ?? [];
  if (features.length === 0) return [];

  const scored = features
    .map((feature) => ({ parcel: toParcel(feature), feature }))
    .filter((entry): entry is { parcel: CanyonParcel; feature: any } => entry.parcel !== null)
    .map((entry) => ({
      ...entry,
      score: scoreAddressMatch(entry.parcel.address, street),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  // Only the best match pays for zoning and flood: two extra round trips that
  // would otherwise be spent on parcels the caller is going to discard.
  const best = scored[0];
  const rings: Ring[] | undefined = best.feature?.geometry?.rings;
  const point = rings ? pointOnSurface(rings) : undefined;
  if (point) {
    Object.assign(best.parcel, await lookupAtPoint(point));
  }

  return scored.map((entry) => entry.parcel);
}

import type { PropertyProfileInput } from "@/shared/propertyProfile";

export interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
  /**
   * Fully resolved address data, if supplied by an approved provider.
   * Lets the client enrich directly without a flaky second place-id round-trip.
   */
  resolved?: PropertyProfileInput;
}

export async function fetchAddressSuggestions(
  input: string
): Promise<AddressSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 3) return [];

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    return fetchGoogleSuggestions(trimmed, googleKey);
  }
  // Public Nominatim forbids autocomplete. Missing configuration leaves manual entry available.
  return [];
}

async function fetchGoogleSuggestions(
  input: string,
  apiKey: string
): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    input,
    key: apiKey,
    types: "address",
    components: "country:us",
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("[geocoding] Google autocomplete:", data.status, data.error_message);
    return [];
  }
  return (data.predictions ?? []).map(
    (p: { place_id: string; description: string; structured_formatting?: { main_text: string; secondary_text: string } }) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
    })
  );
}

export async function resolvePlaceToAddress(
  placeId: string
): Promise<PropertyProfileInput | null> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey && !placeId.match(/^\d+$/)) {
    return resolveGooglePlace(placeId, googleKey);
  }
  // Never send a visitor address to an unapproved fallback provider.
  return null;
}

async function resolveGooglePlace(
  placeId: string,
  apiKey: string
): Promise<PropertyProfileInput | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: "formatted_address,address_components,geometry",
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );
  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;

  const components: Array<{ long_name: string; short_name: string; types: string[] }> =
    data.result.address_components ?? [];
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const city =
    get("locality") || get("sublocality") || get("administrative_area_level_3");
  const state = components.find((c) => c.types.includes("administrative_area_level_1"))
    ?.short_name ?? "ID";
  const zip = get("postal_code");
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

  return {
    placeId,
    formattedAddress: data.result.formatted_address,
    streetAddress: streetAddress || undefined,
    city,
    state,
    zip,
    latitude: data.result.geometry?.location?.lat,
    longitude: data.result.geometry?.location?.lng,
  };
}

const KNOWN_TREASURE_VALLEY_CITIES = [
  "Boise",
  "Meridian",
  "Eagle",
  "Nampa",
  "Kuna",
  "Star",
  "Middleton",
  "Caldwell",
  "Garden City",
];

export function parseFormattedAddress(text: string): PropertyProfileInput {
  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch?.[1] ?? "";

  // Drop trailing country, then split into comma-separated tokens.
  const cleaned = text.replace(/,?\s*(United States|U\.?S\.?A\.?)\s*$/i, "").trim();
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);

  // City: prefer an exact match against the cities we actually serve. This is
  // robust against verbose geocoder output (neighborhood, county, state, zip).
  let city = "";
  for (const part of parts) {
    const candidate = part.replace(/\s+(ID|Idaho)$/i, "").replace(/\s+\d{5}.*$/, "").trim();
    const found = KNOWN_TREASURE_VALLEY_CITIES.find(
      (c) => c.toLowerCase() === candidate.toLowerCase()
    );
    if (found) {
      city = found;
      break;
    }
  }
  // Fallback: the token just before state/zip/county that isn't itself one.
  if (!city) {
    for (let i = parts.length - 1; i >= 1; i--) {
      const p = parts[i];
      if (/^(ID|Idaho)$/i.test(p) || /^\d{5}/.test(p) || /county/i.test(p)) continue;
      city = p.replace(/\s+(ID|Idaho)$/i, "").trim();
      break;
    }
  }

  // Street: join a leading bare house number with the following street name
  // Some formatted addresses separate the house number with a comma.
  let streetAddress = parts[0] ?? cleaned;
  if (/^\d+[A-Za-z]?$/.test(parts[0] ?? "") && parts[1]) {
    streetAddress = `${parts[0]} ${parts[1]}`.trim();
  }

  return {
    formattedAddress: text,
    streetAddress,
    city,
    state: "ID",
    zip,
  };
}

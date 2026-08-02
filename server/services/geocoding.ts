import type { PropertyProfileInput } from "@/shared/propertyProfile";

export interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
  /**
   * Fully resolved address data when the provider returns it inline (Nominatim).
   * Lets the client enrich directly without a flaky second place-id round-trip.
   */
  resolved?: PropertyProfileInput;
}

const TREASURE_VALLEY_BOUNDS = {
  lat: { min: 43.4, max: 43.8 },
  lng: { min: -116.6, max: -116.0 },
};

function inTreasureValley(lat: number, lng: number): boolean {
  return (
    lat >= TREASURE_VALLEY_BOUNDS.lat.min &&
    lat <= TREASURE_VALLEY_BOUNDS.lat.max &&
    lng >= TREASURE_VALLEY_BOUNDS.lng.min &&
    lng <= TREASURE_VALLEY_BOUNDS.lng.max
  );
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
  return fetchNominatimSuggestions(trimmed);
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

async function fetchNominatimSuggestions(input: string): Promise<AddressSuggestion[]> {
  const q = `${input}, Idaho, USA`;
  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    limit: "6",
    countrycodes: "us",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": "BoiseConstructionCo/1.0 (property lookup)",
      },
    }
  );
  if (!res.ok) return [];
  const results = await res.json();
  return (results as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }>)
    .filter((r) => {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      return inTreasureValley(lat, lon);
    })
    .map((r) => ({
      placeId: String(r.place_id),
      description: r.display_name,
      mainText: r.address?.house_number
        ? `${r.address.house_number} ${r.address.road ?? ""}`.trim()
        : r.address?.road,
      secondaryText: [r.address?.city, r.address?.state, r.address?.postcode]
        .filter(Boolean)
        .join(", "),
      resolved: nominatimHitToInput(r),
    }));
}

export async function resolvePlaceToAddress(
  placeId: string
): Promise<PropertyProfileInput | null> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey && !placeId.match(/^\d+$/)) {
    return resolveGooglePlace(placeId, googleKey);
  }
  return resolveNominatimPlace(placeId);
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

async function resolveNominatimPlace(
  placeId: string
): Promise<PropertyProfileInput | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    format: "json",
    addressdetails: "1",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/details?${params}`,
    {
      headers: {
        "User-Agent": "BoiseConstructionCo/1.0 (property lookup)",
      },
    }
  );
  if (!res.ok) {
    const searchParams = new URLSearchParams({
      format: "json",
      addressdetails: "1",
      place_id: placeId,
    });
    const searchRes = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams}`,
      {
        headers: {
          "User-Agent": "BoiseConstructionCo/1.0 (property lookup)",
        },
      }
    );
    const list = await searchRes.json();
    const hit = list[0];
    if (!hit) return null;
    return nominatimHitToInput(hit);
  }
  const data = await res.json();
  if (!data) return null;
  return nominatimHitToInput({
    place_id: placeId,
    display_name: data.names?.name ?? data.localname,
    lat: String(data.centroid?.coordinates?.[1] ?? data.lat),
    lon: String(data.centroid?.coordinates?.[0] ?? data.lon),
    address: data.address,
  });
}

function nominatimHitToInput(hit: {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}): PropertyProfileInput {
  const a = hit.address ?? {};
  const streetNumber = a.house_number ?? "";
  const route = a.road ?? "";
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb ?? "";
  const state = a.state ?? "Idaho";
  const zip = a.postcode ?? "";
  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);

  return {
    placeId: String(hit.place_id),
    formattedAddress: hit.display_name,
    streetAddress: streetAddress || undefined,
    city,
    state: state.length === 2 ? state.toUpperCase() : "ID",
    zip,
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lon) ? lon : undefined,
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

/** Parse a free-text address when user confirms without selecting a suggestion. */
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
  // (Nominatim emits "3024, West Fairview Avenue, ...").
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

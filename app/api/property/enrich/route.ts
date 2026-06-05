import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  enrichPropertyFromAddress,
  enrichPropertyFromFormattedAddress,
  enrichPropertyFromPlaceId,
} from "@/server/services/propertyEnrichment";

const inputSchema = z.object({
  formattedAddress: z.string().min(1),
  streetAddress: z.string().optional(),
  city: z.string().default(""),
  state: z.string().default("ID"),
  zip: z.string().default(""),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
});

const bodySchema = z.object({
  placeId: z.string().min(1).optional(),
  formattedAddress: z.string().min(5).optional(),
  input: inputSchema.optional(),
}).refine((d) => d.placeId || d.formattedAddress || d.input, {
  message: "placeId, formattedAddress, or input is required",
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { placeId, formattedAddress, input } = parsed.data;
    let profile;
    if (input) {
      // Address data already resolved by the autocomplete provider — no second
      // round-trip needed. Always returns a profile.
      profile = await enrichPropertyFromAddress(input);
    } else if (placeId) {
      profile = await enrichPropertyFromPlaceId(placeId);
      // If re-resolving the place id fails (geocoder rate limits, ephemeral ids),
      // fall back to the human-readable text instead of failing the lookup.
      if (!profile && formattedAddress) {
        profile = await enrichPropertyFromFormattedAddress(formattedAddress);
      }
      if (!profile) {
        return NextResponse.json(
          { message: "Could not resolve address" },
          { status: 404 }
        );
      }
    } else {
      profile = await enrichPropertyFromFormattedAddress(formattedAddress!);
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[property/enrich]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

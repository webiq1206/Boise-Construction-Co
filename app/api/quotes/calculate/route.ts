import { NextResponse } from "next/server";

/**
 * Legacy server-side pricing for the removed quote wizard. Pricing now lives
 * in shared/estimateEngine.ts (client + server-verified via /api/consultation).
 * The old implementation referenced an undefined PROPERTY_MULTIPLIERS constant
 * and would have crashed at runtime if called.
 */
export async function POST() {
  return NextResponse.json(
    {
      message:
        "This endpoint has been retired. Planning ranges are computed by the project estimator.",
    },
    { status: 410 }
  );
}

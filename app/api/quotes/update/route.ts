import { NextResponse } from "next/server";

/**
 * Legacy quote update endpoint for the removed quote wizard. Retired along
 * with POST /api/quotes; see /api/consultation for the live lead flow.
 */
export async function POST() {
  return NextResponse.json(
    { message: "This endpoint has been retired." },
    { status: 410 }
  );
}

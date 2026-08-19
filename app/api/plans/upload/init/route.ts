import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isJobStoreConfigured } from "@/server/services/plans/jobStore";
import { isPlanExtractionConfigured } from "@/server/services/planExtract";

export const runtime = "nodejs";

/**
 * Claim an id for a set that is about to be uploaded a sheet at a time.
 *
 * The id comes from the SERVER so it cannot be chosen. Every later request
 * carries it and only it, so a client that guessed someone else's id would be
 * reading their drawings - which is exactly why it is a v4 uuid and not a
 * counter, and why nothing here echoes back an id it was handed.
 *
 * Both preconditions are checked NOW rather than after a 200-sheet upload. A
 * visitor who is going to be told "not configured" should be told before they
 * spend ten minutes uploading, not after.
 */
export async function POST() {
  if (!isPlanExtractionConfigured()) {
    return NextResponse.json(
      {
        error: "not-configured",
        message:
          "Automatic plan review is not switched on yet. Attach your plans anyway and we will read them by hand.",
      },
      { status: 503 },
    );
  }
  if (!isJobStoreConfigured()) {
    return NextResponse.json(
      {
        error: "not-configured",
        message:
          "Large plan sets need the database, which is not available here. Attach your plans and we will read them by hand.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ uploadId: randomUUID() });
}

import { NextRequest, NextResponse, after } from "next/server";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import { LeadRequestError, readBoundedJson } from "@/server/services/leadRequestGuard";
import {
  applyConsultationDetails,
  detailsBodySchema,
  verifyDetailsToken,
} from "@/server/services/consultationDetails";
import { createDrizzleDetailsRepository, detailsDestinations } from "@/server/services/consultationDetailsDelivery";
import { createDrizzleLeadFileStore, leadFileId, toLeadFileLink } from "@/server/services/leadFiles";

/**
 * POST /api/consultation/details: "Help us prepare (optional)" and the file
 * links from the request screen, merged into the request the visitor just
 * sent. Body: { inquiryKey, token, projectType?, address?, zip?,
 * propertyProfile?, timing?, bestTime?, email?, fileIds?, website }.
 *
 * The token comes from the /api/consultation response and expires after two
 * hours (server/services/consultationDetails.ts). Unknown, tampered or expired
 * tokens are refused before the database is touched.
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKeyFrom(request.headers, "consultation-details"), 12, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const parsed = detailsBodySchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request", errors: parsed.error.flatten() }, { status: 400 });
    }
    const details = parsed.data;
    if (details.website.trim()) return NextResponse.json({ saved: true });

    const check = verifyDetailsToken(details.inquiryKey, details.token, process.env.SESSION_SECRET ?? "");
    if (check !== "ok") {
      return NextResponse.json(
        { message: check === "expired" ? "This form has expired" : "Invalid request", reason: check },
        { status: 401 },
      );
    }

    let files: ReturnType<typeof toLeadFileLink>[] = [];
    if (details.fileIds.length) {
      // Only files stored under THIS request count; an id from another request is ignored.
      const wanted = new Set(details.fileIds);
      const store = await createDrizzleLeadFileStore();
      files = (await store.list(details.inquiryKey)).filter((row) => wanted.has(leadFileId(row.key))).map(toLeadFileLink);
    }

    const repository = await createDrizzleDetailsRepository();
    const { outcome, background } = await applyConsultationDetails(details, files, {
      repository,
      destinations: detailsDestinations,
    });
    if (background) after(() => background);
    if (outcome.status === "not-found") {
      return NextResponse.json({ message: "Invalid request", reason: "invalid" }, { status: 401 });
    }
    if (outcome.status === "unchanged") return NextResponse.json({ saved: true, duplicate: true, delivery: [] });
    return NextResponse.json({ saved: true, duplicate: false, files: outcome.merge.files.length, delivery: outcome.delivery });
  } catch (err) {
    if (err instanceof LeadRequestError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error("[consultation-details] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

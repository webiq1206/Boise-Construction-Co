import { NextResponse } from "next/server";
import { getSession, getUserFromDb } from "@/lib/auth";
import { assessorCacheStats, queryAssessor } from "@/lib/assessors";
import { circuitBreakerSnapshot } from "@/lib/assessors/esriClient";

export const dynamic = "force-dynamic";

/**
 * Health of the two county parcel sources.
 *
 * Both are third party hosts we do not control (schoolsitelocator.com for Ada,
 * the City of Nampa for Canyon). If either goes away, enrichment degrades
 * silently by design: leads still submit, they just arrive without a parcel
 * record. Silent degradation is the right behaviour but a bad thing to only
 * discover months later, so this probes each source with a known good address
 * and reports whether it still answers.
 */
const PROBES = [
  {
    county: "ada" as const,
    address: "1386 S Nova Ln, Meridian, ID",
    city: "Meridian",
    expectParcel: "R0071280010",
  },
  {
    county: "canyon" as const,
    address: "1720 E Dewey Ave, Nampa, ID",
    city: "Nampa",
    expectParcel: "R3184100000",
  },
];

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getUserFromDb(session.userId);
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
  }

  const results = await Promise.all(
    PROBES.map(async (probe) => {
      const startedAt = Date.now();
      const result = await queryAssessor({
        county: probe.county,
        address: probe.address,
        cityContext: probe.city,
        // Probing one source at a time is the point: a fallback would mask the
        // very outage this endpoint exists to surface.
        enableFallback: false,
        // Reading our own cache back would report a dead host as healthy.
        bypassCache: true,
      });
      const elapsedMs = Date.now() - startedAt;

      const parcels = result.properties.map((p) => p.parcel);
      const matched = parcels.includes(probe.expectParcel);

      return {
        county: probe.county,
        healthy: result.success && matched,
        elapsedMs,
        parcelsReturned: result.properties.length,
        expectedParcel: probe.expectParcel,
        matchedExpectedParcel: matched,
        error: result.error,
      };
    })
  );

  const healthy = results.every((r) => r.healthy);

  return NextResponse.json(
    {
      healthy,
      checkedAt: new Date().toISOString(),
      sources: results,
      circuitBreakers: circuitBreakerSnapshot(),
      cache: assessorCacheStats(),
    },
    { status: healthy ? 200 : 503 }
  );
}

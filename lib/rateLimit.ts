import { LRUCache } from "lru-cache";

/**
 * Small fixed-window rate limiter for public API routes.
 *
 * In-process and therefore per-instance: this is a guard against a single
 * client hammering an endpoint, not a distributed quota. It exists mainly to
 * stop an unauthenticated route being used to proxy traffic at the third party
 * county GIS hosts, whose goodwill the property lookups depend on.
 */
interface Window {
  count: number;
  resetAt: number;
}

const buckets = new LRUCache<string, Window>({ max: 5000, ttl: 10 * 60 * 1000 });

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs }, { ttl: windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    ok: existing.count <= limit,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Best available client identity behind a proxy. Falls back to a shared bucket
 * when no forwarding header is present, which is deliberately conservative.
 */
export function clientKeyFrom(headers: Headers, prefix: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${prefix}:${ip}`;
}

/**
 * Shared HTTP client for the county ArcGIS endpoints.
 *
 * Both parcel sources are third party hosts we do not control: Ada comes from
 * schoolsitelocator.com and Canyon from the City of Nampa. These lookups sit in
 * the lead submission path, so the rule here is that a slow or broken host must
 * degrade to "no enrichment" quickly and never hang or throw into the caller.
 *
 * Three protections, in order of how often they matter:
 *
 * 1. Timeout. Every request aborts. Ada previously had none at all, so a host
 *    that hung rather than failed would hang the lead form with it.
 * 2. Retry. One retry on a transient network error or 5xx, with a short pause.
 *    Not retried on 4xx, which will fail again identically.
 * 3. Circuit breaker. After repeated failures a host is skipped outright for a
 *    cooling period. Without this, every lead pays the full timeout twice over
 *    while a host is down, once for the county and once for the fallback.
 */

const DEFAULT_TIMEOUT_MS = 6000;
const RETRY_DELAY_MS = 250;

/** Consecutive failures before a host is taken out of rotation. */
const BREAKER_THRESHOLD = 4;
/** How long a tripped host stays skipped before one probe is allowed through. */
const BREAKER_COOLDOWN_MS = 60_000;

interface BreakerState {
  failures: number;
  openedAt: number | null;
}

const breakers = new Map<string, BreakerState>();

function breakerFor(key: string): BreakerState {
  let state = breakers.get(key);
  if (!state) {
    state = { failures: 0, openedAt: null };
    breakers.set(key, state);
  }
  return state;
}

function breakerIsOpen(key: string): boolean {
  const state = breakerFor(key);
  if (state.openedAt === null) return false;
  if (Date.now() - state.openedAt >= BREAKER_COOLDOWN_MS) {
    // Cooldown elapsed: half open. Let one request through to probe the host.
    state.openedAt = null;
    state.failures = BREAKER_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess(key: string): void {
  const state = breakerFor(key);
  state.failures = 0;
  state.openedAt = null;
}

function recordFailure(key: string): void {
  const state = breakerFor(key);
  state.failures += 1;
  if (state.failures >= BREAKER_THRESHOLD && state.openedAt === null) {
    state.openedAt = Date.now();
    console.warn(
      `[esri] circuit opened for ${key} after ${state.failures} failures, skipping for ${
        BREAKER_COOLDOWN_MS / 1000
      }s`
    );
  }
}

/** Test and diagnostics hook. */
export function resetCircuitBreakers(): void {
  breakers.clear();
}

export function circuitBreakerSnapshot(): Record<string, { failures: number; open: boolean }> {
  const out: Record<string, { failures: number; open: boolean }> = {};
  for (const [key, state] of breakers) {
    out[key] = { failures: state.failures, open: state.openedAt !== null };
  }
  return out;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface EsriQueryOptions {
  /** Host identity for the circuit breaker, e.g. "ada" or "canyon". */
  breakerKey: string;
  timeoutMs?: number;
  /** Extra attempts after the first. Defaults to one. */
  retries?: number;
  label?: string;
}

/**
 * Run an ArcGIS query and return the parsed body, or null on any failure.
 *
 * Never throws. A parcel lookup must not be the reason a lead fails to submit.
 */
export async function esriQuery(
  endpoint: string,
  params: Record<string, string>,
  options: EsriQueryOptions
): Promise<any | null> {
  const { breakerKey, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, label } = options;
  const name = label ?? breakerKey;

  if (breakerIsOpen(breakerKey)) {
    console.warn(`[esri] ${name}: circuit open, skipping request`);
    return null;
  }

  const url = `${endpoint}?${new URLSearchParams({ f: "json", ...params }).toString()}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        // 4xx is a bad request on our side and will fail identically on retry.
        if (res.status < 500) {
          console.warn(`[esri] ${name}: HTTP ${res.status}, not retrying`);
          recordFailure(breakerKey);
          return null;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data?.error) {
        // The service answered, so the host is healthy even though the query
        // was rejected. Do not count this against the breaker.
        console.warn(`[esri] ${name}: service error:`, data.error?.message);
        recordSuccess(breakerKey);
        return null;
      }

      recordSuccess(breakerKey);
      return data;
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      const reason = aborted ? `timeout after ${timeoutMs}ms` : String(err);
      if (attempt < retries) {
        console.warn(`[esri] ${name}: ${reason}, retrying`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      console.warn(`[esri] ${name}: ${reason}, giving up`);
      recordFailure(breakerKey);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

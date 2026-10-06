/**
 * Minimal Ahrefs API v3 client for the deployed (Replit cron) runner.
 * Uses process.env.AHREFS_API_KEY so it runs headless, independent of any MCP.
 * Mirrors the Site Explorer endpoints the engine was prototyped against.
 */
const BASE = "https://api.ahrefs.com/v3";
const KEY = process.env.AHREFS_API_KEY;

function today() {
  // Deterministic ISO date (UTC) for `date` params.
  return new Date().toISOString().slice(0, 10);
}

async function get(path, params) {
  if (!KEY) throw new Error("AHREFS_API_KEY not set");
  const qs = new URLSearchParams({ output: "json", ...params }).toString();
  const res = await fetch(`${BASE}/${path}?${qs}`, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ahrefs ${path} ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export const ahrefs = {
  hasKey: () => Boolean(KEY),

  domainRating: (target, date = today()) =>
    get("site-explorer/domain-rating", { target, date }),

  backlinksStats: (target, date = today(), mode = "subdomains") =>
    get("site-explorer/backlinks-stats", { target, date, mode }),

  /** Referring domains, sorted so trafficked (real) linkers surface first. */
  refDomains: (target, { limit = 40, mode = "subdomains", orderBy = "traffic_domain:desc" } = {}) =>
    get("site-explorer/refdomains", {
      target,
      mode,
      limit: String(limit),
      order_by: orderBy,
      select: "domain,domain_rating,traffic_domain,links_to_target,dofollow_links,first_seen",
    }),

  brokenBacklinks: (target, { limit = 30, mode = "subdomains" } = {}) =>
    get("site-explorer/broken-backlinks", {
      target,
      mode,
      limit: String(limit),
      aggregation: "similar_links",
      select: "url_from,url_to,domain_rating_source,traffic_domain,http_code",
    }),

  subscriptionUsage: () => get("subscription-info/limits-and-usage", {}),
};

export const _today = today;

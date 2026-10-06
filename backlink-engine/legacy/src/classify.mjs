/**
 * Deterministic classifier: maps a competitor referring-domain row to an
 * opportunity record (category / relevance / linkType / feasibility / cost) or
 * flags it for rejection. The weekly Claude runner adds richer judgment on top;
 * this keeps the headless cron white-hat and consistent.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gates = JSON.parse(readFileSync(join(ROOT, "config/quality-gates.json"), "utf8"));

// Curated map of known link sources -> classification. Extend over time.
const KNOWN = {
  "bbb.org":               { category: "review_platform", relevance: "high",  linkType: "citation",   feasibility: "application", cost: "paid_membership", local: true },
  "houzz.com":             { category: "review_platform", relevance: "high",  linkType: "profile",    feasibility: "self_serve",  cost: "free",            local: true },
  "angi.com":              { category: "review_platform", relevance: "high",  linkType: "profile",    feasibility: "self_serve",  cost: "free",            local: true },
  "yelp.com":              { category: "review_platform", relevance: "medium",linkType: "profile",    feasibility: "self_serve",  cost: "free",            local: true },
  "birdeye.com":           { category: "review_platform", relevance: "medium",linkType: "citation",   feasibility: "self_serve",  cost: "free",            local: true },
  "guildquality.com":      { category: "review_platform", relevance: "high",  linkType: "review",     feasibility: "application", cost: "paid",            local: false },
  "nari.org":              { category: "association",     relevance: "high",  linkType: "membership", feasibility: "application", cost: "paid_membership", local: false },
  "thescoutguide.com":     { category: "directory",      relevance: "medium",linkType: "editorial",  feasibility: "application", cost: "paid",            local: true },
  "thisoldhouse.com":      { category: "digital_pr",     relevance: "high",  linkType: "editorial",  feasibility: "digital_pr", cost: "free",            local: false },
  "statesman.com":         { category: "digital_pr",     relevance: "high",  linkType: "editorial",  feasibility: "digital_pr", cost: "free",            local: true },
  "idahopower.com":        { category: "utility_program",relevance: "high",  linkType: "membership", feasibility: "application", cost: "free",            local: true },
  "chamberofcommerce.com": { category: "citation",       relevance: "medium",linkType: "citation",   feasibility: "self_serve",  cost: "free",            local: true },
  "alignable.com":         { category: "citation",       relevance: "medium",linkType: "profile",    feasibility: "self_serve",  cost: "free",            local: true },
  "neustarlocaleze.biz":   { category: "citation",       relevance: "low",   linkType: "citation",   feasibility: "self_serve",  cost: "paid",            local: true },
};

// Generic citation directories -> low-value but legit self-serve citations.
const CITATION_HINTS = ["yellowpages", "superpages", "hotfrog", "ezlocal", "dexknows", "yp.com", "citysquares", "2findlocal", "agreatertown", "mylocalservices", "bestprosintown", "loc8nearme", "manta", "brownbook", "cylex"];
// Data scrapers / lead-gen / non-editorial noise -> not worth pursuing (but not toxic).
const NOISE_HINTS = ["seamless.ai", "datanyze", "d7leadfinder", "a-leads", "coldlytics", "apsense", "sitelike", "siteprice", "similarsites", "instantcheckmate", "idcrawl", "zoominfo", "leadfinder"];
// Free-host / user-content footprints -> usually not a real editorial link.
const HOST_HINTS = ["blogspot.com", "web.app", "pages.dev", "netlify.app", "wordpress.com", "wixsite.com", "za.com", "us.com"];

const has = (domain, hints) => hints.some((h) => domain.includes(h));
const matchesSpamBlog = (domain) => gates.spamBlogPatternHints.some((h) => domain.includes(h));

/**
 * @returns {{ keep: boolean, reason?: string, opp?: object }}
 */
export function classify(row, competitorDomain) {
  const domain = String(row.domain || "").toLowerCase();
  const dr = row.domain_rating ?? 0;
  const traffic = row.traffic_domain ?? 0;
  const dofollow = (row.dofollow_links ?? 0) > 0;

  if (matchesSpamBlog(domain)) return { keep: false, reason: "spamBlogPattern" };
  if (has(domain, NOISE_HINTS)) return { keep: false, reason: "scraper_or_leadgen_noise" };
  if (has(domain, HOST_HINTS)) return { keep: false, reason: "free_host_footprint" };
  if (traffic === 0 && dr < 65) return { keep: false, reason: "worthlessFootprint" };

  const known = KNOWN[domain];
  const base = known || (has(domain, CITATION_HINTS)
    ? { category: "citation", relevance: "low", linkType: "citation", feasibility: "self_serve", cost: "free", local: true }
    : null);

  // Unknown but plausibly-real domain (has traffic or solid DR): queue as a
  // medium-relevance editorial candidate for the weekly Claude runner to vet.
  const cls = base || { category: "prospect", relevance: "medium", linkType: "editorial", feasibility: "outreach", cost: "free", local: false };

  return {
    keep: true,
    opp: {
      id: domain.replace(/[^a-z0-9]+/g, "-"),
      name: domain,
      domain,
      category: cls.category,
      dr, traffic, dofollow,
      relevance: cls.relevance,
      local: cls.local,
      linkType: cls.linkType,
      feasibility: cls.feasibility,
      cost: cls.cost,
      competitorValidated: [competitorDomain],
      spamFlags: [],
      targetPage: "",
      action: known ? `Known source: pursue via ${cls.feasibility}.` : `Prospect from ${competitorDomain}; vet topical fit before outreach.`,
      contact: "",
      status: "new",
      discoveredFrom: competitorDomain,
    },
  };
}

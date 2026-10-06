#!/usr/bin/env node
/** Pure, free-only ranking. Metrics are nullable evidence, not invented rank signals. */
import { pathToFileURL } from "node:url";
import { loadIdentity } from "./identity.mjs";
import { publicUrl, validDate, validateCandidate } from "./free-sources.mjs";

function freshDate(value, days, today) {
  if (!validDate(value)) return false;
  const age = (Date.parse(today) - Date.parse(value)) / 86400000;
  return age >= 0 && age <= days;
}
function observedMetric(metric, kind, today) {
  if (!metric || metric.status !== "observed" || !freshDate(metric.observedOn, 90, today)) return null;
  try { publicUrl(metric.sourceUrl); } catch { return null; }
  const value = metric.value;
  if (kind === "dofollow") return typeof value === "boolean" ? value : null;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && (kind !== "authority" || value <= 100) ? value : null;
}
export function scoreOpportunity(opportunity, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const { config } = loadIdentity();
  const reasons = [];
  try { validateCandidate(opportunity); } catch { reasons.push("candidate_identity_or_provenance_mismatch"); }
  if (opportunity.spamFlags?.length) reasons.push("spam_flags");
  if (!["discovered", "reviewed", "new"].includes(opportunity.status)) reasons.push("existing_state_requires_reconciliation");
  const review = opportunity.review;
  const relevance = config.scales.relevance[review?.relevance];
  const route = opportunity.route;
  if (!review || review.editorialFit !== true || !Number.isFinite(relevance) || relevance === 0 || !review.evidenceUrl || !freshDate(review.reviewedOn, 90, today)) reasons.push("editorial_review_required");
  else {
    try { publicUrl(review.evidenceUrl); } catch { reasons.push("invalid_review_evidence"); }
  }
  if (!route || route.cost !== "free" || route.verified !== true || !freshDate(route.checkedOn, 30, today)) reasons.push(route?.cost && route.cost !== "free" ? "not_verified_free" : "verified_free_route_required");
  else {
    try { publicUrl(route.url); } catch { reasons.push("invalid_route"); }
  }
  if (["self_serve", "review_profile"].includes(opportunity.feasibility) && review?.listingEligibility !== "verified") reasons.push("listing_eligibility_required");
  const metrics = {
    authority: observedMetric(opportunity.metrics?.authority, "authority", today),
    traffic: observedMetric(opportunity.metrics?.traffic, "traffic", today),
    dofollow: observedMetric(opportunity.metrics?.dofollow, "dofollow", today),
  };
  const qualified = reasons.length === 0;
  const value = qualified ? Math.round((0.6 * relevance + 0.25 * (config.scales.linkType[opportunity.linkType] || 0) + 0.15 * (review.local === true ? 100 : 0)) * 10) / 10 : 0;
  return { ...opportunity, dr: metrics.authority, traffic: metrics.traffic, dofollow: metrics.dofollow,
    qualified, priority: value, metricStatus: Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, value === null ? "unknown" : "observed"])),
    gate: { held: !qualified, reasons }, status: opportunity.status || "discovered" };
}
export function scoreOpportunities(opportunities) {
  return opportunities.map((opportunity) => scoreOpportunity(opportunity)).sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { run } = await import("./run.mjs");
  await run({ scoreOnly: true });
}

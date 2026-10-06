#!/usr/bin/env node
/** Offline only: existing provider credentials never trigger API or database calls. */
import { loadIdentity } from "./identity.mjs";
try {
  const { site, profile } = loadIdentity();
  console.log(`OK: ${site.brand} identity validated.`);
  console.log("OK: free-only local inputs; no paid discovery, database mutation, or contact crawling.");
  console.log("PAUSED: legacy dispatch remains blocked, even when BACKLINK_SEND_ENABLED=true.");
  console.log(`UNVERIFIED: separate listing eligibility (${profile.verification.listingEligibility}), sender delivery, suppression and capacity.`);
  console.log("UNKNOWN: current authority, traffic, verified links and qualified leads require receiving-system evidence.");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}

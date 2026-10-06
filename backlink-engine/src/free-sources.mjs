/** Bounded, offline adapters. GSC Links data is a manual export, never an API claim. */
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { BRAND } from "./identity.mjs";

export const MAX_RECORDS = 100;
const KINDS = new Set(["known_urls", "search_console_links_export"]);
export function publicUrl(value) {
  if (typeof value !== "string" || value.length > 2048) throw new Error("A bounded public URL is required.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.port ||
      !url.hostname.includes(".") || isIP(url.hostname) || url.hostname.startsWith("[") ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname)) throw new Error("Only public HTTPS URLs without credentials, queries or fragments are accepted.");
  return url.href;
}
export function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export const candidateId = (sourceUrl) => createHash("sha256").update(`${BRAND.id}|${sourceUrl}`).digest("hex").slice(0, 24);
export function validateCandidate(row) {
  if (!row || row.brandId !== BRAND.id) throw new Error("Candidate brand mismatch.");
  const sourceUrl = publicUrl(row.sourceUrl);
  const targetUrl = publicUrl(row.targetUrl);
  const domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
  if (domain === BRAND.domain || row.domain !== domain || row.id !== candidateId(sourceUrl) || row.sourceUrl !== sourceUrl) throw new Error("Candidate source/domain/stable ID mismatch.");
  if (new URL(targetUrl).origin !== BRAND.url) throw new Error("Candidate target must belong to Construction.");
  if (!row.source || !KINDS.has(row.source.kind) || !validDate(row.source.observedOn) || row.source.observedOn > new Date().toISOString().slice(0, 10) ||
      (row.source.kind === "search_console_links_export" && row.source.property !== `sc-domain:${BRAND.domain}`)) throw new Error("Candidate source provenance mismatch.");
  if (typeof row.status !== "string" || !row.status) throw new Error("Candidate status is required.");
  return row;
}
export function importCandidates(manifest) {
  if (!manifest || manifest.brandId !== BRAND.id || !KINDS.has(manifest.kind)) throw new Error("Unsupported source or wrong brand.");
  if (!validDate(manifest.observedOn) || manifest.observedOn > new Date().toISOString().slice(0, 10)) throw new Error("A valid source observation date is required.");
  if (manifest.kind === "search_console_links_export" && manifest.property !== `sc-domain:${BRAND.domain}`) throw new Error("Search Console export property does not match Construction.");
  if (!Array.isArray(manifest.records) || manifest.records.length > MAX_RECORDS) throw new Error(`Import limited to ${MAX_RECORDS} records; split larger exports deliberately.`);
  const candidates = new Map();
  for (const record of manifest.records) {
    const sourceUrl = publicUrl(record.sourceUrl);
    const targetUrl = publicUrl(record.targetUrl || BRAND.url);
    if (new URL(targetUrl).origin !== BRAND.url) throw new Error("Candidate CTA must belong to Construction.");
    const domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
    if (domain === BRAND.domain) throw new Error("An owned-page link is not an earned external opportunity.");
    const id = candidateId(sourceUrl);
    if (candidates.has(id)) continue;
    candidates.set(id, {
      id, brandId: BRAND.id, name: domain, domain, sourceUrl, targetUrl,
      source: { kind: manifest.kind, observedOn: manifest.observedOn, property: manifest.property || null },
      status: "discovered", verifiedLink: false, dr: null, traffic: null, dofollow: null,
      metrics: { authority: null, traffic: null, dofollow: null }, review: null,
      route: null, category: "prospect", feasibility: "outreach", linkType: "unknown",
    });
  }
  return [...candidates.values()];
}
export function mergeCandidates(existing, incoming) {
  if (!Array.isArray(existing) || !Array.isArray(incoming)) throw new Error("Candidate ledger must be an array.");
  const merged = new Map();
  for (const row of existing) {
    validateCandidate(row);
    const key = row.sourceUrl;
    if (merged.has(key)) throw new Error("Duplicate existing source records require reconciliation; no receipt or suppression state was overwritten.");
    merged.set(key, row);
  }
  for (const row of incoming) {
    validateCandidate(row);
    // Existing review/status/receipts win. Imports cannot reset suppression or pending work.
    if (!merged.has(row.sourceUrl)) merged.set(row.sourceUrl, row);
  }
  return [...merged.values()];
}

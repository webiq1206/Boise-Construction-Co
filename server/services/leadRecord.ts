import {
  buildSelectionRows,
  formatUsd,
  type VerifiedEstimate,
  type LeadContact,
  type PropertyEnrichment,
} from "@/server/services/consultationEmail";
import {
  buildEstimateDisclosure,
  NOT_A_QUOTE_NOTICE,
  ONSITE_REQUIRED_NOTICE,
  PROJECT_LABELS,
  FINISH_LABELS,
} from "@/shared/estimateEngine";

/**
 * The complete record of what a homeowner saw, selected, and was told, built
 * once and shared by the CRM forward so the stored record can never disagree
 * with the confirmation email.
 *
 * Everything here is derived from the same helpers the emails render from
 * (buildSelectionRows, buildEstimateDisclosure), rather than restated. If the
 * estimator's copy or scope changes, the CRM record follows automatically.
 */
export interface LeadEstimateRecord {
  projectType: string;
  projectLabel: string;
  /** The layout/type card chosen, e.g. "L-Shape". */
  layout?: string;
  sizeSqft: number;
  finishLevel: string;
  finishLabel: string;
  /** The "what are you upgrading" chips ticked. */
  upgradesSelected: string[];
  priceLow: number;
  priceHigh: number;
  currency: "USD";
  formattedRange: string;
  confidence: string;
  typicalRoiPercent: number;
  /** Every pricing input, exactly as the homeowner saw it labelled. */
  pricingFactors: { label: string; value: string }[];
  includes: string[];
  excludes: string[];
  assumptions: string[];
  increasesCost: string[];
  decreasesCost: string[];
  optionalUpgrades: string[];
  /** The disclaimers shown on screen and in the email, verbatim. */
  disclaimers: string[];
}

export function buildLeadEstimateRecord(est: VerifiedEstimate): LeadEstimateRecord {
  const disclosure = buildEstimateDisclosure({
    project: est.project,
    finish: est.finish,
    sqft: est.sqft,
    refinements: est.refinements,
  });

  const rows = buildSelectionRows(
    est.project,
    est.finish,
    est.sqft,
    est.refinements,
    est.layoutLabel,
    est.upgradeLabels
  );

  return {
    projectType: est.project,
    projectLabel: PROJECT_LABELS[est.project].label,
    layout: est.layoutLabel,
    sizeSqft: est.sqft,
    finishLevel: est.finish,
    finishLabel: FINISH_LABELS[est.finish].label,
    upgradesSelected: est.upgradeLabels ?? [],
    priceLow: est.priceLow,
    priceHigh: est.priceHigh,
    currency: "USD",
    formattedRange: `${formatUsd(est.priceLow)} to ${formatUsd(est.priceHigh)}`,
    confidence: est.confidence,
    typicalRoiPercent: Math.round(est.roi),
    pricingFactors: rows,
    includes: disclosure.includes,
    excludes: disclosure.excludes,
    assumptions: disclosure.assumptions,
    increasesCost: disclosure.increases,
    decreasesCost: disclosure.decreases,
    optionalUpgrades: disclosure.upgrades,
    disclaimers: [NOT_A_QUOTE_NOTICE, ONSITE_REQUIRED_NOTICE],
  };
}

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  return `${title}\n${lines.map((l) => `  ${l}`).join("\n")}\n`;
}

/**
 * A plain-text rendering of the whole record.
 *
 * The CRM's field schema is not known from this repository, so structured
 * fields it does not recognise may be dropped. This string is the guarantee:
 * whatever else happens, one notes field carries the complete record in a
 * consistent, readable, searchable shape. Section headings are stable and
 * uppercase so they can be searched or parsed later.
 */
export function buildLeadNotes(
  lead: LeadContact,
  est: VerifiedEstimate | null,
  profile?: PropertyEnrichment | null
): string {
  const parts: string[] = [];

  parts.push(
    section("CONTACT", [
      `Name: ${lead.name}`,
      `Phone: ${lead.phone}`,
      `Email: ${lead.email}`,
      `Address: ${lead.address || "Not provided"}${lead.zip ? ` ${lead.zip}` : ""}`,
      `Stated budget: ${lead.budget || "Not provided"}`,
    ])
  );

  if (est) {
    const r = buildLeadEstimateRecord(est);
    parts.push(
      section("ESTIMATE SHOWN TO HOMEOWNER", [
        `Planning range: ${r.formattedRange}`,
        `Detail level: ${r.confidence}`,
        `Typical resale ROI: ~${r.typicalRoiPercent}%`,
      ])
    );
    parts.push(
      section(
        "SELECTIONS",
        r.pricingFactors.map((f) => `${f.label}: ${f.value}`)
      )
    );
    parts.push(section("WHAT THE RANGE COVERS", r.includes));
    parts.push(section("WHAT IT DOES NOT COVER", r.excludes));
    parts.push(section("ASSUMPTIONS USED", r.assumptions));
    parts.push(section("COULD INCREASE THE FINAL COST", r.increasesCost));
    parts.push(section("COULD DECREASE THE FINAL COST", r.decreasesCost));
    parts.push(section("OPTIONAL UPGRADES PRESENTED", r.optionalUpgrades));
    parts.push(section("DISCLAIMERS SHOWN", r.disclaimers));
  } else {
    parts.push(section("ESTIMATE SHOWN TO HOMEOWNER", ["No planning range was attached."]));
  }

  if (lead.message) {
    parts.push(section("NOTES FROM THE HOMEOWNER", [lead.message]));
  }

  if (profile) {
    const enrichment = [
      profile.parcelId ? `Parcel: ${profile.parcelId}` : "",
      profile.squareFootage ? `Home: ~${profile.squareFootage.toLocaleString("en-US")} sq ft` : "",
      profile.lotSizeSqFt ? `Lot: ${profile.lotSizeSqFt.toLocaleString("en-US")} sq ft` : "",
      profile.permittingAuthority ? `Permits: ${profile.permittingAuthority}` : "",
    ].filter(Boolean);
    parts.push(section("PROPERTY RECORDS (AUTO-ENRICHED)", enrichment));
  }

  return parts.filter(Boolean).join("\n").trimEnd();
}

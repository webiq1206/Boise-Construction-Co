import {
  LEADS_DASHBOARD_URL,
  buildPropertyRows,
  buildSelectionRows,
  formatUsd,
  type PropertyEnrichment,
  type VerifiedEstimate,
} from "@/server/services/consultationEmail";
import { P5_TEAM_NOTES_MAX_LINES, sanitizeTeamNotes } from "@/server/services/p5IntakeBridge";
import { resolveInternalEstimate } from "@/shared/costs/resolve";
import { isNewConstructionProject } from "@/shared/estimateEngine";
import type { AttributionTouch, LeadAttribution } from "@/lib/leadAttribution";

/**
 * The "From the website" lines P5 prints in its team email (team_notes on the
 * intake bridge). One team email per request means the P5 email is usually the
 * only one the team reads, so what this site's own team email shows and the
 * bridge fields do not goes here: the lead dashboard link, the planning range
 * the customer was shown with the selections behind it, the county parcel
 * record, and how the visitor found the site.
 *
 * NEVER an internal figure. The P5 team email is copied into HubSpot with its
 * full body by the P5 inbox sync, and the owner's rule is that those numbers
 * stay out of HubSpot. So no line here may carry what a job costs us, a margin,
 * a markup, a profit, a contingency or an overhead number, and no pricing check
 * text (it names margins): a count of the checks at most. The internal
 * breakdown this site's own team email shows is therefore NOT sent to P5. It
 * stays in this site's email, which only goes out when P5 did not confirm its
 * own. P5 also drops any line that mentions those words. Do not word around
 * that: leave the figure out.
 *
 * Never repeat what the bridge already sends (name, phone, email, address,
 * project type, message, timing, files). Every line is "Label: value". Lines
 * are in the order the team needs them, because the contract keeps the first
 * 40.
 */

/**
 * Words that mark an internal figure. A line that mentions one is left out,
 * as a backstop: nothing below builds such a line on purpose, but a selection
 * label, an owner name or a landing page address is outside this file's
 * control.
 */
export const INTERNAL_FIGURE_WORDS =
  /\b(?:costs?|costing|margins?|mark-?ups?|profits?|contingenc(?:y|ies)|overheads?)\b/i;

export function mentionsInternalFigure(line: string): boolean {
  return INTERNAL_FIGURE_WORDS.test(line);
}

const EVIDENCE_LABELS: Record<AttributionTouch["evidence"], string> = {
  google_click_id: "Google Ads click",
  campaign_parameters: "campaign link",
  referral: "referral",
  direct: "direct visit",
};

/** Campaign fields a person can read. Click ids are left out: they are long and mean nothing in an email. */
const CAMPAIGN_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "keyword"] as const;

/**
 * One fact per line, so a search keyword or a landing page address that
 * happens to contain one of the words above costs only its own line.
 */
function touchLines(prefix: string, touch: AttributionTouch): string[] {
  const lines = [`${prefix}: ${EVIDENCE_LABELS[touch.evidence] ?? "visit"}`];
  for (const key of CAMPAIGN_FIELDS) {
    if (touch.campaign?.[key]) lines.push(`${prefix}, ${key}: ${touch.campaign[key]}`);
  }
  if (touch.referrer) lines.push(`${prefix}, referrer: ${touch.referrer}`);
  if (touch.landing) lines.push(`${prefix}, landing page: ${touch.landing}`);
  return lines;
}

/** Each section fails alone, so one unreadable value cannot cost the team the other lines. */
function section(build: () => string[]): string[] {
  try {
    return build();
  } catch (error) {
    console.error("[p5-intake] Team note section skipped:", error instanceof Error ? error.message : error);
    return [];
  }
}

function dashboardLines(): string[] {
  return [`Lead dashboard: ${LEADS_DASHBOARD_URL}`];
}

function propertyLines(profile: PropertyEnrichment | null | undefined): string[] {
  if (!profile) return [];
  return buildPropertyRows(profile).map(([label, value]) => `${label}: ${value}`);
}

function attributionLines(attribution: LeadAttribution | null | undefined): string[] {
  if (!attribution?.latest) return [];
  const latest = touchLines("How they found us (browser reported)", attribution.latest);
  if (!attribution.first || attribution.first.at === attribution.latest.at) return latest;
  const first = touchLines(`First visit ${attribution.first.at.slice(0, 10)} (browser reported)`, attribution.first);
  return [...latest, ...first];
}

/** The range exactly as the customer was shown it. No cost data is read to build this line. */
function rangeLine(estimate: VerifiedEstimate): string {
  return `Planning range shown: ${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)} (${estimate.confidence})`;
}

/** What the customer chose in the estimator, labelled as they saw it. */
function selectionLines(estimate: VerifiedEstimate): string[] {
  const lines: string[] = [];
  if (estimate.statedBudget && estimate.statedBudget > 0) {
    lines.push(`Stated budget: ${formatUsd(estimate.statedBudget)}`);
  }
  const rows = buildSelectionRows(
    estimate.project,
    estimate.finish,
    estimate.sqft,
    estimate.refinements,
    estimate.layoutLabel,
    estimate.upgradeLabels,
  );
  for (const row of rows) {
    // The bridge sends the form's project type. This is the project the range was priced for.
    lines.push(`${row.label === "Project type" ? "Range is for" : row.label}: ${row.value}`);
  }
  if (estimate.roi && !isNewConstructionProject(estimate.project)) {
    lines.push(`Typical resale ROI: about ${Math.round(estimate.roi)}%`);
  }
  return lines;
}

/**
 * The pricing checks name margins, so their text never leaves this site. The
 * team is told only that there are some, and reads them in this site's own
 * records.
 */
function pricingCheckLines(estimate: VerifiedEstimate): string[] {
  const resolved = resolveInternalEstimate(estimate.project, estimate.finish, estimate.sqft, estimate.refinements);
  const checks = resolved?.admin.warnings ?? [];
  if (!checks.length) return [];
  const review = checks.filter((check) => check.severity === "warn").length;
  return [
    `Pricing checks on this range: ${checks.length}${review ? `, ${review} to review before quoting` : ""} (not listed in this email)`,
  ];
}

/**
 * Leaves out any line that mentions an internal figure, keeps the first lines
 * and says how many were left out for length, so a long list never silently
 * loses its tail. The lead dashboard has the complete record.
 */
export function fitTeamNotes(lines: string[]): string[] {
  const all = lines.map((line) => line.trim()).filter((line) => line && !mentionsInternalFigure(line));
  if (all.length <= P5_TEAM_NOTES_MAX_LINES) return sanitizeTeamNotes(all);
  const kept = P5_TEAM_NOTES_MAX_LINES - 1;
  return sanitizeTeamNotes([
    ...all.slice(0, kept),
    `Not shown: ${all.length - kept} more lines, the full record is on the lead dashboard`,
  ]);
}

/** Step 1: a request, a callback, or a request with a planning range attached. */
export function buildConsultationTeamNotes(input: {
  estimate?: VerifiedEstimate | null;
  profile?: PropertyEnrichment | null;
  attribution?: LeadAttribution | null;
}): string[] {
  const estimate = input.estimate ?? null;
  return fitTeamNotes([
    ...dashboardLines(),
    ...(estimate ? section(() => [rangeLine(estimate)]) : []),
    ...(estimate ? section(() => selectionLines(estimate)) : []),
    ...(estimate ? section(() => pricingCheckLines(estimate)) : []),
    ...section(() => propertyLines(input.profile)),
    ...section(() => attributionLines(input.attribution)),
  ]);
}

/**
 * Step 2 ("Help us prepare"): the details themselves ride in the bridge fields
 * (the notes block, timing, best time, files). What they do not carry is the
 * parcel record looked up for the address given in this step.
 */
export function buildDetailsTeamNotes(input: { profile?: PropertyEnrichment | null }): string[] {
  return fitTeamNotes([...dashboardLines(), ...section(() => propertyLines(input.profile))]);
}

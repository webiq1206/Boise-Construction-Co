import {
  LEADS_DASHBOARD_URL,
  buildPropertyRows,
  buildSelectionRows,
  formatUsd,
  type PropertyEnrichment,
  type VerifiedEstimate,
} from "@/server/services/consultationEmail";
import {
  P5_TEAM_INTERNAL_NOTES_MAX_LINES,
  P5_TEAM_NOTE_MAX_LENGTH,
  P5_TEAM_NOTES_MAX_LINES,
  sanitizeTeamNotes,
} from "@/server/services/p5IntakeBridge";
import { resolveInternalEstimate } from "@/shared/costs/resolve";
import { isNewConstructionProject } from "@/shared/estimateEngine";
import type { AttributionTouch, LeadAttribution } from "@/lib/leadAttribution";

/**
 * What this site adds to the one team email P5 sends. One team email per
 * request means the P5 email is usually the only one the team reads, so what
 * this site's own team email shows and the bridge fields do not travels in two
 * lists, and the split between them is the whole point.
 *
 * team_notes ("From the website", buildConsultationTeamNotes): the lead
 * dashboard link, the planning range the customer was shown with the
 * selections behind it, the county parcel record, and how the visitor found
 * the site. NEVER an internal figure. A "New lead" email is copied into
 * HubSpot with its full body by the P5 inbox sync, and the owner's rule is
 * that those numbers stay out of HubSpot. So no line there may carry what a
 * job costs us, a margin, a markup, a profit, a contingency or an overhead
 * number, and no pricing check text (it names margins): a count of the checks
 * at most. P5 also withholds any team_notes line that mentions those words. Do
 * not word around that: the figure belongs in the other list.
 *
 * team_internal_notes ("Internal pricing", buildConsultationInternalNotes):
 * the internal breakdown this site's own team email shows for a request with
 * a planning range (owner decision, 17 November 2026). When that list is
 * present P5 sends the email as "Lead and pricing: ..." and its inbox sync
 * copies only "New lead" mail, so these lines never reach HubSpot. Step 1
 * with a range only: nothing for a request without one, nothing for Step 2.
 *
 * Never repeat what the bridge already sends (name, phone, email, address,
 * project type, message, timing, files). Every line is "Label: value". Lines
 * are in the order the team needs them, because each contract keeps only its
 * first lines (40 and 60).
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
 * The pricing checks name margins, so their text is never a team_notes line.
 * This line gives the count and points at the "Internal pricing" section of
 * the same email, where buildConsultationInternalNotes puts the wording.
 */
function pricingCheckLines(estimate: VerifiedEstimate): string[] {
  const resolved = resolveInternalEstimate(estimate.project, estimate.finish, estimate.sqft, estimate.refinements);
  const checks = resolved?.admin.warnings ?? [];
  if (!checks.length) return [];
  const review = checks.filter((check) => check.severity === "warn").length;
  return [
    `Pricing checks on this range: ${checks.length}${review ? `, ${review} to review before quoting` : ""} (see Internal pricing below)`,
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
 * Step 1 with a planning range: the "Internal breakdown (not shown to the
 * lead)" block of this site's own team email, as team_internal_notes. Same
 * source and same rounding as renderTradeRollupHtml in consultationEmail.ts,
 * so the two emails can never disagree.
 *
 * Order matters, because the contract keeps the first 60 lines: the pricing
 * checks (read before the numbers, as in the email), then the totals and the
 * margin, then one line per trade, then the assumptions. Returns nothing for a
 * request without a range, and nothing when the project has no rule set.
 *
 * These lines name costs and margins on purpose. They must only ever be sent
 * as teamInternalNotes, never as teamNotes.
 */
export function buildConsultationInternalNotes(input: { estimate?: VerifiedEstimate | null }): string[] {
  const estimate = input.estimate ?? null;
  if (!estimate) return [];
  try {
    const resolved = resolveInternalEstimate(estimate.project, estimate.finish, estimate.sqft, estimate.refinements);
    if (!resolved) return [];
    const { admin } = resolved;
    const checks = [
      ...admin.warnings.filter((check) => check.severity === "warn").flatMap((check) => wrapNote("Needs review", check.message)),
      ...admin.warnings.filter((check) => check.severity !== "warn").flatMap((check) => wrapNote("Pricing note", check.message)),
    ];
    const totals = [
      `Direct cost: ${formatUsd(admin.directCost)}`,
      `Contingency: ${formatUsd(admin.contingency)}`,
      `Total internal cost: ${formatUsd(admin.totalInternalCost)}`,
      `Gross profit: ${formatUsd(admin.grossProfit)}`,
      `Margin: ${admin.marginLabel}`,
      `Quoted range: ${admin.rangeLabel}`,
    ];
    const trades = admin.trades.map(
      (trade) =>
        `${trade.division}: our cost ${formatUsd(trade.internalCost)}, customer ${formatUsd(trade.customerAmount)}${trade.scopeSummary ? ` (${trade.scopeSummary})` : ""}`,
    );
    const assumptions = admin.assumptions.slice(0, 8).flatMap((assumption) => wrapNote("Assumption", assumption));
    return fitInternalNotes([...checks, ...totals, ...trades, ...assumptions]);
  } catch (error) {
    console.error("[p5-intake] Internal pricing notes skipped:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * A sentence longer than one line allows continues on the next line under the
 * same label, so the wording of a pricing check is never cut short.
 */
function wrapNote(label: string, text: string): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let prefix = `${label}: `;
  let current = "";
  for (const word of words) {
    if (current && prefix.length + current.length + 1 + word.length > P5_TEAM_NOTE_MAX_LENGTH) {
      lines.push(prefix + current);
      prefix = `${label} (continued): `;
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(prefix + current);
  return lines;
}

/** Keeps the first lines and says how many were left out, so the tail is never lost silently. */
export function fitInternalNotes(lines: string[]): string[] {
  const all = lines.map((line) => line.trim()).filter(Boolean);
  if (all.length <= P5_TEAM_INTERNAL_NOTES_MAX_LINES) return sanitizeTeamNotes(all, P5_TEAM_INTERNAL_NOTES_MAX_LINES);
  const kept = P5_TEAM_INTERNAL_NOTES_MAX_LINES - 1;
  return sanitizeTeamNotes(
    [...all.slice(0, kept), `Not shown: ${all.length - kept} more lines of the internal breakdown`],
    P5_TEAM_INTERNAL_NOTES_MAX_LINES,
  );
}

/**
 * Step 2 ("Help us prepare"): the details themselves ride in the bridge fields
 * (the notes block, timing, best time, files). What they do not carry is the
 * parcel record looked up for the address given in this step.
 */
export function buildDetailsTeamNotes(input: { profile?: PropertyEnrichment | null }): string[] {
  return fitTeamNotes([...dashboardLines(), ...section(() => propertyLines(input.profile))]);
}

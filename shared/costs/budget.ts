/**
 * Comparing a homeowner's budget to the range, and finding a way to meet it.
 *
 * THREE STATES, NOT TWO. A budget that sits anywhere inside the quoted range is
 * not "over" - it overlaps our own uncertainty, and warning about it would talk
 * someone out of scope they can probably afford. Only a budget BELOW the floor
 * gets trade-offs. That single rule removes most false alarms, and false alarms
 * are what would cost leads.
 *
 * NOTHING HERE CLAIMS PRECISION THE MODEL DOES NOT HAVE. The engine emits a
 * range because six dropdown answers cannot support more, so every figure this
 * module produces is a range too. "This would land around $24,500" is exactly
 * the kind of sentence the rest of the system is built to avoid.
 *
 * SUGGESTIONS ARE SOLVED, NOT WRITTEN. Each option below is produced by
 * re-running the real engine against a modified set of selections and keeping
 * the ones that actually reach the budget. That is the difference between
 * "consider reducing scope", which everyone ignores, and "standard cabinetry and
 * keeping the plumbing where it is", which starts a conversation.
 */
import type { QualityLevel, ScopeSelections } from "./engine";
import { buildInternalEstimate } from "./engine";
import { buildPlanningRange } from "./pricing";
import { RULES_BY_PROJECT } from "./scopeRules";
import type { ProjectType } from "../estimateEngine";

export type BudgetState = "above" | "within" | "below";

/** A change the homeowner could make, priced by re-running the engine. */
export interface BudgetOption {
  /** Plain language, homeowner-facing. */
  label: string;
  changes: Partial<ScopeSelections>;
  low: number;
  high: number;
  /** True when this option's range now contains or sits under the budget. */
  reachesBudget: boolean;
}

export interface BudgetAssessment {
  state: BudgetState;
  budget: number;
  low: number;
  high: number;
  /** One sentence, the first thing a homeowner reads. Never alarming. */
  headline: string;
  /** Optional second sentence naming the two trades doing the most work. */
  driver?: string;
  /** Ranked, computed alternatives. Empty unless state is "below". */
  options: BudgetOption[];
  /**
   * True when no combination of reversible choices reaches the budget. Said
   * plainly rather than papered over with an option that does not work.
   */
  unreachable: boolean;
  /** What the estimate is actually based on. Shown once, near the comparison. */
  basisNote: string;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export const BUDGET_BASIS_NOTE =
  "This is built from the answers you gave and what comparable Treasure Valley projects have actually cost. It will move once we see the space.";

/**
 * Levers a homeowner can realistically pull, cheapest concession first.
 *
 * Ordered by how much is given up, not by how much is saved. Keeping plumbing
 * where it is costs a homeowner nothing they can see; dropping a finish level
 * changes the whole feel of the room. Suggesting the second when the first
 * would do is how an estimator loses trust.
 *
 * Size and bathroom count are deliberately absent: those describe what the
 * homeowner needs, not how nicely it is finished, and suggesting a smaller
 * kitchen or one fewer bathroom answers a question nobody asked.
 */
interface Lever {
  key: keyof ScopeSelections;
  value: unknown;
  label: string;
  /** Only offered when the current selection is actually richer than this. */
  applies: (s: ScopeSelections) => boolean;
}

const QUALITY_ORDER: QualityLevel[] = ["refresh", "mid-range", "high-end", "luxury"];

function lowerQuality(q: QualityLevel): QualityLevel | null {
  const i = QUALITY_ORDER.indexOf(q);
  return i > 0 ? QUALITY_ORDER[i - 1] : null;
}

function buildLevers(s: ScopeSelections): Lever[] {
  const levers: Lever[] = [
    {
      key: "plumbingElectrical",
      value: "cosmetic",
      label: "keeping the plumbing and wiring where they are",
      applies: (x) => x.plumbingElectrical === "full" || x.plumbingElectrical === "partial",
    },
    {
      key: "layoutChanges",
      value: "none",
      label: "keeping the existing layout",
      applies: (x) => x.layoutChanges === "major" || x.layoutChanges === "moderate",
    },
    {
      key: "cabinetTier",
      value: "semi-custom",
      label: "semi-custom cabinetry instead of fully custom",
      applies: (x) => x.cabinetTier === "custom",
    },
    {
      key: "cabinetTier",
      value: "standard",
      label: "standard cabinetry",
      applies: (x) => x.cabinetTier === "custom" || x.cabinetTier === "semi-custom",
    },
  ];

  const down = lowerQuality(s.quality);
  if (down) {
    levers.push({
      key: "quality",
      value: down,
      label: `a ${down.replace("-", " ")} finish level`,
      applies: () => true,
    });
  }
  return levers.filter((l) => l.applies(s));
}

function priceWith(
  project: ProjectType,
  selections: ScopeSelections,
  changes: Partial<ScopeSelections>,
): { low: number; high: number } | null {
  const rules = RULES_BY_PROJECT[project];
  if (!rules) return null;
  const merged = { ...selections, ...changes } as ScopeSelections;
  const internal = buildInternalEstimate(rules, merged, project);
  const range = buildPlanningRange(internal, project, merged.quality, merged.sqft);
  return { low: range.low, high: range.high };
}

/**
 * Solve for the smallest change that brings the project within reach.
 *
 * Tries every single lever, then every pair, and keeps the ones whose range
 * floor drops to the budget or below. Ranked by fewest concessions first, then
 * by the cheapest concession, so the least painful option is offered first.
 */
function solveOptions(
  project: ProjectType,
  selections: ScopeSelections,
  budget: number,
): BudgetOption[] {
  const levers = buildLevers(selections);
  const candidates: { changes: Partial<ScopeSelections>; label: string; depth: number; rank: number }[] = [];

  levers.forEach((l, i) => {
    candidates.push({ changes: { [l.key]: l.value } as Partial<ScopeSelections>, label: l.label, depth: 1, rank: i });
  });

  for (let i = 0; i < levers.length; i++) {
    for (let j = i + 1; j < levers.length; j++) {
      // Two levers on the same field would contradict each other.
      if (levers[i].key === levers[j].key) continue;
      candidates.push({
        changes: { [levers[i].key]: levers[i].value, [levers[j].key]: levers[j].value } as Partial<ScopeSelections>,
        label: `${levers[i].label} and ${levers[j].label}`,
        depth: 2,
        rank: i + j,
      });
    }
  }

  const priced: BudgetOption[] = [];
  for (const c of candidates) {
    const r = priceWith(project, selections, c.changes);
    if (!r) continue;
    priced.push({ label: c.label, changes: c.changes, low: r.low, high: r.high, reachesBudget: r.low <= budget });
  }

  return priced
    .filter((o) => o.reachesBudget)
    .sort((a, b) => {
      const ca = candidates.find((c) => c.label === a.label)!;
      const cb = candidates.find((c) => c.label === b.label)!;
      return ca.depth - cb.depth || ca.rank - cb.rank;
    })
    .slice(0, 3);
}

/**
 * Compare a stated budget against the quoted range.
 *
 * `topTrades` are the two largest parent trades, used only to explain WHERE the
 * money is when the budget falls short. Pass them from the admin rollup; they
 * are named, never priced, to the homeowner.
 */
export function assessBudget(
  project: ProjectType,
  selections: ScopeSelections,
  range: { low: number; high: number },
  budget: number,
  topTrades: string[] = [],
): BudgetAssessment {
  const base = {
    budget,
    low: range.low,
    high: range.high,
    options: [] as BudgetOption[],
    unreachable: false,
    basisNote: BUDGET_BASIS_NOTE,
  };

  if (budget >= range.high) {
    const headroom = budget - range.high;
    return {
      ...base,
      state: "above",
      // Only quote the headroom when it is big enough to mean something. A
      // budget $400 above the ceiling is "comfortably inside", not "$400 spare".
      headline:
        headroom >= 2000
          ? `This comes in around ${usd(headroom)} under your target.`
          : "This comes in comfortably inside your target.",
      driver:
        "That leaves room to upgrade the finishes that matter most to you, or simply to keep some of it in reserve.",
    };
  }

  if (budget >= range.low) {
    return {
      ...base,
      state: "within",
      headline: "Your target sits inside this range.",
      driver:
        "Where it lands depends on selections and what we find on site, which is what the in-home visit settles.",
    };
  }

  const options = solveOptions(project, selections, budget);
  const named = topTrades.slice(0, 2);

  return {
    ...base,
    state: "below",
    options,
    unreachable: options.length === 0,
    headline: `Your target sits below this range. A project like this typically starts around ${usd(range.low)}.`,
    driver:
      named.length > 0
        ? `Most of the cost is in ${named.join(" and ").toLowerCase()}.`
        : undefined,
  };
}

/**
 * The sentence offering a way forward, or an honest admission that there is not
 * one at this scope.
 *
 * Phasing is a real answer and it keeps the homeowner in the conversation,
 * which inventing an option that does not reach the budget would not.
 */
export function budgetGuidance(a: BudgetAssessment): string {
  if (a.state !== "below") return "";
  if (a.unreachable) {
    return `A project at this size is unlikely to land near ${usd(a.budget)}. It is worth talking through phasing the work, or reducing the scope, when we visit.`;
  }
  const best = a.options[0];
  return `${best.label.charAt(0).toUpperCase()}${best.label.slice(1)} would likely bring this closer to ${usd(best.low)} to ${usd(best.high)}.`;
}

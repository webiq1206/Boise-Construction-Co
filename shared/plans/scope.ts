/**
 * Which question a plan set is being asked.
 *
 * The estimator has two extraction targets now: the residential one that asks
 * how big a house is, and the millwork one that asks what joinery is on the
 * sheets. Picking the wrong one is not a degraded answer, it is a useless one -
 * a restaurant read as a house returns every field null, which is exactly what
 * happened to the first real set someone uploaded.
 *
 * WHY A MODEL DECIDES AND NOT A KEYWORD LIST. "Price the casework", "just the
 * cabinets and the bar", "we only need the joinery package", "millwork only"
 * and "what would the built-ins run" all mean the same thing, and a regex that
 * catches them today misses the sixth phrasing tomorrow. The decision is also
 * cheap and made once per job, so there is no reason to be clever about it.
 *
 * The DEFAULT IS RESIDENTIAL, deliberately. Someone who uploads plans and says
 * nothing wants the estimator they came for. Millwork mode is opt-in through
 * saying so.
 */

export type PlanScope = "residential" | "millwork";

export const PLAN_SCOPE_LABELS: Record<PlanScope, string> = {
  residential: "Whole-home estimate",
  millwork: "Millwork and casework takeoff",
};

export const SCOPE_CLASSIFIER_PROMPT = `Decide which of two readings a customer wants for their construction drawings.

"millwork" - they asked for joinery specifically: millwork, casework, cabinetry, cabinets, built-ins, countertops, the bar, panelling, trim, shop drawings, or a named subset of those. Phrases like "millwork only", "just the casework", "price the built-ins", "we need the joinery package" are all millwork.

"residential" - anything else, including an empty request. Someone pricing a whole house, an addition, or who said nothing at all, wants the ordinary whole-project estimate.

Two rules that matter:
- If they want the WHOLE project priced and merely mention millwork as one part of it ("a custom home with a lot of built-in millwork"), that is "residential". Millwork mode is for when the joinery IS the job.
- If in doubt, answer "residential". It is the estimator they came for, and a whole-project read that mentions casework is far less wrong than a joinery takeoff for someone who wanted a house.`;

/**
 * Cheap pre-filter so an obvious case never needs a model call.
 *
 * Returns null when the text is ambiguous enough to be worth asking about.
 * Deliberately conservative in both directions: it only short-circuits on an
 * empty instruction, which is by far the most common case and is unambiguously
 * residential.
 */
export function obviousScope(instructions: string | null): PlanScope | null {
  if (!instructions || instructions.trim().length === 0) return "residential";
  return null;
}

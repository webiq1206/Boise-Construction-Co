/**
 * Scoring for "is this returned parcel actually the address the homeowner
 * typed?"
 *
 * This exists because the previous selection logic compared house numbers with
 * a substring test, so the number 1386 matched the parcel at 11386 W
 * GOLDENSPIRE DR. Attributing a lead to the wrong parcel is worse than
 * returning nothing: every field that follows (zoning, lot size, assessed
 * value, owner) then describes a different person's house.
 *
 * The rule that prevents it: house numbers are compared as whole tokens, and a
 * mismatch is disqualifying rather than merely low scoring.
 */

const UNIT_MARKERS = new Set(["APT", "UNIT", "STE", "SUITE", "#", "LOT", "SPC", "TRLR"]);

/** Uppercase, strip punctuation, collapse whitespace. */
export function normalizeForCompare(value: string): string {
  return value
    .toUpperCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForCompare(value).split(" ").filter(Boolean);
}

/** Leading all digit token, e.g. "1386". Undefined when there is none. */
function houseNumber(tokens: string[]): string | undefined {
  const first = tokens[0];
  return first && /^\d+$/.test(first) ? first : undefined;
}

/** Drop unit/apartment designators so "123 MAIN ST APT 4" matches "123 MAIN ST". */
function streetTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (UNIT_MARKERS.has(token)) break;
    if (i === 0 && /^\d+$/.test(token)) continue;
    out.push(token);
  }
  return out;
}

/** Minimum score to treat a candidate as the same property. */
export const MIN_ADDRESS_MATCH_SCORE = 60;

/**
 * Score a candidate address against the target, 0 to 100.
 *
 * 0 means "definitely not this property". Callers should reject anything below
 * MIN_ADDRESS_MATCH_SCORE rather than taking the best of a bad set.
 */
export function scoreAddressMatch(candidate: string, target: string): number {
  const candidateTokens = tokenize(candidate ?? "");
  const targetTokens = tokenize(target ?? "");
  if (candidateTokens.length === 0 || targetTokens.length === 0) return 0;

  if (candidateTokens.join(" ") === targetTokens.join(" ")) return 100;

  const candidateNumber = houseNumber(candidateTokens);
  const targetNumber = houseNumber(targetTokens);

  // Whole token comparison. This is the check that rejects 1386 against 11386.
  if (candidateNumber && targetNumber && candidateNumber !== targetNumber) return 0;
  // The homeowner gave a house number and the parcel has none (or vice versa):
  // not enough to confirm the same property.
  if (Boolean(candidateNumber) !== Boolean(targetNumber)) return 0;

  const candidateStreet = new Set(streetTokens(candidateTokens));
  const targetStreet = new Set(streetTokens(targetTokens));
  if (targetStreet.size === 0 || candidateStreet.size === 0) return 0;

  let overlap = 0;
  for (const token of targetStreet) if (candidateStreet.has(token)) overlap++;

  /*
   * Jaccard rather than "how much of the target was covered". Measuring
   * coverage one way lets extra words in the candidate ride along free, so
   * "S NOVA RIDGE WAY" scored 77 against "S NOVA LN" on the two shared words.
   * Dividing by the union penalises the unmatched extras and rejects it.
   */
  const union = new Set([...candidateStreet, ...targetStreet]).size;
  const ratio = overlap / union;

  if (ratio < 0.5) return 0;

  return Math.round(40 + 55 * ratio);
}

/**
 * Best scoring candidate, or null when none clears the threshold.
 *
 * Returning null is deliberate: no enrichment is a better outcome than
 * enrichment describing the wrong house.
 */
export function pickBestAddressMatch<T>(
  candidates: T[],
  target: string,
  addressOf: (candidate: T) => string
): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = scoreAddressMatch(addressOf(candidate), target);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore >= MIN_ADDRESS_MATCH_SCORE ? best : null;
}

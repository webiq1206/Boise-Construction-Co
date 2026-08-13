/**
 * Reconciling an RE-10 repair list read across many passes.
 *
 * DIFFERENT PROBLEM FROM A PLAN SET. A plan set is many partial descriptions of
 * ONE building, so merging means resolving contradictions about a single fact.
 * A repair addendum is a LIST, so merging means union - and the danger inverts.
 * There, the risk was picking the wrong area. Here it is counting the same
 * repair twice, or dropping one because it looked like a repeat.
 *
 * BOTH FAILURES ARE EXPENSIVE AND THEY PULL IN OPPOSITE DIRECTIONS:
 *  - Count "replace the kitchen faucet" twice because it appears on the RE-10
 *    AND in the inspection report it cites, and the quote is inflated by a real
 *    line item. That is the duplicate-quantity failure.
 *  - Merge "patch drywall in the hallway" with "patch drywall in bedroom 2"
 *    because both say "patch drywall", and a genuine repair vanishes from the
 *    scope. That is the overlooked-scope failure, and it is worse: the first
 *    loses a bid, the second loses money on a job already won.
 *
 * SO THE RULE IS ASYMMETRIC. Only an unambiguous repeat is collapsed silently.
 * Anything merely similar is KEPT - both rows survive - and flagged for a human
 * to confirm. Erring toward keeping means an estimator occasionally deletes a
 * duplicate row, which is a ten-second fix. Erring toward merging means work
 * nobody priced, discovered on site.
 */
import type { ExtractedRepair, ExtractionResult, UnmappedItem } from "./extraction";

export interface Re10ChunkContribution {
  result: Partial<ExtractionResult>;
  pageIds: string[];
  pageLabels: string[];
}

export interface DuplicateFlag {
  verbatim: string;
  pageLabels: string[];
  reason: string;
}

export interface QuantityConflict {
  verbatim: string;
  quantities: number[];
  pageLabels: string[];
}

export interface MergedRe10Result {
  result: ExtractionResult;
  /** Collapsed silently: identical wording, kind and location. */
  duplicatesRemoved: DuplicateFlag[];
  /** Kept in the list AND flagged: similar enough to check, not to merge. */
  possibleDuplicates: DuplicateFlag[];
  /** The same repair carrying different counts on different pages. */
  quantityConflicts: QuantityConflict[];
}

/**
 * Comparison form. Deliberately shallow: lowercase, strip punctuation, collapse
 * whitespace, and normalise the small number words that actually show up on
 * these forms. Anything cleverer (stemming, synonyms) starts merging repairs
 * that are not the same repair, which is the failure this file is built to
 * avoid.
 */
const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join(" ");
}

function normalizeLocation(loc?: string): string {
  return loc ? normalize(loc) : "";
}

/**
 * True when one description clearly restates the other - the RE-10 saying
 * "repair handrail" and the inspection report saying "repair loose handrail at
 * stairs per inspection".
 *
 * TOKEN SUBSET, NOT SUBSTRING. A substring test fails on exactly the case this
 * is for: real restatements interleave words ("repair LOOSE handrail"), so
 * "repair handrail" never appears contiguously in the longer line. Asking
 * whether every word of the shorter description appears somewhere in the
 * longer one matches how people actually restate a repair.
 *
 * Still no fuzzy scoring. A similarity threshold is the kind of knob that
 * silently deletes scope once it drifts, and the consequence of a false
 * negative here is mild (two rows an estimator glances at) while a false
 * positive on a merge would be a repair nobody prices.
 */
function oneContainsOther(a: string, b: string): boolean {
  if (a === b) return false;
  const aTokens = a.split(" ").filter(Boolean);
  const bTokens = b.split(" ").filter(Boolean);
  const [shorter, longer] = aTokens.length <= bTokens.length ? [aTokens, bTokens] : [bTokens, aTokens];
  // A single shared word is not a restatement; it is a coincidence.
  if (shorter.length < 2) return false;
  const longerSet = new Set(longer);
  return shorter.every((t) => longerSet.has(t));
}

export function mergeRe10Chunks(contributions: Re10ChunkContribution[]): MergedRe10Result {
  const duplicatesRemoved: DuplicateFlag[] = [];
  const possibleDuplicates: DuplicateFlag[] = [];
  const quantityConflicts: QuantityConflict[] = [];

  interface Entry {
    repair: ExtractedRepair;
    labels: string[];
    normVerbatim: string;
    normLocation: string;
  }

  const kept: Entry[] = [];

  for (const c of contributions) {
    for (const repair of c.result.repairs ?? []) {
      const entry: Entry = {
        repair,
        labels: [...c.pageLabels],
        normVerbatim: normalize(repair.verbatim),
        normLocation: normalizeLocation(repair.location),
      };

      /* An unambiguous repeat: same trade item, same place, same words. This is
         the RE-10 and its cited inspection report describing one repair. */
      const exact = kept.find(
        (k) =>
          k.repair.kind === entry.repair.kind &&
          k.normLocation === entry.normLocation &&
          k.normVerbatim === entry.normVerbatim,
      );

      if (exact) {
        const a = exact.repair.quantity;
        const b = entry.repair.quantity;
        if (typeof a === "number" && typeof b === "number" && a !== b) {
          /* Same repair, two counts. NOT summed - summing is precisely the
             duplicate-quantity error. The larger is carried so the estimate is
             not short, and the disagreement goes to a human. */
          quantityConflicts.push({
            verbatim: exact.repair.verbatim,
            quantities: [a, b],
            pageLabels: [...new Set([...exact.labels, ...entry.labels])],
          });
          exact.repair.quantity = Math.max(a, b);
        } else if (typeof b === "number" && typeof a !== "number") {
          // One pass read a count the other missed; the stated count wins.
          exact.repair.quantity = b;
        }

        // Keep whichever reading carries more provenance.
        if (!exact.repair.sourceRef && entry.repair.sourceRef) {
          exact.repair.sourceRef = entry.repair.sourceRef;
        }
        if (!exact.repair.location && entry.repair.location) {
          exact.repair.location = entry.repair.location;
        }
        /* A review flag from ANY pass sticks. If one pass saw something that
           needs an onsite look, another pass not noticing does not clear it. */
        if (!exact.repair.needsReview && entry.repair.needsReview) {
          exact.repair.needsReview = entry.repair.needsReview;
        }
        exact.labels = [...new Set([...exact.labels, ...entry.labels])];

        duplicatesRemoved.push({
          verbatim: entry.repair.verbatim,
          pageLabels: entry.labels,
          reason: "Identical repair already captured from another page.",
        });
        continue;
      }

      /* Similar but not identical. BOTH are kept - see the header note on why
         the asymmetry runs this way - and the pair is flagged so an estimator
         confirms rather than the software deciding. */
      const similar = kept.find(
        (k) =>
          k.repair.kind === entry.repair.kind &&
          k.normLocation === entry.normLocation &&
          oneContainsOther(k.normVerbatim, entry.normVerbatim),
      );
      if (similar) {
        possibleDuplicates.push({
          verbatim: entry.repair.verbatim,
          pageLabels: [...new Set([...similar.labels, ...entry.labels])],
          reason: `May restate "${similar.repair.verbatim}". Both are listed; confirm before pricing.`,
        });
      }

      kept.push(entry);
    }
  }

  /* Unmapped text is deduplicated on wording alone: it carries no kind or
     location to distinguish two entries, so identical text is one finding. */
  const unmappedSeen = new Set<string>();
  const unmapped: UnmappedItem[] = [];
  for (const c of contributions) {
    for (const item of c.result.unmapped ?? []) {
      const key = normalize(item.verbatim);
      if (!key || unmappedSeen.has(key)) continue;
      unmappedSeen.add(key);
      unmapped.push(item);
    }
  }

  /* Scalars: first stated value wins. These are identifiers rather than
     quantities, so a later pass restating them adds nothing. */
  const firstStated = <K extends keyof ExtractionResult>(key: K): ExtractionResult[K] | undefined => {
    for (const c of contributions) {
      const v = c.result[key];
      if (v !== null && v !== undefined && v !== "") return v as ExtractionResult[K];
    }
    return undefined;
  };

  return {
    result: {
      ...contributions[0]?.result,
      repairs: kept.map((k) => k.repair),
      unmapped,
      propertyAddress: firstStated("propertyAddress") ?? null,
    } as ExtractionResult,
    duplicatesRemoved,
    possibleDuplicates,
    quantityConflicts,
  };
}

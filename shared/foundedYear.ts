/**
 * Recorded founding year. Idaho SOS shows P5 Home Co. LLC filed 09/25/2025,
 * so nothing published here backs 2020. The year stays in the repo. It is
 * omitted from pages, schema, and generated copy while this flag is false.
 */
export const FOUNDED_YEAR = '2020';
export const SHOW_FOUNDED_YEAR = false;

/** ", founded in 2020" when the claim may be published, otherwise nothing. */
export function foundedInClause(): string {
  return SHOW_FOUNDED_YEAR ? `, founded in ${FOUNDED_YEAR}` : '';
}

/**
 * "Name has worked in Treasure Valley residential construction since 2020. "
 * when the claim may be published, otherwise nothing.
 */
export function sinceFoundedLead(name = 'Boise Construction Co'): string {
  return SHOW_FOUNDED_YEAR
    ? `${name} has worked in Treasure Valley residential construction since ${FOUNDED_YEAR}. `
    : '';
}

/** "Est. 2020" when the claim may be published. */
export function establishedLabel(): string | null {
  return SHOW_FOUNDED_YEAR ? `Est. ${FOUNDED_YEAR}` : null;
}

/** "Founded in 2020. " when the claim may be published. */
export function foundedSentence(): string {
  return SHOW_FOUNDED_YEAR ? `Founded in ${FOUNDED_YEAR}. ` : '';
}

/** " since 2020" when the claim may be published. */
export function sinceFoundedYear(): string {
  return SHOW_FOUNDED_YEAR ? ` since ${FOUNDED_YEAR}` : '';
}

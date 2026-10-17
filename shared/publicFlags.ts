/**
 * Public copy gates. Both default off so unpublished claims stay out of
 * rendered pages, schema, and feeds. The original wording stays in
 * FOUNDING_YEAR_COPY.shown.
 */
export const SHOW_FOUNDING_YEAR = false;

export const FOUNDING_YEAR_COPY = {
  shown: {
    idahoBuilder:
      'Boise Construction Co is a design-build home builder in Boise, Idaho, founded in 2020.',
    valleyWork:
      'Boise Construction Co has worked in Treasure Valley residential construction since 2020.',
    schemaDescription:
      'Design-build home builder serving the Treasure Valley since 2020. Custom homes, semi-custom homes, builds on client-owned land, and shop homes. Bonded, insured, and committed to line-item budgets before construction.',
    gbpFoundedSentence: 'Founded in 2020. ',
    llmsFoundedClause: ', founded 2020',
    llmsSinceClause: ' since 2020',
    foundedLine: 'Founded: 2020',
    aboutDurationQuestion: 'How long has Boise Construction Co built in the Treasure Valley?',
  },
  hidden: {
    idahoBuilder: 'Boise Construction Co is a design-build home builder in Boise, Idaho.',
    valleyWork: 'Boise Construction Co works in Treasure Valley residential construction.',
    schemaDescription:
      'Design-build home builder serving the Treasure Valley. Custom homes, semi-custom homes, builds on client-owned land, and shop homes. Bonded, insured, and committed to line-item budgets before construction.',
    gbpFoundedSentence: '',
    llmsFoundedClause: '',
    llmsSinceClause: '',
    foundedLine: '',
    aboutDurationQuestion: 'Who leads a Boise Construction Co build in the Treasure Valley?',
  },
} as const;

export const FOUNDING = SHOW_FOUNDING_YEAR ? FOUNDING_YEAR_COPY.shown : FOUNDING_YEAR_COPY.hidden;

/** Circular seal carries EST 2020. The small icon does not. */
export const SEAL_LOGO_PATH = '/brand/png/seal/any/boise-construction-co-seal-on-charcoal-accent-512px.png';
export const YEAR_FREE_ICON_PATH = '/brand/png/icon/boise-construction-co-icon-charcoal-512px.png';
export const PUBLIC_MARK_PATH = SHOW_FOUNDING_YEAR ? SEAL_LOGO_PATH : YEAR_FREE_ICON_PATH;

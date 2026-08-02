/**
 * The RE-10 estimator funnel, as named events.
 *
 * WHY A CONSTANT AND NOT A STRING LITERAL AT EACH CALL SITE. A funnel is only
 * useful if the names are stable: rename `re10_document_uploaded` to
 * `re10_upload` six months from now and the historic drop-off data becomes two
 * unrelated series with no error anywhere to tell you. Every name lives here,
 * once, and the call sites reference it.
 *
 * The set is the one the brief asked for, in funnel order, so a report can be
 * built by walking this array rather than by remembering which events exist.
 */
export const RE10_EVENTS = {
  /** The wizard became visible and interactive. */
  started: "re10_estimator_started",
  /** Files chosen, before analysis runs. */
  documentUploaded: "re10_document_uploaded",
  /** Analysis returned a repair list. */
  analysisCompleted: "re10_analysis_completed",
  /** Analysis failed or was unavailable. Not in the brief; the drop-off it
   *  explains would otherwise look like the homeowner losing interest. */
  analysisFailed: "re10_analysis_failed",
  /** The homeowner accepted the repair list and moved to the contact step. */
  repairsConfirmed: "re10_repairs_confirmed",
  /** The contact step rendered. The denominator for gate abandonment. */
  contactViewed: "re10_contact_viewed",
  /** Contact details submitted. */
  contactSubmitted: "re10_contact_submitted",
  /** A range was produced and shown. */
  estimateGenerated: "re10_estimate_generated",
  /** The customer copy was sent. */
  estimateEmailed: "re10_estimate_emailed",
  /** Onsite evaluation requested from the result screen. */
  onsiteRequested: "re10_onsite_requested",
  /** Phone tapped anywhere on the RE-10 page. */
  phoneClicked: "re10_phone_clicked",
  /** Text tapped anywhere on the RE-10 page. */
  textClicked: "re10_text_clicked",
  /** More documents added after a first pass. */
  additionalDocuments: "re10_additional_documents",
} as const;

export type Re10EventName = (typeof RE10_EVENTS)[keyof typeof RE10_EVENTS];

/**
 * Funnel order, for building a drop-off report without hand-listing stages.
 *
 * Deliberately excludes the branch events (failure, phone, text, extra
 * documents): they are real signals but they are not stages, and folding them
 * into the funnel would make the conversion denominators wrong.
 */
export const RE10_FUNNEL_ORDER: Re10EventName[] = [
  RE10_EVENTS.started,
  RE10_EVENTS.documentUploaded,
  RE10_EVENTS.analysisCompleted,
  RE10_EVENTS.repairsConfirmed,
  RE10_EVENTS.contactViewed,
  RE10_EVENTS.contactSubmitted,
  RE10_EVENTS.estimateGenerated,
  RE10_EVENTS.estimateEmailed,
];

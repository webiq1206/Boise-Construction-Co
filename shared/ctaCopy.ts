/** Sitewide conversion copy; keep primary/secondary CTAs consistent. */
/**
 * Owner decision, 13 November 2026: the family's central estimator, framed at
 * /instant-estimate, is the primary pricing call to action. It gives an
 * on-screen preliminary range, so "instant estimate" is accurate. It is never
 * called a quote, a bid or a final price. Destinations and the service to
 * project mapping live in shared/instantEstimate.ts.
 */
/** In-page primary buttons. */
export const CTA_PRIMARY = "Get an instant estimate";
/** Header, mobile menu and bottom bar: short, it has to fit the header. */
export const CTA_PRIMARY_SHORT = "Instant estimate";
export const CTA_SECONDARY = "Schedule a consultation";
export const CTA_SECONDARY_ALT = "Schedule a free consultation";
/** The path to a person: the quote request form at /estimate (no price shown). */
export const CTA_QUOTE = "Request a quote";

/** Send label on the one-screen quote form (owner, 1 November: plain words). */
export const CTA_FORM_SEND = "Send my request";
/** Send label when the visitor switched on "Have us call you". */
export const CTA_FORM_CALLBACK = "Request a call";
/** @deprecated Superseded by the single-step CTA_FORM_SEND. */
export const CTA_FORM_REVIEW = "Review my request";
/** @deprecated Superseded by the single-step CTA_FORM_SEND. */
export const CTA_FORM_CONFIRM = "Confirm and send";

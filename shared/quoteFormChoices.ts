/**
 * Choices on the quote form, shared by the browser and the server so the
 * internal email and CRM notes print the same words the visitor tapped.
 */

/** Project type values are the ones the form always sent, so CRM and P5 mapping is unchanged. */
export const PROJECT_CHOICES = [
  { value: "custom-home", label: "Custom home" },
  { value: "semi-custom-home", label: "Semi-custom home" },
  { value: "build-on-my-lot", label: "Build on my lot" },
  { value: "shop-home", label: "Shop home" },
  { value: "looking-for-land", label: "Still looking for land" },
  { value: "addition", label: "Home addition" },
  { value: "plans-only", label: "Home design and plans" },
  { value: "lot-evaluation", label: "Lot evaluation" },
  { value: "other", label: "Other or not sure yet" },
] as const;

export const PROJECT_LABEL_LOOKUP: Readonly<Record<string, string>> = Object.fromEntries(
  PROJECT_CHOICES.map((o) => [o.value, o.label]),
);

export const TIMING_CHOICES = ["Soon", "1 to 3 months", "3 to 6 months", "Just planning"] as const;
export type TimingChoice = (typeof TIMING_CHOICES)[number];

export const BEST_TIMES = ["Morning", "Midday", "Afternoon", "Evening"] as const;

"use client";

import { cn } from "@/lib/utils";

export interface WizardStepProps {
  /** Short, descriptive heading (the step's one clear purpose). */
  heading: React.ReactNode;
  /** One or two lines telling the user exactly what to do. */
  instructions?: React.ReactNode;
  /** Optional eyebrow above the heading (section/category name). */
  eyebrow?: string;
  children: React.ReactNode;
  tone?: "inverse" | "default";
  className?: string;
  /** Marks the heading as an h2 (default) or h3. */
  as?: "h2" | "h3";
  /**
   * One-screen mode: the frame header already carries the eyebrow, so it is
   * dropped here; the heading and instruction tighten so the controls get the
   * height.
   */
  compact?: boolean;
  "data-testid"?: string;
}

/**
 * The consistent shell every step wears: eyebrow, a single clear heading, a
 * short instruction, then the step's content. Keeping this identical across
 * both estimators is what makes them feel like one product rather than two
 * forms that happen to share a colour scheme.
 */
export function WizardStep({
  heading,
  instructions,
  eyebrow,
  children,
  tone = "default",
  className,
  as = "h2",
  compact = false,
  "data-testid": testId,
}: WizardStepProps) {
  const inverse = tone === "inverse";
  const Heading = as;

  return (
    <div className={cn(className)} data-testid={testId}>
      {eyebrow && !compact && (
        <p
          className={cn(
            "brc-label mb-3",
            inverse ? "text-inverse-muted" : "text-muted-foreground",
          )}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "font-serif tracking-tight",
          compact ? "text-[1.375rem] leading-tight md:text-[1.75rem]" : as === "h2" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
          inverse ? "text-inverse-foreground" : "text-foreground",
        )}
      >
        {heading}
      </Heading>
      {instructions && (
        <p
          className={cn(
            compact ? "mt-1.5 text-[0.8125rem] leading-snug" : "mt-3 text-sm leading-relaxed",
            inverse ? "text-inverse-foreground/80" : "text-muted-foreground",
          )}
        >
          {instructions}
        </p>
      )}
      <div className={compact ? "mt-4" : "mt-6"}>{children}</div>
    </div>
  );
}

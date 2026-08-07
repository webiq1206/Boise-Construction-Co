"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepMeta {
  /** Stable id for the step. */
  id: string;
  /** Short label shown in the progress rail (e.g. "Your details"). */
  label: string;
}

export interface WizardProgressProps {
  steps: WizardStepMeta[];
  /** Zero-based index of the current step within `steps`. */
  currentIndex: number;
  /** "inverse" for dark bands, "default" for light surfaces. */
  tone?: "inverse" | "default";
  className?: string;
}

/**
 * Dynamic orientation for a guided flow: where you are, how many steps apply,
 * and how much is left. The step count is derived from `steps`, so a flow that
 * grows or shrinks with earlier answers updates here for free.
 *
 * The bar is an accessible progressbar; the rail beneath it names each step so
 * "Step 3 of 5" is never shown without saying what step 3 is. On narrow phones
 * the rail collapses to the current step plus a count to avoid wrapping.
 */
export function WizardProgress({
  steps,
  currentIndex,
  tone = "default",
  className,
}: WizardProgressProps) {
  const total = steps.length;
  const clamped = Math.min(Math.max(currentIndex, 0), Math.max(total - 1, 0));
  const current = steps[clamped];
  const humanStep = clamped + 1;
  const pct = total > 0 ? Math.round((humanStep / total) * 100) : 0;

  const inverse = tone === "inverse";
  const muted = inverse ? "text-inverse-muted" : "text-muted-foreground";
  const strong = inverse ? "text-inverse-foreground" : "text-foreground";
  const trackBg = inverse ? "bg-inverse-foreground/15" : "bg-foreground/10";

  return (
    <div className={cn("mb-7", className)} data-testid="wizard-progress">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className={cn("text-[12px] tracking-[0.08em] uppercase", strong)}>
          <span className="brc-display-num">{humanStep}</span>
          <span className={muted}> of </span>
          <span className="brc-display-num">{total}</span>
          <span className={cn("mx-2", muted)} aria-hidden="true">
            &middot;
          </span>
          {current?.label}
        </p>
        <p className={cn("text-[11px] tabular-nums", muted)} aria-hidden="true">
          {pct}%
        </p>
      </div>

      {/* The accessible source of truth. The visual rail below is decorative. */}
      <div
        role="progressbar"
        aria-label="Estimator progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={humanStep}
        aria-valuetext={`Step ${humanStep} of ${total}: ${current?.label ?? ""}`}
        className={cn("h-1.5 w-full overflow-hidden rounded-full", trackBg)}
      >
        <div
          className="h-full rounded-full bg-accent-legible transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Named steps. Announced politely so a screen reader hears the change of
          step without the bar's raw percentage. */}
      <ol
        className="mt-2.5 hidden flex-wrap gap-x-2 gap-y-1 sm:flex"
        aria-hidden="true"
      >
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "flex items-center text-[11px] tracking-[0.06em] uppercase",
              i === clamped
                ? strong
                : i < clamped
                  ? "text-accent-legible"
                  : /* Plain muted, no opacity dim: the muted tone alone sits at
                       ~6:1 (AA), while dimming it to 60% fell to ~3.6:1 at 11px.
                       De-emphasis still reads via the strong current step and
                       the ochre check on completed ones. */
                    muted,
            )}
          >
            {i > 0 && (
              <span className={cn("mr-2", muted)} aria-hidden="true">
                /
              </span>
            )}
            {i < clamped && <Check className="mr-1 h-3 w-3" aria-hidden="true" />}
            {s.label}
          </li>
        ))}
      </ol>

      <p className="sr-only" aria-live="polite">
        Step {humanStep} of {total}: {current?.label}
      </p>
    </div>
  );
}

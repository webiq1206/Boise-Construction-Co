"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type Tone = "inverse" | "default";

const inputBase =
  "w-full min-h-12 rounded-sm border px-3.5 text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-legible";

function toneInput(tone: Tone) {
  return tone === "inverse"
    ? "border-inverse-foreground/25 bg-inverse-foreground/5 text-inverse-foreground placeholder:text-inverse-muted/60"
    : "border-border bg-card text-foreground placeholder:text-muted-foreground/60";
}

function toneLabel(tone: Tone) {
  return tone === "inverse" ? "text-inverse-muted" : "text-muted-foreground";
}

function toneError(tone: Tone) {
  return tone === "inverse" ? "text-red-300" : "text-destructive";
}

export interface WizardFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  tone?: Tone;
  /** Optional explicit id (otherwise generated). */
  fieldId?: string;
}

/**
 * A labelled text input with inline, field-level error messaging wired up for
 * assistive tech via `aria-invalid` and `aria-describedby`. Errors sit right
 * under the field they describe, in plain language, and the input keeps its
 * value through validation - the caller never clears it.
 */
export const WizardField = forwardRef<HTMLInputElement, WizardFieldProps>(
  function WizardField(
    { label, hint, error, required, tone = "default", fieldId, className, ...rest },
    ref,
  ) {
    const generated = useId();
    const id = fieldId ?? generated;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className={cn("min-w-0", className)}>
        <label htmlFor={id} className={cn("mb-1.5 block text-[12.5px]", toneLabel(tone))}>
          {label}
          {required && <span className="text-accent-legible"> *</span>}
        </label>
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            inputBase,
            toneInput(tone),
            error && "border-red-400 ring-1 ring-red-400/60",
          )}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className={cn("mt-1.5 text-[12px] leading-snug", toneLabel(tone))}>
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            className={cn("mt-1.5 text-[12.5px] leading-snug", toneError(tone))}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

export interface WizardTextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: React.ReactNode;
  tone?: Tone;
  fieldId?: string;
}

export function WizardTextArea({
  label,
  hint,
  tone = "default",
  fieldId,
  className,
  ...rest
}: WizardTextAreaProps) {
  const generated = useId();
  const id = fieldId ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={cn("mb-1.5 block text-[12.5px]", toneLabel(tone))}>
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        className={cn(
          "w-full rounded-sm border px-3.5 py-3 text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-legible",
          toneInput(tone),
        )}
        {...rest}
      />
      {hint && (
        <p id={hintId} className={cn("mt-1.5 text-[12px] leading-snug", toneLabel(tone))}>
          {hint}
        </p>
      )}
    </div>
  );
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

export interface WizardChoiceGroupProps<T extends string> {
  label: string;
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T;
  onChange: (v: T) => void;
  tone?: Tone;
  className?: string;
}

/**
 * A segmented, single-select control. Preferred over a dropdown whenever the
 * choices are few and worth seeing at a glance, per the input brief. Rendered
 * as a radiogroup so arrow keys and screen readers behave; selection is shown
 * with a border and a tinted ground, never colour alone.
 */
export function WizardChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  tone = "default",
  className,
}: WizardChoiceGroupProps<T>) {
  const inverse = tone === "inverse";
  return (
    <div className={cn("min-w-0", className)}>
      <span className={cn("mb-1.5 block text-[12.5px]", toneLabel(tone))}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-11 flex-1 rounded-sm border px-3 text-[14px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible",
                selected
                  ? "border-accent-legible bg-accent-legible/10 " +
                      (inverse ? "text-inverse-foreground" : "text-foreground")
                  : inverse
                    ? "border-inverse-foreground/25 text-inverse-muted hover:text-inverse-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

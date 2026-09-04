"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectableCardProps {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Controls the ARIA role so the group reads correctly to assistive tech. */
  control?: "radio" | "checkbox" | "button";
  disabled?: boolean;
  tone?: "inverse" | "default";
  /**
   * One-screen steps: a shorter card with tighter padding whose description
   * shows only from `sm` up, so a two-column grid of eight fits a phone.
   */
  dense?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}

/**
 * A large, thumb-friendly choice card. The selected state is signalled three
 * ways at once - an accent border, a tinted ground, and a checkmark badge - so
 * it never depends on colour alone, per the accessibility brief. Minimum height
 * is 56px with generous padding so it clears the 44px touch-target floor even
 * on a small phone.
 */
export function SelectableCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  control = "button",
  disabled = false,
  tone = "default",
  dense = false,
  className,
  "data-testid": testId,
  "aria-label": ariaLabel,
}: SelectableCardProps) {
  const inverse = tone === "inverse";

  const ariaProps =
    control === "radio"
      ? { role: "radio" as const, "aria-checked": selected }
      : control === "checkbox"
        ? { role: "checkbox" as const, "aria-checked": selected }
        : { "aria-pressed": selected };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      data-testid={testId}
      data-selected={selected ? "true" : "false"}
      aria-label={ariaLabel}
      {...ariaProps}
      className={cn(
        dense
          ? "group relative flex min-h-12 w-full items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left transition-colors"
          : "group relative flex min-h-14 w-full items-center gap-3 rounded-sm border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible focus-visible:ring-offset-2",
        inverse
          ? "focus-visible:ring-offset-[hsl(var(--inverse))]"
          : "focus-visible:ring-offset-background",
        disabled && "cursor-not-allowed opacity-50",
        selected
          ? inverse
            ? "border-accent-legible bg-accent-legible/10"
            : "border-accent-legible bg-accent-legible/10"
          : inverse
            ? "border-inverse-foreground/20 bg-inverse-foreground/[0.04] hover:border-inverse-foreground/40"
            : "border-border bg-card hover:border-foreground/30",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            dense ? "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm [&_svg]:h-4 [&_svg]:w-4" : "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm [&_svg]:h-5 [&_svg]:w-5",
            inverse ? "text-inverse-foreground/80" : "text-foreground/70",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            dense ? "block text-[0.9375rem] leading-tight" : "block text-base leading-tight",
            inverse ? "text-inverse-foreground" : "text-foreground",
          )}
        >
          {title}
        </span>
        {description && (
          <span
            className={cn(
              "mt-1 block text-caption leading-snug",
              dense && "hidden sm:block",
              inverse ? "text-inverse-muted" : "text-muted-foreground",
            )}
          >
            {description}
          </span>
        )}
      </span>

      {/* The badge is the non-colour signal: an outlined circle when unselected,
          a filled tick when selected. Present in both states so its arrival is
          what the eye catches, not a hue change. */}
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-accent-legible bg-accent-legible text-[hsl(var(--inverse))]"
            : inverse
              ? "border-inverse-foreground/30"
              : "border-foreground/25",
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

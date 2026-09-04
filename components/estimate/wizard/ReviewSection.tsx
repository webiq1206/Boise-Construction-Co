"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewSectionProps {
  title: string;
  /** Called when the user taps Edit; should return them to the relevant step. */
  onEdit?: () => void;
  editLabel?: string;
  children: React.ReactNode;
  tone?: "inverse" | "default";
  /**
   * One-screen review: a single hairline row - title, value, Edit - instead of
   * a padded card. Thirteen cards ran 874px past a phone's frame body; thirteen
   * rows fit.
   */
  compact?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * One titled block on a review screen, with a clear Edit action that jumps
 * straight back to the step that owns this information. Editing one section
 * must never cost the user anything they entered elsewhere, so the Edit handler
 * only changes the step - all answers live in the wizard's own state.
 */
export function ReviewSection({
  title,
  onEdit,
  editLabel = "Edit",
  children,
  tone = "default",
  compact = false,
  className,
  "data-testid": testId,
}: ReviewSectionProps) {
  const inverse = tone === "inverse";
  if (compact) {
    return (
      <section
        data-testid={testId}
        className={cn(
          "flex items-center justify-between gap-3 border-b py-1",
          inverse ? "border-inverse-foreground/12" : "border-border",
          className,
        )}
      >
        {/* One line per answer: the title as a muted prefix, the value after it.
            Two lines per row put thirteen rows 69px past a phone body. */}
        <div className={cn("min-w-0 truncate text-[0.875rem] leading-snug", inverse ? "text-inverse-foreground" : "text-foreground")}>
          <span className={cn("mr-2 text-[0.625rem] uppercase tracking-[0.14em]", inverse ? "text-inverse-muted" : "text-muted-foreground")}>{title}</span>
          {children}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm px-2 text-[0.8125rem] text-accent-legible hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
            data-testid={testId ? `${testId}-edit` : undefined}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {editLabel}
          </button>
        )}
      </section>
    );
  }
  return (
    <section
      data-testid={testId}
      className={cn(
        "rounded-sm border p-4",
        inverse
          ? "border-inverse-foreground/15 bg-inverse-foreground/[0.05]"
          : "border-border bg-card",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3
          className={cn(
            "text-caption tracking-[0.08em] uppercase",
            inverse ? "text-inverse-foreground" : "text-foreground",
          )}
        >
          {title}
        </h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 -mr-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible",
              "text-accent-legible hover:underline",
            )}
            data-testid={testId ? `${testId}-edit` : undefined}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {editLabel}
          </button>
        )}
      </div>
      <div
        className={cn(
          "text-sm leading-relaxed",
          inverse ? "text-inverse-foreground/85" : "text-muted-foreground",
        )}
      >
        {children}
      </div>
    </section>
  );
}

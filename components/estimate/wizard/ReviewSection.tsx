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
  className,
  "data-testid": testId,
}: ReviewSectionProps) {
  const inverse = tone === "inverse";
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
            "text-[12px] tracking-[0.08em] uppercase",
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
              "inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 -mr-2 text-[13px] transition-colors",
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
          "text-[13.5px] leading-relaxed",
          inverse ? "text-inverse-foreground/85" : "text-muted-foreground",
        )}
      >
        {children}
      </div>
    </section>
  );
}

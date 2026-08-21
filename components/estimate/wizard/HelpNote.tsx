"use client";

import { useId, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HelpNoteProps {
  /** The trigger text, e.g. "Not sure what to send?" */
  label: string;
  children: React.ReactNode;
  tone?: "inverse" | "default";
  className?: string;
  "data-testid"?: string;
}

/**
 * Progressive disclosure for supporting guidance: examples, definitions, "why
 * we ask". Collapsed by default so it never pushes the primary controls below
 * the fold, expandable inline with a proper button/region pairing for keyboard
 * and screen-reader users.
 */
export function HelpNote({
  label,
  children,
  tone = "default",
  className,
  "data-testid": testId,
}: HelpNoteProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const inverse = tone === "inverse";

  return (
    <div className={cn("mt-3", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        data-testid={testId}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible focus-visible:ring-offset-2 rounded-sm",
          inverse
            ? "text-accent-legible focus-visible:ring-offset-[hsl(var(--inverse))]"
            : "text-accent-legible focus-visible:ring-offset-background",
        )}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        {label}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={id}
          className={cn(
            "mt-2 rounded-sm border p-3.5 text-sm leading-relaxed",
            inverse
              ? "border-inverse-foreground/15 bg-inverse-foreground/[0.05] text-inverse-foreground/85"
              : "border-border bg-surface-greige text-muted-foreground",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

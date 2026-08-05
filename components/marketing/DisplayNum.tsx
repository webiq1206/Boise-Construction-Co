import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type DisplayNumProps = HTMLAttributes<HTMLSpanElement>;

/** Libre Baskerville display numerals for prominent numbers (stats, prices, step markers). */
export function DisplayNum({ className, children, ...props }: DisplayNumProps) {
  return (
    <span className={cn("brc-display-num tabular-nums", className)} {...props}>
      {children}
    </span>
  );
}

/** Zero-padded step index for process lists (01, 02, …). */
export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

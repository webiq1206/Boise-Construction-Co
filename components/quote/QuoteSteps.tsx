import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The two steps, always in view above the quote form: step 1 is the request
 * itself (the only part anyone has to complete), step 2 is optional photos and
 * details. Once the request is saved, step 1 reads "Request sent" with a tick,
 * so nobody is left wondering whether the extra questions are still part of
 * sending it (owner, 11 November, after a client found a family form
 * confusing: "it just kept asking more questions").
 */
export function QuoteSteps({ sent, tone }: { sent: boolean; tone: "inverse" | "default" }) {
  const inverse = tone === "inverse";
  const text = inverse ? "text-inverse-foreground" : "text-foreground";
  const muted = inverse ? "text-inverse-muted" : "text-muted-foreground";
  const badge = "flex h-6 w-6 flex-none items-center justify-center rounded-sm border text-xs font-semibold";
  const filled = inverse ? "border-[#fbfaf6] bg-[#fbfaf6] text-[#2c302f]" : "border-foreground bg-foreground text-background";
  const outline = inverse ? "border-inverse-foreground" : "border-foreground";
  const faint = inverse ? "border-inverse-foreground/40" : "border-foreground/40";
  return (
    <ol
      className="flex w-full flex-col gap-x-3 gap-y-1.5 text-sm sm:flex-row sm:flex-wrap sm:items-center"
      data-testid="quote-steps"
      data-quote-sent={sent ? "true" : "false"}
    >
      <li aria-current={sent ? undefined : "step"} className={cn("flex items-center gap-2 font-medium", text)}>
        <span className={cn(badge, filled)} aria-hidden="true">
          {sent ? <Check className="h-3.5 w-3.5" /> : "1"}
        </span>
        <span>
          <span className="sr-only">Step 1: </span>
          {sent ? "Request sent" : "Your request"}
        </span>
      </li>
      <li aria-current={sent ? "step" : undefined} className={cn("flex items-center gap-2", sent ? cn("font-medium", text) : muted)}>
        <span className={cn("hidden h-px w-5 sm:block", inverse ? "bg-inverse-foreground/30" : "bg-foreground/30")} aria-hidden="true" />
        <span className={cn(badge, sent ? outline : faint)} aria-hidden="true">
          2
        </span>
        <span>
          <span className="sr-only">Step 2: </span>
          Photos and details (optional)
        </span>
      </li>
    </ol>
  );
}

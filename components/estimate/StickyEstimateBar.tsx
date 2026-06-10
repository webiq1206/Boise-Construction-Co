"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ADAPTIVE_GLASS_ATTR,
  ADAPTIVE_GLASS_BAR_BASE,
  getAdaptiveGlassClasses,
} from "@/components/marketing/adaptiveGlassTheme";
import { useAdaptiveGlassTheme } from "@/hooks/useAdaptiveGlassTheme";
import { AnimatedPrice } from "@/components/estimate/EstimateResultPanel";
import type { EstimateResult } from "@/shared/estimateEngine";

const SHEET_SCOPE_COUNT = 4;

export interface StickyEstimateBarProps {
  /**
   * inline: fixed to the bottom of the viewport (replaces the global mobile
   * nav bar while active). modal: sticky to the bottom of the dialog scroll
   * area so it never floats mid-page.
   */
  mode: "inline" | "modal";
  /** Inline only: whether the estimator section is currently on screen. */
  visible?: boolean;
  result: EstimateResult | null;
  /** Short selections summary, or a hint when nothing is selected yet. */
  summary: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
}

/**
 * Bottom-anchored estimate bar for mobile. Always pinned to the bottom of the
 * viewport (inline) or dialog (modal), safe-area aware, with a tap-to-expand
 * summary sheet once a planning range exists.
 */
export function StickyEstimateBar({
  mode,
  visible = true,
  result,
  summary,
  ctaLabel,
  ctaDisabled = false,
  onCta,
}: StickyEstimateBarProps) {
  const [expanded, setExpanded] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const isInline = mode === "inline";
  const glassTheme = useAdaptiveGlassTheme(barRef, { enabled: isInline && visible });
  const glass = getAdaptiveGlassClasses(isInline ? glassTheme : "onLight");

  // While the inline bar owns the bottom edge, hide the global Call/Text bar
  // instead of stacking two bars (modal visibility is handled by ModalProvider).
  useEffect(() => {
    if (!isInline || !visible) return;
    document.body.dataset.hideMobileNavBar = "true";
    return () => {
      delete document.body.dataset.hideMobileNavBar;
    };
  }, [isInline, visible]);

  // Collapse the sheet when the range goes away (e.g. user changed project).
  useEffect(() => {
    if (!result) setExpanded(false);
  }, [result]);

  if (isInline && !visible) return null;

  const sheetId = `estimate-bar-sheet-${mode}`;

  return (
    <div
      ref={barRef}
      {...(isInline ? { [ADAPTIVE_GLASS_ATTR]: "" } : {})}
      className={cn(
        isInline
          ? cn(ADAPTIVE_GLASS_BAR_BASE, "bottom-0 z-[120] lg:hidden", glass.bar)
          : "sticky bottom-0 z-20 -mx-6 -mb-6 mt-4 border-t border-border bg-background/97 backdrop-blur-md pb-safe md:hidden"
      )}
      data-testid="mobile-estimate-bar"
    >
      {expanded && result && (
        <div
          id={sheetId}
          className={cn(
            "px-4 pt-4 pb-2 border-b",
            isInline ? glass.divide : "border-border"
          )}
          data-testid="estimate-bar-sheet"
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p className={cn("text-[11px] uppercase tracking-wide", glass.textMuted)}>
              {summary}
            </p>
            <p className={cn("text-[11px]", glass.textMuted)}>{result.confidenceLabel}</p>
          </div>
          <ul className="space-y-1.5 mb-2">
            {result.included.slice(0, SHEET_SCOPE_COUNT).map((item) => (
              <li
                key={item}
                className={cn("flex items-start gap-2 text-xs leading-snug", glass.textMuted)}
              >
                <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className={cn("text-[10px] leading-snug", glass.textMuted)}>
            Planning estimate only, not a binding quote.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => result && setExpanded((prev) => !prev)}
          disabled={!result}
          aria-expanded={result ? expanded : undefined}
          aria-controls={result ? sheetId : undefined}
          className="min-w-0 flex-1 text-left min-h-11 flex items-center gap-2"
          data-testid="estimate-bar-toggle"
        >
          <span className="min-w-0">
            <span
              className={cn(
                "block text-[10px] uppercase tracking-wide truncate",
                glass.textMuted
              )}
            >
              {result ? summary : "Your planning range"}
            </span>
            {result ? (
              <span
                className={cn("block text-lg leading-tight brc-display-num tabular-nums", glass.text)}
                data-testid="mobile-estimate-range"
                aria-live="polite"
                aria-atomic="true"
              >
                <AnimatedPrice value={result.priceLow} />
                <span aria-hidden="true"> to </span>
                <AnimatedPrice value={result.priceHigh} />
              </span>
            ) : (
              <span
                className={cn("block text-sm leading-tight", glass.text)}
                data-testid="mobile-estimate-placeholder"
              >
                Make your selections to see it
              </span>
            )}
          </span>
          {result &&
            (expanded ? (
              <ChevronDown className={cn("h-4 w-4 flex-shrink-0", glass.textMuted)} />
            ) : (
              <ChevronUp className={cn("h-4 w-4 flex-shrink-0", glass.textMuted)} />
            ))}
        </button>

        <Button
          variant="brand"
          onClick={onCta}
          disabled={ctaDisabled}
          className="flex-shrink-0 px-5 py-2.5 text-xs"
          data-testid="mobile-button-book-visit"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { useKeyboardInset } from "./useKeyboardInset";

export interface WizardActionBarProps {
  /** Back handler. Omit (or pass undefined) to hide the Back control. */
  onBack?: () => void;
  backLabel?: string;
  /** Primary/Continue handler. */
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  /** When true, the primary button shows a spinner and is not clickable. */
  busy?: boolean;
  busyLabel?: string;
  /** Optional trailing icon on the primary button (default: arrow). */
  primaryIcon?: "arrow" | "none";
  /** Optional secondary control rendered between Back and Primary (e.g. Exit). */
  children?: React.ReactNode;
  tone?: "inverse" | "default";
  /** Hide the global mobile Call/Text bar while this bar owns the bottom edge. */
  ownsBottomEdge?: boolean;
  /**
   * Inside the one-screen AppFrame the frame's own footer is the bottom edge,
   * so the bar renders in flow: no sticky, no negative margins, no keyboard
   * translate (the frame is fixed and the keyboard shrinks it instead).
   */
  pinned?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * The one navigation pattern for every wizard step: a compact, always-reachable
 * bar pinned to the bottom of the flow. Back sits left and reads as secondary;
 * Continue sits right, fills the remaining width, and is unmistakably primary.
 *
 * It is `sticky`, not `fixed`, so it belongs to the wizard rather than floating
 * over the whole marketing page, and it clears the software keyboard by riding
 * the visual viewport up when a field is focused. Safe-area padding keeps it off
 * the iPhone home indicator.
 */
export function WizardActionBar({
  onBack,
  backLabel = "Back",
  onPrimary,
  primaryLabel,
  primaryDisabled = false,
  busy = false,
  busyLabel,
  primaryIcon = "arrow",
  children,
  tone = "default",
  ownsBottomEdge = true,
  pinned = true,
  className,
  "data-testid": testId = "wizard-action-bar",
}: WizardActionBarProps) {
  const keyboardInset = useKeyboardInset();

  // While the bar owns the bottom edge, hide the global Call/Text bar rather
  // than stacking two competing bars at the bottom of a phone.
  useEffect(() => {
    if (!ownsBottomEdge) return;
    return requestHideMobileNavBar();
  }, [ownsBottomEdge]);

  const inverse = tone === "inverse";

  return (
    <div
      data-testid={testId}
      data-wizard-action-bar=""
      style={pinned && keyboardInset > 0 ? { transform: `translateY(-${keyboardInset}px)` } : undefined}
      className={cn(
        pinned
          ? "sticky bottom-0 z-30 -mx-4 mt-5 sm:mt-8 border-t px-4 pb-safe pt-3 backdrop-blur-md transition-transform duration-150"
          : "pt-1",
        pinned && (inverse
          ? "border-inverse-foreground/15 bg-[hsl(var(--inverse))]/95"
          : "border-border bg-background/95"),
        className,
      )}
    >
      <div className={cn("mx-auto flex max-w-3xl items-center gap-3", pinned ? "pb-3" : "pb-2")}>
        {onBack ? (
          <Button
            type="button"
            variant={inverse ? "heroGhost" : "brandOutline"}
            onClick={onBack}
            disabled={busy}
            className="min-h-12 flex-shrink-0 px-4"
            data-testid="wizard-back"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Button>
        ) : null}

        {children}

        <Button
          type="button"
          variant="brand"
          onClick={onPrimary}
          disabled={primaryDisabled || busy}
          aria-busy={busy}
          className="min-h-12 flex-1 text-base"
          data-testid="wizard-continue"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {busyLabel ?? primaryLabel}
            </>
          ) : (
            <>
              {primaryLabel}
              {primaryIcon === "arrow" && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

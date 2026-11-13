"use client";

import { usePathname } from "next/navigation";
import { PrimaryCta } from "@/components/approved/PrimaryCta";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { INSTANT_ESTIMATE_PATH } from "@/shared/instantEstimate";

interface EstimateCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  onExtraClick?: () => void;
  /** Optional context for the cta_click event (e.g. "hero", "footer", "faq"). */
  trackingLocation?: string;
  /** A service page can retain a specific estimator starting point. */
  href?: string;
}

/**
 * The sitewide primary action. Owner decision, 13 November 2026: it opens the
 * family's central estimator, framed at /instant-estimate, on every page. It
 * used to scroll to /#calculator on the homepage and open the /estimate quote
 * form elsewhere; both are still there, linked as the secondary paths.
 */
export function EstimateCTA({ onExtraClick, children, trackingLocation, href: explicitHref, ...props }: EstimateCTAProps) {
  const pathname = usePathname();
  const href = explicitHref ?? INSTANT_ESTIMATE_PATH;

  /* The primary action on a page body is one component everywhere: the brand
     variant renders the shared PrimaryCta (charcoal on light, paper on dark)
     rather than the uppercase chrome button the header and mobile bar use. */
  if (props.variant === "brand" || props.variant === undefined) {
    return (
      <PrimaryCta
        href={href}
        className={props.className}
        trackingLocation={trackingLocation}
        onClick={onExtraClick}
        data-testid={(props as { "data-testid"?: string })["data-testid"]}
      >
        {children}
      </PrimaryCta>
    );
  }

  return (
    <Button {...props} asChild>
      <a
        href={href}
        onClick={() => {
          trackEvent("cta_click", { cta: "primary", location: trackingLocation ?? pathname });
          onExtraClick?.();
        }}
      >
        {children}
      </a>
    </Button>
  );
}

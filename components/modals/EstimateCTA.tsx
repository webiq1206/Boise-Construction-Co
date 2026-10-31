"use client";

import { usePathname } from "next/navigation";
import { PrimaryCta } from "@/components/approved/PrimaryCta";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

interface EstimateCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  onExtraClick?: () => void;
  /** Optional context for the cta_click event (e.g. "hero", "footer", "faq"). */
  trackingLocation?: string;
  /** A service page can retain a specific estimator starting point. */
  href?: string;
}

export function EstimateCTA({ onExtraClick, children, trackingLocation, href: explicitHref, ...props }: EstimateCTAProps) {
  const pathname = usePathname();
  const href = explicitHref ?? (pathname === "/" ? "/#calculator" : "/estimate");

  /* The primary action on a page body is one component everywhere: the brand
     variant renders the shared PrimaryCta (charcoal on light, paper on dark)
     rather than the uppercase chrome button the header and mobile bar use. */
  if (props.variant === "brand" || props.variant === undefined) {
    return (
      <PrimaryCta
        href={href}
        className={props.className}
        arrow={typeof children === "string"}
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

"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

interface EstimateCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  onExtraClick?: () => void;
  /** Optional context for the cta_click event (e.g. "hero", "footer", "faq"). */
  trackingLocation?: string;
}

export function EstimateCTA({ onExtraClick, children, trackingLocation, ...props }: EstimateCTAProps) {
  const pathname = usePathname();
  const href = pathname === "/" ? "/#calculator" : "/estimate";

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

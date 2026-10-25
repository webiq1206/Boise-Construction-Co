"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface NavEstimateButtonProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  /** Plain anchor styling for mobile sticky bar text links. */
  asLink?: boolean;
  className?: string;
  children: React.ReactNode;
  onExtraClick?: () => void;
  /** cta_click event location - "nav_desktop" | "nav_mobile_menu" | "mobile_sticky_bar". */
  trackingLocation?: string;
}

/**
 * Header and mobile-bar estimate entry: homepage scrolls to #calculator;
 * every other page goes to the dedicated /estimate page.
 */
export function NavEstimateButton({
  asLink = false,
  className,
  children,
  onExtraClick,
  trackingLocation,
  ...props
}: NavEstimateButtonProps) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const href = onHome ? "/#calculator" : "/estimate";
  const { variant: _v, size: _s, ...linkAttrs } = props as Record<string, unknown>;

  const handleClick = () => {
    trackEvent("cta_click", { cta: "primary", location: trackingLocation ?? "nav" });
    onExtraClick?.();
  };

  if (asLink) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        {...(linkAttrs as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <Button {...props} className={cn(className)} asChild>
      <a href={href} onClick={handleClick}>
        {children}
      </a>
    </Button>
  );
}

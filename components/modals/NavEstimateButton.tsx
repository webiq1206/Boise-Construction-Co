"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavEstimateButtonProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  /** Plain anchor styling for mobile sticky bar text links. */
  asLink?: boolean;
  className?: string;
  children: React.ReactNode;
  onExtraClick?: () => void;
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
  ...props
}: NavEstimateButtonProps) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const href = onHome ? "/#calculator" : "/estimate";
  const { variant: _v, size: _s, ...linkAttrs } = props as Record<string, unknown>;

  if (asLink) {
    return (
      <a
        href={href}
        className={className}
        onClick={onExtraClick}
        {...(linkAttrs as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <Button {...props} className={cn(className)} asChild>
      <a href={href} onClick={onExtraClick}>
        {children}
      </a>
    </Button>
  );
}

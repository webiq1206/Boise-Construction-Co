"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface EstimateCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  onExtraClick?: () => void;
}

export function EstimateCTA({ onExtraClick, children, ...props }: EstimateCTAProps) {
  const pathname = usePathname();
  const href = pathname === "/" ? "/#calculator" : "/estimate";

  return (
    <Button {...props} asChild>
      <a href={href} onClick={onExtraClick}>
        {children}
      </a>
    </Button>
  );
}

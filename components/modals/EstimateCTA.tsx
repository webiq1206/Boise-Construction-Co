"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { useModals } from "./modalsContext";

interface EstimateCTAProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  onExtraClick?: () => void;
}

export function EstimateCTA({ onExtraClick, children, ...props }: EstimateCTAProps) {
  const { openEstimate } = useModals();
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <Button {...props} asChild>
        <a href="/#calculator" onClick={onExtraClick}>
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button
      {...props}
      onClick={() => {
        openEstimate();
        onExtraClick?.();
      }}
    >
      {children}
    </Button>
  );
}

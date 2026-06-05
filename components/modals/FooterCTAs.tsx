"use client";

import { usePathname } from "next/navigation";
import { useModals } from "./modalsContext";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/shared/ctaCopy";

const cls =
  "text-sm text-inverse-muted hover:text-inverse-foreground transition-colors text-left";

export function FooterCTAs() {
  const { openConsult, openEstimate } = useModals();
  const isHome = usePathname() === "/";

  return (
    <>
      <li>
        {isHome ? (
          <a href="/#consult" className={cls}>
            {CTA_PRIMARY}
          </a>
        ) : (
          <button onClick={openConsult} className={cls}>
            {CTA_PRIMARY}
          </button>
        )}
      </li>
      <li>
        {isHome ? (
          <a href="/#calculator" className={cls}>
            {CTA_SECONDARY}
          </a>
        ) : (
          <button onClick={openEstimate} className={cls}>
            {CTA_SECONDARY}
          </button>
        )}
      </li>
    </>
  );
}

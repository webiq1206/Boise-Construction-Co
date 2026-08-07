"use client";

import { usePathname } from "next/navigation";
import { useModals } from "./modalsContext";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/shared/ctaCopy";
import { trackEvent } from "@/lib/analytics";

const cls =
  "text-sm text-inverse-muted hover:text-inverse-foreground transition-colors text-left";

export function FooterCTAs() {
  const { openConsult } = useModals();
  const isHome = usePathname() === "/";

  return (
    <>
      <li>
        {isHome ? (
          <a href="/#calculator" className={cls}>
            {CTA_PRIMARY}
          </a>
        ) : (
          <a href="/estimate" className={cls}>
            {CTA_PRIMARY}
          </a>
        )}
      </li>
      <li>
        {/* The anchor variant is tracked by ConversionTracking's delegated
            #consult branch; the modal button never navigates, so it reports
            its own secondary-CTA click. */}
        {isHome ? (
          <a href="/#consult" className={cls}>
            {CTA_SECONDARY}
          </a>
        ) : (
          <button
            onClick={() => {
              trackEvent("cta_click", { cta: "secondary", location: "footer_modal" });
              openConsult();
            }}
            className={cls}
          >
            {CTA_SECONDARY}
          </button>
        )}
      </li>
    </>
  );
}

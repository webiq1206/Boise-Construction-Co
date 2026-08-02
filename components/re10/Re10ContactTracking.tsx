"use client";

import { useEffect } from "react";
import { RE10_EVENTS } from "@/shared/re10/analyticsEvents";
import { trackEvent } from "@/lib/analytics";

/**
 * Phone and text taps anywhere on the RE-10 page.
 *
 * A delegated listener rather than an onClick on each anchor. The page has five
 * separate tel: and sms: links across the hero, the sticky mobile bar, the
 * footer CTA and the site chrome, and several of those are rendered by shared
 * components that other pages use too. Wiring handlers into them would either
 * miss the shared ones or fire RE-10 events from every other page.
 *
 * Capture phase, because a tel: link starts navigating immediately and a
 * bubble-phase handler can lose the race on mobile Safari.
 *
 * Renders nothing.
 */
export function Re10ContactTracking() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href^='tel:'], a[href^='sms:']") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      trackEvent(href.startsWith("sms:") ? RE10_EVENTS.textClicked : RE10_EVENTS.phoneClicked, {
        page: "re-10-repairs-boise",
      });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

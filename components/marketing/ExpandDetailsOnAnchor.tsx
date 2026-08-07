"use client";

import { useEffect } from "react";

/**
 * Companion to SectionedArticle's collapsible mode. In-page anchors (sidebar
 * TOC, jump chips, deep links) can target headings that live inside a closed
 * <details> section; without help the reader lands on a shut accordion - or,
 * for an h3 inside the hidden body, nowhere at all. This opens the target's
 * section before the browser scrolls, and re-scrolls after expansion so the
 * heading settles below the sticky header (scroll-margin-top does the offset).
 */
export function ExpandDetailsOnAnchor() {
  useEffect(() => {
    function openAndScroll(id: string) {
      const target = document.getElementById(id);
      if (!target) return;
      const details = target.closest("details");
      if (details && !details.open) {
        details.open = true;
        /* The layout shifts as the section expands - scroll after it settles.
           Instant, not smooth: this is a correction, not a transition. */
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        });
      }
    }

    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
      if (id) openAndScroll(id);
    }

    function onHashChange() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) openAndScroll(id);
    }

    // A deep link straight into a collapsed section.
    onHashChange();

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}

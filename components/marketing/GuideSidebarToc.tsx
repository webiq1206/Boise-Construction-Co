"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocHeading } from "@/lib/content-utils";

interface GuideSidebarTocProps {
  headings: TocHeading[];
}

/**
 * Sidebar table of contents with a reading-position indicator: the section
 * currently on screen is highlighted in the brand ochre, so a reader deep in
 * a long article always knows where they are and what comes next. Progressive
 * enhancement - without JS (or before hydration) it renders as plain links.
 */
export function GuideSidebarToc({ headings }: GuideSidebarTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings || headings.length < 2) return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    /* "Active" = the last heading that has scrolled up past the reading line
       (a band ~35% down the viewport). Positions are read fresh on every
       recompute: expanding a collapsed section reflows everything below it,
       so cached tops (an IntersectionObserver's entries included) go stale -
       an rAF-throttled scroll listener over ~a dozen rect reads is cheap and
       never lands one heading behind after a smooth anchor scroll settles. */
    const recompute = () => {
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
          current = el.id;
        }
      }
      setActiveId(current ?? els[0].id);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recompute();
      });
    };

    recompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [headings]);

  if (!headings || headings.length < 2) return null;

  return (
    <nav
      className="rounded-lg border border-border p-4 mb-4 max-h-[min(50vh,20rem)] overflow-y-auto"
      aria-label="Table of contents"
      data-testid="guide-toc"
    >
      <p className="text-xs font-normal uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      <ol className="space-y-1 text-sm">
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <li
              key={h.id}
              className={cn(
                h.level === 3 ? "ml-3 list-[circle]" : "list-decimal ml-4",
                active && "marker:text-accent-legible",
              )}
            >
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "leading-snug transition-colors",
                  active
                    ? "text-accent-legible"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

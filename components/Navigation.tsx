"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CTA_PRIMARY, CTA_PRIMARY_SHORT } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { useModals } from "@/components/modals/modalsContext";
import { useAdaptiveGlassTheme } from "@/hooks/useAdaptiveGlassTheme";
import {
  ADAPTIVE_GLASS_ATTR,
  ADAPTIVE_GLASS_BAR_BASE,
  getAdaptiveGlassClasses,
} from "@/components/marketing/adaptiveGlassTheme";

const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Our Work", href: "/testimonials" },
  { label: "Areas", href: "/areas" },
  { label: "About", href: "/about" },
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

function Logo({ hero }: { hero: boolean }) {
  return (
    <Link href="/" className="flex flex-col leading-none">
      <span
        className={cn(
          "font-sans text-[1.05rem] font-light tracking-tight transition-colors duration-300",
          hero ? "text-inverse-foreground" : "text-foreground"
        )}
      >
        Boise Remodeling{" "}
        <em className={cn("brc-accent transition-colors duration-300", hero ? "text-inverse-muted" : "text-accent")}>
          Co
        </em>
      </span>
      <span
        className={cn(
          "text-[9px] tracking-[0.15em] uppercase font-sans font-medium mt-0.5 transition-colors duration-300",
          hero ? "text-inverse-muted/80" : "text-muted-foreground"
        )}
      >
        Design &amp; Build
      </span>
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openConsult } = useModals();
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const bottomBarTheme = useAdaptiveGlassTheme(bottomBarRef);
  const bottomBarClasses = getAdaptiveGlassClasses(bottomBarTheme);

  const isPortal =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/subcontractor/portal") ||
    pathname?.startsWith("/subcontractor/leads") ||
    pathname?.startsWith("/subcontractor/compliance") ||
    pathname?.startsWith("/subcontractor/projects") ||
    pathname?.startsWith("/subcontractor/contracts") ||
    pathname === "/subcontractor" ||
    pathname?.startsWith("/subcontractor/purchases");
  const isHome = pathname === "/";
  const isHeroMode = isHome && !scrolled && !isPortal;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (isPortal) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <nav className="container flex h-16 items-center justify-between gap-4 px-6">
          <Logo hero={false} />
        </nav>
      </header>
    );
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[100] w-full transition-all duration-300",
          isHeroMode
            ? "bg-transparent border-b border-transparent"
            : "bg-background/97 backdrop-blur border-b border-border"
        )}
      >
        <nav className="container flex h-[60px] items-center justify-between gap-4 px-4 md:px-6">
          <Logo hero={isHeroMode} />

          <div className="hidden md:flex items-center gap-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-[13px] font-medium transition-colors rounded-sm hover-elevate",
                  isHeroMode
                    ? "text-inverse-muted hover:text-inverse-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={SITE_CONFIG.phoneHref}
              className={cn(
                "flex items-center gap-2 text-[13px] font-medium transition-colors",
                isHeroMode ? "text-inverse-muted hover:text-inverse-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="link-phone-desktop"
            >
              <span className="relative flex h-2 w-2">
                <span className="pulse-accent absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              {SITE_CONFIG.phone}
            </a>
            <a
              href={SITE_CONFIG.phoneSmsHref}
              className={cn(
                "text-[13px] font-medium transition-colors",
                isHeroMode ? "text-inverse-muted hover:text-inverse-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="link-text-desktop"
            >
              Text us
            </a>
            {isHome ? (
              <Button variant="brand" size="sm" asChild>
                <a href="/#consult">{CTA_PRIMARY_SHORT}</a>
              </Button>
            ) : (
              <Button variant="brand" size="sm" onClick={openConsult}>
                {CTA_PRIMARY_SHORT}
              </Button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className={isHeroMode ? "text-inverse-foreground" : undefined}
              onClick={() => setMobileOpen(true)}
              data-testid="button-mobile-menu-open"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Full-screen mobile nav overlay - md:hidden via pointer-events only on desktop */}
      <div
        className={cn(
          "fixed inset-0 z-[200] bg-background flex flex-col md:hidden",
          "transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-6 h-[60px] border-b border-border/40 shrink-0">
          <Logo hero={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            data-testid="button-mobile-menu-close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="border-b border-border/40">
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-6 py-5 text-2xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* Bottom contact row */}
        <div className="shrink-0 border-t border-border/40 px-6 py-6 space-y-3">
          <a
            href={SITE_CONFIG.phoneHref}
            className="flex items-center gap-3 text-base font-medium text-foreground"
            data-testid="link-phone-mobile-menu"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-accent absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </span>
            {SITE_CONFIG.phone}
          </a>
          <a
            href={SITE_CONFIG.phoneSmsHref}
            className="flex items-center gap-3 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-text-mobile-menu"
          >
            Text us instead
          </a>
          {isHome ? (
            <Button variant="brand" className="w-full" asChild>
              <a href="/#consult" onClick={() => setMobileOpen(false)}>
                {CTA_PRIMARY}
              </a>
            </Button>
          ) : (
            <Button
              variant="brand"
              className="w-full"
              onClick={() => { openConsult(); setMobileOpen(false); }}
            >
              {CTA_PRIMARY}
            </Button>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        ref={bottomBarRef}
        {...{ [ADAPTIVE_GLASS_ATTR]: "" }}
        className={cn(
          ADAPTIVE_GLASS_BAR_BASE,
          "bottom-0 z-[100] md:hidden",
          bottomBarClasses.bar
        )}
      >
        <div className={cn("grid grid-cols-3 divide-x", bottomBarClasses.divide)}>
          <a
            href={SITE_CONFIG.phoneHref}
            className={cn(
              "flex items-center justify-center gap-2 py-4 text-sm font-medium",
              bottomBarClasses.text
            )}
            data-testid="button-call-mobile"
          >
            Call
          </a>
          <a
            href={SITE_CONFIG.phoneSmsHref}
            className={cn(
              "flex items-center justify-center gap-2 py-4 text-sm font-medium",
              bottomBarClasses.text
            )}
            data-testid="button-text-mobile"
          >
            Text
          </a>
          {isHome ? (
            <a
              href="/#consult"
              className={cn(
                "flex items-center justify-center gap-2 py-4 text-sm font-medium",
                bottomBarClasses.text
              )}
              data-testid="button-begin-conversation-mobile"
            >
              {CTA_PRIMARY_SHORT}
            </a>
          ) : (
            <button
              onClick={openConsult}
              className={cn(
                "flex items-center justify-center gap-2 py-4 text-sm font-medium",
                bottomBarClasses.text
              )}
              data-testid="button-begin-conversation-mobile"
            >
              {CTA_PRIMARY_SHORT}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

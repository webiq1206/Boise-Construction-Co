"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Contact, Menu, MessageSquare, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CTA_QUOTE } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { NavEstimateButton } from "@/components/modals/NavEstimateButton";
import { SaveContactLink } from "@/components/SaveContactLink";
import { NAV_LINKS } from "@/shared/navConfig";

function Logo() {
  return (
    <Link href="/" className="flex items-center" aria-label={`${SITE_CONFIG.name} - home`}>
      {/* Bone wordmark with the ochre "Co." for the dark ground. Intrinsic
          size is 1765.71x159.96, so 26px tall renders ~287px wide. */}
      <img
        src="/brand/svg/wordmark/dark/boise-construction-co-wordmark-bone-accent.svg"
        alt={SITE_CONFIG.name}
        width={287}
        height={26}
        className="h-[26px] w-auto"
      />
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  // P5's header behaviour: transparent over the hero, gaining its ground, blur
  // and a hairline only once the page has scrolled.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActivePath = (href: string) =>
    href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
  const isPortal =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/subcontractor/portal") ||
    pathname?.startsWith("/subcontractor/leads") ||
    pathname?.startsWith("/subcontractor/compliance") ||
    pathname?.startsWith("/subcontractor/projects") ||
    pathname?.startsWith("/subcontractor/contracts") ||
    pathname === "/subcontractor" ||
    pathname?.startsWith("/subcontractor/purchases");

  if (isPortal) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <nav className="container flex h-16 items-center justify-between gap-4 px-6">
          <Logo />
        </nav>
      </header>
    );
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-[100] w-full transition-[background-color,border-color] duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur border-b border-border"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <nav className="container flex h-[60px] items-center justify-between gap-4 px-4 md:px-6">
          <Logo />

          <div className="hidden md:flex items-center gap-0">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-4 py-2 text-sm font-normal transition-colors rounded-sm hover-elevate",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-4 bottom-1 h-px bg-accent-legible" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
              <a
                href={SITE_CONFIG.phoneHref}
                className="flex items-center gap-2 text-sm font-normal transition-colors text-muted-foreground hover:text-foreground"
                data-testid="link-phone-desktop"
              >
                <span className="relative flex h-2 w-2">
                  <span className="pulse-accent absolute inline-flex h-full w-full rounded-full bg-accent-legible opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-legible" />
                </span>
                {SITE_CONFIG.phone}
              </a>
            {/* Text and Save-to-contacts as quiet icon buttons on one row. The
                previous stack put "Save to contacts" under the phone number,
                which wrapped the header to two lines and read as a mistake. */}
            <div className="flex items-center" aria-label="More ways to reach us">
              <a
                href={SITE_CONFIG.phoneSmsHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                aria-label="Text us"
                title="Text us"
                data-testid="link-text-desktop"
              >
                <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </a>
              <SaveContactLink
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                aria-label="Save to contacts"
                title="Save to contacts"
              >
                <Contact className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </SaveContactLink>
            </div>
            <NavEstimateButton variant="brand" size="sm" className="min-h-11" trackingLocation="nav_desktop">
              {CTA_QUOTE}
            </NavEstimateButton>
          </div>

          {/* Mobile menu - Radix Dialog gives focus trap, Escape, scroll-lock,
              inert background, and auto aria-expanded/aria-controls on the trigger. */}
          <div className="flex md:hidden items-center gap-2">
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                {/* The shared icon size is 36px, which suits dense admin
                    toolbars and is under the 44px touch target for the one
                    control that opens navigation on a phone. */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  aria-label="Open navigation menu"
                  data-testid="button-mobile-menu-open"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[190] bg-background/80 backdrop-blur-sm md:hidden" />
                <Dialog.Content
                  className="fixed inset-0 z-[200] bg-background flex flex-col md:hidden focus:outline-none"
                  data-testid="mobile-nav-drawer"
                >
                  <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Site navigation and contact options
                  </Dialog.Description>

                  {/* Header row */}
                  <div className="flex items-center justify-between px-6 h-[60px] border-b border-border/40 shrink-0">
                    <Logo />
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close navigation menu"
                        data-testid="button-mobile-menu-close"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </Dialog.Close>
                  </div>

                  {/* Nav links */}
                  <nav className="flex-1 overflow-y-auto">
                    {NAV_LINKS.map((link) => {
                      const active = isActivePath(link.href);
                      return (
                        <div key={link.label} className="border-b border-border/40">
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 px-6 py-5 text-2xl font-normal transition-colors hover:text-accent-legible",
                              active ? "text-accent-legible" : "text-foreground",
                            )}
                            data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {active && (
                              <span className="h-4 w-px bg-accent-legible" aria-hidden="true" />
                            )}
                            {link.label}
                          </Link>
                        </div>
                      );
                    })}
                  </nav>

                  {/* Bottom contact row */}
                  <div className="shrink-0 border-t border-border/40 px-6 py-6 space-y-3 pb-safe">
                    <div className="space-y-1">
                      <a
                        href={SITE_CONFIG.phoneHref}
                        className="flex items-center gap-3 text-base font-normal text-foreground"
                        data-testid="link-phone-mobile-menu"
                      >
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="pulse-accent absolute inline-flex h-full w-full rounded-full bg-accent-legible opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-legible" />
                        </span>
                        {SITE_CONFIG.phone}
                      </a>
                      <SaveContactLink className="pl-[22px] text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Save to contacts
                      </SaveContactLink>
                    </div>
                    <a
                      href={SITE_CONFIG.phoneSmsHref}
                      className="flex items-center gap-3 text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-text-mobile-menu"
                    >
                      Text us instead
                    </a>
                    <NavEstimateButton
                      variant="brand"
                      className="w-full"
                      onExtraClick={() => setMobileOpen(false)}
                      trackingLocation="nav_mobile_menu"
                    >
                      {CTA_QUOTE}
                    </NavEstimateButton>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </nav>
      </header>

      {/* Sticky bottom bar: one primary conversion action (Get an estimate)
          plus one secondary utility action (Call). Text remains reachable in
          the header and mobile menu, but doesn't compete for space here -
          three equal actions diluted which one visitors actually tap. */}
      <div
        data-mobile-nav-bar=""
        className="fixed left-0 right-0 bottom-0 z-[100] md:hidden pb-safe border-t bg-background/97 backdrop-blur-md border-border"
      >
        <div className="flex items-stretch gap-2 p-2">
          <a
            href={SITE_CONFIG.phoneHref}
            className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-border text-foreground hover-elevate active-elevate-2"
            aria-label={`Call ${SITE_CONFIG.phone}`}
            data-testid="button-call-mobile"
          >
            <Phone className="h-5 w-5" strokeWidth={1.5} />
          </a>
          <NavEstimateButton
            variant="brand"
            className="min-h-14 flex-1 text-base"
            data-testid="button-begin-conversation-mobile"
            trackingLocation="mobile_sticky_bar"
          >
            {CTA_QUOTE}
          </NavEstimateButton>
        </div>
      </div>
    </>
  );
}

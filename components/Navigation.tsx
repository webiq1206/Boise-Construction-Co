"use client";
/**
 * Site chrome routing for Boise Construction Co. The header, mobile menu and
 * mobile action bar themselves are the shared family components
 * (components/family/), set up by lib/familyBrand.ts; this file only decides
 * where they render.
 *
 * - Estimator routes (/estimate and below): no marketing header or bar. The
 *   estimator and quote wizard are one-page apps with their own brand bar,
 *   progress, exit and fixed Continue bar; stacking the marketing header on
 *   top cost about a third of a phone screen (owner 2026-09-23).
 * - Portal and admin routes: a plain lockup bar, no bottom bar.
 */
import { ApprovedBrand } from "@/components/approved/ApprovedBrand";
import { MobileActionBar } from "@/components/family/MobileActionBar";
import { SiteHeader } from "@/components/family/SiteHeader";
import { isEstimatorPath } from "@/lib/p5/estimatorRoutes";
import { SITE_CONFIG } from "@/shared/siteConfig";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isPortalPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/subcontractor/portal") ||
    pathname.startsWith("/subcontractor/leads") ||
    pathname.startsWith("/subcontractor/compliance") ||
    pathname.startsWith("/subcontractor/projects") ||
    pathname.startsWith("/subcontractor/contracts") ||
    pathname === "/subcontractor" ||
    pathname.startsWith("/subcontractor/purchases")
  );
}

export function Navigation() {
  const pathname = usePathname();
  if (isEstimatorPath(pathname)) return null;
  if (isPortalPath(pathname)) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <nav className="container flex h-16 items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center" aria-label={`${SITE_CONFIG.name}, home`}>
            <ApprovedBrand />
          </Link>
        </nav>
      </header>
    );
  }
  return <SiteHeader />;
}

/** Rendered after the footer so the bar's clearance spacer sits at the end of the page. */
export function SiteActionBar() {
  const pathname = usePathname();
  if (isEstimatorPath(pathname) || isPortalPath(pathname)) return null;
  return <MobileActionBar />;
}

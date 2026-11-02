"use client";

import { ContractorRegistrationPlain } from "@/components/ContractorRegistration";
import { isEstimatorPath } from "@/lib/p5/estimatorRoutes";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The marketing footer arrives as a server-rendered element from the root
 * layout. Importing Footer here made it a client component, which shipped
 * every service, city, hub and full guide body it reads for its link lists
 * (about 270 KB of script) to every page just to render links.
 */
export function ConditionalFooter({ footer }: { footer: ReactNode }) {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/subcontractor/portal") ||
    pathname?.startsWith("/subcontractor/leads") ||
    pathname?.startsWith("/subcontractor/compliance") ||
    pathname?.startsWith("/subcontractor/projects") ||
    pathname?.startsWith("/subcontractor/contracts") ||
    pathname === "/subcontractor" ||
    pathname?.startsWith("/subcontractor/purchases");

  // The estimator owns the screen. The marketing footer would force a scroll,
  // so the funnel keeps only the registration line, as plain text.
  if (isEstimatorPath(pathname)) return <ContractorRegistrationPlain />;
  if (hideFooter) return null;
  return footer;
}

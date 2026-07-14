import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  external?: boolean;
  /** Descriptive accessible name for generic link text (e.g. "Learn more"). */
  ariaLabel?: string;
}

export function TextLink({
  href,
  children,
  className,
  showArrow = true,
  external = false,
  ariaLabel,
}: TextLinkProps) {
  const content = (
    <>
      {children}
      {showArrow && <ArrowRight className="h-4 w-4" />}
    </>
  );

  if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("sms:") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={cn("brc-text-link", className)} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cn("brc-text-link", className)} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

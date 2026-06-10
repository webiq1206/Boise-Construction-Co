"use client";

import { SITE_CONFIG } from "@/shared/siteConfig";

interface EmailLinkProps {
  className?: string;
  label?: string;
}

/** Renders a mailto trigger without exposing the address in static HTML. */
export function EmailLink({
  className = "",
  label = "Email us",
}: EmailLinkProps) {
  const [user, domain] = SITE_CONFIG.email.split("@");

  const handleClick = () => {
    window.location.href = `mailto:${user}@${domain}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label={`Send email to ${SITE_CONFIG.name}`}
    >
      {label}
    </button>
  );
}

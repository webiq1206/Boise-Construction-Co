/** Primary site navigation - single source of truth for the header. */
export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Services", href: "/services" },
  { label: "Areas", href: "/areas" },
  { label: "About", href: "/about" },
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

import Link from "next/link";
import { ChevronDown, Facebook } from "lucide-react";
import { CITIES, SERVICES } from "@/shared/contentData";
import { SITE_TAGLINE } from "@/shared/siteContent";
import { areaPath, servicePath } from "@/lib/seo-routes";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { GBP_SOCIAL } from "@/shared/gbpProfile";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmailLink } from "@/components/EmailLink";
import { BusinessPhoneLink } from "@/components/BusinessPhoneContact";
import { SaveContactLink } from "@/components/SaveContactLink";
import { FooterCTAs } from "@/components/modals/FooterCTAs";
import { CONTENT_HUBS, categoryHubPath, guidePath } from "@/shared/contentHubs";
import { BLOG_POSTS } from "@/shared/blogContent";
import { GUIDE_PAGES } from "@/shared/guideContent";
import manifest from "@/data/internal-links.json";

const PUBLISHED_GUIDE_SLUGS = new Set(GUIDE_PAGES.map((g) => g.slug));

/**
 * A footer link group. Renders as a native <details>/<summary> disclosure so
 * it's a collapsed accordion on mobile (no JS, keyboard/AT accessible for
 * free) but always open on desktop - the summary's click/toggle is disabled
 * at lg+ via pointer-events-none rather than switching markup, so there's no
 * hydration mismatch between server and client.
 */
function FooterGroup({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details open className="group/fg">
      <summary
        className="flex min-h-11 cursor-pointer select-none items-center justify-between gap-2 py-1 font-sans text-xs font-normal uppercase tracking-[0.12em] text-inverse-muted marker:hidden [&::-webkit-details-marker]:hidden lg:pointer-events-none lg:min-h-0 lg:cursor-default lg:py-0 lg:mb-5"
      >
        {title}
        <ChevronDown
          className="h-4 w-4 shrink-0 text-inverse-muted transition-transform duration-200 group-open/fg:rotate-180 lg:hidden"
          aria-hidden="true"
        />
      </summary>
      <div className="pb-5 pt-3 lg:pb-0 lg:pt-0">{children}</div>
    </details>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="container px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-10 mb-12 lg:gap-0 lg:divide-x lg:divide-inverse-foreground/10 [&>*]:lg:px-6 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="mb-5">
              {/* Wordmark only - the seal reads as clutter at footer scale, so
                  the brand column leads with the primary mark alone. Intrinsic
                  size is 1765.71x159.96, so 26px tall renders ~287px wide. */}
              <img
                src="/brand/svg/wordmark/dark/boise-construction-co-wordmark-bone-accent.svg"
                alt={SITE_CONFIG.name}
                width={287}
                height={26}
                className="h-[26px] w-auto"
              />
            </div>
            <p className="text-sm mb-6 text-inverse-muted font-sans">
              {SITE_TAGLINE}.
            </p>
            <div className="space-y-2">
              <BusinessPhoneLink
                className="block text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                data-testid="link-footer-phone"
              />
              <a
                href={SITE_CONFIG.phoneSmsHref}
                className="block text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                data-testid="link-footer-text"
              >
                Text us
              </a>
              <EmailLink className="block text-sm text-left text-inverse-muted hover:text-inverse-foreground transition-colors" />
              <p className="text-sm text-inverse-muted">
                {SITE_CONFIG.address.cityState} · {SITE_CONFIG.address.serviceArea}
              </p>
              {/* Save to Contacts is a button here, not a text link: it is a
                  deliberate action (download the vCard), and a button reads as
                  one where the surrounding lines are passive contact details. */}
              <div className="pt-3">
                <SaveContactLink
                  showIcon
                  className={cn(buttonVariants({ variant: "heroGhost" }), "text-sm")}
                >
                  Save to Contacts
                </SaveContactLink>
              </div>
              {/* Facebook only, as an icon in the brand accent. Instagram removed. */}
              <div className="flex gap-4 pt-3">
                <a
                  href={GBP_SOCIAL.facebook}
                  className="text-accent-legible hover:text-inverse-foreground transition-colors"
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label={`${SITE_CONFIG.name} on Facebook`}
                >
                  <Facebook className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </a>
              </div>
            </div>
          </div>

          <FooterGroup title="Services">
            <ul className="space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={servicePath(service.slug)}
                    className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title="Resources">
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/guides"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                >
                  Home Building Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                >
                  Planning Downloads
                </Link>
              </li>
              {CONTENT_HUBS.filter(
                (h) => h.priorityTier <= 2 && PUBLISHED_GUIDE_SLUGS.has(h.pillarSlug),
              )
                .slice(0, 3)
                .map((hub) => (
                  <li key={hub.hubSlug}>
                    <Link
                      href={guidePath(hub.pillarSlug)}
                      className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                    >
                      {hub.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </FooterGroup>

          <FooterGroup title="Company">
            <ul className="space-y-2.5">
              {[
                { label: "About", href: "/about" },
                // Sitewide link so the RE-10 page is reachable from every page
                // and never ships orphaned.
                { label: "RE-10 Repairs", href: "/re-10-repairs-boise" },
                { label: "Contact", href: "/contact" },
                { label: "Why Choose Us", href: "/#why-choose-us" },
                { label: "How We Build", href: "/#how-we-build" },
                // Guides/Blog already have their own columns; not repeated here.
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>

          {/* Plain-text title: a link inside <summary> is a nested interactive
              control (axe: nested-interactive) - the index link lives in the
              list instead. */}
          <FooterGroup title="Service Areas">
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/areas"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                >
                  All service areas
                </Link>
              </li>
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={areaPath(city.slug)}
                    className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  >
                    {city.name}, Idaho
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title="From the Blog">
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                >
                  All articles
                </Link>
              </li>
              {CONTENT_HUBS.filter((h) => h.priorityTier <= 2)
                .slice(0, 3)
                .map((hub) => (
                  <li key={hub.hubSlug}>
                    <Link
                      href={categoryHubPath(hub.hubSlug)}
                      className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                    >
                      {hub.title}
                    </Link>
                  </li>
                ))}
              {(
                (manifest.blogByCategory as Record<
                  string,
                  Array<{ slug: string; title: string }>
                /* 'remodeling-costs' was the pre-repositioning hub slug. It now
                   exists only as a legacy redirect on individual posts, not as a
                   hub, so both lookups missed and this footer column rendered
                   empty rather than erroring. */
                >)?.['home-building-costs'] ??
                BLOG_POSTS.filter((p) => p.hubSlug === 'home-building-costs')
                  .slice(0, 1)
                  .map((p) => ({ slug: p.slug, title: p.title }))
              )
                .slice(0, 1)
                .map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors line-clamp-2"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </FooterGroup>

          <FooterGroup title="Start a Conversation">
            <ul className="space-y-2.5">
              <FooterCTAs />
              <li>
                {/* Phone only here; "Save to Contacts" lives as a button in the
                    contact column, so a second text link would just duplicate it. */}
                <BusinessPhoneLink
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  data-testid="link-footer-column-phone"
                />
              </li>
              <li>
                <a
                  href={SITE_CONFIG.phoneSmsHref}
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                >
                  Text us
                </a>
              </li>
              <li>
                <EmailLink className="text-sm text-left text-inverse-muted hover:text-inverse-foreground transition-colors" />
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-inverse-foreground/10">
              <a
                href="/api/login"
                rel="nofollow"
                className="text-xs text-inverse-muted hover:text-inverse-foreground transition-colors"
              >
                Subcontractor Login
              </a>
            </div>
          </FooterGroup>
        </div>

        <div className="py-5 border-t border-b border-inverse-foreground/10 mb-5">
          <p className="text-xs tracking-[0.08em] text-inverse-muted">
            Serving {CITIES.map((c) => c.name).join(" · ")} · Ada and Canyon County, Idaho
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-inverse-muted">
          <div className="flex flex-wrap gap-4">
            <span>&copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.</span>
            <span>License details available upon request</span>
            {/* Required parent-company disclosure. This brand is a DBA of
                P5 Home Co LLC, not a separate company, and the branded link
                gives that claim somewhere to resolve - for a reader deciding
                who signs the contract, and for the entity graph, which
                declares the same relationship in JSON-LD. */}
            <span>
              {SITE_CONFIG.name} is a DBA of{" "}
              <a
                href="https://p5homeco.com"
                className="underline underline-offset-2 transition-colors hover:text-inverse-foreground"
              >
                P5 Home Co LLC
              </a>
            </span>
            <span>
              Built by{" "}
              <a
                href="https://webiq.co"
                target="_blank"
                rel="noopener"
                className="underline underline-offset-2 transition-colors hover:text-inverse-foreground"
              >
                webIQ
              </a>
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/sitemap" className="transition-colors hover:text-inverse-foreground">
              Site Map
            </Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-inverse-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-inverse-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

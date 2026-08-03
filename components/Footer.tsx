import Link from "next/link";
import { Facebook } from "lucide-react";
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

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="container px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-10 mb-12 lg:gap-0 lg:divide-x lg:divide-inverse-foreground/10 [&>*]:lg:px-6 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-4">
              {/* Dark-background brand seal; circular clip drops the square
                  corners so its dark ground reads as a seamless medallion on
                  the dark footer band */}
              <img
                src="/brand/icons/boise-construction-co-seal-dark.svg"
                alt=""
                aria-hidden="true"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-full"
              />
              {/* Reverse (white) primary logo with tagline. Intrinsic size is
                  1671x420, so 45px tall renders 179px wide. */}
              <img
                src="/brand/logos/boise-construction-co-logo-primary-reverse.svg"
                alt={SITE_CONFIG.name}
                width={179}
                height={45}
                className="h-[45px] w-auto"
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

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              Services
            </h3>
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
          </div>

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              Resources
            </h3>
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
          </div>

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              Studio
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "About", href: "/about" },
                { label: "Guides", href: "/guides" },
                // Sitewide link so the RE-10 page is reachable from every page
                // and never ships orphaned.
                { label: "RE-10 Repairs", href: "/re-10-repairs-boise" },
                { label: "Contact", href: "/contact" },
                { label: "Why Choose Us", href: "/#why-choose-us" },
                { label: "How We Build", href: "/#how-we-build" },
                { label: "Blog", href: "/blog" },
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
          </div>

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              <Link href="/areas" className="hover:text-inverse-foreground transition-colors">
                Service Areas
              </Link>
            </h3>
            <ul className="space-y-2.5">
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
          </div>

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              From the Blog
            </h3>
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
          </div>

          <div>
            <h3 className="font-sans font-normal text-[11px] tracking-[0.12em] uppercase mb-5 text-inverse-muted">
              Start a Conversation
            </h3>
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
                className="text-xs text-inverse-muted hover:text-inverse-foreground transition-colors"
              >
                Subcontractor Login
              </a>
            </div>
          </div>
        </div>

        <div className="py-5 border-t border-b border-inverse-foreground/10 mb-5">
          <p className="text-[11px] tracking-[0.08em] text-inverse-muted">
            Serving {CITIES.map((c) => c.name).join(" · ")} · Ada and Canyon County, Idaho
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-inverse-muted">
          <div className="flex flex-wrap gap-4">
            <span>&copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.</span>
            <span>License details available upon request</span>
          </div>
          <div className="flex gap-4">
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

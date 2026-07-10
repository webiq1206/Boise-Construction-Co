import Link from "next/link";
import { CITIES, SERVICES } from "@/shared/contentData";
import { SITE_TAGLINE } from "@/shared/siteContent";
import { areaPath, servicePath } from "@/lib/seo-routes";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { EmailLink } from "@/components/EmailLink";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 mb-12 lg:gap-0 lg:divide-x lg:divide-inverse-foreground/10 [&>*]:lg:px-6 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0">
          <div>
            <div className="mb-5 flex items-center gap-4">
              {/* Bright emblem badge reads as a mark on the dark footer band */}
              <img
                src="/brand/icons/boise-remodeling-co-emblem-light.svg"
                alt=""
                aria-hidden="true"
                width={44}
                height={44}
                className="h-11 w-11 shrink-0"
              />
              {/* Reverse (white) primary logo with tagline */}
              <img
                src="/brand/logos/boise-remodeling-co-logo-primary-reverse.svg"
                alt="Boise Remodeling Co"
                width={168}
                height={45}
                className="h-[45px] w-auto"
              />
            </div>
            <p className="text-sm mb-6 text-inverse-muted font-sans">
              {SITE_TAGLINE}.
            </p>
            <div className="space-y-2">
              <a
                href={SITE_CONFIG.phoneHref}
                className="block text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
              >
                {SITE_CONFIG.phone}
              </a>
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
              <div className="flex gap-4 pt-2">
                <a
                  href="https://www.facebook.com/boiseremodeling"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/boiseremodeling"
                  className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram
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
                  Remodeling Guides
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
                { label: "Projects & Reviews", href: "/testimonials" },
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
                >)?.['remodeling-costs'] ??
                BLOG_POSTS.filter((p) => p.hubSlug === 'remodeling-costs')
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
              {[
                { label: SITE_CONFIG.phone, href: SITE_CONFIG.phoneHref },
                { label: "Text us", href: SITE_CONFIG.phoneSmsHref },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-inverse-muted hover:text-inverse-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
            <span>&copy; {currentYear} Boise Remodeling Co. All rights reserved.</span>
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

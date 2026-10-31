import Link from 'next/link';
import { CITIES, SERVICES } from '@/shared/contentData';
import { CONTENT_HUBS, guidePath } from '@/shared/contentHubs';
import { GUIDE_PAGES } from '@/shared/guideContent';
import { isCityServiceNoindex } from '@/lib/page-metadata';
import { areaPath, cityServicePath, servicePath } from '@/lib/seo-routes';

interface RelatedLinksProps {
  serviceSlug?: string;
  citySlug?: string;
  variant: 'service' | 'area' | 'city-service';
}

/** The master guide is the fallback, never a service's own pillar. */
const MASTER_GUIDE_SLUG = 'treasure-valley-home-building-guide';

/**
 * Map each service to the pillar guide it links "up" to, derived from
 * CONTENT_HUBS[].serviceSlugs (the first hub, in declared order, that lists the
 * service and whose pillar is published). This used to be an empty map, so all
 * 49 landing pages linked the generic master guide instead of their pillar.
 * Services no pillar claims (additions, ADUs, shop homes) keep the master guide.
 */
const SERVICE_GUIDE: Record<string, { href: string; label: string }> = (() => {
  const published = new Map(GUIDE_PAGES.map((g) => [g.slug, g]));
  const map: Record<string, { href: string; label: string }> = {};
  for (const hub of CONTENT_HUBS) {
    if (hub.pillarSlug === MASTER_GUIDE_SLUG) continue;
    const guide = published.get(hub.pillarSlug);
    if (!guide) continue;
    for (const slug of hub.serviceSlugs) {
      map[slug] ??= { href: guidePath(hub.pillarSlug), label: guide.title };
    }
  }
  return map;
})();

/**
 * City-service pages that render `noindex, follow` are not linked from these
 * blocks: the same rule the sitemap uses, so indexable pages stop spending
 * internal links on pages that cannot rank.
 */
function isIndexableCombo(serviceSlug: string, citySlug: string): boolean {
  return !isCityServiceNoindex(serviceSlug, citySlug);
}

/**
 * Shared cross-link block rendered on every landing page. Links "up" to the most
 * relevant pillar guide and feeds the two least-linked pages (testimonials,
 * resources) contextual internal links across the whole landing-page network.
 */
function ExploreFurther({ serviceSlug }: { serviceSlug?: string }) {
  const guide = serviceSlug ? SERVICE_GUIDE[serviceSlug] : undefined;
  /* Points at the canonical guide slug, not the legacy one. The old href still
     resolved, but only through a 308, so every landing page on the site spent
     an internal link on a redirect hop - which is what scripts/internal-links
     audits for. */
  const links: { href: string; label: string }[] = [
    guide ?? { href: guidePath(MASTER_GUIDE_SLUG), label: 'Treasure Valley Building Guide' },
    { href: '/services', label: 'Compare how we build' },
    { href: '/resources', label: 'Free home building planning worksheets' },
    { href: '/estimate', label: 'Estimate your build cost' },
  ];
  return (
    <div className="border-t pt-10" style={{ borderColor: "var(--ed-line)" }}>
      <h2 className="ed-h4 mb-6">Explore further</h2>
      <ul className="grid sm:grid-cols-2 gap-2">
        {links.map((link) => (
          <li key={link.href} className="list-none">
            <Link
              href={link.href}
              className="ed-body flex min-h-11 items-center text-[0.9375rem] transition-colors hover:[color:var(--ed-accent)] lg:min-h-0"
            >
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RelatedLinks({ serviceSlug, citySlug, variant }: RelatedLinksProps) {
  if (variant === 'service' && serviceSlug) {
    return (
      <div className="space-y-10">
        <ExploreFurther serviceSlug={serviceSlug} />
      </div>
    );
  }

  if (variant === 'area' && citySlug) {
    const city = CITIES.find((c) => c.slug === citySlug);
    const indexableServices = SERVICES.filter((service) => isIndexableCombo(service.slug, citySlug));
    if (indexableServices.length === 0) {
      return (
        <div className="space-y-10">
          <ExploreFurther />
        </div>
      );
    }
    return (
      <div className="space-y-10">
        <div>
          <h2 className="ed-h2-sm ed-statement-wide mb-8">
            Home building services in {city?.name}
          </h2>
          <div className="ed-grid-balance grid sm:grid-cols-2 gap-4">
            {indexableServices.map((service) => (
              <Link key={service.slug} href={cityServicePath(service.slug, citySlug)}>
                <div className="ed-card ed-card-link h-full">
                  <h3 className="ed-h4">{service.name}</h3>
                  <p className="ed-body mt-2 text-[0.875rem]">{service.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <ExploreFurther />
      </div>
    );
  }

  if (variant === 'city-service' && serviceSlug && citySlug) {
    const otherCities = CITIES.filter(
      (c) => c.slug !== citySlug && isIndexableCombo(serviceSlug, c.slug),
    ).slice(0, 4);
    const otherServices = SERVICES.filter(
      (s) => s.slug !== serviceSlug && isIndexableCombo(s.slug, citySlug),
    ).slice(0, 3);
    return (
      <div className="space-y-10">
      <div className="grid md:grid-cols-2 gap-10">
        {otherCities.length > 0 && (
        <div>
          <h2 className="ed-h4 mb-6">
            Same service, nearby cities
          </h2>
          <ul className="space-y-2">
            {otherCities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={cityServicePath(serviceSlug, city.slug)}
                  className="ed-body text-[0.9375rem] transition-colors hover:[color:var(--ed-accent)]"
                >
                  {SERVICES.find((s) => s.slug === serviceSlug)?.name} in {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        )}
        <div>
          {otherServices.length > 0 && (
          <>
          <h2 className="ed-h4 mb-6">
            More services in {CITIES.find((c) => c.slug === citySlug)?.name}
          </h2>
          <ul className="space-y-2">
            {otherServices.map((service) => (
              <li key={service.slug}>
                <Link
                  href={cityServicePath(service.slug, citySlug)}
                  className="ed-body text-[0.9375rem] transition-colors hover:[color:var(--ed-accent)]"
                >
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
          </>
          )}
          <div className={`${otherServices.length > 0 ? 'mt-8 border-t pt-6 ' : ''}flex flex-wrap gap-x-10 gap-y-4`} style={{ borderColor: "var(--ed-line)" }}>
            <Link href={servicePath(serviceSlug)} className="ed-link">
              All {SERVICES.find((s) => s.slug === serviceSlug)?.name} areas →
            </Link>
            <Link href={areaPath(citySlug)} className="ed-link">
              Home building in {CITIES.find((c) => c.slug === citySlug)?.name} →
            </Link>
          </div>
        </div>
      </div>
        <ExploreFurther serviceSlug={serviceSlug} />
      </div>
    );
  }

  return null;
}

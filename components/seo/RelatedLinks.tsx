import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getManifestLinks } from '@/lib/internal-links';
import { getBlogHeroImage, getBlogImageAlt } from '@/shared/blogImages';
import { getCityServiceImage } from '@/shared/cityServiceImages';
import { contentImageAlt } from '@/shared/imageAlts';
import { subjectForService } from '@/shared/localAlt';
import { CONSTRUCTION_IMAGES } from '@/shared/siteImages';
import { CITIES, SERVICES, serviceLabel } from '@/shared/contentData';
import { CONTENT_HUBS, guidePath } from '@/shared/contentHubs';
import { GUIDE_PAGES } from '@/shared/guideContent';
import { isCityServiceNoindex } from '@/lib/page-metadata';
import { areaPath, cityServicePath, servicePath } from '@/lib/seo-routes';
import { INSTANT_ESTIMATE_PATH, servicePrimaryAction } from '@/shared/instantEstimate';

interface RelatedLinksProps {
  serviceSlug?: string;
  citySlug?: string;
  variant: 'service' | 'area' | 'city-service';
  /** Page path whose related pages (data/internal-links.json) join the reading list. */
  manifestPath?: string;
  /** Links the page already shows in its body. They are not repeated here. */
  exclude?: readonly string[];
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
 * One closing block of onward links for every landing page (owner, 19 November
 * 2026: the stacked link lists read as clutter). Places and services are photo
 * cards (a swipe row on phones, balanced rows from tablet up), each with the
 * photograph of the page it opens; guides and related pages are one list with
 * thumbnails. Every photograph carries a local alt: the work and the place,
 * then what the picture shows. A link appears once: nothing already in a card
 * or in the page body is repeated in the list. Cards keep the full anchor text
 * for search and screen readers and show only the part that differs.
 */
interface Cell { href: string; label: string; context?: string }

/** The photograph that belongs to the page a link opens, with its alt. */
function pageImage(href: string): { src: string; alt: string } | undefined {
  const [section, a, b] = href.split('?')[0].split('/').filter(Boolean);
  if ((section === 'blog' || section === 'guides') && a) {
    const src = getBlogHeroImage(a);
    return src ? { src, alt: getBlogImageAlt(a) } : undefined;
  }
  let src: string | undefined;
  let context: { subject?: string; city?: string } = {};
  if (section === 'services' && a) {
    src = getCityServiceImage(href);
    context = { subject: subjectForService(a), city: CITIES.find((c) => c.slug === b)?.name };
  } else if (section === 'areas' && a) {
    src = getCityServiceImage(href);
    context = { city: CITIES.find((c) => c.slug === a)?.name };
  } else if (section === 'services') {
    src = CONSTRUCTION_IMAGES.customHome;
  } else if (section === 'resources') {
    src = CONSTRUCTION_IMAGES.plans;
  } else if (section === 'instant-estimate' || section === 'estimate') {
    src = CONSTRUCTION_IMAGES.budget;
  }
  if (!src) return undefined;
  const alt = contentImageAlt(src, context);
  return alt ? { src, alt } : undefined;
}

function Cells({ cells }: { cells: Cell[] }) {
  return (
    <ul
      className="lx-cells"
      style={{
        // One full row on desktop for up to six cards; otherwise rows of four. Tablets take rows of three or four.
        ['--lx-cols' as string]: cells.length <= 6 ? cells.length : cells.length % 5 === 0 ? 5 : 4,
        ['--lx-cols-tablet' as string]: cells.length % 4 === 0 ? 4 : 3,
      }}
    >
      {cells.map((cell) => {
        const image = pageImage(cell.href);
        return (
          <li key={cell.href + cell.label}>
            <Link href={cell.href} className="lx-cell">
              {image ? (
                <span className="lx-cell-photo">
                  <Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 46vw, 300px" className="object-cover img-brand-grade" />
                </span>
              ) : null}
              <span className="lx-cell-label">
                <span>
                  {cell.context ? <span className="sr-only">{cell.context} </span> : null}
                  {cell.label}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Group({ label, action, children }: { label: string; action?: { href: string; label: string; context?: string }; children: React.ReactNode }) {
  return (
    <div className="lx-explore-group">
      <div className="lx-explore-head">
        <h3 className="lx-explore-label">{label}</h3>
        {action ? (
          <Link href={action.href} className="lx-explore-all">
            {action.context ? <span className="sr-only">{action.context} </span> : null}
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const MAX_READING = 6;

/** Pillar guide, planning pages and the page's related pages, each once. */
function readingLinks(serviceSlug: string | undefined, manifestPath: string | undefined, taken: Set<string>, readingOnly: boolean) {
  const guide = serviceSlug ? SERVICE_GUIDE[serviceSlug] : undefined;
  /* Points at the canonical guide slug, not the legacy one, so no landing page
     spends an internal link on a redirect hop (scripts/internal-links audits it). */
  const fixed = [
    guide ?? { href: guidePath(MASTER_GUIDE_SLUG), label: 'Treasure Valley building guide' },
    { href: '/services', label: 'Compare how we build' },
    { href: '/resources', label: 'Free home building planning worksheets' },
    // The instant estimator, on this service's project where it prices one. A service it does
    // not price keeps the quote request this link has always opened (shared/instantEstimate.ts).
    { href: serviceSlug ? servicePrimaryAction(serviceSlug).href : INSTANT_ESTIMATE_PATH, label: 'Estimate your build cost' },
  ];
  // Beside cards of places and services, the list holds guides and articles only.
  const related = (manifestPath ? getManifestLinks(manifestPath) : [])
    .filter((link) => !readingOnly || !/^\/(services|areas)\//.test(link.url))
    .map((link) => ({ href: link.url, label: link.anchor }));
  const out: { href: string; label: string }[] = [];
  for (const link of [...fixed, ...related]) {
    if (taken.has(link.href)) continue;
    taken.add(link.href);
    out.push(link);
    if (out.length === MAX_READING) break;
  }
  return out;
}

function Reading({ links }: { links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <Group label="Guides and planning">
      <ul className="lx-reading">
        {links.map((link) => {
          const image = pageImage(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} className="lx-reading-link">
                {image ? (
                  <span className="lx-reading-photo">
                    <Image src={image.src} alt={image.alt} fill sizes="72px" className="object-cover img-brand-grade" />
                  </span>
                ) : null}
                <span className="lx-reading-title">{link.label}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Group>
  );
}

export function RelatedLinks({ serviceSlug, citySlug, variant, manifestPath, exclude = [] }: RelatedLinksProps) {
  const taken = new Set<string>(exclude);
  const service = SERVICES.find((s) => s.slug === serviceSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  const groups: React.ReactNode[] = [];

  if (variant === 'area' && citySlug && city) {
    // Same index rule as the sitemap: noindexed combos are never linked.
    const cells = SERVICES.filter((s) => isIndexableCombo(s.slug, citySlug)).map((s) => ({
      href: cityServicePath(s.slug, citySlug),
      label: serviceLabel(s),
      context: `${city.name}:`,
    }));
    if (cells.length > 0) {
      cells.forEach((cell) => taken.add(cell.href));
      groups.push(<Group key="services" label={`Home building services in ${city.name}`}><Cells cells={cells} /></Group>);
    }
  }

  if (variant === 'city-service' && serviceSlug && citySlug && service && city) {
    const cityCells: Cell[] = CITIES.filter(
      (c) => c.slug !== citySlug && isIndexableCombo(serviceSlug, c.slug),
    ).map((c) => ({ href: cityServicePath(serviceSlug, c.slug), label: c.name, context: `${service.name} in` }));
    const serviceCells: Cell[] = SERVICES.filter(
      (s) => s.slug !== serviceSlug && isIndexableCombo(s.slug, citySlug),
    ).slice(0, 4).map((s) => ({ href: cityServicePath(s.slug, citySlug), label: serviceLabel(s), context: `${city.name}:` }));
    [...cityCells, ...serviceCells].forEach((cell) => taken.add(cell.href));
    taken.add(servicePath(serviceSlug));
    taken.add(areaPath(citySlug));
    if (cityCells.length > 0) {
      groups.push(
        <Group key="cities" label={`${serviceLabel(service)} in nearby cities`} action={{ href: servicePath(serviceSlug), label: 'All areas', context: `${service.name}:` }}>
          <Cells cells={cityCells} />
        </Group>,
      );
    }
    groups.push(
      <Group key="services" label={`More services in ${city.name}`} action={{ href: areaPath(citySlug), label: `Home building in ${city.name}` }}>
        {serviceCells.length > 0 ? <Cells cells={serviceCells} /> : null}
      </Group>,
    );
  }

  const reading = readingLinks(serviceSlug, manifestPath, taken, groups.length > 0);
  if (groups.length === 0 && reading.length === 0) return null;

  return (
    <div className="lx-explore">
      <h2 className="ed-h2-sm ed-statement-wide">Keep exploring</h2>
      <div className="lx-explore-grid">
        {groups}
        <Reading links={reading} />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import {
  GALLERY_PROJECTS,
  type GalleryProject,
} from "@/shared/galleryData";
import { contentImageAlt } from "@/shared/imageAlts";
import { CITIES } from "@/shared/contentData";

function cityDisplayName(slug: string) {
  return CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

function ProjectMeta({ project, lead = false }: { project: GalleryProject; lead?: boolean }) {
  const cityName = cityDisplayName(project.city);
  return (
    <>
      <p className="ed-eyebrow ed-eyebrow-accent !mb-3">{cityName}, Idaho</p>
      <h3 className={lead ? "ed-h3" : "ed-h4"}>{project.title}</h3>
      <p className={`ed-body mt-3 ${lead ? "" : "text-[0.875rem]"}`}>{project.description}</p>
    </>
  );
}

function ProjectImageGrid({
  project,
  lead = false,
}: {
  project: GalleryProject;
  lead?: boolean;
}) {
  const [hero, ...rest] = project.images;
  if (!hero) return null;

  return (
    <div className="flex flex-col">
      <div className={`relative ${lead ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <Image
          src={hero.src}
          alt={contentImageAlt(hero.src) || hero.label}
          fill
          sizes={lead ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 768px) 85vw, 31vw"}
          className="object-cover img-brand-grade"
        />
        <span className="absolute left-3 bottom-3 ed-small bg-background/85 px-2 py-1">
          {hero.label}
        </span>
      </div>
      {rest.length > 0 && (
        <div
          className={`grid ${lead ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
          style={{ borderTop: "1px solid var(--ed-line)" }}
        >
          {(lead ? rest : rest.slice(0, 3)).map((image) => (
            <div
              key={image.src}
              className="relative aspect-[4/3]"
              style={{ borderRight: "1px solid var(--ed-line)" }}
            >
              <Image
                src={image.src}
                alt={contentImageAlt(image.src) || image.label}
                fill
                sizes={lead ? "(max-width: 640px) 50vw, 15vw" : "(max-width: 768px) 28vw, 10vw"}
                className="object-cover img-brand-grade"
                loading="lazy"
              />
              <span className="absolute left-2 bottom-2 ed-small bg-background/85 px-1.5 py-0.5 text-[0.65rem]">
                {image.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectGallerySectionProps {
  limit?: number;
  showViewAll?: boolean;
  /** Service types to omit - e.g. one already shown in the featured section. */
  excludeServiceTypes?: string[];
}

/**
 * Our work - cohesive concept homes.
 *
 * New construction has no remodel before/after. Each featured project shows
 * exterior and room views that belong to one property, so mobile scroll gets
 * a visual rhythm instead of a text wall, and the set reads as one home.
 */
export function ProjectGallerySection({
  limit = 1,
  showViewAll = true,
  excludeServiceTypes = [],
}: ProjectGallerySectionProps) {
  const projects = GALLERY_PROJECTS.filter(
    (p) => !excludeServiceTypes.includes(p.serviceType),
  ).slice(0, limit);
  const [lead, ...rest] = projects;
  if (!lead) return null;
  const showRail = rest.length > 0 && limit > 1;

  return (
    <Section id="gallery" surface="bone" spacing="xl" edge className="overflow-hidden">
      <div className="ed-shell">
        <div className="grid gap-[var(--ed-gutter)] lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal>
            <p className="ed-eyebrow">Concept design</p>
            <h2 className="ed-h2 ed-statement">
              {lead.title}
            </h2>
            <div className="mt-10 hidden lg:block">
              <ProjectMeta project={lead} lead />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div style={{ border: "1px solid var(--ed-line)" }}>
              <ProjectImageGrid project={lead} lead />
            </div>
            <div className="mt-6 lg:hidden">
              <ProjectMeta project={lead} lead />
            </div>
          </Reveal>
        </div>

        {showRail && (
          <Reveal delay={120}>
            <div className="mt-[clamp(48px,6vw,88px)] flex items-end justify-between gap-6">
              <p className="ed-eyebrow !mb-0">More concept homes</p>
              <p className="ed-small hidden sm:block">Scroll sideways</p>
            </div>
            <div
              className="ed-rail mt-6 [scrollbar-color:var(--ed-line)_transparent]"
              tabIndex={0}
              role="region"
              style={{ ["--ed-rail-w" as string]: "31%" }}
              aria-label="More concept homes"
            >
              {rest.map((project) => (
                <article
                  key={`${project.serviceType}-${project.city}-${project.title}`}
                  className="flex flex-col"
                  style={{ border: "1px solid var(--ed-line)" }}
                >
                  <ProjectImageGrid project={project} />
                  <div className="p-6">
                    <ProjectMeta project={project} />
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        )}

        {showViewAll && (
          <div className="mt-12">
            <Button variant="brandOutline" asChild>
              <Link href="/services">See services</Link>
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import type { GalleryProject } from "@/shared/galleryData";
import { contentImageAlt } from "@/shared/imageAlts";

interface FeaturedBeforeAfterSectionProps {
  project: GalleryProject;
  title?: React.ReactNode;
}

/**
 * Featured concept home for service hub pages.
 *
 * Kept the historical filename so existing imports stay stable. New
 * construction shows a cohesive multi-room set rather than a remodel
 * before/after slider.
 */
export function FeaturedBeforeAfterSection({
  project,
  title = (
    <>
      A cohesive <em className="brc-accent">concept home</em>
    </>
  ),
}: FeaturedBeforeAfterSectionProps) {
  const [hero, ...rooms] = project.images;
  if (!hero) return null;

  return (
    <Section divider>
      <div className="container px-4 max-w-5xl">
        <SectionHeader
          eyebrow="Representative imagery"
          title={title}
          description="Exterior and interior views of one concept property - materials and setting stay continuous from curb to kitchen."
          className="mb-8 max-w-3xl"
        />
        <Reveal>
          <div className="overflow-hidden" style={{ border: "1px solid var(--ed-line)" }}>
            <div className="relative aspect-[16/10] md:aspect-[21/9]">
              <Image
                src={hero.src}
                alt={contentImageAlt(hero.src) || `Representative image: ${hero.label}`}
                fill
                sizes="(max-width: 768px) 100vw, 1024px"
                className="object-cover img-brand-grade"
              />
              <span className="absolute left-4 bottom-4 ed-small bg-background/85 px-2 py-1">
                {hero.label}
              </span>
            </div>
            {rooms.length > 0 && (
              <div
                className="grid grid-cols-2 md:grid-cols-4"
                style={{ borderTop: "1px solid var(--ed-line)" }}
              >
                {rooms.map((image) => (
                  <div
                    key={image.src}
                    className="relative aspect-[4/3]"
                    style={{ borderRight: "1px solid var(--ed-line)" }}
                  >
                    <Image
                      src={image.src}
                      alt={contentImageAlt(image.src) || `Representative image: ${image.label}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
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
            <div className="p-6 md:p-8">
              <h3 className="font-serif font-normal text-lg text-foreground mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

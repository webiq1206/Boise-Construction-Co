"use client";

import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GALLERY_PROJECTS, type GalleryProject } from "@/shared/galleryData";
import { CITIES } from "@/shared/contentData";

function cityDisplayName(slug: string) {
  return CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

function BeforeAfterCard({ project }: { project: GalleryProject }) {
  const cityName = cityDisplayName(project.city);

  return (
    <MarketingCard className="overflow-hidden p-0">
      <BeforeAfterSlider
        beforeSrc={project.beforeImageUrl}
        afterSrc={project.afterImageUrl}
        beforeAlt={`Before: ${project.title} in ${cityName}, Idaho`}
        afterAlt={`After: ${project.title} in ${cityName}, Idaho`}
        aspectClass="aspect-[4/3]"
      />
      <div className="p-5">
        <h3 className="font-sans font-normal text-sm mb-1 text-foreground">{project.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
      </div>
    </MarketingCard>
  );
}

interface ProjectGallerySectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export function ProjectGallerySection({ limit = 6, showViewAll = true }: ProjectGallerySectionProps) {
  const projects = GALLERY_PROJECTS.slice(0, limit);

  return (
    <Section id="gallery" divider>
      <div className="container px-4">
        <SectionHeader
          eyebrow="Our work"
          title="Transformations across the Treasure Valley"
          description="Explore recent kitchen, bathroom, whole-home, and addition projects. Drag any slider to compare before and after."
          className="mb-10 max-w-3xl"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <Reveal key={project.title} delay={i * 60}>
              <BeforeAfterCard project={project} />
            </Reveal>
          ))}
        </div>
        {showViewAll && (
          <div className="mt-10 text-center">
            <Button variant="brandOutline" asChild>
              <Link href="/testimonials">See more projects and reviews</Link>
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

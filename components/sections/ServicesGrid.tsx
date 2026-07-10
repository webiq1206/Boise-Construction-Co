import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { TextLink } from "@/components/marketing/TextLink";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/shared/contentData";
import { servicePath } from "@/lib/seo-routes";
import { CTA_SECONDARY } from "@/shared/ctaCopy";
import { getServiceBackground } from "@/shared/serviceBackgrounds";

export function ServicesGrid() {
  return (
    <Section id="services" divider>
      <div className="container px-4">
        <SectionHeader
          eyebrow="Our services"
          size="display"
          title={
            <>
              Design-build expertise for every major{" "}
              <em className="brc-accent text-accent">remodel</em>
            </>
          }
          description="Full design-build coordination under one roof, not piecemeal trades managed by multiple vendors. One team handles layout, permitting, and construction so your project stays aligned from start to finish."
        />

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {SERVICES.map((service, i) => (
            <Reveal key={service.slug} delay={i * 40}>
              <article className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-4">
                  <Image
                    src={getServiceBackground(service.slug)}
                    alt={`${service.name} project by Boise Remodeling Co`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    quality={70}
                    className="object-cover img-brand-grade transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="font-sans font-normal text-base mb-2 text-foreground">
                  {service.name}
                </h3>
                <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
                  {service.shortDescription}
                </p>
                <TextLink href={servicePath(service.slug)} showArrow>
                  Learn more
                </TextLink>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="brand" asChild>
            <a href="#calculator">{CTA_SECONDARY}</a>
          </Button>
        </div>
      </div>
    </Section>
  );
}

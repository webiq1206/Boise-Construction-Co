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
import { SITE_CONFIG } from "@/shared/siteConfig";

export function ServicesGrid() {
  // Homepage shows the primary services; secondary ones (lot evaluation, shop
  // homes, energy-efficient builds) live on their own pages and /services.
  const primary = SERVICES.filter((s) => !s.secondary);
  return (
    <Section id="services" divider>
      <div className="container px-4">
        <SectionHeader
          eyebrow="Our services"
          size="display"
          title={
            <>
              Every way there is to{" "}
              <em className="brc-accent">build</em>
            </>
          }
          description="Design, engineering, permitting, and construction under one roof, not a designer and a builder pointing at each other. One team from the first sketch to the day you get the keys."
        />

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {primary.map((service, i) => (
            <Reveal key={service.slug} delay={i * 40}>
              <article className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-4">
                  <Image
                    src={getServiceBackground(service.slug)}
                    alt={`${service.name} by ${SITE_CONFIG.name} in the Treasure Valley, Idaho`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    quality={70}
                    className="object-cover img-brand-grade transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="font-sans font-normal text-base mb-2 text-foreground">
                  {service.name}
                </h3>
                <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
                  {service.shortDescription}
                </p>
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Planning from
                  </span>
                  <span className="brc-display-num text-foreground text-base leading-none">
                    {service.planningFrom}
                  </span>
                </div>
                <TextLink href={servicePath(service.slug)} showArrow ariaLabel={`Learn more about ${service.name}`}>
                  Learn more
                </TextLink>
              </article>
            </Reveal>
          ))}

          {/* CTA card fills the final grid cell so an odd service count never
              leaves a lonely card, and gives the section a clear next step. */}
          <Reveal delay={primary.length * 40}>
            <div className="h-full min-h-[220px] rounded-sm border border-card-border bg-card p-6 md:p-8 flex flex-col justify-center">
              <div className="brc-label mb-3">Not sure where to start</div>
              <h3 className="font-sans font-light text-xl md:text-2xl tracking-tight mb-2 text-foreground">
                Tell us what you want to <em className="brc-accent">build</em>
              </h3>
              <p className="text-sm leading-relaxed mb-5 text-muted-foreground">
                Every home starts with a free planning consultation and an honest budget band, with no obligation.
              </p>
              <Button variant="brand" className="self-start" asChild>
                <a href="#consult">{CTA_SECONDARY}</a>
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Button variant="brandOutline" asChild>
            <a href="/services">Explore all services</a>
          </Button>
          <TextLink href="#consult">{CTA_SECONDARY}</TextLink>
        </div>
      </div>
    </Section>
  );
}

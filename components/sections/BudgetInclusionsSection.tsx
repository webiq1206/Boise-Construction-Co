import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ArrowRight, Check } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { Hairline } from "@/components/marketing/Hairline";
import {
  BUDGET_GUIDANCE_POINTS,
  STANDARD_INCLUSIONS,
  OPTIONAL_ENHANCEMENTS,
} from "@/shared/siteContent";
import { SITE_IMAGES } from "@/shared/siteImages";
import { Button } from "@/components/ui/button";
import { CTA_SECONDARY } from "@/shared/ctaCopy";

export function BudgetInclusionsSection() {
  return (
    <Section
      id="budget"
      variant="canvas"
      divider
      className="section-light relative overflow-hidden"
    >
      {/* This is the page's deliberate light "breather." It rides on a warm bone
          ground (see .section-light) so the dark estimator above it is not
          followed by yet another near-black band. A faint island-detail crop
          keeps it from reading flat while the copy stays fully legible. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Image
          src={SITE_IMAGES.budgetDetail}
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover opacity-[0.05] img-brand-grade"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-greige via-surface-greige/70 to-surface-greige" />
      </div>
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Budget and scope"
            size="display"
            title={
              <>
                What your number actually{" "}
                <em className="brc-accent">covers</em>
              </>
            }
            description="A planning range upfront, a line-item budget before we break ground, and the same standard inclusions on every home, so you always know where things stand."
            className="mb-0"
          />

          <Hairline className="mt-8 mb-12" />

          <div className="grid md:grid-cols-2 gap-12 md:gap-0">
            <Reveal>
              <div className="space-y-8 md:pr-16">
                {BUDGET_GUIDANCE_POINTS.map((point) => (
                  <div key={point.title}>
                    <h3 className="font-sans font-normal text-sm mb-2 text-foreground">
                      {point.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="md:border-l md:border-border md:pl-16">
                <h3 className="font-sans font-normal text-sm mb-5 text-foreground">
                  Included on every home we build
                </h3>
                <ul className="space-y-3 mb-10">
                  {STANDARD_INCLUSIONS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent-legible" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-8 border-t border-border">
                  <p className="text-[11px] tracking-[0.12em] uppercase font-normal text-muted-foreground mb-3">
                    Optional enhancement
                  </p>
                  <h3 className="font-sans font-normal text-sm mb-2 text-foreground">
                    {OPTIONAL_ENHANCEMENTS.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
                    {OPTIONAL_ENHANCEMENTS.body}
                  </p>
                  <p className="text-xs mb-4 text-muted-foreground/80">
                    {OPTIONAL_ENHANCEMENTS.note}
                  </p>
                  <a
                    href="#consult"
                    className="inline-flex items-center gap-2 text-sm font-normal text-foreground hover:text-muted-foreground transition-colors"
                  >
                    Ask about visualizations
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <Button variant="brandOutline" asChild>
              <a href="#consult">{CTA_SECONDARY}</a>
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

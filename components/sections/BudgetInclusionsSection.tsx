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
import { Button } from "@/components/ui/button";
import { CTA_PRIMARY } from "@/shared/ctaCopy";

export function BudgetInclusionsSection() {
  return (
    <Section id="budget" variant="inverse" divider>
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Budget and scope"
            inverse
            size="display"
            title={
              <>
                Clear guidance on what to{" "}
                <em className="brc-accent text-accent">expect</em>
              </>
            }
            description="Planning ranges upfront, a written scope before construction, and standard inclusions on every project, so you always know where things stand."
            className="mb-0"
          />

          <Hairline inverse className="mt-8 mb-12" />

          <div className="grid md:grid-cols-2 gap-12 md:gap-0">
            <Reveal>
              <div className="space-y-8 md:pr-16">
                {BUDGET_GUIDANCE_POINTS.map((point) => (
                  <div key={point.title}>
                    <h3 className="font-sans font-normal text-sm mb-2 text-inverse-foreground">
                      {point.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-inverse-muted">{point.body}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="md:border-l md:border-inverse-foreground/15 md:pl-16">
                <h3 className="font-sans font-normal text-sm mb-5 text-inverse-foreground">
                  Included on every project
                </h3>
                <ul className="space-y-3 mb-10">
                  {STANDARD_INCLUSIONS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-inverse-muted"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-8 border-t border-inverse-foreground/15">
                  <p className="text-[11px] tracking-[0.12em] uppercase font-normal text-inverse-muted mb-3">
                    Optional enhancement
                  </p>
                  <h3 className="font-sans font-normal text-sm mb-2 text-inverse-foreground">
                    {OPTIONAL_ENHANCEMENTS.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-3 text-inverse-muted">
                    {OPTIONAL_ENHANCEMENTS.body}
                  </p>
                  <p className="text-xs mb-4 text-inverse-muted/80">
                    {OPTIONAL_ENHANCEMENTS.note}
                  </p>
                  <a
                    href="#consult"
                    className="inline-flex items-center gap-2 text-sm font-normal text-inverse-foreground hover:text-inverse-muted transition-colors"
                  >
                    Ask about visualizations
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <Button variant="brand" asChild>
              <a href="#consult">{CTA_PRIMARY}</a>
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

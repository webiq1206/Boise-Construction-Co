import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { Hairline } from "@/components/marketing/Hairline";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { VALUE_MODEL } from "@/shared/siteContent";
import { CTA_PRIMARY } from "@/shared/ctaCopy";

/**
 * "Where your money goes" value section. Contrasts the overhead a customer is
 * NOT paying for against what their investment actually buys, then closes on the
 * reusable value tagline. Copy lives in shared/siteContent.ts (VALUE_MODEL).
 */
export function ValueOverheadSection() {
  return (
    <Section id="value" divider>
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow={VALUE_MODEL.eyebrow}
            size="display"
            title={
              <>
                {VALUE_MODEL.statement}{" "}
                <em className="brc-accent">{VALUE_MODEL.accentWord}</em>.
              </>
            }
            description={VALUE_MODEL.lead}
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-0 mt-2">
            <Reveal>
              <div className="md:pr-14">
                <p className="brc-label mb-5">{VALUE_MODEL.avoidLabel}</p>
                <ul className="space-y-3">
                  {VALUE_MODEL.avoid.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <X className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-50" aria-hidden="true" />
                      <span className="line-through decoration-muted-foreground/40">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="md:border-l md:border-border md:pl-14">
                <p className="brc-label mb-5">{VALUE_MODEL.investLabel}</p>
                <ul className="space-y-3">
                  {VALUE_MODEL.invest.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent-legible" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Hairline className="mt-12 mb-8" />

          <Reveal>
            <div className="max-w-2xl">
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-4">
                {VALUE_MODEL.closer}
              </p>
              <p className="font-sans font-light text-2xl md:text-3xl lg:text-[2.5rem] leading-[1.1] tracking-tight text-foreground">
                {VALUE_MODEL.taglineLead}{" "}
                <em className="brc-accent">{VALUE_MODEL.taglineAccent}</em>.
              </p>
            </div>
            <div className="mt-8">
              <Button variant="brand" asChild>
                <a href="#calculator">{CTA_PRIMARY}</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

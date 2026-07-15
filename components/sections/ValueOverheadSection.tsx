import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { VALUE_MODEL } from "@/shared/siteContent";
import { CTA_PRIMARY } from "@/shared/ctaCopy";

/**
 * "Where your money goes" value band. Placed just before the estimator so it
 * frames the pricing conversation: lean overhead means more of the budget lands
 * in the home. Confident editorial voice; copy lives in shared/siteContent.ts.
 */
export function ValueOverheadSection() {
  return (
    <Section id="value" divider>
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="brc-label mb-6">{VALUE_MODEL.eyebrow}</div>
          <Reveal>
            <h2 className="font-sans font-light text-[2rem] md:text-[3rem] lg:text-[3.25rem] leading-[1.06] tracking-tight text-foreground">
              {VALUE_MODEL.headlineA}
              <br />
              {VALUE_MODEL.headlineB}{" "}
              <em className="brc-accent">{VALUE_MODEL.accentWord}</em>.
            </h2>

            <div className="mt-8 h-px w-16 bg-accent-legible" />

            <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-foreground/90">
              {VALUE_MODEL.costs}
            </p>
            <p className="mt-3 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
              {VALUE_MODEL.costsBody} {VALUE_MODEL.reframe}
            </p>

            <p className="mt-8 font-sans font-light text-2xl md:text-3xl tracking-tight text-foreground">
              {VALUE_MODEL.taglineLead}{" "}
              <em className="brc-accent">{VALUE_MODEL.taglineAccent}</em>.
            </p>

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

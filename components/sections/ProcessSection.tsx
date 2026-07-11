import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { DisplayNum, Section } from "@/components/marketing";
import { HOW_WE_BUILD_STEPS } from "@/shared/siteContent";
import { GALLERY_IMAGES } from "@/shared/siteImages";
import { GRAIN_URL } from "@/lib/grain";

export function ProcessSection() {
  return (
    <Section id="how-we-build" variant="greige" spacing="none" divider className="p-0">
      <div className="grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:block relative min-h-[380px] md:min-h-[560px] overflow-hidden">
          <Image
            src={GALLERY_IMAGES.outdoor.after}
            alt="Finished outdoor living space by Boise Remodeling Co in the Treasure Valley"
            fill
            loading="lazy"
            sizes="50vw"
            className="object-cover img-brand-grade"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-inverse/55 via-inverse/35 to-inverse/85" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat", opacity: 0.028 }}
          />
          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <div className="brc-label mb-3 text-inverse-muted">How We Build</div>
            <p className="font-sans font-light text-xl md:text-2xl text-inverse-foreground">
              Free in-home visit
              <br />
              to final walkthrough
            </p>
          </div>
        </div>

        <div className="section-y-sm px-8 md:px-14 lg:px-16 bg-card border-l border-border">
          <Reveal>
            <div className="brc-label mb-5">Our process</div>
            <h2 className="font-sans font-light text-[2rem] md:text-[2.5rem] lg:text-[2.75rem] leading-[1.08] tracking-tight mb-10 text-foreground">
              From first visit to{" "}
              <em className="brc-accent">final walkthrough</em>
            </h2>
            <div className="space-y-0">
              {HOW_WE_BUILD_STEPS.map((step, i) => (
                <div
                  key={step.number}
                  className={`flex gap-5 py-6 ${i < HOW_WE_BUILD_STEPS.length - 1 ? "border-b border-border" : ""}`}
                >
                  <DisplayNum className="text-2xl w-8 flex-shrink-0 leading-none mt-0.5 text-accent-legible">
                    {step.number}
                  </DisplayNum>
                  <div>
                    <p className="font-normal text-sm mb-1 text-foreground">{step.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

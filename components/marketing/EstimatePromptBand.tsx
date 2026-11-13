import { Section } from "./Section";
import { Reveal } from "@/components/Reveal";
import { HeroTextLink, PrimaryCta } from "@/components/approved/PrimaryCta";
import { CTA_PRIMARY, CTA_QUOTE } from "@/shared/ctaCopy";
import { INSTANT_ESTIMATE_PATH, QUOTE_REQUEST_PATH } from "@/shared/instantEstimate";

interface EstimatePromptBandProps {
  eyebrow?: string;
  title: React.ReactNode;
  description: string;
  /** Kept for callers; both now render on the family's gradient ground. */
  variant?: "greige" | "tint" | "canvas";
  /** Optional bullet trust points shown beside the CTA on md+. */
  bullets?: string[];
  /** Optional estimator URL for a service-specific starting point. */
  href?: string;
}

/**
 * Contextual estimator prompt for service, area and content pages.
 * Opens the family's instant estimator at /instant-estimate (owner decision,
 * 13 November 2026); callers can provide a service-specific destination. The
 * quote request sits beside it as the path to a person.
 *
 * WAS a card inside a card: a bordered panel with an icon box, a left accent
 * rule and a 36px heading, centred in a 1024px container on a band the same
 * value as its neighbours. It read as a widget.
 *
 * NOW a statement band. The brief asked for large statement sections, and a
 * single prompt with one action is exactly the content that suits one: display
 * heading, a short lede, the CTA. It sits on the family's gradient ground - the
 * one accent-tinted surface on the page - so it marks a pause between the work
 * and the reasons, rather than being another box in a column of boxes.
 */
export function EstimatePromptBand({
  eyebrow = "Planning your budget",
  title,
  description,
  href = INSTANT_ESTIMATE_PATH,
  bullets = [
    "Free and open day or night",
    "No appointment needed to see your range",
    "A preliminary range now, a firm written proposal after we visit",
  ],
}: EstimatePromptBandProps) {
  return (
    <Section surface="gradient" spacing="lg" edge>
      <div className="ed-shell">
        <div className="ed-split ed-split-end">
          <Reveal>
            <p className="ed-eyebrow ed-eyebrow-accent">{eyebrow}</p>
            <h2 className="ed-h2 ed-statement-wide">{title}</h2>
          </Reveal>

          <Reveal delay={80}>
            <div className="flex flex-col items-start gap-6">
              <p className="ed-body">{description}</p>
              <div className="interior-hero-actions">
                <PrimaryCta href={href} trackingLocation="estimate_prompt_band">{CTA_PRIMARY}</PrimaryCta>
                <HeroTextLink href={QUOTE_REQUEST_PATH}>{CTA_QUOTE}</HeroTextLink>
              </div>
              <p className="ed-small">Free · A preliminary range, not a final price</p>
            </div>
          </Reveal>
        </div>

        {bullets.length > 0 && (
          <Reveal delay={120}>
            <ul
              className="ed-matrix mt-[clamp(40px,5vw,72px)] list-none p-0"
              style={{ ["--ed-cols" as string]: Math.min(bullets.length, 3), ["--ed-cell-h" as string]: "0" }}
            >
              {bullets.map((b, i) => (
                <li key={b} style={{ maxWidth: "none", margin: 0 }} className="ed-body flex items-start gap-4 text-[0.875rem]">
                  <span className="ed-small shrink-0 pt-1" style={{ color: "var(--ed-accent)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </Section>
  );
}

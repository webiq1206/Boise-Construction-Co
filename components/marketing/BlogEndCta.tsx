import { Section } from "./Section";
import { HeroTextLink } from "@/components/approved/PrimaryCta";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { EstimateCTA } from "@/components/modals/EstimateCTA";
import { BusinessPhoneLink } from "@/components/BusinessPhoneContact";
import { SaveContactLink } from "@/components/SaveContactLink";

/**
 * The closing ask on every article, guide and area page.
 *
 * WAS a dark card centred in a 896px column - a box at the end of a page. NOW
 * the same gradient statement band every other page closes on. It is a full-
 * width band, so callers render it bare - not inside a page container. A first
 * cut pulled it out of the container with a negative margin instead; measured,
 * that overflowed the viewport by 24px on the areas page at every width.
 */
export function BlogEndCta() {
  return (
    <Section surface="gradient" spacing="xl" edge>
      <div className="ed-shell">
        <div className="ed-split ed-split-center">
          <div>
            <p className="ed-eyebrow ed-eyebrow-accent">Start your project</p>
      <h2 className="ed-h2 ed-statement">
        Ready to start your project?
      </h2>
      </div>
      <div>
      <p className="ed-body">
        Get a preliminary planning range online, then book a free in-home visit when you&apos;re
        ready. No obligation, no pressure.
      </p>
      {/* One primary; the visit, call and text are quiet text actions. Four
          equal-looking actions with two of them filled competed for the click. */}
      <div className="mt-8 interior-hero-actions">
        <EstimateCTA variant="brand" data-testid="link-bottom-cta-estimate">
          {CTA_PRIMARY}
        </EstimateCTA>
        <HeroTextLink href="/contact#consult">Book a free visit</HeroTextLink>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
        <BusinessPhoneLink data-testid="link-bottom-cta-call" className="hero-text-link">Call {SITE_CONFIG.phone}</BusinessPhoneLink>
        <a href={SITE_CONFIG.phoneSmsHref} data-testid="link-bottom-cta-text" className="hero-text-link">
          Text us
        </a>
        <SaveContactLink className="text-xs text-inverse-muted hover:text-inverse-foreground transition-colors">
          Save to contacts
        </SaveContactLink>
      </div>
    </div>
        </div>
      </div>
    </Section>
  );
}

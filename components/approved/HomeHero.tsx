import { HeroBackgroundVideo } from "./HeroBackgroundVideo";
import { FamilyButton } from "@/components/family/Button";
import { brandStyle } from "@/components/family/brandStyle";
import { ProofStrip } from "@/components/family/ProofStrip";
import { FAMILY_BRAND } from "@/lib/familyBrand";
import {
  CONTRACTOR_LICENSE_SEARCH_URL,
  CONTRACTOR_REGISTRATION_LABEL,
} from "@/shared/contractorRegistration";

const HERO_POSTER = "/images/construction/boise-construction-co-poster.jpg";

/** Construction-owned media, preserving the existing family hero content and styles. */
export function HomeHero() {
  return (
    <>
      <div className="home-hero pt-0" data-p5-hero="">
        <section className="fam-hero" data-family-hero="" data-fit="viewport" data-desktop-from={FAMILY_BRAND.header.desktopFrom} style={brandStyle()} aria-labelledby="family-hero-title">
          <link rel="preload" as="image" href={HERO_POSTER} fetchPriority="high" />
          <HeroBackgroundVideo />
          <div className="fam-hero-scrim" aria-hidden="true" />
          <div className="fam-hero-inner">
            <div className="fam-hero-copy">
              <p className="fam-hero-eyebrow">Custom home building · Treasure Valley</p>
              <h1 className="fam-hero-title" id="family-hero-title">Custom home builder in Boise. <span className="fam-hero-accent">Built around you.</span></h1>
              <p className="fam-hero-support">From bare lot to the keys, one accountable team.</p>
              <div className="fam-hero-actions">
                <FamilyButton href={FAMILY_BRAND.cta.href} variant="hero" size="lg" data-hero-cta="primary" data-cta="primary">{FAMILY_BRAND.cta.label}</FamilyButton>
                <a href={FAMILY_BRAND.phone.telHref} className="fam-hero-link">Call or text {FAMILY_BRAND.phone.display}</a>
              </div>
              <p className="fam-hero-micro">We answer your questions, start to finish.</p>
            </div>
          </div>
        </section>
      </div>
      {/* Facts this site already publishes, nothing new: the line-item budget, the
          Friday updates, one accountable team, and the DOPL-linked registration. */}
      <ProofStrip
        items={[
          { label: "Budget", text: "Line-item budget before construction" },
          { label: "Updates", text: "Written updates every Friday" },
          { label: "One team", text: "One accountable design-build team" },
          {
            label: "Registered",
            text: CONTRACTOR_REGISTRATION_LABEL,
            href: CONTRACTOR_LICENSE_SEARCH_URL,
            linkTitle: 'Idaho contractor registration details',
            linkLabel: `${CONTRACTOR_REGISTRATION_LABEL}, opens in a new tab`,
            newTab: true,
          },
        ]}
      />
    </>
  );
}

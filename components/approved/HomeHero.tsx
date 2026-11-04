import { HeroPhoto } from "@/components/family/HeroPhoto";
import { ProofStrip } from "@/components/family/ProofStrip";
import { FAMILY_BRAND } from "@/lib/familyBrand";
import {
  CONTRACTOR_LICENSE_SEARCH_URL,
  CONTRACTOR_REGISTRATION_LABEL,
} from "@/shared/contractorRegistration";
import { contentImageAlt } from "@/shared/imageAlts";

const HERO_SRC = "/family/construction-custom-home-exterior.webp";

/**
 * Homepage hero on the shared family HeroPhoto (draft-hero.md, Boise
 * Construction Co: already the closest to the template; one support line, the
 * ochre second line, a lower horizon on phones). Same H1 words as before, same
 * photograph, one primary to the quote wizard, the phone as the one text link,
 * and the response-time line that was already published here.
 *
 * The phone crop is cut from the same
 * file with the sky trimmed, so the house fills the clear upper part of the screen.
 *
 * The wrapper carries pt-0: app/family.css gives the first block of every page
 * clearance under the header, and this photograph starts flush under it.
 *
 * Server-rendered, so the image and the H1 are in the first HTML.
 */
export function HomeHero() {
  return (
    <>
      <div className="home-hero pt-0" data-p5-hero="">
        {/* Both files are already sized WebP (1280x720 at 137 KB, 780x1040 at 47 KB), so they
            are served as is. A /_next/image request for a hero crop can stall and hold the
            page's load event open, as it did on Boise Remodeling Co. */}
        <HeroPhoto
          fit="viewport"
          image={{
            src: HERO_SRC,
            width: 1280,
            height: 720,
            position: "58% 50%",
            unoptimized: true,
            alt: contentImageAlt(HERO_SRC),
          }}
          phoneImage={{
            src: "/family/construction-custom-home-exterior-phone.webp",
            width: 780,
            height: 1040,
            position: "42% 0%",
            unoptimized: true,
          }}
          eyebrow="Custom home building · Treasure Valley"
          title="Custom home builder in Boise."
          titleAccent="Built around you."
          support="From bare lot to the keys, one accountable team."
          primary={{ label: FAMILY_BRAND.cta.label, href: FAMILY_BRAND.cta.href }}
          link={{ label: `Call or text ${FAMILY_BRAND.phone.display}`, href: FAMILY_BRAND.phone.telHref }}
          microcopy="Our team replies within one business day."
        />
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

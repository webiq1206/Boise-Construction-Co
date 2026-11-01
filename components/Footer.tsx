import { SiteFooter } from "@/components/family/SiteFooter";
import { PARENT_GOOGLE_PROFILE } from "@/lib/familyBrand";
import Link from "next/link";

/**
 * Boise Construction Co footer: the shared family SiteFooter, set up by
 * lib/familyBrand.ts. Everything this site's footer carried is there: every
 * service, the pillar guides, the guides and downloads hubs, the blog, about,
 * warranty and contact, every service area, the phone, text and email, Save
 * our contact, the P5 Home Co Facebook page, the public NAP line with hours,
 * the DOPL-linked registration line, the DBA disclosure and the legal links,
 * plus the P5 Home Co family row (rel="noopener", no noreferrer, so sibling
 * analytics see the referral).
 *
 * Brand-owned extras go in the brand column through brandExtra, never by
 * editing the shared component: the Boise ADU Co note (its projects run
 * through this company until its own site exists) and the P5 Home Co Google
 * Business Profile, which belongs to the parent and sits beside its Facebook page.
 */
export function Footer() {
  return (
    <SiteFooter
      brandExtra={
        <>
          {PARENT_GOOGLE_PROFILE.href ? (
            <ul className="fam-footer-contact">
              <li>
                <a href={PARENT_GOOGLE_PROFILE.href} rel="noopener" target="_blank" data-testid="link-footer-google">
                  {PARENT_GOOGLE_PROFILE.label}
                </a>
              </li>
            </ul>
          ) : null}
          <p className="fam-footer-tagline footer-adu-note" data-testid="footer-adu-note">
            Boise ADU Co projects currently run through Boise Construction Co; its site is coming.{" "}
            <Link href="/services/adu">ADUs &amp; guest houses</Link>
          </p>
        </>
      }
    />
  );
}

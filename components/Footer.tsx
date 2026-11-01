import { SiteFooter } from "@/components/family/SiteFooter";
import Link from "next/link";

/**
 * Boise Construction Co footer: the shared family SiteFooter, set up by
 * lib/familyBrand.ts. Everything this site's footer carried is there: every
 * service, the pillar guides, the guides and downloads hubs, the blog, about,
 * warranty and contact, every service area, the phone, text and email, Save
 * our contact, the P5 Home Co Facebook page and Google Business Profile, the
 * public NAP line with hours, the DOPL-linked registration line, the DBA
 * disclosure and the legal links, plus the P5 Home Co family row
 * (rel="noopener", no noreferrer, so sibling analytics see the referral).
 *
 * Brand-owned extras go in the brand column through brandExtra, never by
 * editing the shared component: the Boise ADU Co note (its projects run
 * through this company until its own site exists).
 */
export function Footer() {
  return (
    <SiteFooter
      brandExtra={
        <p className="fam-footer-tagline footer-adu-note" data-testid="footer-adu-note">
          Boise ADU Co projects currently run through Boise Construction Co; its site is coming.{" "}
          <Link href="/services/adu">ADUs &amp; guest houses</Link>
        </p>
      }
    />
  );
}

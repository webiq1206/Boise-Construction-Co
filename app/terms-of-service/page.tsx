import { InteriorDocument,InteriorPage } from '@/components/approved/InteriorLayout';
import { BusinessPhoneLink } from "@/components/BusinessPhoneContact";
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail";
import { SaveContactLink } from "@/components/SaveContactLink";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical,FEED_ALTERNATES } from "@/lib/page-metadata";
import { generateBreadcrumbSchema,generateWebPageSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { Metadata } from "next";

export const metadata: Metadata = withBrandPageMetadata(({
  title: "Terms of Service",
  description: "Terms of service for Boise Construction Co. Your rights when using our home building services across Boise and the Treasure Valley.",
  alternates: {
    canonical: buildCanonical("/terms-of-service"),
    types: FEED_ALTERNATES,
  },
  openGraph: {
    title: "Terms of Service | Boise Construction Co",
    description: "Your rights when using Boise Construction Co home building services in Idaho's Treasure Valley.",
    url: buildCanonical("/terms-of-service"),
    type: "website",
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: "Boise Construction Co" }],
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Boise Construction Co",
    description: "Your rights when using Boise Construction Co home building services in Idaho's Treasure Valley.",
  },
}), "/terms-of-service");

export default function TermsOfServicePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Terms of Service", url: "/terms-of-service" },
  ]);
  const webPageSchema = generateWebPageSchema({
    title: "Terms of Service",
    description: "Terms of service for Boise Construction Co. Your rights and responsibilities when using our services.",
    url: "/terms-of-service",
  });

  return (
    <InteriorPage kind="legal"><div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <InteriorDocument heading={<h1>Terms of service for Boise Construction Co</h1>} contents={[{"id":"document-section-1","label":"Agreement to terms"},{"id":"document-section-2","label":"Services"},{"id":"document-section-3","label":"Scope, pricing and changes"},{"id":"document-section-4","label":"Payment terms"},{"id":"document-section-5","label":"Consultations and paid planning"},{"id":"document-section-6","label":"Scheduling and cancellation"},{"id":"document-section-7","label":"Property access"},{"id":"document-section-8","label":"Subcontracting"},{"id":"document-section-9","label":"Workmanship warranty"},{"id":"document-section-10","label":"Limitation of liability"},{"id":"document-section-11","label":"Changes to terms"},{"id":"document-section-12","label":"Contact information"}]}>

            <p className="lead text-muted-foreground">
              Last updated November 8, 2026
            </p>

            <h2 id="document-section-1">Agreement to terms</h2>
            <p>
              Boise Construction Co is a brand of P5 Home Co LLC ("Company," "we," "us," or "our"). These Terms of Service are a general summary of how we work. Your signed agreement with us controls your project. If anything on this page differs from your signed agreement, the signed agreement governs, and these terms do not change any agreement you have already signed.
            </p>

            <h2 id="document-section-2">Services</h2>
            <p>
              Boise Construction Co provides new residential construction services, including custom and semi-custom home building, design-build services, and builds on client-owned land, to customers in the Treasure Valley area of Idaho.
            </p>

            <h2 id="document-section-3">Scope, pricing and changes</h2>
            <ul>
              <li>Scope and price are set in writing before work begins</li>
              <li>Planning ranges and estimates on this website are starting points, not bids</li>
              <li>Changes to scope, price or schedule are agreed in writing before the affected work is done or the affected items are ordered</li>
            </ul>

            <h2 id="document-section-4">Payment terms</h2>
            <ul>
              <li>Payments are made at the milestones set out in the payment schedule in your signed agreement</li>
              <li>We accept major credit cards, checks, and electronic payments</li>
              <li>Late payments may incur additional fees as stated in your agreement</li>
            </ul>

            <h2 id="document-section-5">Consultations and paid planning</h2>
            <ul>
              <li>The first conversation and project review are free</li>
              <li>Paid planning, design or feasibility work begins only after you approve its scope and price in writing</li>
            </ul>

            <h2 id="document-section-6"><span className="heading-balance-tail">Scheduling</span> and cancellation</h2>
            <ul>
              <li>Service schedules are weather-dependent and may be adjusted as needed</li>
              <li>We will make reasonable efforts to notify you of schedule changes</li>
              <li>Cancellation of scheduled services requires 24-hour advance notice</li>
              <li>Special-order and custom items may not be cancellable once ordered; we tell you which items this applies to before you approve them</li>
            </ul>

            <h2 id="document-section-7">Property access</h2>
            <p>
              By engaging our services, you grant us permission to access your property as necessary to perform the agreed-upon work. Please ensure gates are unlocked and pets are secured on service days.
            </p>

            <h2 id="document-section-8">Subcontracting</h2>
            <p>
              Boise Construction Co may subcontract parts of the work, such as licensed plumbing, electrical or HVAC, as needed to deliver the agreed scope. At the end of every project we provide a complete list of the subcontractors who worked on it, with their contact information.
            </p>

            <h2 id="document-section-9">Workmanship warranty</h2>
            <ul>
              <li>Work performed by our own team carries a one-year workmanship warranty from documented Final Completion, as defined in your signed agreement</li>
              <li>Work performed by subcontractors is covered by that subcontractor&apos;s own warranty</li>
              <li>Manufacturer and product warranties are separate and follow each maker&apos;s terms</li>
              <li>Formal warranty notice is given using the method stated in your signed agreement</li>
            </ul>
            <p>
              See our <a href="/warranty" className="text-primary hover:underline">warranty page</a> for what is covered and how to get help with a completed project.
            </p>

            <h2 id="document-section-10">Limitation of liability</h2>
            <p>
              While we take great care in providing our services, Boise Construction Co's liability for any claims arising from our services is limited to the amount paid for the specific service in question. We are not liable for pre-existing conditions, normal wear, or conditions outside our control.
            </p>

            <h2 id="document-section-11">Changes to terms</h2>
            <p>
              We may update these terms at any time. Changes are effective when posted to our website and do not change a signed agreement.
            </p>

            <h2 id="document-section-12">Contact information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>Email: <ObfuscatedEmail user="hello" domain="boiseconstruction.co" className="text-primary hover:underline inline-flex items-center gap-1" showIcon={false} /></li>
              <li>
                Phone: <BusinessPhoneLink className="text-primary hover:underline" />{" "}
                <span className="text-muted-foreground">·</span>{" "}
                <SaveContactLink className="text-primary hover:underline">Save to contacts</SaveContactLink>
              </li>
              <li>
                Text: <a href={SITE_CONFIG.phoneSmsHref} className="text-primary hover:underline">{SITE_CONFIG.phone}</a>{" "}
                <span className="text-muted-foreground">·</span>{" "}
                <SaveContactLink className="text-primary hover:underline">Save to contacts</SaveContactLink>
              </li>
              <li>Service area: {SITE_CONFIG.address.cityState} · {SITE_CONFIG.address.serviceArea}</li>
            </ul>
          </InteriorDocument>
        </div>
      </section>
    </div></InteriorPage>
  );
}

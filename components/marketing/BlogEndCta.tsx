import { ArrowRight, MessageSquare, Phone } from "lucide-react";
import { MarketingCard } from "./MarketingCard";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { ConsultCTA } from "@/components/modals/ConsultCTA";

export function BlogEndCta() {
  return (
    <MarketingCard className="cta-card-dark p-10 md:p-16 text-center max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-sans font-light tracking-tight mb-4 text-inverse-foreground">
        Ready to start your project?
      </h2>
      <p className="text-inverse-muted mb-8 max-w-lg mx-auto">
        Get an instant planning range in 60 seconds, then book a free in-home visit when you&apos;re
        ready. No obligation, no pressure.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <ConsultCTA variant="brand" size="lg" data-testid="link-bottom-cta-consult">
          {CTA_PRIMARY}
          <ArrowRight className="ml-2 h-5 w-5" />
        </ConsultCTA>
        <a
          href={SITE_CONFIG.phoneHref}
          data-testid="link-bottom-cta-call"
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-inverse-foreground/30 bg-inverse-foreground/10 px-4 py-2 min-h-11 text-sm font-normal text-inverse-foreground transition-colors hover-elevate"
        >
          <Phone className="h-4 w-4" />
          {SITE_CONFIG.phone}
        </a>
        <a
          href={SITE_CONFIG.phoneSmsHref}
          data-testid="link-bottom-cta-text"
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-inverse-foreground/30 bg-inverse-foreground/10 px-4 py-2 min-h-11 text-sm font-normal text-inverse-foreground transition-colors hover-elevate"
        >
          <MessageSquare className="h-4 w-4" />
          Text us
        </a>
      </div>
    </MarketingCard>
  );
}

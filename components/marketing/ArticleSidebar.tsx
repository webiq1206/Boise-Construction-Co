import { ArrowRight, Phone, Wrench } from 'lucide-react';
import { MarketingCard } from './MarketingCard';
import { GuideSidebarToc } from './GuideContentBlocks';
import type { TocHeading } from '@/lib/content-utils';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';

interface ArticleSidebarProps {
  tocHeadings: TocHeading[];
  ctaDescription?: string;
}

export function ArticleSidebar({
  tocHeadings,
  ctaDescription = 'Get an instant planning range for your project before you commit to anything.',
}: ArticleSidebarProps) {
  return (
    <>
      <GuideSidebarToc headings={tocHeadings} />
      <ArticleSidebarCta description={ctaDescription} />
    </>
  );
}

export function ArticleSidebarCta({ description }: { description: string }) {
  return (
    <MarketingCard className="cta-card-dark">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <Wrench className="h-5 w-5 text-inverse-foreground/60" />
          </div>
          <h3 className="font-normal text-sm text-inverse-foreground">Instant Estimate</h3>
        </div>
        <p className="text-sm text-inverse-muted">{description}</p>
        <ConsultCTA variant="brand" size="sm" className="w-full">
          {CTA_PRIMARY}
          <ArrowRight className="ml-2 h-4 w-4" />
        </ConsultCTA>
        <p className="text-xs text-inverse-muted text-center flex items-center justify-center gap-1">
          <Phone className="h-3 w-3" />
          {SITE_CONFIG.phone}
        </p>
      </div>
    </MarketingCard>
  );
}

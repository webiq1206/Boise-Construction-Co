import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Phone,
  Tag,
  User,
  BookOpen,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Chip } from './Chip';
import { BlogEndCta } from './BlogEndCta';
import { RelatedPostCards } from './RelatedPostCards';
import { Section } from './Section';
import { GuideContentBlocks, GuideJumpChips } from './GuideContentBlocks';
import { SectionedArticle } from './SectionedArticle';
import { ArticleSidebar, ArticleSidebarCta } from './ArticleSidebar';
import type { GuidePageData } from '@/shared/guideContent';
import { getBlogHeroImage, getBlogImageAlt } from '@/shared/blogImages';
import { BlogHeroBanner } from './BlogHeroBanner';
import {
  injectHeadingIds,
  extractHeadingsFromHtml,
  estimateReadingTime,
  countSubstantiveWords,
} from '@/lib/content-utils';
import { getHubBySlug, guidePath, getClustersForHub, categoryHubPath } from '@/shared/contentHubs';
import { CATEGORY_HUB_MIN_POSTS } from '@/shared/contentHubs';
import { getResourcesForGuide } from '@/shared/guideResources';
import { GuideResourceDownloads } from './GuideResourceDownloads';

interface GuidePageLayoutProps {
  guide: GuidePageData;
  formatDate: (date: string) => string;
}

export function GuidePageLayout({ guide, formatDate }: GuidePageLayoutProps) {
  const hub = getHubBySlug(guide.hubSlug);
  const heroImage = getBlogHeroImage(guide.slug, guide.heroImage);
  const heroAlt = getBlogImageAlt(guide.slug);
  const guideUrl = guidePath(guide.slug);
  const contentWithIds = injectHeadingIds(guide.content);
  const tocHeadings = extractHeadingsFromHtml(contentWithIds);
  const readingTime = estimateReadingTime(countSubstantiveWords(guide.content));
  const publishedClusters = getClustersForHub(guide.hubSlug, true);
  const resources = getResourcesForGuide(guide.slug);

  return (
    <div className="flex flex-col pb-20 md:pb-0">
      <BlogHeroBanner src={heroImage} alt={heroAlt} />

      <Section spacing="sm" className="pt-8 md:pt-10 pb-0">
        <div className="container px-4 max-w-6xl mx-auto">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Guides', href: '/guides' },
              { name: guide.title },
            ]}
          />

          <header className="max-w-3xl mb-8 md:mb-10 mt-2">
            {hub && <Chip className="mb-4">{hub.categoryLabel}</Chip>}
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-sans font-light tracking-tight text-foreground mb-4">
              {guide.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-5 max-w-2xl">{guide.excerpt}</p>
            <div role="presentation" className="border-t border-border/60 mb-5" />
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(guide.publishedAt)}
              </span>
              <span>{readingTime} min read</span>
              {guide.author && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {guide.author}
                </span>
              )}
            </div>
          </header>

          <GuideJumpChips headings={tocHeadings} />

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
            <div className="flex-1 min-w-0 w-full">
              <GuideContentBlocks
                quickAnswer={guide.quickAnswer}
                keyTakeaways={guide.keyTakeaways}
              >
                <GuideResourceDownloads resources={resources} />

                {publishedClusters.length > 0 && (
                  <div
                    className="rounded-lg border border-border bg-muted/20 p-5 md:p-6 mb-8"
                    data-testid="guide-cluster-links"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-accent" />
                      <h2 className="text-base font-normal">Go deeper in this guide</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Topic-specific articles - read these for detail beyond this overview.
                    </p>
                    <ul className="space-y-2">
                      {publishedClusters.slice(0, 8).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/blog/${c.replacesSlug ?? c.slug}`}
                            className="text-sm text-accent-legible hover:underline inline-flex items-center"
                          >
                            {c.title}
                            <ArrowRight className="ml-1 h-3 w-3 shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {publishedClusters.length >= CATEGORY_HUB_MIN_POSTS && hub && (
                      <Link
                        href={categoryHubPath(guide.hubSlug)}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mt-4"
                      >
                        View all in {hub.title}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                )}

                <SectionedArticle html={contentWithIds} testId="guide-content" />
              </GuideContentBlocks>

              {guide.faqs.length > 0 && (
                <section className="mt-12 pt-8 border-t border-border" data-testid="guide-faqs">
                  <p className="text-xs font-normal uppercase tracking-wider text-muted-foreground mb-3">
                    Common questions
                  </p>
                  <h2 className="text-xl md:text-2xl font-sans font-light tracking-tight text-foreground mb-6">
                    Frequently asked questions
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {guide.faqs.map((faq, i) => (
                      <AccordionItem
                        key={faq.question}
                        value={`faq-${i}`}
                        className="border-0 border-t border-border"
                      >
                        <AccordionTrigger className="text-left py-5 hover:no-underline font-sans font-normal text-sm text-foreground">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed pb-6 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {guide.tags && guide.tags.length > 0 && (
                <div className="mt-10 pt-8 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {guide.tags.map((tag) => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </div>
                </div>
              )}

              <div className="lg:hidden mt-10">
                <ArticleSidebarCta />
              </div>
            </div>

            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 sticky top-24 self-start">
              <ArticleSidebar tocHeadings={tocHeadings} />
            </aside>
          </div>
        </div>
      </Section>

      <Section spacing="sm" divider>
        <div className="container px-4 max-w-6xl mx-auto">
          <RelatedPostCards path={guideUrl} limit={8} />
        </div>
      </Section>

      <Section divider>
        <div className="container px-4">
          <BlogEndCta />
        </div>
      </Section>
    </div>
  );
}

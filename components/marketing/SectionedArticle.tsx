import {
  splitHtmlByH2,
  shouldUseCollapsibleSections,
} from '@/lib/split-article-sections';

interface SectionedArticleProps {
  html: string;
  /** How many sections stay expanded by default (long articles). */
  defaultOpenCount?: number;
  testId?: string;
  /** When true, never collapse — render the full article inline (guides). */
  forceExpanded?: boolean;
}

export function SectionedArticle({
  html,
  defaultOpenCount = 3,
  testId = 'article-content',
  forceExpanded = false,
}: SectionedArticleProps) {
  const sections = splitHtmlByH2(html);

  if (forceExpanded || !shouldUseCollapsibleSections(sections.length)) {
    return (
      <article className="blog-content prose-measure" data-testid={testId}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    );
  }

  return (
    <article className="prose-measure space-y-0" data-testid={testId}>
      {sections.map((section, index) => {
        const isOpen = index < defaultOpenCount;
        const label = section.headingText || 'Overview';

        if (!section.headingHtml) {
          return (
            <div
              key={`section-${index}`}
              className="blog-content pb-8 border-b border-border"
              dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
            />
          );
        }

        return (
          <details
            key={`section-${index}`}
            className="guide-section-details group border-b border-border"
            open={isOpen}
          >
            <summary className="guide-section-summary cursor-pointer list-none py-5 md:py-6 [&::-webkit-details-marker]:hidden">
              <div
                className="blog-content [&_h2]:mt-0 [&_h2]:mb-0 [&_h2]:text-xl md:[&_h2]:text-2xl flex items-start justify-between gap-4"
                dangerouslySetInnerHTML={{ __html: section.headingHtml }}
              />
              <span className="text-xs text-muted-foreground mt-1 block group-open:hidden">
                Tap to expand
              </span>
            </summary>
            <div
              className="blog-content pb-8 pt-0"
              dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
            />
          </details>
        );
      })}
    </article>
  );
}

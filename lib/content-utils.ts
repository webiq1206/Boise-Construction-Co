/** Utilities for guide/blog content rendering and QA */

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractHeadingsFromHtml(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<h([23])([^>]*)>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    if (!text) continue;
    /* Prefer the id actually on the heading. injectHeadingIds leaves authored
       ids alone, so re-slugifying from text here produced TOC links aimed at
       ids that never existed - every jump link on an authored-id article was
       dead until this matched. */
    const attrId = /\bid=["']([^"']+)["']/.exec(match[2])?.[1];
    headings.push({ id: attrId ?? slugifyHeading(text), text, level });
  }
  return headings;
}

export function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_full, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = slugifyHeading(text);
    if (/\bid=/.test(attrs)) return `<h${level}${attrs}>${inner}</h${level}>`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

/** Remove legacy SEO filler blocks before word count / reading time. */
export function stripSummaryBlocks(html: string): string {
  return html.replace(/<div class="summary-block">[\s\S]*?<\/div>/gi, '');
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').filter((w) => w.length > 0).length;
}

export function countSubstantiveWords(html: string): number {
  return countWords(stripSummaryBlocks(html));
}

export function countH2Headings(html: string): number {
  return (html.match(/<h2[^>]*>/gi) ?? []).length;
}

export function countInternalLinks(html: string): number {
  return (html.match(/href="\/(?:blog|guides|services|areas)[^"]*"/g) ?? []).length;
}

export function countCitiesMentioned(html: string, cities: readonly string[]): number {
  return cities.filter((c) => html.includes(c)).length;
}

export function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

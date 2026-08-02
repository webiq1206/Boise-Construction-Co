/* Temporary QA for the land-and-lots wave2 articles. Delete after use. */
import type { BlogPostData } from '../shared/blogContent';

const SLUGS = [
  'how-to-buy-a-buildable-lot-boise',
  'well-and-septic-cost-idaho',
  'lot-evaluation-checklist',
  'building-in-the-boise-foothills',
  'impact-fees-and-utility-connections',
];

const ALLOWED_PREFIXES = [
  '/guides/',
  '/services/',
  '/areas/',
  '/blog/',
  '/contact',
  '/#calculator',
  '/estimate',
  '/resources',
  '/about',
];

function words(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  let failures = 0;
  const fail = (slug: string, msg: string) => {
    failures++;
    console.log(`  FAIL [${slug}] ${msg}`);
  };

  for (const slug of SLUGS) {
    let mod: Record<string, unknown>;
    try {
      mod = await import(`../shared/content/wave2/${slug}`);
    } catch (e) {
      console.log(`  FAIL [${slug}] cannot import: ${(e as Error).message}`);
      failures++;
      continue;
    }
    const post = Object.values(mod)[0] as BlogPostData;
    const raw = JSON.stringify(post);

    if (raw.includes('\u2014')) fail(slug, 'contains em-dash U+2014');
    if (post.slug !== slug) fail(slug, `slug mismatch: ${post.slug}`);
    if (post.category !== 'Land & Lots') fail(slug, `category: ${post.category}`);
    if (post.hubSlug !== 'land-and-lots') fail(slug, `hubSlug: ${post.hubSlug}`);
    if (post.author !== 'Boise Construction Co') fail(slug, `author: ${post.author}`);
    if (post.heroImage !== `/images/blog/${slug}.webp`) fail(slug, `heroImage: ${post.heroImage}`);
    if (post.seoTitle.length > 60) fail(slug, `seoTitle ${post.seoTitle.length} chars`);
    const md = post.metaDescription.length;
    if (md < 140 || md > 158) fail(slug, `metaDescription ${md} chars`);
    const qa = post.quickAnswer ? words(post.quickAnswer) : 0;
    if (qa < 40 || qa > 60) fail(slug, `quickAnswer ${qa} words`);
    const kt = post.keyTakeaways?.length ?? 0;
    if (kt < 4 || kt > 6) fail(slug, `keyTakeaways ${kt}`);
    if (post.faqs.length < 5 || post.faqs.length > 7) fail(slug, `faqs ${post.faqs.length}`);
    post.faqs.forEach((f, i) => {
      const w = words(f.answer);
      if (w < 40 || w > 90) fail(slug, `faq ${i + 1} answer ${w} words`);
    });

    const wc = words(post.content);
    if (wc < 1600 || wc > 2200) fail(slug, `content ${wc} words`);

    const h2 = post.content.match(/<h2 id="[a-z0-9-]+">/g) ?? [];
    const h2all = post.content.match(/<h2/g) ?? [];
    if (h2.length !== h2all.length) fail(slug, 'h2 missing kebab id');
    if (h2.length < 8 || h2.length > 12) fail(slug, `h2 sections ${h2.length}`);

    const links = [...post.content.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    if (links.length < 4 || links.length > 8) fail(slug, `body links ${links.length}`);
    for (const l of links) {
      if (!ALLOWED_PREFIXES.some((p) => l.startsWith(p))) fail(slug, `bad link ${l}`);
      if (/remodel|kitchen-remodel|bathroom-remodel|testimonials|whole-home/.test(l))
        fail(slug, `forbidden link ${l}`);
    }
    if (!links.includes('/guides/buying-land-to-build-boise')) fail(slug, 'no pillar link');
    const sibling = links.some((l) => SLUGS.some((s) => l === `/blog/${s}` && s !== slug));
    if (!sibling) fail(slug, 'no sibling hub link');
    const closing = links.some((l) => l === '/contact' || l === '/#calculator');
    if (!closing) fail(slug, 'no /contact or /#calculator link');

    const strongCount = (post.content.match(/<strong>/g) ?? []).length;
    if (strongCount < h2.length - 1) fail(slug, `strong ${strongCount} < h2 ${h2.length}`);

    console.log(
      `[${slug}] ${wc} words | ${h2.length} H2 | ${links.length} links | seo ${post.seoTitle.length} | meta ${md} | qa ${qa}w | ${post.faqs.length} faqs | ${post.publishedAt}`,
    );
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} FAILURE(S)`);
}

main();

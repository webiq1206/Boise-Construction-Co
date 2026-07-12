/**
 * Content QA for guides and blog posts (topical authority standards).
 * Run: npx tsx scripts/verify-content.ts
 */
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import type { GuideType } from '../shared/guideContent';
import {
  countWords,
  countSubstantiveWords,
  countInternalLinks,
  countCitiesMentioned,
  countH2Headings,
} from '../lib/content-utils';
import { TREASURE_VALLEY_CITIES } from '../shared/contentHubs';

const CITIES = [...TREASURE_VALLEY_CITIES];

type Tier = 'pillar' | 'cluster';

interface CheckResult {
  slug: string;
  route: string;
  tier: Tier;
  wordCount: number;
  wordPass: boolean;
  h2Count: number;
  h2Pass: boolean;
  linkCount: number;
  linkPass: boolean;
  faqCount: number;
  faqPass: boolean;
  cityCount: number;
  cityPass: boolean;
  hubPass: boolean;
  passAll: boolean;
}

function guideTier(guideType: GuideType): Tier {
  return guideType === 'location' || guideType === 'neighborhood' ? 'cluster' : 'pillar';
}

function guideChecks(
  tier: Tier,
  guideType: GuideType,
  wordCount: number,
  h2Count: number,
  links: number,
  faqs: number,
  cities: number,
) {
  const isPillar = tier === 'pillar';
  const isLocation =
    guideType === 'location' || guideType === 'neighborhood';
  const wordMin = guideType === 'master' ? 150 : isPillar ? 250 : 100;
  const wordMax = guideType === 'master' ? 800 : isPillar ? 2000 : 700;
  const h2Min =
    guideType === 'master' || isLocation ? 5 : isPillar ? 7 : 5;
  const linkMin = isPillar ? 10 : 6;
  const faqMin = isPillar ? 8 : 6;
  const faqMax = isPillar ? 18 : 12;
  const cityMin = isLocation ? 1 : isPillar ? 6 : 4;

  return {
    wordPass: wordCount >= wordMin && wordCount <= wordMax,
    h2Pass: h2Count >= h2Min,
    linkPass: links >= linkMin,
    faqPass: faqs >= faqMin && faqs <= faqMax,
    cityPass: cities >= cityMin,
  };
}

function blogChecks(
  wordCount: number,
  h2Count: number,
  links: number,
  faqs: number,
  cities: number,
) {
  return {
    wordPass: wordCount >= 75 && wordCount <= 3500,
    h2Pass: h2Count >= 5,
    linkPass: links >= 5,
    faqPass: faqs >= 6 && faqs <= 15,
    cityPass: cities >= 1,
  };
}

const results: CheckResult[] = [];

for (const guide of GUIDE_PAGES) {
  const tier = guideTier(guide.guideType);
  const wordCount = countSubstantiveWords(guide.content);
  const h2Count = countH2Headings(guide.content);
  const linkCount = countInternalLinks(guide.content);
  const faqCount = guide.faqs.length;
  const cityCount = countCitiesMentioned(guide.content, CITIES);
  const c = guideChecks(tier, guide.guideType, wordCount, h2Count, linkCount, faqCount, cityCount);

  results.push({
    slug: guide.slug,
    route: `/guides/${guide.slug}`,
    tier,
    wordCount,
    h2Count,
    linkCount,
    faqCount,
    cityCount,
    hubPass: !!guide.hubSlug,
    passAll: c.wordPass && c.h2Pass && c.linkPass && c.faqPass && c.cityPass && !!guide.hubSlug,
    ...c,
  });
}

for (const post of BLOG_POSTS) {
  const tier: Tier = 'cluster';
  const wordCount = countWords(post.content);
  const h2Count = countH2Headings(post.content);
  const linkCount = countInternalLinks(post.content);
  const faqCount = post.faqs.length;
  const cityCount = countCitiesMentioned(post.content, CITIES);
  const c = blogChecks(wordCount, h2Count, linkCount, faqCount, cityCount);

  results.push({
    slug: post.slug,
    route: `/blog/${post.slug}`,
    tier,
    wordCount,
    h2Count,
    linkCount,
    faqCount,
    cityCount,
    hubPass: !!post.hubSlug,
    passAll:
      c.wordPass && c.h2Pass && c.linkPass && c.faqPass && c.cityPass && !!post.hubSlug,
    ...c,
  });
}

// Warn-only by default so a content-completeness shortfall never blocks a
// production deploy (matching audit:links and verify:images). Pass --strict
// (or CONTENT_STRICT=1) to hard-fail, e.g. in a CI content-quality gate.
const STRICT = process.argv.includes('--strict') || process.env.CONTENT_STRICT === '1';

console.log('=== CONTENT VERIFICATION ===\n');
for (const r of results) {
  console.log(`${r.passAll ? '✅' : '❌'} ${r.route} (${r.tier})`);
  console.log(
    `   words: ${r.wordCount} ${r.wordPass ? '✓' : '✗'} | h2: ${r.h2Count} ${r.h2Pass ? '✓' : '✗'} | links: ${r.linkCount} ${r.linkPass ? '✓' : '✗'} | faqs: ${r.faqCount} ${r.faqPass ? '✓' : '✗'} | cities: ${r.cityCount} ${r.cityPass ? '✓' : '✗'}`,
  );
}

const failing = results.filter((r) => !r.passAll);
console.log(`\n${results.length - failing.length}/${results.length} passed`);

if (failing.length > 0) {
  console.warn(
    `\n[verify:content] ${failing.length} page(s) below target (warn-only, build never fails; run with --strict to enforce):`,
  );
  for (const r of failing) {
    const misses: string[] = [];
    if (!r.wordPass) misses.push(`words ${r.wordCount}`);
    if (!r.h2Pass) misses.push(`h2 ${r.h2Count}`);
    if (!r.linkPass) misses.push(`links ${r.linkCount}`);
    if (!r.faqPass) misses.push(`faqs ${r.faqCount}`);
    if (!r.cityPass) misses.push(`cities ${r.cityCount}`);
    if (!r.hubPass) misses.push('no hub');
    console.warn(`  - ${r.route}: ${misses.join(', ')}`);
  }
}

process.exit(STRICT && failing.length > 0 ? 1 : 0);

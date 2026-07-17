/**
 * Generates local-seo-audit/01-url-audit.csv from /tmp/audit-url-data.json.
 * Scores are template-level rules derived from the June 2026 local SEO audit;
 * rationale for every score below 8 lives in local-seo-audit/01-url-audit.md.
 *
 * Run: npx tsx scripts/audit-url-matrix.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { CITIES, SERVICES, getServiceBySlug, getCityBySlug } from '../shared/contentData';

type Row = {
  url: string;
  pageType: string;
  title: string;
  city?: string;
  service?: string;
  hub?: string;
  wordCount?: number;
  faqCount?: number;
};

const rows: Row[] = JSON.parse(readFileSync('/tmp/audit-url-data.json', 'utf8'));

const NOINDEX = new Set(['/services/adu/kuna', '/services/adu/star', '/services/adu/middleton', '/services/adu/caldwell']);

const SERVICE_KEYWORD: Record<string, string> = {
  'kitchen-remodel': 'Kitchen Remodeling',
  'bathroom-remodel': 'Bathroom Remodeling',
  'whole-home-remodel': 'Whole-Home Remodeling',
  'room-addition': 'Room Addition',
  adu: 'ADU Builder',
};

function cityName(slug?: string): string {
  if (!slug) return '';
  return getCityBySlug(slug)?.name ?? slug;
}

function contentScore(w?: number): number {
  if (w === undefined) return 0;
  if (w < 100) return 2;
  if (w < 150) return 3;
  if (w < 250) return 4;
  if (w < 400) return 6;
  if (w < 600) return 7;
  if (w < 1200) return 8;
  return 9;
}

interface Scored {
  url: string;
  pageType: string;
  targetCity: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  longTailKeywords: string;
  searchIntent: string;
  titleTag: number;
  content: number;
  schema: number;
  internalLinking: number;
  localRelevance: number;
  gbpAlignment: number;
  pageSpeed: number;
  mobile: number;
  aeo: number;
  geo: number;
  technical: number;
  eeat: number;
  conversion: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actions: string;
}

const out: Scored[] = [];

for (const r of rows) {
  const city = cityName(r.city);
  const svc = r.service ? SERVICE_KEYWORD[r.service] : '';
  const svcName = r.service ? (getServiceBySlug(r.service)?.name ?? '') : '';

  let s: Scored = {
    url: r.url,
    pageType: r.pageType,
    targetCity: city || 'Treasure Valley',
    primaryKeyword: '',
    secondaryKeywords: '',
    longTailKeywords: '',
    searchIntent: 'Commercial',
    titleTag: 8,
    content: contentScore(r.wordCount),
    schema: 7,
    internalLinking: 8,
    localRelevance: 6,
    gbpAlignment: 3, // sitewide cap: GBP unverified, no GBP URL in sameAs
    pageSpeed: 8, // SSG + next/image AVIF/WebP; no field data available
    mobile: 8,
    aeo: 6,
    geo: 5,
    technical: 9,
    eeat: 4, // sitewide: no named founder/team, no license number, no real reviews
    conversion: 7,
    priority: 'Medium',
    actions: '',
  };

  switch (true) {
    case r.pageType === 'homepage': {
      s.primaryKeyword = 'Boise Remodeling Contractor';
      s.secondaryKeywords = 'Design-Build Remodeling Boise; Home Remodeling Treasure Valley; Remodeling Company Boise';
      s.longTailKeywords = 'best design-build remodeling contractor in Boise Idaho; kitchen and bathroom remodeling company Treasure Valley';
      s.searchIntent = 'Commercial / Brand';
      s.titleTag = 6;
      s.content = 8;
      s.schema = 7;
      s.localRelevance = 7;
      s.aeo = 7;
      s.geo = 6;
      s.conversion = 9;
      s.priority = 'Critical';
      s.actions =
        'Retitle to "Remodeling Contractor Boise ID | Design-Build | Boise Remodeling Co"; add aggregateRating once reviews exist; add founder Person to schema; link GBP in sameAs';
      break;
    }
    case r.pageType === 'service': {
      s.primaryKeyword = `${svc} Boise`;
      s.secondaryKeywords = `${svcName} Contractor Treasure Valley; ${svcName} Company Boise; ${svc} Idaho`;
      s.longTailKeywords = `how much does a ${svcName.toLowerCase()} cost in Boise; best ${svcName.toLowerCase()} contractor Treasure Valley`;
      s.searchIntent = 'Commercial';
      s.titleTag = 8;
      s.content = 6;
      s.localRelevance = 6;
      s.aeo = 6; // only 3 FAQs per service
      s.geo = 6;
      s.conversion = 8;
      s.priority = r.service === 'adu' ? 'Critical' : 'High';
      s.actions =
        r.service === 'adu'
          ? 'Build ADU pillar guide (Boise ordinance, costs, types); expand page to 800+ words; add cost table, 8+ FAQs; embed proof'
          : `Expand to 600+ words with cost ranges and a comparison table; grow FAQs from 3 to 8; embed city-tagged proof; add direct-answer block`;
      break;
    }
    case r.pageType === 'area': {
      s.primaryKeyword = `Remodeling Contractor ${city}`;
      s.secondaryKeywords = `Home Remodeling ${city} Idaho; ${city} Remodeling Company; Kitchen Remodel ${city}`;
      s.longTailKeywords = `best home remodeling contractor in ${city} Idaho; who remodels homes in ${city}`;
      s.searchIntent = 'Commercial / Local';
      s.content = 5;
      s.localRelevance = 7;
      s.aeo = 6;
      s.geo = 5;
      const hasProof = ['boise', 'meridian', 'eagle', 'nampa'].includes(r.city ?? '');
      s.eeat = hasProof ? 5 : 4;
      s.priority = 'High';
      s.actions = hasProof
        ? `Deepen ${city} page: housing-stock detail by neighborhood, ZIP coverage list, recent project narrative, city-specific cost note`
        : `Deepen ${city} page AND collect ${city}-tagged testimonial/project (currently zero local proof); add housing-stock and ZIP detail`;
      break;
    }
    case r.pageType === 'city-service': {
      const noidx = NOINDEX.has(r.url);
      s.primaryKeyword = `${svc} ${city}`;
      s.secondaryKeywords = `${svcName} Contractor ${city}; ${svcName} Company ${city} Idaho; ${svc} Near Me`;
      s.longTailKeywords = `how much does a ${svcName.toLowerCase()} cost in ${city} Idaho; best ${svcName.toLowerCase()} contractor in ${city}`;
      s.searchIntent = 'Commercial / Local';
      s.titleTag = 9;
      s.content = 6; // ~540 words but ~60% shared template
      s.localRelevance = 7;
      s.aeo = 7;
      s.geo = 5;
      s.technical = noidx ? 6 : 9;
      const hasProof = ['boise', 'meridian', 'eagle', 'nampa'].includes(r.city ?? '');
      s.eeat = hasProof ? 5 : 4;
      s.conversion = 8;
      s.priority = noidx ? 'Medium' : hasProof ? 'Medium' : 'High';
      s.actions = noidx
        ? 'Noindexed doorway-risk page listed in sitemap.xml - remove from sitemap; build ADU content + local proof to re-index later'
        : hasProof
          ? `Raise unique copy share: add ${city}-specific project narrative, cost band, and neighborhood-level detail beyond the template swaps`
          : `Add ${city} proof (testimonial/project) and a city-specific cost band; raise unique copy share above 50%`;
      break;
    }
    case r.pageType.startsWith('guide:hub-pillar'): {
      s.primaryKeyword = r.title.replace(/ \| .*/, '');
      s.secondaryKeywords = 'Boise remodeling guide; Treasure Valley remodeling costs';
      s.longTailKeywords = 'derived from H2 question headings (see 03-keyword-strategy.md)';
      s.searchIntent = 'Informational';
      s.localRelevance = 7;
      s.aeo = 8;
      s.geo = 7;
      s.eeat = 5;
      s.conversion = 7;
      s.priority = (r.wordCount ?? 0) < 450 ? 'High' : 'Medium';
      s.actions =
        (r.wordCount ?? 0) < 450
          ? 'Expand pillar toward 800-1200 words: add cost/timeline tables, named local examples, comparison sections'
          : 'Add named author with credentials; refresh dateModified; add local project example';
      break;
    }
    case r.pageType === 'guide:master': {
      s.primaryKeyword = 'Treasure Valley Remodeling Guide';
      s.secondaryKeywords = 'remodeling in the Treasure Valley; Boise area remodeling overview';
      s.longTailKeywords = 'what to know before remodeling in the Treasure Valley';
      s.searchIntent = 'Informational';
      s.content = 4;
      s.aeo = 6;
      s.geo = 6;
      s.priority = 'High';
      s.actions = 'Expand master guide to 600+ words: per-city market snapshot, permit overview, cost index linking to all pillars';
      break;
    }
    case r.pageType === 'guide:location': {
      const c = r.url.replace('/guides/', '').replace('-remodeling-guide', '');
      const cn = cityName(c) || r.title;
      s.targetCity = cn;
      s.primaryKeyword = `${cn} Remodeling Guide`;
      s.secondaryKeywords = `remodeling in ${cn} Idaho; ${cn} home renovation`;
      s.longTailKeywords = `what does it cost to remodel a home in ${cn} Idaho`;
      s.searchIntent = 'Informational / Local';
      s.localRelevance = 6;
      s.aeo = 5;
      s.geo = 5;
      s.priority = 'High';
      s.actions = `Expand from ~${r.wordCount} to 500-700 words: ${cn} housing stock by era, permit specifics, cost bands, neighborhood call-outs, link to /areas page`;
      break;
    }
    case r.pageType === 'guide:neighborhood': {
      const n = r.title.replace(/ Remodeling Guide.*/i, '');
      s.targetCity = 'Boise';
      s.primaryKeyword = `${n} Remodeling`;
      s.secondaryKeywords = `remodeling ${n} Boise; ${n} home renovation`;
      s.longTailKeywords = `remodeling rules for ${n} homes; can I remodel a historic home in ${n}`;
      s.searchIntent = 'Informational / Local';
      s.localRelevance = 6;
      s.aeo = 5;
      s.geo = 6; // neighborhood guides are rare = citation-worthy if deepened
      s.priority = 'High';
      s.actions = `Expand from ~${r.wordCount} to 500+ words: era-specific housing stock, historic-district rules where relevant, local project example`;
      break;
    }
    case r.pageType === 'blog': {
      s.primaryKeyword = r.title.replace(/ \| .*/, '');
      s.secondaryKeywords = 'see 03-keyword-strategy.md cluster mapping';
      s.longTailKeywords = 'question-form variants of title (see 03-keyword-strategy.md)';
      s.searchIntent = /cost|budget|price/i.test(r.title) ? 'Commercial Investigation' : 'Informational';
      s.localRelevance = /boise|treasure valley|idaho|ada|canyon/i.test(r.title + r.url) ? 6 : 4;
      s.aeo = (r.faqCount ?? 0) >= 8 ? 7 : 5;
      s.geo = (r.wordCount ?? 0) >= 250 ? 6 : 4;
      s.eeat = 4;
      s.conversion = 6;
      const w = r.wordCount ?? 0;
      s.priority = /cost/i.test(r.title) && w < 300 ? 'High' : w < 150 ? 'High' : 'Medium';
      s.actions =
        w < 150
          ? `Thin (${w} words): expand to 600+ words or consolidate into its hub pillar; add Boise-specific data, cost/timeline table, named author`
          : w < 300
            ? `Expand from ${w} to 600+ words with Boise-market specifics and tables; add named author`
            : 'Add named author with credentials and dateModified; refresh with current-year cost data';
      break;
    }
    case r.pageType === 'hub': {
      s.primaryKeyword = `${r.title} (category hub)`;
      s.secondaryKeywords = 'category navigation';
      s.longTailKeywords = 'n/a (navigational hub)';
      s.searchIntent = 'Navigational';
      s.content = 6;
      s.localRelevance = 5;
      s.aeo = 5;
      s.geo = 5;
      s.conversion = 6;
      s.priority = 'Low';
      s.actions = 'Add 150-word hub intro with local context and links to pillar + top clusters';
      break;
    }
    case r.pageType === 'static': {
      const map: Record<string, Partial<Scored>> = {
        '/about': {
          primaryKeyword: 'About Boise Remodeling Co',
          searchIntent: 'Brand / Trust',
          content: 6,
          eeat: 3,
          priority: 'Critical',
          actions: 'Add founder (the owner) bio + photo, team section, license/insurance specifics, year-by-year history; this page gates sitewide EEAT',
        },
        '/areas': {
          primaryKeyword: 'Remodeling Service Areas Treasure Valley',
          searchIntent: 'Commercial / Local',
          content: 6,
          localRelevance: 7,
          priority: 'Medium',
          actions: 'Add county grouping, ZIP coverage, and a service-area map embed consistent with GBP service area',
        },
        '/contact': {
          primaryKeyword: 'Contact Remodeling Contractor Boise',
          searchIntent: 'Transactional',
          content: 6,
          conversion: 9,
          priority: 'Medium',
          actions: 'Add GBP link once verified; surface hours matching schema; keep NAP exact-match with GBP',
        },
        '/testimonials': {
          primaryKeyword: 'Boise Remodeling Co Reviews',
          searchIntent: 'Commercial Investigation',
          content: 5,
          eeat: 5,
          schema: 8,
          priority: 'High',
          actions: 'Only 4 undated testimonials; add dates, cities, project types; embed Google reviews once GBP is live; activates aggregateRating',
        },
        '/blog': { primaryKeyword: 'Remodeling Blog Boise', searchIntent: 'Navigational', content: 6, priority: 'Low', actions: 'Adequate index; add hub descriptions' },
        '/guides': { primaryKeyword: 'Boise Remodeling Guides', searchIntent: 'Navigational', content: 6, priority: 'Low', actions: 'Adequate index' },
        '/resources': { primaryKeyword: 'Remodeling Planning Resources Boise', searchIntent: 'Informational', content: 6, priority: 'Low', actions: 'Adequate; add more downloadable resources over time' },
        '/resources/ada-canyon-permit-flow': {
          primaryKeyword: 'Ada County vs Canyon County Remodeling Permits',
          searchIntent: 'Informational / Local',
          content: 7,
          localRelevance: 8,
          aeo: 7,
          geo: 7,
          priority: 'Medium',
          actions: 'Strong local asset; add current fee schedules + review timelines with dates; most citation-worthy page on site',
        },
        '/privacy-policy': { primaryKeyword: 'n/a', searchIntent: 'Legal', content: 6, localRelevance: 3, aeo: 2, geo: 2, conversion: 3, priority: 'Low', actions: 'No action' },
        '/terms-of-service': { primaryKeyword: 'n/a', searchIntent: 'Legal', content: 6, localRelevance: 3, aeo: 2, geo: 2, conversion: 3, priority: 'Low', actions: 'No action' },
      };
      const overrides = map[r.url] ?? {};
      s = { ...s, internalLinking: 6, ...overrides } as Scored;
      if (!s.primaryKeyword) s.primaryKeyword = r.title;
      break;
    }
  }

  out.push(s);
}

const header = [
  'URL', 'Page Type', 'Target City', 'Primary Keyword', 'Secondary Keywords', 'Long-Tail Keywords', 'Search Intent',
  'Title Tag Score', 'Content Score', 'Schema Score', 'Internal Linking Score', 'Local Relevance Score',
  'GBP Alignment Score', 'Page Speed Score', 'Mobile Score', 'AEO Score', 'GEO Score', 'Technical SEO Score',
  'EEAT Score', 'Conversion Score', 'Priority', 'Recommended Actions',
];

function csvEscape(v: string | number): string {
  const str = String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const lines = [header.join(',')];
for (const s of out) {
  lines.push(
    [
      s.url, s.pageType, s.targetCity, s.primaryKeyword, s.secondaryKeywords, s.longTailKeywords, s.searchIntent,
      s.titleTag, s.content, s.schema, s.internalLinking, s.localRelevance, s.gbpAlignment, s.pageSpeed, s.mobile,
      s.aeo, s.geo, s.technical, s.eeat, s.conversion, s.priority, s.actions,
    ]
      .map(csvEscape)
      .join(','),
  );
}

mkdirSync('local-seo-audit', { recursive: true });
writeFileSync('local-seo-audit/01-url-audit.csv', lines.join('\n') + '\n');

// summary to stdout
const avg = (k: keyof Scored) => (out.reduce((a, b) => a + (b[k] as number), 0) / out.length).toFixed(1);
console.log('rows:', out.length);
console.log('priorities:', out.reduce((m: Record<string, number>, r) => ((m[r.priority] = (m[r.priority] || 0) + 1), m), {}));
for (const k of ['titleTag', 'content', 'schema', 'internalLinking', 'localRelevance', 'gbpAlignment', 'aeo', 'geo', 'technical', 'eeat', 'conversion'] as const) {
  console.log(k, avg(k));
}

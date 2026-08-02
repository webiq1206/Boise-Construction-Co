/**
 * Generates public/llms.txt and public/llms-full.txt from the content layer.
 *
 * These were hand-maintained and went stale: robots.ts explicitly welcomes
 * eleven AI crawlers, and both files were still describing a remodeling company
 * and linking to service and guide slugs that had been retired. A crawler that
 * trusts llms.txt over the live pages would have gotten the wrong business.
 *
 * Deriving them from SERVICES / GUIDE_PAGES / CONTENT_HUBS means the page list
 * can no longer disagree with the sitemap. Prose that is genuinely editorial
 * still lives here as literals; it just sits next to the data it describes.
 *
 * Run: npm run generate:llms   (verified in prebuild via verify:llms)
 */
import fs from 'fs';
import path from 'path';
import { SITE_CONFIG } from '../shared/siteConfig';
import { SERVICES, CITIES } from '../shared/contentData';
import { GUIDE_PAGES } from '../shared/guideContent';
import { CONTENT_HUBS } from '../shared/contentHubs';
import { BLOG_POSTS } from '../shared/blogContent';

const BASE = SITE_CONFIG.siteUrl.replace(/\/$/, '');
const url = (p: string) => `${BASE}${p}`;
const today = new Date().toISOString().slice(0, 10);

const adaCities = CITIES.filter((c) => c.county === 'ada').map((c) => c.name);
const canyonCities = CITIES.filter((c) => c.county === 'canyon').map((c) => c.name);

const pillarGuides = GUIDE_PAGES.filter((g) => g.guideType === 'hub-pillar' || g.guideType === 'master');
const cityGuides = GUIDE_PAGES.filter((g) => g.guideType === 'location');
const neighborhoodGuides = GUIDE_PAGES.filter((g) => g.guideType === 'neighborhood');

const SUMMARY =
  `New residential construction in Boise, Idaho and the Treasure Valley: custom homes, ` +
  `semi-custom homes, build-on-your-lot, shop homes, and the design and permitting that ` +
  `precede them. Design-build, founded 2020. Serving ${CITIES.map((c) => c.name).join(', ')}. ` +
  `Phone ${SITE_CONFIG.phone}.`;

const POSITIONING =
  `Design-build means one accountable team handles architectural design, engineering, ` +
  `estimating, Ada and Canyon County permitting, and construction under a single contract, ` +
  `backed by a written line-item scope before the foundation is poured. Budget ranges are ` +
  `produced by an on-site estimator from house geometry and specification level rather than ` +
  `a flat price per square foot, because the same 2,400 square feet costs very different ` +
  `money on a flat infill lot than on a sloped foothills parcel with a shared well. Ranges ` +
  `are planning estimates, not quotes; a firm proposal follows a site visit and a lot review.`;

function buildShort(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_CONFIG.name}`, '');
  lines.push(`> ${SUMMARY}`, '');
  lines.push(POSITIONING, '');

  lines.push('## Services', '');
  for (const s of SERVICES) {
    lines.push(`- [${s.name}](${url(`/services/${s.slug}`)}): ${s.shortDescription}`);
  }
  lines.push(
    `- [RE-10 / Inspection Repairs](${url('/re-10-repairs-boise')}): repairs from an Idaho RE-10 inspection response, completed and documented before closing, for real estate agents, buyers and sellers.`,
  );
  lines.push(
    `- [All Services](${url('/services')}): plus city pages at /services/{service}/{city} and [Service Areas](${url('/areas')}).`,
    '',
  );

  lines.push('## Authoritative guides', '');
  for (const g of pillarGuides) lines.push(`- [${g.title}](${url(`/guides/${g.slug}`)})`);
  lines.push('');

  lines.push('## Local permit and location resources', '');
  lines.push(`- [Ada County vs Canyon County permit flow](${url('/resources/ada-canyon-permit-flow')})`);
  if (cityGuides.length) {
    lines.push(
      `- City guides: ${cityGuides.map((g) => `[${g.title}](${url(`/guides/${g.slug}`)})`).join(', ')}`,
    );
  }
  if (neighborhoodGuides.length) {
    lines.push(
      `- Neighborhood guides: ${neighborhoodGuides.map((g) => `[${g.title}](${url(`/guides/${g.slug}`)})`).join(', ')}`,
    );
  }
  lines.push('');

  lines.push('## Blog category hubs', '');
  for (const h of CONTENT_HUBS) lines.push(`- [${h.title}](${url(`/blog/category/${h.hubSlug}`)})`);
  lines.push('');

  lines.push('## About and contact', '');
  lines.push(
    `- [About ${SITE_CONFIG.name}](${url('/about')}): design-build home building across the Treasure Valley since 2020.`,
  );
  lines.push(`- [Contact](${url('/contact')})`);
  lines.push(`- [Free build estimator](${url('/estimate')})`);
  lines.push(`- [Planning resources and worksheets](${url('/resources')})`, '');

  lines.push('## Optional', '');
  lines.push(`- [Blog](${url('/blog')})`, '');

  lines.push('## Machine-readable endpoints', '');
  lines.push(`- [Sitemap](${url('/sitemap.xml')}): every indexable page.`);
  lines.push(`- [Image sitemap](${url('/sitemap-images.xml')}): guide and article imagery with titles and captions.`);
  lines.push(`- [RSS feed](${url('/feed.xml')}): guides and articles, newest first, with publication and revision dates.`);
  lines.push(`- [Full text for LLMs](${url('/llms-full.txt')}): expanded reference copy of the core facts.`, '');

  lines.push(`Last updated: ${today}.`);
  return lines.join('\n') + '\n';
}

function buildFull(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_CONFIG.name} - Full Reference`, '');
  lines.push(`> ${SUMMARY}`, '');

  lines.push('## About', '');
  lines.push(
    `${SITE_CONFIG.name} is a residential design-build home builder serving the Treasure Valley ` +
      `since 2020. We build new homes: custom homes drawn from a blank page, semi-custom homes ` +
      `personalized from a proven plan, and build-on-your-lot projects for families who already ` +
      `own land. Design-build means design, engineering, permitting, and construction are ` +
      `delivered by one team under one contract, which removes the handoff between an architect ` +
      `and a general contractor and keeps the drawings and the budget on the same schedule. ` +
      `Every project includes a written line-item scope before construction, named allowances ` +
      `for selections, and a workmanship warranty at completion.`,
    '',
  );
  lines.push('- Business type: Residential design-build home builder (new construction)');
  lines.push('- Founded: 2020');
  lines.push('- Service model: One accountable team for design, permits, and construction');
  lines.push(`- Contact: ${url('/contact')}`);
  lines.push(`- Build estimator: ${url('/estimate')}`, '');

  lines.push('## Service area', '');
  lines.push('We build in the following Treasure Valley cities across Ada and Canyon County:', '');
  if (adaCities.length) lines.push(`- Ada County: ${adaCities.join(', ')}`);
  if (canyonCities.length) lines.push(`- Canyon County: ${canyonCities.join(', ')}`);
  lines.push(
    '',
    'Permit paths, impact fees, and inspection sequencing differ between Ada County and Canyon ' +
      'County, and again between incorporated city limits and county jurisdiction. We coordinate ' +
      'submissions, fees, and inspections as part of the design-build contract.',
    '',
  );

  lines.push('## Services', '');
  for (const s of SERVICES) {
    lines.push(`- ${s.name}: /services/${s.slug} - ${s.shortDescription}`);
  }
  lines.push(
    '',
    `Each service has a dedicated page per city at /services/{service-slug}/{city-slug} for ` +
      `${CITIES.map((c) => c.slug).join(', ')}. City service-area hubs live at /areas/{city-slug}.`,
    '',
  );

  lines.push(`## Authoritative guides (${url('/guides')})`, '');
  lines.push('Pillar guides (own the head terms):', '');
  for (const g of pillarGuides) lines.push(`- ${g.title}: /guides/${g.slug}`);
  if (cityGuides.length) {
    lines.push('', 'City guides:', '');
    for (const g of cityGuides) lines.push(`- /guides/${g.slug}`);
  }
  if (neighborhoodGuides.length) {
    lines.push('', 'Neighborhood guides:', '');
    for (const g of neighborhoodGuides) lines.push(`- /guides/${g.slug}`);
  }
  lines.push('');

  lines.push('## Blog category hubs (long-tail questions support the pillars)', '');
  for (const h of CONTENT_HUBS) lines.push(`- ${h.title}: /blog/category/${h.hubSlug}`);
  lines.push('', `${BLOG_POSTS.length} articles across these hubs. Index: /blog`, '');

  lines.push('## Planning resources', '');
  lines.push('- Home building planning resources (free PDFs and visual guides): /resources');
  lines.push('- New home budget worksheet: /downloads/new-home-budget-worksheet.pdf');
  lines.push('- Lot evaluation checklist: /downloads/lot-evaluation-checklist.pdf');
  lines.push('- Ada vs Canyon County permit flow (visual guide): /resources/ada-canyon-permit-flow', '');

  lines.push('## Common questions', '');
  lines.push(
    '- How long does it take to build a house in the Treasure Valley? Design and engineering ' +
      'typically run two to four months, plan review and permitting another one to three ' +
      'depending on jurisdiction, and construction ten to fourteen months for a custom home. ' +
      'Semi-custom plans compress the design phase because the drawings already exist.',
  );
  lines.push(
    '- What does a new home cost per square foot here? A blended rate is the wrong unit, because ' +
      'site work, foundation type, and specification level move the number more than area does. ' +
      'The estimator prices geometry and scope instead, then reports a range.',
  );
  lines.push(
    '- Can I build on land I already own? Yes, that is the build-on-your-lot path. Before design ' +
      'starts we review soils, utilities, access, setbacks, easements, and slope, because those ' +
      'determine what the parcel can actually carry and what the site work will cost.',
  );
  lines.push(
    '- Do I need a construction loan? Most owners use a construction-to-permanent loan that draws ' +
      'against completed milestones and converts to a mortgage at occupancy. The draw schedule ' +
      'has to match the build schedule, which is something we set up with the lender.',
  );
  lines.push(
    '- How do I compare two builder bids? Only when the allowances, site work assumptions, and ' +
      'permit responsibilities match. Most of the spread between two bids on the same house is ' +
      'scope that one of them left out, not margin.',
    '',
  );

  lines.push('## Key pages', '');
  lines.push(`- Home: ${url('/')}`);
  lines.push(`- About: ${url('/about')}`);
  lines.push(`- Services: ${url('/services')}`);
  lines.push(`- Service areas: ${url('/areas')}`);
  lines.push(`- Build estimator: ${url('/estimate')}`);
  lines.push(`- Blog: ${url('/blog')}`);
  lines.push(`- Guides: ${url('/guides')}`);
  lines.push(`- Resources: ${url('/resources')}`);
  lines.push(`- Contact: ${url('/contact')}`, '');

  lines.push('## RE-10 / Inspection Repairs', '');
  lines.push(
    `${SITE_CONFIG.name} also completes RE-10 and home inspection repairs for real estate agents, ` +
      `buyers and sellers across Boise and the Treasure Valley. An RE-10 is the Idaho inspection ` +
      `response form: after a home inspection the buyer requests specific repairs before closing. ` +
      `We review the RE-10 and inspection report, provide a written scope and pricing, coordinate ` +
      `access, complete the approved work across multiple trades, and supply photo documentation, ` +
      `invoices and receipts for the transaction file. Structural, foundation, mold and asbestos ` +
      `abatement, main electrical service, sewer and septic, HVAC replacement, gas lines and full ` +
      `roof replacement are coordinated to licensed specialists rather than performed in house. ` +
      `We take this work because an inspection repair is a deadline problem rather than a ` +
      `construction problem, and sequencing trades against a date that will not move is the same ` +
      `thing we do on every build. Details: ${url('/re-10-repairs-boise')}`,
    '',
  );

  lines.push(`Last updated: ${today}. Full sitemap: ${url('/sitemap.xml')}`);
  return lines.join('\n') + '\n';
}

const targets: Array<[string, string]> = [
  ['llms.txt', buildShort()],
  ['llms-full.txt', buildFull()],
];

const check = process.argv.includes('--check');
let drift = false;

for (const [name, content] of targets) {
  const file = path.join(__dirname, '..', 'public', name);
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  // The date line changes daily; ignore it so the check is about content drift.
  const norm = (s: string) => s.replace(/Last updated: \d{4}-\d{2}-\d{2}/g, 'Last updated: DATE');
  if (check) {
    if (norm(existing) !== norm(content)) {
      console.error(`verify:llms FAILED - public/${name} is out of date. Run: npm run generate:llms`);
      drift = true;
    }
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Wrote public/${name} (${content.split('\n').length} lines)`);
  }
}

if (check) {
  if (drift) process.exit(1);
  console.log('verify:llms OK (llms.txt and llms-full.txt match the content layer)');
}

/**
 * Published prices come from the instant estimator (owner instruction, 21
 * November 2026: "We should always base everything off of the engine as long
 * as you're getting the actual numbers from the engine/cost book. I do not
 * want to mislead people").
 *
 * Every price this site publishes for a new home, an addition, an ADU or a
 * detached garage or shop must be one the P5 instant estimator (the tool
 * behind "Get an instant estimate") shows for the inputs the copy states.
 * scripts/pricing/p5-published-figures.mts runs the estimator and writes
 * shared/content/p5PublishedFigures.json; these tests pin the copy to it.
 *
 * A dollar range in published copy must be a range in the JSON. Any other
 * dollar figure must be listed below with the reason it is not a price for our
 * work (a city permit fee or valuation bracket). Shop homes follow the same
 * rule (21 November 2026): the estimator has no shop home project, so their
 * copy quotes its new home and detached garage or shop ranges separately and
 * never adds them together; this site's line-item engine figures are retired
 * from copy and have no allowlist. Work no engine prices (site work, wells and
 * septic, lot evaluations, design-only engagements) carries no figure at all.
 *
 * When the cost book changes: re-run the script, then change the copy until
 * these tests pass. Never allowlist a home, addition, ADU, garage, shop or
 * shop home price.
 * Set P5_HOME_CO_DIR to a p5-home-co checkout to also check the JSON against
 * the estimator itself.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

type Range = { low: number; high: number };
type Tier = Range & { finish: string; perSqFt?: Range };
type Case = {
  project: string;
  label: string;
  inputs: Record<string, string | number>;
  sqft?: number;
  tiers: Record<'builder' | 'mid' | 'high' | 'luxury', Tier>;
  spans: Record<'essentialToSignature' | 'premiumToLuxury' | 'allFinishes', Range & { perSqFt?: Range }>;
};
type Figures = {
  about: string;
  asOf: string;
  rulesVersion: string;
  inputs: { brand: string; laborRatePerHour: number; costBook: string; tiers: Record<string, string> };
  cases: Record<string, Case>;
  designAndEngineering: Record<string, { tiers: Record<string, Range>; essentialToSignature: Range }>;
  scope: Record<string, { rangeNotes: string[]; excluded: string[]; undetermined: string[] }>;
};

const FIGURES_FILE = 'shared/content/p5PublishedFigures.json';
const figures = JSON.parse(readFileSync(FIGURES_FILE, 'utf8')) as Figures;
const money = (n: number) => `$${n.toLocaleString('en-US')}`;
const range = (r: Range) => `${money(r.low)} to ${money(r.high)}`;
const tier = (id: string, t: keyof Case['tiers']) => {
  const c = figures.cases[id];
  assert.ok(c, `the JSON prices ${id}`);
  return range(c.tiers[t]);
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Every file whose text is published: service and city pages, guides, posts, FAQs, the worksheet PDF, GBP copy, llms.txt. */
const COPY_FILES = [
  ...walk('shared/content'),
  'shared/seoContent.ts',
  'shared/homepageFaqs.ts',
  'shared/gbpProfile.ts',
  'shared/contentData.ts',
  'shared/metaDescriptions.ts',
  'shared/resourcePdfContent.ts',
  'shared/siteContent.ts',
  'shared/serviceFieldConfig.ts',
  'shared/quoteFormChoices.ts',
  'shared/guideContent.ts',
  'shared/blogContent.ts',
  'shared/contentHubs.ts',
  'shared/ctaCopy.ts',
  'shared/instantEstimate.ts',
  'shared/imageAlts.ts',
  'public/llms.txt',
  'public/llms-full.txt',
  ...walk('app').filter((f) => !/[\\/](admin|api|subcontractor|portal)[\\/]/.test(f)),
  // P5*.tsx is the shared document estimator's code, not page copy.
  ...walk('components').filter((f) => !/[\\/](admin|subcontractor|portal)[\\/]/.test(f) && !/[\\/]P5[^\\/]*$/.test(f)),
].map((f) => f.split(path.sep).join('/'));

/**
 * Dollar figures that are not a price for our work, by file, as the exact text
 * they sit in. A home, addition or ADU price never belongs here.
 */
const NOT_OUR_PRICE: Record<string, Array<{ text: string; why: string }>> = {
  'shared/content/cityServiceCopy.ts': [
    { text: 'lists $93 for a new residential mechanical permit and $128 when the home includes a fireplace, with $93 for each', why: 'Kuna mechanical permit fees' },
    { text: 'at $160 each when it\'s under 2,000 sq ft and $255 at 2,000 sq ft', why: 'Caldwell FY2026 trade permit fees' },
    { text: 'lists a $150 application fee for new residential construction', why: 'Meridian application fee' },
    { text: 'The permit fee itself is $50 plus $5.50 for each $1,000 of valuation', why: 'Meridian permit fee formula' },
    { text: 'charges a $70 residential submittal fee', why: 'Kuna submittal fee' },
    { text: 'A home valued between $250,001 and $500,000 pays $1,461 on the first $250,001, then $4.85 per additional $1,000', why: 'Kuna valuation bracket and permit fee' },
    { text: 'For a project valued from $500,000 to $999,999, the fee is $2,755.45 plus about 0.43% of the value above $500,000', why: 'Caldwell FY2026 valuation bracket and permit fee' },
    { text: 'shows $995 for fire, $4,119 for parks, and $402 for police', why: 'Meridian impact fee schedule' },
    { text: 'charges $50 to apply for a residential addition or remodel permit', why: 'Meridian application fee' },
    { text: 'A project valued at $50,001 to $100,000 starts at $506, and one valued at $100,001 to $250,000 starts at $764, each plus a set amount per additional $1,000', why: 'Kuna valuation brackets and permit fees' },
    { text: 'The $70 submittal fee', why: 'Kuna submittal fee' },
    { text: 'starting from a $34 base; each plumbing fixture adds $15.75 and each extended electrical circuit $22.25', why: 'Caldwell FY2026 trade permit fees' },
    { text: 'any job totaling $500 or less in value', why: 'Garden City permit exemption threshold' },
    { text: 'charges $65 for each re-inspection', why: 'Kuna re-inspection fee' },
    { text: '(minimum $55)', why: 'Caldwell planning review minimum fee' },
    { text: 'Kuna charges $70 to submit a residential permit and bills structural plan review at $65 an hour', why: 'Kuna submittal and plan review fees' },
  ],
  'shared/content/areaCopy.ts': [
    { text: 'lists a $150 non-refundable application fee', why: 'Meridian application fee' },
    { text: 'a permit fee of $50 plus $5.50 per $1,000 of project value', why: 'Meridian permit fee formula' },
    { text: 'the schedule shows $995 fire, $4,119 parks, and $402 police', why: 'Meridian impact fee schedule' },
    { text: 'a separate $10 Planning and Zoning fence permit', why: 'Meridian fence permit fee' },
    { text: 'lists a $70 residential submittal fee and structural plan review at $65 per hour', why: 'Kuna submittal and plan review fees' },
    { text: '$1,461 covers the first $250,001, plus $4.85 for each additional $1,000 up to $500,000', why: 'Kuna valuation bracket and permit fee' },
    { text: '$846.27 plus about 0.45% of value above $100,000 in the $100,000–$499,999 range', why: 'Caldwell FY2026 valuation bracket and permit fee' },
    { text: '(minimum $55)', why: 'Caldwell planning review minimum fee' },
  ],
  'components/sections/BudgetInclusionsSection.tsx': [{ text: '"\\u00A0$1"', why: 'a regular expression replacement token, not a figure' }],
  'components/sections/ProjectGallerySection.tsx': [{ text: '"\\u00A0$1"', why: 'a regular expression replacement token, not a figure' }],
};

/** Comments are not published; JSX `{...}` and template `${...}` are not figures. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const AMOUNT = String.raw`\d{1,3}(?:,\d{3})+|\d+`;
const SEPARATOR = String.raw`\s*(?:to|and|up to|-|–|\\u2013)\s*`;
const FIGURE = new RegExp(String.raw`\$(${AMOUNT})(?:\.\d+)?(k\b)?(?:${SEPARATOR}\$(${AMOUNT})(k\b)?)?`, 'g');

const allowedRanges = new Set<string>();
const addRange = (r: Range | undefined) => r && allowedRanges.add(range(r));
for (const c of Object.values(figures.cases)) {
  for (const t of Object.values(c.tiers)) {
    addRange(t);
    addRange(t.perSqFt);
  }
  for (const s of Object.values(c.spans)) {
    addRange(s);
    addRange(s.perSqFt);
  }
}
for (const d of Object.values(figures.designAndEngineering)) {
  for (const t of Object.values(d.tiers)) addRange(t);
  addRange(d.essentialToSignature);
}

function figuresIn(file: string) {
  const text = stripComments(readFileSync(file, 'utf8'));
  const found: Array<{ at: number; text: string; isRange: boolean }> = [];
  for (const m of text.matchAll(FIGURE)) found.push({ at: m.index!, text: m[0], isRange: m[3] !== undefined });
  return { text, found };
}

function inAllowlist(file: string, text: string, at: number): boolean {
  for (const { text: snippet } of NOT_OUR_PRICE[file] ?? []) {
    for (let j = text.indexOf(snippet); j >= 0; j = text.indexOf(snippet, j + 1)) {
      if (at >= j && at < j + snippet.length) return true;
    }
  }
  return false;
}

test('the figures file states its inputs: construction brand, plans none, every finish, November 2026', () => {
  assert.equal(figures.asOf, 'November 2026');
  assert.equal(figures.inputs.brand, 'construction');
  assert.match(figures.about, /scripts\/pricing\/p5-published-figures\.mts/);
  assert.ok(figures.rulesVersion, 'the estimator rules version is recorded');
  assert.deepEqual(figures.inputs.tiers, { builder: 'Essential', mid: 'Signature', high: 'Premium', luxury: 'Luxury' });
  for (const id of ['home-1600', 'home-2000', 'home-2400', 'home-3000', 'home-2400-complete-plans', 'addition-room-300', 'addition-second', 'adu-detached', 'adu-attached', 'adu-garage', 'garage-shop-576', 'garage-shop-1200', 'home-1600-no-garage']) {
    assert.ok(figures.cases[id], `the JSON prices ${id}`);
  }
  for (const [id, c] of Object.entries(figures.cases)) {
    assert.ok(['custom-home', 'addition', 'adu', 'garage-shop'].includes(c.project), `${id} is a project this brand offers`);
    assert.ok(Object.keys(c.inputs).length > 0, `${id} states its inputs`);
    if (!/complete-plans/.test(id)) assert.equal(c.inputs.plans, undefined, `${id} uses the default answer, no plans yet`);
    for (const t of Object.values(c.tiers)) assert.ok(Number.isInteger(t.low) && t.low > 0 && t.low < t.high, `${id} is a range`);
    // The finish ladder only goes up.
    assert.ok(c.tiers.builder.high < c.tiers.luxury.high && c.tiers.builder.low < c.tiers.mid.low, `${id} rises with finish`);
  }
  for (const d of Object.values(figures.designAndEngineering)) for (const t of Object.values(d.tiers)) assert.ok(t.low > 0 && t.high > t.low, 'design adds to the range');
});

test('the inclusion wording in copy is the estimator\'s own note under the range', () => {
  assert.deepEqual(figures.scope['custom-home/none'].rangeNotes, ['Includes design, engineered plans and permit fees.']);
  assert.ok(figures.scope['custom-home/none'].excluded.includes('The land'));
  assert.ok(figures.scope['custom-home/none'].undetermined.some((u) => /Utility connection and capacity fees/.test(u)));
  assert.ok(figures.scope['custom-home/none'].undetermined.some((u) => /Site work beyond a typical lot/.test(u)));
  for (const key of ['adu/detached/none', 'adu/attached/none', 'addition/room/none']) {
    assert.deepEqual(figures.scope[key].rangeNotes, ['Includes design, engineered plans and permit fees.'], key);
  }
});

test('every dollar range in published copy is an instant estimate range from the JSON', () => {
  const problems: string[] = [];
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const { text, found } = figuresIn(file);
    for (const f of found) {
      if (f.isRange && allowedRanges.has(f.text)) continue;
      if (inAllowlist(file, text, f.at)) continue;
      problems.push(`${file}: ${f.text}`);
    }
  }
  assert.deepEqual(problems, [], 'a figure that is not in p5PublishedFigures.json (re-run the script, or name the inputs the estimator prices)');
});

test('the retired bands and figures no engine prices are gone from published copy', () => {
  const retired = [
    /\$250 (?:to|and) \$400/, /\$225 (?:to|and) \$300/, /\$225 (?:to|and) \$400/, /\$275 (?:to|and) \$425/,
    /\$600,000 (?:to|and) \$960,000/, /\$450,000 (?:to|and) \$600,000/, /\$9,000 (?:to|and) \$35,000/,
    /\$40,000 to \$65,000/, /\$130,000 to \$205,000/, /\$70,000 to \$95,000/, /\$950 (?:to|and) \$5,500/,
    /\$20,000 to \$55,000/, /\$175,000 to \$280,000/, /\$525,000|\$525k|\$425,000|\$425k|\$475k|\$575,000|\$575k/,
    /(?:near|approach) \$225/, /\$450 per (?:finished )?square foot/, /5 to 12 percent/, /3 to 8 percent/,
    // This site's own line-item engine for a shop home, retired from copy on 21 November 2026.
    /\$385,000|\$385k|\$520,000|\$465,000|\$630,000|\$330,000|\$330k/, /\$55 (?:to|and|-) \$60/, /simple lot with city services/,
  ];
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const r of retired) assert.equal(text.match(r)?.[0] ?? null, null, `${file} still publishes ${r}`);
  }
});

test('copy that carries an estimator figure says it is a preliminary instant estimate range, dated', () => {
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const { text, found } = figuresIn(file);
    if (!found.some((f) => f.isRange && allowedRanges.has(f.text))) continue;
    assert.ok(/instant estimate/i.test(text), `${file} names the instant estimate`);
    assert.ok(/preliminary/i.test(text), `${file} calls the figure preliminary`);
    assert.ok(/November 2026/.test(text), `${file} dates the figure`);
    assert.equal(text.match(/instant (?:quote|bid)|guaranteed price|final price/i)?.[0] ?? null, null, file);
  }
});

test('the pages that open the instant estimate quote its own range for a stated home, with what it includes', async () => {
  const { SERVICE_SEO_CONTENT, HOMEPAGE_FAQS_FOR_SCHEMA } = await import('../shared/seoContent.ts');
  const essential = tier('home-2400', 'builder');
  const signature = tier('home-2400', 'mid');
  for (const slug of ['custom-home-builder', 'build-on-your-lot', 'design-build']) {
    const page = SERVICE_SEO_CONTENT[slug];
    const text = [...page.faqs.map((f: { answer: string }) => f.answer), ...(page.costGuidance?.paragraphs ?? [])].join(' ');
    assert.ok(text.includes(essential) && text.includes(signature), `${slug} quotes the 2,400 sq ft range`);
    assert.match(text, /2,400 square foot home with an attached 2-car garage/, `${slug} states the inputs`);
    assert.match(text, /design, engineered plans and permit fees included/, `${slug} says what the range includes`);
    assert.match(text, /land excluded/, `${slug} says the land is not included`);
  }
  const semi = SERVICE_SEO_CONTENT['semi-custom-homes'];
  assert.ok(semi.faqs.some((f: { answer: string }) => f.answer.includes(tier('home-2000', 'builder'))), 'semi-custom quotes the 2,000 sq ft home');
  const energy = SERVICE_SEO_CONTENT['energy-efficient-homes'];
  assert.ok((energy.costGuidance?.paragraphs ?? []).join(' ').includes(range(figures.cases['home-2400'].spans.essentialToSignature)));
  const design = SERVICE_SEO_CONTENT['home-plans-design'];
  assert.ok(design.faqs.some((f: { answer: string }) => f.answer.includes(range(figures.designAndEngineering['home-2400'].essentialToSignature))), 'design quotes the cost book difference');
  // The FAQ answers are the FAQPage structured data, so the schema carries the same figures.
  assert.ok(HOMEPAGE_FAQS_FOR_SCHEMA.some((f: { answer: string }) => f.answer.includes(signature)));

  const { HOMEPAGE_FAQS } = await import('../shared/homepageFaqs.ts');
  assert.ok(HOMEPAGE_FAQS.some((f: { a: string }) => f.a.includes(essential) && f.a.includes(signature)), 'homepage FAQ');

  const { aduCostBoise } = await import('../shared/content/wave2/adu-cost-boise.ts');
  assert.ok(`${aduCostBoise.quickAnswer} ${aduCostBoise.content}`.includes(tier('adu-detached', 'builder')), 'the ADU cost post quotes the detached ADU');
});

test('the cost guide table and the worksheet show the JSON figures', () => {
  const guide = readFileSync('shared/content/pillars/boise-home-building-cost-guide.ts', 'utf8');
  for (const [label, id] of [['New home, 1,600 sq ft', 'home-1600'], ['New home, 2,000 sq ft', 'home-2000'], ['New home, 2,400 sq ft', 'home-2400'], ['New home, 3,000 sq ft', 'home-3000']] as const) {
    assert.ok(guide.includes(`<tr><td>${label}</td><td>${tier(id, 'builder')} at Essential finish, ${tier(id, 'mid')} at Signature finish</td></tr>`), label);
  }
  const pdf = readFileSync('shared/resourcePdfContent.ts', 'utf8');
  const c = figures.cases['home-2400'];
  for (const [name, t] of [['Essential', 'builder'], ['Signature', 'mid'], ['Premium', 'high'], ['Luxury', 'luxury']] as const) {
    assert.ok(pdf.includes(`['${name}', '${range(c.tiers[t])}', '${range(c.tiers[t].perSqFt!)}', '___________']`), `worksheet row ${name}`);
  }
});

test('shop home copy quotes the estimator\'s house and shop separately and never adds them', async () => {
  const house = figures.cases['home-1600-no-garage'];
  const shop = figures.cases['garage-shop-1200'];
  assert.deepEqual(house.inputs, { sqft: 1600, garage: 'none' }, 'the house half is a new home with no garage, an answer a visitor can give');
  assert.deepEqual(shop.inputs, { sqft: 1200 });
  // The garage or shop has no engineering item in the cost book: copy must not claim it.
  assert.deepEqual(figures.scope['garage-shop/none'].rangeNotes, ['Includes design drawings and permit fees. Engineering, if your building needs it, is not yet determined.']);

  // No sum of a house range and a shop range appears anywhere: there is no shop home project to quote.
  const sums = new Set<string>();
  for (const t of ['builder', 'mid', 'high', 'luxury'] as const) {
    sums.add(money(house.tiers[t].low + shop.tiers[t].low));
    sums.add(money(house.tiers[t].high + shop.tiers[t].high));
  }
  for (const s of Object.values(house.spans)) for (const o of Object.values(shop.spans)) {
    sums.add(money(s.low + o.low));
    sums.add(money(s.high + o.high));
  }
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const s of sums) assert.equal(text.includes(s), false, `${file} adds the house and shop ranges into ${s}`);
  }

  const { SERVICE_SEO_CONTENT } = await import('../shared/seoContent.ts');
  const { CITY_SERVICE_COPY } = await import('../shared/content/cityServiceCopy.ts');
  const page = SERVICE_SEO_CONTENT['shop-homes-barndominiums'];
  const perTier = [house.tiers.builder, house.tiers.mid, shop.tiers.builder, shop.tiers.mid].map(range);
  for (const [where, text] of [['FAQ', page.faqs[0].answer], ['cost guidance', (page.costGuidance?.paragraphs ?? []).join(' ')]] as const) {
    for (const r of perTier) assert.ok(text.includes(r), `the shop home ${where} quotes ${r}`);
    assert.match(text, /1,600 square foot new home with no garage/, where);
    assert.match(text, /1,200 square foot detached garage or shop/, where);
    assert.match(text, /engineering[^.]*not yet determined/, `${where} says the shop's engineering is not yet determined`);
    assert.match(text, /line-item budget after a lot walkthrough/, where);
    assert.match(text, /November 2026/, where);
  }
  for (const [city, c] of Object.entries(CITY_SERVICE_COPY['shop-homes-barndominiums'])) {
    const answer = c.faqs[0].answer;
    assert.ok(answer.includes(range(house.spans.essentialToSignature)) && answer.includes(range(shop.spans.essentialToSignature)), city);
    assert.match(answer, /1,600 square foot new home with no garage/, city);
    assert.match(answer, /1,200 square foot detached garage or shop/, city);
    assert.match(answer, /engineering not yet determined/, city);
    assert.match(answer, /preliminary/, city);
  }
  const { SERVICES } = await import('../shared/contentData.ts');
  assert.equal(SERVICES.find((x: { slug: string }) => x.slug === 'shop-homes-barndominiums')?.planningFrom, 'Priced after a lot walkthrough');
});

test('the JSON matches the estimator when a p5-home-co checkout is given', { skip: !process.env.P5_HOME_CO_DIR }, () => {
  execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/pricing/p5-published-figures.mts', '--check'], {
    stdio: 'pipe',
    env: process.env,
  });
});

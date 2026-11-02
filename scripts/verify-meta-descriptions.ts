/**
 * Meta description and title guard (runs in prebuild).
 *
 * 48 generated descriptions once rendered "Call (208) 477-1169 for a free
 * consultation!" on every money page, one rendered "Boise's design-build
 * design-build", and the blog hubs were sliced mid-sentence. This check
 * computes every description the routes render, from the same functions and
 * data the routes use, and fails the build when one:
 *
 *   - contains a phone number or an exclamation mark,
 *   - runs past 155 characters,
 *   - is empty,
 *   - (authored landing-page copy only) is under 140 characters,
 *   - duplicates another indexable page's description.
 *
 * It also fails when a generated title for an indexable page would render past
 * 60 characters once the layout appends " | Boise Construction Co", or repeats
 * another indexable page's title.
 *
 * Route files that declare literal descriptions (the homepage, /services,
 * /estimate, legal pages and so on) are read with the TypeScript parser, so a
 * description typed straight into a page is held to the same rules.
 *
 *   npx tsx scripts/verify-meta-descriptions.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { buildPageMetadata, isCityServiceNoindex } from '../lib/page-metadata';
import { META_DESCRIPTION_MAX, META_DESCRIPTION_MIN } from '../lib/seo';
import { BLOG_POSTS } from '../shared/blogContent';
import { CITIES, SERVICES } from '../shared/contentData';
import { CONTENT_HUBS } from '../shared/contentHubs';
import { GUIDE_PAGES } from '../shared/guideContent';
import {
  AREA_META_DESCRIPTIONS,
  CITY_SERVICE_META_DESCRIPTIONS,
  SERVICE_META_DESCRIPTIONS,
} from '../shared/metaDescriptions';
import { SITE_CONFIG } from '../shared/siteConfig';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BRAND_SUFFIX = ` | ${SITE_CONFIG.name}`;
const TITLE_MAX = 60;
const PHONE = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;

const failures: string[] = [];
let checked = 0;

function checkDescription(where: string, text: string | undefined | null, opts: { min?: boolean } = {}) {
  checked++;
  const value = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return failures.push(`${where}: empty description`);
  if (PHONE.test(value)) failures.push(`${where}: phone number in description: "${value}"`);
  if (value.includes('!')) failures.push(`${where}: exclamation mark in description: "${value}"`);
  if (value.includes('…')) failures.push(`${where}: ellipsis (sliced description): "${value}"`);
  if (value.length > META_DESCRIPTION_MAX)
    failures.push(`${where}: description ${value.length} > ${META_DESCRIPTION_MAX}: "${value}"`);
  if (opts.min && value.length < META_DESCRIPTION_MIN)
    failures.push(`${where}: description ${value.length} < ${META_DESCRIPTION_MIN}: "${value}"`);
}

const titles = new Map<string, string>();
function checkTitle(where: string, title: string) {
  const rendered = title.includes(SITE_CONFIG.name) ? title : `${title}${BRAND_SUFFIX}`;
  if (rendered.length > TITLE_MAX) failures.push(`${where}: title ${rendered.length} > ${TITLE_MAX}: "${rendered}"`);
  const other = titles.get(rendered);
  if (other && where.startsWith('/')) failures.push(`${where}: same title as ${other}: "${rendered}"`);
  else if (where.startsWith('/')) titles.set(rendered, where);
}

const indexableDescriptions = new Map<string, string>();
function remember(route: string, description: string | undefined | null) {
  const value = (description ?? '').trim();
  const other = indexableDescriptions.get(value);
  if (value && other) failures.push(`${route}: same description as ${other}`);
  else if (value) indexableDescriptions.set(value, route);
}

function metaText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'absolute' in value) return String((value as { absolute: string }).absolute);
  return '';
}

/* 1. Authored landing-page copy: the 140 to 155 band applies in full. */
for (const [slug, text] of Object.entries(SERVICE_META_DESCRIPTIONS)) checkDescription(`SERVICE_META_DESCRIPTIONS.${slug}`, text, { min: true });
for (const [slug, text] of Object.entries(AREA_META_DESCRIPTIONS)) checkDescription(`AREA_META_DESCRIPTIONS.${slug}`, text, { min: true });
for (const [key, text] of Object.entries(CITY_SERVICE_META_DESCRIPTIONS)) {
  checkDescription(`CITY_SERVICE_META_DESCRIPTIONS.${key}`, text, { min: true });
  const [service, city] = key.split('/');
  if (isCityServiceNoindex(service, city)) failures.push(`CITY_SERVICE_META_DESCRIPTIONS.${key}: combination is noindexed`);
}

/* 2. Every generated landing page, exactly as the routes build it. */
for (const service of SERVICES) {
  const meta = buildPageMetadata({ kind: 'service', serviceName: service.name, serviceSlug: service.slug, path: `/services/${service.slug}` });
  checkDescription(`/services/${service.slug}`, meta.description, { min: true });
  checkTitle(`/services/${service.slug}`, metaText(meta.title));
  remember(`/services/${service.slug}`, meta.description);
  for (const city of CITIES) {
    const route = `/services/${service.slug}/${city.slug}`;
    const noindex = isCityServiceNoindex(service.slug, city.slug);
    const cityMeta = buildPageMetadata({
      kind: 'city-service',
      serviceName: service.name,
      serviceSlug: service.slug,
      cityName: city.name,
      citySlug: city.slug,
      path: route,
      noindex,
    });
    checkDescription(route, cityMeta.description, { min: !noindex });
    if (!noindex) {
      checkTitle(route, metaText(cityMeta.title));
      remember(route, cityMeta.description);
    }
  }
}
for (const city of CITIES) {
  const route = `/areas/${city.slug}`;
  const meta = buildPageMetadata({ kind: 'area', cityName: city.name, citySlug: city.slug, path: route });
  checkDescription(route, meta.description, { min: true });
  checkTitle(route, metaText(meta.title));
  remember(route, meta.description);
}
for (const kind of ['about', 'contact', 'blog'] as const) {
  const meta = buildPageMetadata({ kind, path: `/${kind}` });
  checkDescription(`buildPageMetadata(${kind})`, meta.description);
  checkTitle(`buildPageMetadata(${kind})`, metaText(meta.title));
}

/* 3. Posts, guides and blog category hubs. */
for (const post of BLOG_POSTS) {
  const route = `/blog/${post.slug}`;
  checkDescription(route, post.metaDescription || post.excerpt);
  checkTitle(route, post.seoTitle || post.title);
  remember(route, post.metaDescription || post.excerpt);
}
for (const guide of GUIDE_PAGES) {
  const route = `/guides/${guide.slug}`;
  checkDescription(route, guide.metaDescription || guide.excerpt);
  checkTitle(route, guide.seoTitle || guide.title);
  remember(route, guide.metaDescription || guide.excerpt);
}
for (const hub of CONTENT_HUBS) {
  const route = `/blog/category/${hub.hubSlug}`;
  checkDescription(route, hub.metaDescription, { min: true });
  checkTitle(route, `${hub.title} Articles`);
}

/* 4. Literal descriptions typed into route files. */
const RESOLVE: Record<string, string> = { 'SITE_CONFIG.name': SITE_CONFIG.name };
function literalText(node: ts.Expression | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      const key = span.expression.getText();
      if (!(key in RESOLVE)) return undefined;
      out += RESOLVE[key] + span.literal.text;
    }
    return out;
  }
  if (ts.isCallExpression(node) && node.expression.getText() === 'fitDescription') return literalText(node.arguments[0]);
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
  return undefined;
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'api' || name === 'admin') continue;
      walkFiles(full, out);
    } else if (/^(page|layout)\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

for (const file of walkFiles(path.join(ROOT, 'app'))) {
  const source = readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = path.relative(ROOT, file);
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && /^(description|descriptionOverride)$/.test(node.name.getText(tree))) {
      // Schema helpers (generateWebPageSchema and friends) carry descriptions
      // that are not meta tags; only check the ones inside metadata objects.
      let parent: ts.Node | undefined = node.parent;
      let inSchema = false;
      while (parent) {
        if (ts.isCallExpression(parent) && /Schema$/.test(parent.expression.getText(tree))) inSchema = true;
        parent = parent.parent;
      }
      const text = literalText(node.initializer);
      if (text !== undefined && !inSchema) checkDescription(`${rel} (${node.name.getText(tree)})`, text);
    }
    if (ts.isVariableDeclaration(node) && /DESCRIPTION$/.test(node.name.getText(tree))) {
      const text = literalText(node.initializer);
      if (text !== undefined) checkDescription(`${rel} (${node.name.getText(tree)})`, text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}

if (failures.length) {
  console.error(`[verify:meta-descriptions] ${failures.length} problem(s) in ${checked} descriptions:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`[verify:meta-descriptions] ${checked} descriptions checked: no phone numbers, no "!", none over ${META_DESCRIPTION_MAX}, no duplicates.`);

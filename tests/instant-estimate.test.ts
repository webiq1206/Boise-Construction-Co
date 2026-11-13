/**
 * The family's central instant estimator on this site.
 *
 * Owner decision, 13 November 2026: the estimator on the parent company's site
 * is the primary pricing call to action on every family site. This site frames
 * it at /instant-estimate and holds none of its logic. These tests pin that:
 * the page frames it under this site's brand id, the central CTA points at the
 * page, the frame component carries no pricing code, a service the estimator
 * cannot price keeps "Request a quote", and a lead conversion is sent for a
 * finished estimate only.
 *
 * Run: node --import tsx --test tests/instant-estimate.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import { getSiteUrlGroups } from '../lib/siteUrls.ts';
import { SERVICES } from '../shared/contentData.ts';
import { CTA_PRIMARY, CTA_PRIMARY_SHORT, CTA_QUOTE } from '../shared/ctaCopy.ts';
import {
  INSTANT_ESTIMATE_PATH,
  INSTANT_ESTIMATE_PROJECTS,
  INSTANT_ESTIMATOR_BRAND_ID,
  SERVICE_INSTANT_ESTIMATE_PROJECT,
  instantEstimateHref,
  servicePrimaryAction,
  validEstimatorProject,
} from '../shared/instantEstimate.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const exists = (p: string) => existsSync(new URL(`../${p}`, import.meta.url));

const PAGE = 'app/instant-estimate/page.tsx';
const FRAME = 'components/estimator/EstimatorFrame.tsx';
const ANALYTICS = 'components/estimator/EstimatorAnalytics.tsx';

test('the /instant-estimate page frames the central estimator under this site’s brand id', () => {
  assert.ok(exists(PAGE), `${PAGE} exists`);
  const page = read(PAGE);
  assert.equal(INSTANT_ESTIMATOR_BRAND_ID, 'construction');
  assert.equal(FAMILY_BRAND.id, INSTANT_ESTIMATOR_BRAND_ID);
  assert.match(page, /<EstimatorFrame\s+brand="construction"/);
  assert.match(page, /<EstimatorAnalytics \/>/);
  assert.match(page, /project=\{project\}/);
  assert.match(page, /headerOffset=\{HEADER_OFFSET\}/);
  // The project comes from the address, validated, and never from anywhere else.
  assert.match(page, /validEstimatorProject\(searchParams\.project\)/);
  // Canonical, one H1, and the normal site shell (it is not under /estimate).
  assert.match(page, /canonical: buildCanonical\(INSTANT_ESTIMATE_PATH\)/);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<InteriorPage\b/);
  // The path to a person stays on the page: the quote request and the phone.
  assert.match(page, /href=\{QUOTE_REQUEST_PATH\}/);
  assert.match(page, /SITE_CONFIG\.phoneHref/);
});

test('the project id is validated before it reaches the frame', () => {
  assert.equal(validEstimatorProject('adu'), 'adu');
  assert.equal(validEstimatorProject('custom-home'), 'custom-home');
  for (const bad of [undefined, null, '', 'ADU', 'adu&brand=p5', 'a/b', ['adu'], 'x'.repeat(41), 7]) {
    assert.equal(validEstimatorProject(bad), null, String(bad));
  }
  assert.equal(instantEstimateHref(), '/instant-estimate');
  assert.equal(instantEstimateHref('addition'), '/instant-estimate?project=addition');
  assert.equal(instantEstimateHref('not valid'), '/instant-estimate');
});

test('the central CTA is the instant estimate, and the quote request stays the path to a person', () => {
  assert.equal(INSTANT_ESTIMATE_PATH, '/instant-estimate');
  assert.equal(FAMILY_BRAND.cta.href, '/instant-estimate');
  assert.equal(FAMILY_BRAND.cta.label, 'Instant estimate');
  assert.equal(CTA_PRIMARY_SHORT, FAMILY_BRAND.cta.label);
  assert.equal(CTA_PRIMARY, 'Get an instant estimate');
  assert.equal(CTA_QUOTE, 'Request a quote');
  // The shared defaults every in-page primary button falls back to.
  assert.match(read('components/approved/PrimaryCta.tsx'), /href = INSTANT_ESTIMATE_PATH,/);
  assert.match(read('components/modals/EstimateCTA.tsx'), /explicitHref \?\? INSTANT_ESTIMATE_PATH/);
  // The page is in the one URL inventory the XML and HTML sitemaps are built from,
  // and the quote request form is still there beside it.
  const paths = getSiteUrlGroups().flatMap((group) => group.entries.map((entry) => entry.path));
  assert.equal(paths.filter((path) => path === '/instant-estimate').length, 1);
  assert.ok(paths.includes('/estimate'));
  // Existing lead paths are not removed: the quote form and its emailed scope links.
  assert.ok(exists('app/estimate/page.tsx'));
  assert.ok(exists('app/estimate/scope'));
});

test('a service opens the estimator only on a project the estimator can price', () => {
  const slugs = new Set(SERVICES.map((service) => service.slug));
  const projects = new Set<string>(INSTANT_ESTIMATE_PROJECTS);
  for (const [slug, project] of Object.entries(SERVICE_INSTANT_ESTIMATE_PROJECT)) {
    assert.ok(slugs.has(slug), `${slug} is a published service`);
    assert.ok(projects.has(project), `${project} is an estimator project for this brand`);
    assert.deepEqual(servicePrimaryAction(slug), {
      label: 'Get an instant estimate',
      href: `/instant-estimate?project=${project}`,
      instant: true,
    });
  }
  assert.equal(servicePrimaryAction('adu').href, '/instant-estimate?project=adu');
  assert.equal(servicePrimaryAction('home-additions').href, '/instant-estimate?project=addition');
  // No project maps: the page keeps the quote request it had before. A shop home is a house,
  // not the detached garage or shop project.
  for (const slug of ['home-plans-design', 'lot-evaluation', 'shop-homes-barndominiums']) {
    assert.ok(slugs.has(slug), slug);
    assert.deepEqual(servicePrimaryAction(slug), { label: 'Request a quote', href: '/estimate', instant: false }, slug);
  }
  // Every service is decided one way or the other, so a new one cannot slip through unnoticed.
  const unmapped = SERVICES.map((service) => service.slug).filter((slug) => !(slug in SERVICE_INSTANT_ESTIMATE_PROJECT));
  assert.deepEqual(unmapped.sort(), ['home-plans-design', 'lot-evaluation', 'shop-homes-barndominiums']);
  // Both service templates use the rule.
  assert.match(read('app/services/[slug]/page.tsx'), /primaryAction=\{primaryAction\}/);
  assert.match(read('app/services/[slug]/[city]/page.tsx'), /primaryAction=\{servicePrimaryAction\(service\.slug\)\}/);
});

test('EstimatorFrame only frames the estimator: no pricing code, and outside the shared chrome', () => {
  const frame = read(FRAME);
  assert.match(frame, /https:\/\/p5homeco\.com/);
  assert.match(frame, /\/estimator\/embed\?/);
  // Its only import is React. No estimate engine, cost data, pricing or lead code.
  const imports = [...frame.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map((match) => match[1]);
  assert.deepEqual(imports, ['react']);
  assert.doesNotMatch(frame, /\brequire\(|\bimport\(/);
  assert.doesNotMatch(frame, /estimateEngine|shared\/costs|lib\/p5|priceScope|calculateEstimate|costBook|fetch\(/);
  // The shared family chrome forbids the parent company's URL, so the frame lives here.
  assert.equal(exists('components/family/EstimatorFrame.tsx'), false);
});

test('a lead conversion is sent for a finished estimate only, once per page view', () => {
  const analytics = read(ANALYTICS);
  assert.match(analytics, /^"use client";/);
  assert.match(analytics, /addEventListener\("p5-estimator-event"/);
  assert.match(analytics, /trackEvent\(detail\.name, \{ estimator_brand: brand, estimator_project: project \}\)/);
  assert.match(analytics, /const LEAD_EVENT = "estimator_completed";/);
  assert.match(analytics, /const LEAD_SOURCE = "instant_estimator";/);
  // Everything that counts a lead sits behind the one guard.
  const guard = analytics.indexOf('if (detail.name !== LEAD_EVENT || leadSent.current) return;');
  assert.ok(guard > 0, 'the completed-only, once-only guard');
  for (const call of ['trackEvent("generate_lead"', 'trackGoogleAdsLead(', 'trackMetaEvent("Lead"']) {
    assert.equal(analytics.split(call).length - 1, 1, `${call} appears once`);
    assert.ok(analytics.indexOf(call) > guard, `${call} is behind the guard`);
  }
  assert.match(analytics, /return null;/);
});

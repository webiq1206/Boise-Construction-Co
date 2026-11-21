/**
 * The homepage planning range explorer is retired (owner, 21 November 2026:
 * one source of prices). It ran this site's own engine and showed figures
 * that differed from the P5 instant estimator, so the homepage now shows a
 * short instant estimate block in its place: no figure, one link per project
 * the estimator prices for this brand, and the path to a person beside it.
 * components/PlanningRangeExplorer.tsx stays in the repository, unmounted.
 *
 * These tests render the real homepage body and check the block, and check
 * that no page on the site still links to /#calculator.
 *
 * Run: node --import tsx --test tests/home-instant-estimate-block.test.ts
 */
import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CTA_QUOTE } from '../shared/ctaCopy.ts';
import { INSTANT_ESTIMATE_PROJECTS, INSTANT_ESTIMATE_PROJECT_LABELS, QUOTE_REQUEST_PATH, instantEstimateHref } from '../shared/instantEstimate.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';

// CSS modules have no meaning in node: each class name reads as its own key.
(Module as unknown as { _extensions: Record<string, (module: { exports: unknown }) => void> })._extensions['.css'] = (module) => {
  module.exports = new Proxy({}, { get: (_, key) => (key === '__esModule' ? undefined : String(key)) });
};
(globalThis as typeof globalThis & { React: typeof React }).React = React;

let html = '';
let block = '';

test.before(async () => {
  const { ApprovedHome } = await import('../components/approved/ApprovedHome.tsx');
  html = renderToStaticMarkup(React.createElement(ApprovedHome));
  const start = html.indexOf('id="estimate-by-project"');
  block = html.slice(start, html.indexOf('</section>', start));
});

test('the homepage renders no planning range explorer', () => {
  const home = readFileSync('components/approved/ApprovedHome.tsx', 'utf8');
  assert.doesNotMatch(home, /<PlanningRangeExplorer\b|import \{PlanningRangeExplorer\}/);
  assert.doesNotMatch(html, /data-testid="planning-range-explorer"|data-testid="proof-range-value"|type="range"/);
  // The component itself is kept, unmounted, as the owner asked.
  assert.match(readFileSync('components/PlanningRangeExplorer.tsx', 'utf8'), /export function PlanningRangeExplorer/);
});

test('the block links the instant estimate for every project, with the path to a person', () => {
  assert.ok(block.length > 0, 'the block is on the homepage');
  assert.ok(html.indexOf('id="estimate-by-project"') > html.indexOf('id="own-a-lot"'), 'where the explorer was: after "Already own a lot?"');
  assert.ok(html.indexOf('id="estimate-by-project"') < html.indexOf('id="why-choose-us"'), 'and before the way we work');
  assert.deepEqual([...INSTANT_ESTIMATE_PROJECTS], ['custom-home', 'addition', 'garage-shop', 'adu']);
  for (const id of INSTANT_ESTIMATE_PROJECTS) {
    assert.equal(instantEstimateHref(id), `/instant-estimate?project=${id}`);
    assert.ok(block.includes(`href="${instantEstimateHref(id)}"`), id);
    assert.ok(block.includes(`>${INSTANT_ESTIMATE_PROJECT_LABELS[id]}<`), INSTANT_ESTIMATE_PROJECT_LABELS[id]);
  }
  assert.ok(block.includes(`href="${QUOTE_REQUEST_PATH}"`) && block.includes(`>${CTA_QUOTE}<`), 'Request a quote beside it');
  assert.ok(block.includes(`href="${SITE_CONFIG.phoneHref}"`), 'and the phone');
  assert.match(block, /fam-btn fam-btn--secondary fam-btn--lg fam-btn--on-dark/, 'family button styles');
  assert.ok(block.includes('id="calculator"'), 'old outside links (ads, GBP posts) still land on the block');
});

test('the block shows no figure and follows the wording rules', () => {
  const text = block.replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(text, /\$\s?\d|\d{1,3},\d{3}/, 'no price');
  assert.doesNotMatch(text, /instant\s+(?:quote|bid)|final price|firm price|guaranteed/i);
  assert.doesNotMatch(text, /\b\d+\s+(?:minutes?|seconds?)\b/i);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false, 'no em dash');
  assert.doesNotMatch(text, /near me/i);
});

test('no page on the site links to /#calculator', () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (/\.(tsx?|mjs|txt|json)$/.test(name) && /(?:["'(]\/?|\}\/|\.co\/)#calculator\b/.test(readFileSync(file, 'utf8'))) offenders.push(file);
    }
  };
  for (const dir of ['app', 'components', 'shared', 'lib', 'public']) walk(dir);
  assert.deepEqual(offenders, []);
});

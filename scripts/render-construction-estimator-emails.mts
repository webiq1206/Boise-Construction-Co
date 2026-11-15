/**
 * Render Boise Construction Co estimator fixtures to HTML and PNG.
 * Does not send email.
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';

import {CONSTRUCTION_FIXTURES, renderConstructionFixture} from '../tests/construction-email-fixtures.ts';

const out = '/opt/cursor/artifacts/emails';
mkdirSync(out, {recursive: true});

const browser = await chromium.launch();
const page = await browser.newPage();
const written: string[] = [];

for (const fixture of CONSTRUCTION_FIXTURES) {
  const rendered = renderConstructionFixture(fixture);
  for (const kind of ['admin', 'customer'] as const) {
    const message = rendered[kind];
    const htmlPath = path.join(out, `${fixture.id}-${kind}.html`);
    writeFileSync(htmlPath, message.html);
    writeFileSync(path.join(out, `${fixture.id}-${kind}.txt`), message.text);
    written.push(htmlPath);
    for (const width of [1280, 375]) {
      await page.setViewportSize({width, height: 900});
      await page.setContent(message.html, {waitUntil: 'load'});
      const png = path.join(out, `${fixture.id}-${kind}-${width}.png`);
      await page.screenshot({path: png, fullPage: true});
      written.push(png);
    }
  }
}

await browser.close();
console.log(written.join('\n'));

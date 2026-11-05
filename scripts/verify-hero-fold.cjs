/* Homepage fold geometry only. Local Chromium emulation, no submissions or deployment.
 * Overlay color and contrast belong to their separate review and are not asserted here. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const base = new URL(process.env.E2E_BASE_URL || 'http://127.0.0.1:34863');
if (base.href !== 'http://127.0.0.1:34863/') throw new Error('Fold QA requires the isolated local preview at port 34863');
const output = path.resolve('test-results/hero-fold');
const normal = [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080],[320,844]];
const failures = [], rows = [], pageErrors = [], blocked = {};
const check = (condition, message) => { if (!condition) failures.push(message); };
const close = (a, b) => Math.abs(a - b) <= 1;
let browser;

async function contextFor(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const asset = /\.(?:png|webp|jpe?g|svg|ico|woff2?|ttf|css|js|map|mp4|webm)$/.test(url.pathname);
    const localImage = url.pathname === '/_next/image' && /^\/(?!\/)/.test(url.searchParams.get('url') || '');
    if (url.origin === base.origin && request.method() === 'GET' && !url.pathname.startsWith('/api/') &&
        (url.pathname === '/' || asset || localImage || url.pathname.startsWith('/_next/static/'))) return route.continue();
    const category = url.origin !== base.origin ? 'external' : url.pathname.startsWith('/api/') ? 'api' : 'other';
    blocked[category] = (blocked[category] || 0) + 1;
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  return context;
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // Let ResizeObservers publish wrap-grown chrome and let bar transitions finish.
  await page.waitForTimeout(400);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function open(context, label) {
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push({ label, message: error.message }));
  const response = await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (!response?.ok()) throw new Error(`${label}: preview returned ${response?.status()}`);
  await page.locator('.home-hero .fam-hero-copy').waitFor();
  await page.locator('[data-hero-poster]').evaluate(image => image.decode());
  await settle(page);
  return page;
}

async function capture(page, label, { short = false, menu = false } = {}) {
  await settle(page);
  const m = await page.evaluate(() => {
    const hero = document.querySelector('.home-hero [data-family-hero]');
    const header = document.querySelector('[data-family-header]'), bar = document.querySelector('[data-family-bar]');
    const rect = element => { const r = element.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
    const visible = element => element && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility === 'visible';
    const barVisible = visible(bar) && bar.dataset.state === 'visible';
    const hit = element => { const r = element.getBoundingClientRect(), found = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return !!found && element.contains(found); };
    const viewport = { width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height ?? innerHeight,offsetTop:visualViewport?.offsetTop ?? 0 };
    const cta = hero.querySelector('[data-hero-cta="primary"]');
    return { viewport,hero:rect(hero),header:rect(header),bar:barVisible?rect(bar):null,barState:bar?.dataset.state,
      minHeight:parseFloat(getComputedStyle(hero).minHeight),copy:rect(hero.querySelector('.fam-hero-copy')),
      headline:rect(hero.querySelector('h1')),cta:{...rect(cta),unobstructed:hit(cta)},
      video:rect(hero.querySelector('video')),poster:rect(hero.querySelector('[data-hero-poster]')),
      proof:rect(document.querySelector('.fam-proof')),overflow:document.documentElement.scrollWidth>innerWidth+1,
      heroScrollBox:hero.scrollHeight>hero.clientHeight+1,copyScrollBox:hero.querySelector('.fam-hero-copy').scrollHeight>hero.querySelector('.fam-hero-copy').clientHeight+1,
      headerSafe:parseFloat(getComputedStyle(header).paddingTop),barSafe:bar?Math.max(0,parseFloat(getComputedStyle(bar).paddingBottom)-(parseFloat(getComputedStyle(bar).getPropertyValue('--bar-pad'))||12)):0 };
  });
  const floor = m.bar ? m.bar.y : m.viewport.visualHeight + m.viewport.offsetTop;
  const budget = floor - m.header.bottom, overflow = m.hero.bottom > floor + 1;
  const narrowException = m.viewport.width === 320 && m.viewport.height === 568;
  rows.push({ label,condition:short?'unusually short viewport':narrowException?'320x568 exception':'normal',expectedBudget:budget,exceptionUsed:overflow&&(short||narrowException),...m });
  check(close(m.hero.y,m.header.bottom),`${label}: hero does not begin directly below actual header`);
  check(close(m.minHeight,budget),`${label}: reserved budget ${m.minHeight}px differs from actual ${budget}px; safe areas count inside measured chrome once`);
  check(m.hero.bottom>=floor-1,`${label}: hero ends above visible fold`);
  check(m.proof.y>=floor-1,`${label}: proof strip peeks into initial visible viewport`);
  check(!m.overflow,`${label}: horizontal overflow`);
  check(!m.heroScrollBox&&!m.copyScrollBox,`${label}: hero content is clipped or placed in an internal scroll box`);
  for (const name of ['video','poster']) check(['x','y','width','height'].every(key=>close(m.hero[key],m[name][key])),`${label}: ${name} does not cover complete hero`);
  check(m.copy.y>=m.hero.y-1&&m.copy.bottom<=m.hero.bottom+1,`${label}: natural copy escapes hero bounds`);
  if (!short&&!narrowException) {
    check(close(m.hero.bottom,floor),`${label}: complete normal hero does not end exactly at fold`);
    check(m.copy.bottom<=floor+1,`${label}: complete normal copy extends below fold`);
  }
  if (!short&&!menu) {
    check(m.headline.y>=m.header.bottom-1&&m.headline.bottom<=floor+1,`${label}: headline does not fit first screen`);
    check(m.cta.y>=m.header.bottom-1&&m.cta.bottom<=floor+1&&m.cta.unobstructed,`${label}: primary CTA is outside first screen or obstructed`);
  }
  await page.screenshot({ path:path.join(output,`${label}.png`) });
  return m;
}

async function run() {
  fs.mkdirSync(output,{recursive:true});
  browser = await chromium.launch({headless:true});
  for (const [width,height] of [...normal,[844,390],[1024,600]]) {
    const label=`${width}x${height}`, context=await contextFor({width,height});
    try { await capture(await open(context,label),label,{short:height===390||height===600}); }
    catch(error) { failures.push(`${label}: ${error.message}`); }
    finally { await context.close(); }
  }
  const context=await contextFor({width:390,height:844});
  try {
    const page=await open(context,'transitions');
    for (const height of [844,700,932]) {
      await page.setViewportSize({width:390,height});
      await capture(page,`resize-390x${height}`);
    }
    await page.getByTestId('button-mobile-menu-open').click();
    await page.getByRole('dialog',{name:'Navigation menu'}).waitFor();
    const hidden=await capture(page,'menu-open-bar-hidden',{menu:true});
    check(hidden.bar===null&&hidden.barState==='hidden','menu: bottom bar did not yield');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog',{name:'Navigation menu'}).waitFor({state:'hidden'});
    const restored=await capture(page,'menu-escape-bar-restored');
    check(restored.bar!==null&&restored.barState==='visible','menu: bottom bar was not restored after Escape');
    for (const width of [1179,1180]) {
      await page.setViewportSize({width,height:900});
      const m=await capture(page,`threshold-${width}x900`);
      check(width===1179?m.bar!==null:m.bar===null,`${width}px: incorrect actual bottom-bar visibility at brand threshold`);
    }
  } catch(error) { failures.push(`transitions: ${error.message}`); }
  finally { await context.close(); }
}

run().catch(error=>failures.push(error.stack||String(error))).finally(async()=>{
  if(browser) await browser.close();
  check(pageErrors.length===0,`Browser errors: ${JSON.stringify(pageErrors)}`);
  let sha='unknown'; try {sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();} catch {}
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify({sha,scope:'Homepage fold only; Chromium CSS viewport emulation; physical devices/browser-control collapse not exercised; local GET assets only; no submissions',rows,blocked,pageErrors,failures},null,2));
  console.log(JSON.stringify({rows:rows.length,exceptions:rows.filter(row=>row.exceptionUsed).map(row=>row.label),blocked,pageErrors,failures},null,2));
  if(failures.length) process.exitCode=1;
});

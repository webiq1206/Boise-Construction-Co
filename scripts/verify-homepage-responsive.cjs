/* Homepage-only, offline rendered QA. This is not production or lead-delivery QA.
 * Run against the loopback development server launched by offline-run.mjs.
 * Artifacts support independent visual review; assertions cannot replace it.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const base = new URL(process.env.E2E_BASE_URL || 'http://127.0.0.1:34863');
if (base.origin !== 'http://127.0.0.1:34863' || base.pathname !== '/' || base.search || base.hash) {
  throw new Error('Homepage QA only supports http://127.0.0.1:34863/');
}
const output = path.resolve('test-results/homepage-responsive');
fs.mkdirSync(output, { recursive: true });
const viewports = [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080],[844,390],[1024,600]];
// The instant estimate by project replaced the planning range explorer on 21
// November 2026 (one source of prices). Its four projects, in order.
const projects = ['custom-home','addition','garage-shop','adu'];
const failures = [], rows = [], blocked = {}, pageErrors = [];
let browser;
const check = (ok, message) => { if (!ok) failures.push(message); };
const pause = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

(async () => {
  browser = await chromium.launch({headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH} : {})});
  const context = await browser.newContext({reducedMotion: 'reduce', serviceWorkers: 'block'});
  await context.route('**/*', route => {
    const req = route.request(), u = new URL(req.url());
    const asset = /\.(?:png|webp|jpe?g|svg|ico|woff2?|ttf|css|js|map)$/.test(u.pathname);
    const nextAsset = u.pathname.startsWith('/_next/static/') || u.pathname === '/_next/webpack-hmr';
    const image = u.pathname === '/_next/image' && (u.searchParams.get('url') || '').startsWith('/') && !(u.searchParams.get('url') || '').startsWith('//');
    const allowed = u.origin === base.origin && req.method() === 'GET' && !u.pathname.startsWith('/api/') && (u.pathname === '/' || asset || nextAsset || image);
    if (!allowed) {
      const category = u.origin !== base.origin ? 'external' : u.pathname.startsWith('/api/') ? 'api' : 'other';
      blocked[category] = (blocked[category] || 0) + 1;
      return route.abort();
    }
    return route.continue();
  });
  // No browser-originated websocket connections, including external telemetry.
  await context.routeWebSocket('**/*', socket => socket.close());
  for (const [width,height] of viewports) {
    const key = `${width}x${height}`;
    const page = await context.newPage();
    await page.setViewportSize({width,height});
    page.on('pageerror', error => pageErrors.push({viewport:key,message:error.message}));
    const record = {viewport:key, interactions:[]};
    rows.push(record);
    try {
      const response = await page.goto(base.href,{waitUntil:'networkidle',timeout:180000});
      check(response.ok(), `${key}: homepage status ${response.status()}`);
      await page.locator('#estimate-by-project [data-estimator-project]').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({path:path.join(output,`first-${key}.png`)});
      // Trigger real lazy images/reveals without changing rendered styles.
      await page.evaluate(async () => {
        for (let y=0; y<document.documentElement.scrollHeight; y+=Math.max(200,innerHeight/2)) {
          scrollTo(0,y); await new Promise(r=>setTimeout(r,30));
        }
        await Promise.all([...document.images].map(image => image.decode().catch(()=>{})));
        scrollTo(0,0);
      });
      await pause(page);
      await page.screenshot({path:path.join(output,`full-${key}.jpg`),fullPage:true,type:'jpeg',quality:80});
      for (const id of ['own-a-lot','estimate-by-project']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await pause(page);
        await page.locator(`#${id}`).screenshot({path:path.join(output,`${id}-${key}.png`)});
      }
      record.metrics = await page.evaluate(() => {
        const block=document.querySelector('#estimate-by-project');
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
        const rgba=value=>{
          const values=value.match(/[\d.]+/g)?.map(Number);
          if (!value.startsWith('rgb') || !values || values.length<3) return null;
          return [...values.slice(0,3),values[3]??1];
        };
        const over=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
        const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
        const textContrast=[...block.querySelectorAll('.approved-estimate-intro p, [data-estimator-project] span, ul + div p')].map(label=>{
          const ancestors=[];
          for(let element=label;element;element=element.parentElement) ancestors.unshift(element);
          let background=[255,255,255],supported=true;
          for(const element of ancestors){
            const css=getComputedStyle(element),color=rgba(css.backgroundColor);
            if(!color || css.backgroundImage!=='none' || Number(css.opacity)!==1) supported=false;
            if(color) background=over(color,background);
          }
          const color=rgba(getComputedStyle(label).color);
          const foreground=color?over(color,background):null;
          const a=foreground?luminance(foreground):null,b=luminance(background);
          return {text:label.textContent.trim(),ratio:supported && a!==null?(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05):null};
        });
        const links=[...block.querySelectorAll('[data-estimator-project]')];
        return {textContrast,overflow:document.documentElement.scrollWidth>innerWidth+1,block:rect(block),projects:links.map(link=>({id:link.dataset.estimatorProject,href:link.getAttribute('href'),...rect(link)})),titleSize:getComputedStyle(block.querySelector('h2')).fontSize,figures:/\$\s?\d/.test(block.innerText),brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.getAttribute('src'))};
      });
      const m=record.metrics;
      check(!m.overflow,`${key}: page horizontal overflow`);
      check(Number.parseFloat(m.titleSize)<=40,`${key}: estimate heading exceeds 40px (${m.titleSize})`);
      check(m.textContrast.length>=6 && m.textContrast.every(label=>label.ratio!==null && label.ratio>=4.5),`${key}: estimate block text must have measurable 4.5:1 contrast (${JSON.stringify(m.textContrast)})`);
      check(!m.figures,`${key}: the estimate block shows a price`);
      check(JSON.stringify(m.projects.map(p=>p.id))===JSON.stringify(projects),`${key}: expected the four estimator projects in order`);
      check(m.projects.every(p=>p.href===`/instant-estimate?project=${p.id}`),`${key}: a project button does not open the estimator on its project`);
      check(m.projects.every(p=>p.height>=44 && p.width>=44),`${key}: undersized project button`);
      check(!m.brokenImages.length,`${key}: broken homepage images`);
      // Keyboard: every project button takes focus in order.
      const first=page.locator('#estimate-by-project [data-estimator-project]').first();
      await first.scrollIntoViewIfNeeded();
      await first.focus();
      const order=[await first.getAttribute('data-estimator-project')];
      for (let i=1;i<projects.length;i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement?.getAttribute('data-estimator-project'))); }
      check(JSON.stringify(order)===JSON.stringify(projects),`${key}: keyboard order ${JSON.stringify(order)}`);
      record.interactions.push({keyboardOrder:order});
      await page.screenshot({path:path.join(output,`controls-${key}.png`)});
      const cta=page.locator('#estimate-by-project a[href="/estimate"]');
      await cta.scrollIntoViewIfNeeded();
      await cta.focus();
      await page.waitForTimeout(350);
      record.cta=await cta.evaluate(element => {
        const r=element.getBoundingClientRect(), css=getComputedStyle(element);
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        const header=document.querySelector('[data-family-header]').getBoundingClientRect();
        return {text:element.innerText,href:element.getAttribute('href'),width:r.width,height:r.height,top:r.top,bottom:r.bottom,fontSize:css.fontSize,color:css.color,visible:css.visibility==='visible' && css.display!=='none',unobstructed:!!hit && element.contains(hit),aboveHeader:r.top<header.bottom,focused:document.activeElement===element};
      });
      check(record.cta.href==='/estimate' && record.cta.text.trim()==='Request a quote',`${key}: changed request CTA`);
      check(record.cta.visible && record.cta.unobstructed && !record.cta.aboveHeader && record.cta.bottom<=height && record.cta.width>=44 && record.cta.height>=44 && Number.parseFloat(record.cta.fontSize)>=14 && record.cta.focused,`${key}: request CTA is not readable/reachable`);
      await page.screenshot({path:path.join(output,`cta-${key}.png`)});
      check(page.url()===base.href,`${key}: navigated outside homepage`);
    } catch(error) {
      failures.push(`${key}: ${error.message}`);
      await page.screenshot({path:path.join(output,`error-${key}.jpg`),fullPage:true,type:'jpeg',quality:80}).catch(()=>{});
    } finally { await page.close(); }
  }
})().catch(error=>failures.push(error.stack || error.message)).finally(async()=>{
  if(browser) await browser.close().catch(error => failures.push(`Browser cleanup: ${error.message}`));
  // CI's checkout can have different ownership inside the official container.
  // Never change Git trust/security settings merely to record provenance.
  let sha = process.env.GITHUB_SHA || null;
  if (!sha) {
    try { sha = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); }
    catch { /* Missing local provenance must not discard rendered evidence. */ }
  }
  fs.writeFileSync(path.join(output,'responsive-metrics.json'),JSON.stringify({sha,browser:'Chromium, emulated CSS viewports; no physical devices or on-screen keyboard',scope:'Homepage only; API/external requests blocked; no form submission, providers, database, delivery or production checks',rows,blocked,pageErrors,failures},null,2));
  console.log(JSON.stringify({viewports:rows.length,failures,blocked,pageErrors},null,2));
  if(failures.length || pageErrors.length) process.exitCode=1;
});

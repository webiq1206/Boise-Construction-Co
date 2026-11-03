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
const projects = ['custom-home','semi-custom-home','build-on-your-lot','shop-home'];
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
      await page.locator('#calculator [role=radio]').first().waitFor();
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
      for (const id of ['own-a-lot','calculator']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await pause(page);
        await page.locator(`#${id}`).screenshot({path:path.join(output,`${id}-${key}.png`)});
      }
      // Align the active input block immediately below the actual sticky header.
      await page.evaluate(() => {
        const controls=document.querySelector('.planning-range-controls');
        const header=document.querySelector('[data-family-header]');
        scrollBy(0,controls.getBoundingClientRect().top-header.getBoundingClientRect().height-8);
      });
      await page.waitForTimeout(350);
      record.metrics = await page.evaluate(() => {
        const calc=document.querySelector('#calculator');
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
        const header=document.querySelector('[data-family-header]');
        const bar=document.querySelector('[data-family-bar]');
        const barVisible=bar && bar.dataset.state==='visible' && getComputedStyle(bar).display!=='none';
        const rgba=value=>{
          const values=value.match(/[\d.]+/g)?.map(Number);
          if (!value.startsWith('rgb') || !values || values.length<3) return null;
          return [...values.slice(0,3),values[3]??1];
        };
        const over=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
        const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
        const labelContrast=[...calc.querySelectorAll('.planning-range-label, .planning-range-sqft-bounds')].map(label=>{
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
          return {text:label.textContent.trim(),color:getComputedStyle(label).color,background,ratio:supported && a!==null?(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05):null};
        });
        return {labelContrast,overflow:document.documentElement.scrollWidth>innerWidth+1,calculator:rect(calc),controls:rect(calc.querySelector('.planning-range-controls')),header:rect(header),bottomBar:barVisible?rect(bar):null,cards:[...calc.querySelectorAll('[role=radio]')].map(rect),labelColor:getComputedStyle(calc.querySelector('.planning-range-label')).color,titleSize:getComputedStyle(calc.querySelector('h2')).fontSize,result:rect(calc.querySelector('.planning-range-result')),brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.getAttribute('src'))};
      });
      const m=record.metrics;
      check(!m.overflow,`${key}: page horizontal overflow`);
      check(Number.parseFloat(m.titleSize)<=40,`${key}: planning heading exceeds 40px (${m.titleSize})`);
      check(m.labelContrast.length>=3 && m.labelContrast.every(label=>label.ratio!==null && label.ratio>=4.5),`${key}: planning labels must have measurable 4.5:1 contrast (${JSON.stringify(m.labelContrast)})`);
      check(m.cards.length===4,`${key}: expected four project choices`);
      check(m.cards.every(c=>c.height>=56 && c.width>=44),`${key}: undersized project choice`);
      check(m.controls.y>=m.header.bottom-1 && m.controls.bottom<=height-(m.bottomBar?.height||0)+1,`${key}: active controls do not fit visible viewport`);
      check(!m.brokenImages.length,`${key}: broken homepage images`);
      await page.screenshot({path:path.join(output,`controls-${key}.png`)});
      for (const [index,id] of projects.entries()) {
        const choice=page.getByTestId(`proof-project-${id}`);
        await choice.click();
        check(await choice.getAttribute('aria-checked')==='true',`${key}: pointer selection ${id}`);
        // Switch away, then select using keyboard only to prove both input paths.
        await page.getByTestId(`proof-project-${projects[(index+1)%projects.length]}`).click();
        await choice.focus(); await page.keyboard.press(index%2 ? 'Space' : 'Enter');
        check(await choice.getAttribute('aria-checked')==='true',`${key}: keyboard selection ${id}`);
        const slider=page.getByTestId('proof-sqft-slider');
        await slider.focus(); await page.keyboard.press('End');
        const maxValue=await slider.inputValue();
        check(maxValue===await slider.getAttribute('max'),`${key}: max slider ${id}`);
        const maxResult=await page.getByTestId('proof-range-value').innerText();
        await page.keyboard.press('Home');
        const minValue=await slider.inputValue();
        check(minValue===await slider.getAttribute('min'),`${key}: min slider ${id}`);
        const minResult=await page.getByTestId('proof-range-value').innerText();
        check(minResult.includes('From') && minResult!==maxResult,`${key}: result did not update ${id}`);
        await page.keyboard.press('ArrowRight');
        check(Number(await slider.inputValue())===Number(minValue)+Number(await slider.getAttribute('step')),`${key}: slider step ${id}`);
        record.interactions.push({project:id,pointer:true,keyboard:index%2?'Space':'Enter',minValue,maxValue,minResult,maxResult});
        await page.locator('#calculator').screenshot({path:path.join(output,`state-${id}-${key}.png`)});
      }
      const cta=page.getByTestId('proof-cta-estimate');
      await cta.scrollIntoViewIfNeeded();
      await cta.focus();
      await page.waitForTimeout(350);
      record.cta=await cta.evaluate(element => {
        const r=element.getBoundingClientRect(), css=getComputedStyle(element);
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        const header=document.querySelector('[data-family-header]').getBoundingClientRect();
        return {text:element.innerText,href:element.getAttribute('href'),width:r.width,height:r.height,top:r.top,bottom:r.bottom,fontSize:css.fontSize,color:css.color,background:css.backgroundColor,visible:css.visibility==='visible' && css.display!=='none',unobstructed:!!hit && element.contains(hit),aboveHeader:r.top<header.bottom,focused:document.activeElement===element};
      });
      check(record.cta.href==='/estimate' && record.cta.text.trim()==='Request a quote',`${key}: changed estimate CTA`);
      check(record.cta.visible && record.cta.unobstructed && !record.cta.aboveHeader && record.cta.bottom<=height && record.cta.width>=44 && record.cta.height>=44 && Number.parseFloat(record.cta.fontSize)>=14 && record.cta.focused,`${key}: estimate CTA is not readable/reachable`);
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

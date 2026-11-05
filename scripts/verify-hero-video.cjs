/* Scoped, offline browser evidence for the Construction homepage hero.
 * Uses real local media. No API calls, external requests or form submissions.
 * Screenshots/metrics support independent review; they are not live-site QA.
 */
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const base = new URL(process.env.E2E_BASE_URL || 'http://127.0.0.1:34863');
if (base.href !== 'http://127.0.0.1:34863/') {
  throw new Error('Hero QA only supports http://127.0.0.1:34863/');
}
const output = path.resolve('test-results/hero-video');
fs.mkdirSync(output, { recursive: true });
const viewports = [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080]];
const failures = [], rows = [], states = [], pageErrors = [], blocked = {};
const check = (ok, message) => { if (!ok) failures.push(message); };
const mediaPath = /\/boise-construction-co-background(?:-\d+p)?\.(?:mp4|webm)$/;
let browser;

async function contextFor(options = {}) {
  const { saveData = false, effectiveType, failMedia = false, failWebm = false, ...browserOptions } = options;
  const context = await browser.newContext({ serviceWorkers: 'block', ...browserOptions });
  if (saveData || effectiveType) {
    await context.addInitScript(({ saveData, effectiveType }) => {
      const connection = new EventTarget();
      connection.saveData = saveData;
      connection.effectiveType = effectiveType || '4g';
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: connection,
      });
    }, { saveData, effectiveType });
  }
  const requests = [];
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const isMedia = mediaPath.test(url.pathname);
    if (isMedia) requests.push(url.pathname);
    const asset = /\.(?:png|webp|jpe?g|svg|ico|woff2?|ttf|css|js|map|mp4|webm)$/.test(url.pathname);
    const next = url.pathname.startsWith('/_next/static/') || url.pathname === '/_next/webpack-hmr';
    const image = url.pathname === '/_next/image' && (url.searchParams.get('url') || '').startsWith('/') && !(url.searchParams.get('url') || '').startsWith('//');
    const allowed = url.origin === base.origin && request.method() === 'GET' && !url.pathname.startsWith('/api/') && (url.pathname === '/' || asset || next || image);
    const expectedMediaFailure = isMedia && (failMedia || (failWebm && url.pathname.endsWith('.webm')));
    if (!allowed || expectedMediaFailure) {
      const category = expectedMediaFailure ? 'expected-media-failure' : url.origin !== base.origin ? 'external' : url.pathname.startsWith('/api/') ? 'api' : 'other';
      blocked[category] = (blocked[category] || 0) + 1;
      return route.abort();
    }
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  return { context, requests };
}

async function open(context, label) {
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push({ label, message: error.message }));
  const response = await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: 180000 });
  check(response?.ok(), `${label}: homepage did not return 200`);
  if(!response?.ok()) throw new Error(`Preview returned ${response?.status()}; restart isolated preview before retrying`);
  await page.locator('.home-hero .fam-hero-copy').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function playing(page) {
  await page.waitForFunction(() => {
    const video = document.querySelector('.home-hero video');
    return video && !video.paused && video.readyState >= 2 && video.currentTime > 0;
  }, null, { timeout: 30000 });
}

async function paused(page) {
  await page.waitForFunction(() => document.querySelector('.home-hero video')?.paused, null, { timeout: 10000 });
}

async function frame(page, seconds) {
  await page.locator('.home-hero video').evaluate(async (video, seconds) => {
    video.pause();
    if (Math.abs(video.currentTime - seconds) < 0.02) return;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out seeking approved video')), 15000);
      video.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
      video.currentTime = seconds;
    });
  }, seconds);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function geometry(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('.home-hero section.fam-hero');
    const video = hero.querySelector('video'), poster = hero.querySelector('[data-hero-poster]');
    const rect = element => { const r = element.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; };
    const header = document.querySelector('[data-family-header]');
    const bar = document.querySelector('[data-family-bar]');
    const barRect = bar && getComputedStyle(bar).display !== 'none' && bar.dataset.state === 'visible' ? rect(bar) : null;
    const cta = hero.querySelector('[data-hero-cta="primary"]');
    const control = hero.querySelector('button.hero-video-control');
    const controlRect = control && getComputedStyle(control).display !== 'none' ? rect(control) : null;
    const accessible = element => {
      const r = element.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
      return !!hit && (hit === element || element.contains(hit));
    };
    return {
      hero:rect(hero), video:rect(video), poster:rect(poster), header:header?rect(header):null,
      headline:rect(hero.querySelector('h1')), copy:rect(hero.querySelector('.fam-hero-copy')),
      cta:{...rect(cta),href:cta.getAttribute('href'),text:cta.textContent.trim(),unobstructed:accessible(cta)},
      control:controlRect?{...controlRect,unobstructed:accessible(control)}:null,
      bottomBar:barRect, horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      media:{src:video.currentSrc,muted:video.muted,loop:video.loop,playsInline:video.playsInline,duration:video.duration,width:video.videoWidth,height:video.videoHeight,objectFit:getComputedStyle(video).objectFit,opacity:getComputedStyle(video).opacity,paused:video.paused},
      posterLoaded:poster.complete && poster.naturalWidth>0,
      heading:hero.querySelector('h1').textContent.trim(),
      links:[...hero.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})),
    };
  });
}

// Measure actual composited background pixels under each rendered text line.
// Sampling each line's whole box is conservative: spaces are checked too.
async function textContrast(page, label) {
  const runs = await page.evaluate(() => {
    const root = document.querySelector('.home-hero .fam-hero-copy');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const result = [];
    const bar = document.querySelector('[data-family-bar]');
    const visibleBottom = bar && bar.dataset.state === 'visible' && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight;
    while (walker.nextNode()) {
      const node = walker.currentNode, element = node.parentElement;
      if (!node.textContent.trim() || !element) continue;
      const css = getComputedStyle(element), color = css.color.match(/[\d.]+/g)?.map(Number);
      if (!color || css.visibility !== 'visible') continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1 || r.top < 0 || r.bottom > visibleBottom) continue;
        result.push({text:node.textContent.trim(),color:[...color.slice(0,3),color[3]??1],fontSize:parseFloat(css.fontSize),weight:parseInt(css.fontWeight,10),x:r.x,y:r.y,width:r.width,height:r.height});
      }
    }
    return result;
  });
  const style = await page.addStyleTag({ content: '.home-hero .fam-hero-copy, .home-hero .fam-hero-copy * { transition:none !important; color:transparent !important; text-shadow:none !important; }' });
  let pixels;
  try { pixels = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject:true }); }
  finally { await style.evaluate(element => element.remove()); }
  const luminance = rgb => rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
  const results = runs.map(run => {
    let minimum = Infinity;
    const left=Math.max(0,Math.ceil(run.x)), top=Math.max(0,Math.ceil(run.y));
    const right=Math.min(pixels.info.width,Math.floor(run.x+run.width)), bottom=Math.min(pixels.info.height,Math.floor(run.y+run.height));
    for(let y=top;y<bottom;y+=2) for(let x=left;x<right;x+=2) {
      const index=(y*pixels.info.width+x)*pixels.info.channels;
      const background=[...pixels.data.subarray(index,index+3)];
      const foreground=run.color.slice(0,3).map((v,i)=>v*run.color[3]+background[i]*(1-run.color[3]));
      const a=luminance(foreground), b=luminance(background);
      minimum=Math.min(minimum,(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05));
    }
    const required=run.fontSize>=24 || (run.fontSize>=18.66 && run.weight>=700)?3:4.5;
    return {...run,minimum:Number.isFinite(minimum)?minimum:null,required};
  });
  check(results.length>0 && results.every(run=>run.minimum!==null && run.minimum>=run.required),`${label}: text contrast failed (${results.filter(run=>run.minimum===null || run.minimum<run.required).map(run=>`${run.text}: ${run.minimum?.toFixed(2)} / ${run.required}`).join('; ')})`);
  return results;
}

async function responsive() {
  for(const [width,height] of viewports) {
    const label=`${width}x${height}`, {context,requests}=await contextFor({viewport:{width,height},reducedMotion:'no-preference'});
    const row={viewport:label}; rows.push(row);
    try {
      const page=await open(context,label);
      await playing(page);
      await frame(page,0.5);
      row.geometry=await geometry(page); row.requests=requests;
      const m=row.geometry, floor=m.bottomBar?.y??height;
      const same=(a,b)=>['x','y','width','height'].every(key=>Math.abs(a[key]-b[key])<=1);
      check(same(m.hero,m.video) && same(m.hero,m.poster),`${label}: video/poster do not fill the complete hero`);
      check(!m.horizontalOverflow,`${label}: horizontal overflow`);
      check(m.posterLoaded,`${label}: poster did not decode`);
      check(m.media.muted && m.media.loop && m.media.playsInline,`${label}: muted inline looping flags missing`);
      check(m.media.objectFit==='cover',`${label}: video object-fit must cover`);
      check(Math.abs(m.media.duration-30)<0.1,`${label}: expected approved 30-second video`);
      check(m.media.width===(width<1024?1280:1920) && m.media.height===(width<1024?720:1080),`${label}: wrong responsive media dimensions`);
      check(width<1024?/background-720p\.mp4$/.test(m.media.src):/background(?:-1080p\.mp4|\.webm)$/.test(m.media.src),`${label}: wrong responsive source (${m.media.src})`);
      check(m.cta.href==='/estimate' && m.cta.text==='Request a quote',`${label}: changed primary CTA`);
      check(m.links.some(a=>a.href==='tel:+12084771169' && a.text==='Call or text (208) 477-1169'),`${label}: changed telephone action`);
      check(m.heading==='Custom home builder in Boise. Built around you.',`${label}: changed headline`);
      check(m.headline.y>=m.header.bottom-1 && m.headline.bottom<=floor+1,`${label}: headline outside first screen`);
      check(m.cta.y>=m.header.bottom-1 && m.cta.bottom<=floor+1 && m.cta.unobstructed,`${label}: primary CTA outside first screen or obstructed`);
      if(width>=360) check(m.copy.bottom<=floor+1,`${label}: complete hero copy does not fit first screen`);
      check(m.control && m.control.width>=44 && m.control.height>=44 && m.control.unobstructed,`${label}: pause/play control is not reachable at 44px minimum`);
      await page.screenshot({path:path.join(output,`after-${label}.png`)});
      row.contrast=await textContrast(page,`${label} first frame`);
      // Show both ends and an interior in the two representative compositions.
      if(width===390 || width===1440) {
        row.sceneContrast=[];
        for(const time of [12,24,29]) {
          await frame(page,time);
          await page.screenshot({path:path.join(output,`scene-${time}s-${label}.png`)});
          row.sceneContrast.push({time,runs:await textContrast(page,`${label} at ${time}s`)});
        }
      }
    } catch(error) { failures.push(`${label}: ${error.message}`); }
    finally { await context.close(); }
  }
}

async function interactions() {
  const {context}=await contextFor({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const record={name:'playback-controls-and-lifecycle'}; states.push(record);
  try {
    const page=await open(context,record.name);
    await playing(page);
    await page.locator('.home-hero video').evaluate(video=>{video.currentTime=29.7;});
    await page.waitForFunction(()=>{const v=document.querySelector('.home-hero video');return v && v.currentTime>0 && v.currentTime<1 && !v.paused;},null,{timeout:10000});
    record.naturalLoop=true;
    record.resizes=[];
    for(const [width,height,source] of [[390,844,'background-720p.mp4'],[1440,900,'background.webm']]) {
      await page.setViewportSize({width,height});
      await page.waitForFunction(source=>document.querySelector('.home-hero video')?.currentSrc.endsWith(source),source,{timeout:30000});
      await playing(page);
      record.resizes.push({width,height,src:await page.locator('.home-hero video').evaluate(video=>video.currentSrc)});
    }
    const pause=page.getByRole('button',{name:'Pause background video',exact:true});
    await pause.focus();
    record.focus=await pause.evaluate(button=>({focused:document.activeElement===button,outlineStyle:getComputedStyle(button).outlineStyle,outlineWidth:getComputedStyle(button).outlineWidth}));
    check(record.focus.focused && record.focus.outlineStyle!=='none' && parseFloat(record.focus.outlineWidth)>0,'video control lacks visible keyboard focus');
    await page.keyboard.press('Space'); await paused(page);
    await page.getByRole('button',{name:'Play background video',exact:true}).waitFor();
    record.keyboardPause=true;
    await page.screenshot({path:path.join(output,'control-keyboard-paused.png')});
    const time=await page.locator('video').evaluate(video=>video.currentTime);
    await page.evaluate(()=>scrollTo(0,document.querySelector('.home-hero').getBoundingClientRect().bottom+scrollY+innerHeight));
    await page.waitForTimeout(250); await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(250);
    check(await page.locator('.home-hero video').evaluate((video,time)=>video.paused && Math.abs(video.currentTime-time)<0.1,time),'manual pause was lost across off-screen return');
    record.manualPausePersists=true;
    await page.getByRole('button',{name:'Play background video',exact:true}).focus(); await page.keyboard.press('Enter'); await playing(page);
    record.keyboardPlay=true;
    await page.evaluate(()=>scrollTo(0,document.querySelector('.home-hero').getBoundingClientRect().bottom+scrollY+innerHeight));
    await paused(page); record.offScreenPause=true;
    await page.evaluate(()=>scrollTo(0,0)); await playing(page); record.offScreenResume=true;
    // Browser foregrounding is unreliable in headless contexts. Exercise the
    // Page Visibility listener with controlled document visibility, recorded as emulation.
    await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
      Object.defineProperty(document,'hidden',{configurable:true,get:()=> true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await paused(page); record.hiddenTabPause='Page Visibility API emulation';
    await page.evaluate(()=>{
      delete document.visibilityState; delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await playing(page); record.visibleTabResume='Page Visibility API emulation';
    await page.emulateMedia({reducedMotion:'reduce'}); await paused(page);
    record.runtimeReducedMotionPause=true;
  } catch(error) { failures.push(`${record.name}: ${error.message}`); }
  finally { await context.close(); }
}

async function fallbacks() {
  for(const options of [
    {name:'reduced-motion',reducedMotion:'reduce'},
    {name:'data-saver',saveData:true},
    {name:'slow-connection',effectiveType:'2g'},
    {name:'slow-2g-connection',effectiveType:'slow-2g'},
    {name:'failed-media',failMedia:true},
    {name:'desktop-all-media-failed',failMedia:true,viewport:{width:1440,height:900}},
    {name:'no-javascript',javaScriptEnabled:false},
  ]) {
    const {name,...settings}=options, {context,requests}=await contextFor({viewport:{width:390,height:844},...settings});
    const record={name}; states.push(record);
    try {
      const page=await open(context,name);
      await page.waitForTimeout(settings.failMedia?1500:500);
      record.requests=[...requests]; record.geometry=await geometry(page);
      check(record.geometry.posterLoaded,`${name}: poster not available`);
      check(record.geometry.cta.unobstructed,`${name}: CTA obstructed`);
      if(!settings.failMedia) check(!requests.length,`${name}: video fetched despite static fallback`);
      check(await page.locator('.home-hero video').evaluate(video=>video.paused),`${name}: static fallback video is playing`);
      check(Number(record.geometry.media.opacity)===0,`${name}: static fallback does not reveal poster`);
      if(settings.failMedia) {
        await page.locator('.home-hero button.hero-video-control').waitFor({state:'hidden',timeout:10000});
        check(await page.locator('.home-hero button.hero-video-control').count()===0,`${name}: failed media leaves an unusable playback control`);
      }
      await page.screenshot({path:path.join(output,`fallback-${name}.png`)});
      if(name==='reduced-motion') {
        await page.getByRole('button',{name:'Play background video',exact:true}).click();
        await playing(page); record.explicitPlayOverride=true;
        await page.getByRole('button',{name:'Pause background video',exact:true}).click();
        await paused(page); record.explicitPause=true;
      }
      if(name==='data-saver') {
        await page.evaluate(()=>{navigator.connection.saveData=false;navigator.connection.dispatchEvent(new Event('change'));});
        await playing(page); record.preferenceChangeResume=true;
        await page.evaluate(()=>{navigator.connection.saveData=true;navigator.connection.dispatchEvent(new Event('change'));});
        await paused(page); record.preferenceChangePause=true;
      }
    } catch(error) { failures.push(`${name}: ${error.message}`); }
    finally { await context.close(); }
  }
}

async function sourceFallback() {
  const record={name:'desktop-webm-fails-mp4-plays'}; states.push(record);
  const {context,requests}=await contextFor({viewport:{width:1440,height:900},failWebm:true,reducedMotion:'no-preference'});
  try {
    const page=await open(context,record.name);
    await playing(page);
    record.geometry=await geometry(page); record.requests=requests;
    check(/background-1080p\.mp4$/.test(record.geometry.media.src),'desktop WebM failure did not fall back to approved 1080p MP4');
    check(record.geometry.media.width===1920 && record.geometry.media.height===1080,'desktop MP4 fallback has incorrect dimensions');
    await page.getByRole('button',{name:'Pause background video',exact:true}).waitFor();
    await page.screenshot({path:path.join(output,'fallback-webm-to-mp4.png')});
  } catch(error) { failures.push(`${record.name}: ${error.message}`); }
  finally { await context.close(); }
}

async function grids() {
  const tiles=[];
  for(const [width,height] of viewports) {
    const key=`${width}x${height}`;
    for(const state of ['before','after']) {
      const file=path.join(output,`${state}-${key}.png`);
      const exists=fs.existsSync(file);
      const source=exists?sharp(file):sharp({create:{width:320,height:240,channels:3,background:'#383837'}});
      const tile=await source.resize({width:320,height:240,fit:'contain',background:'#383837'}).extend({top:28,bottom:0,left:0,right:0,background:'#383837'}).composite([{input:Buffer.from(`<svg width="320" height="28"><text x="8" y="19" fill="#fbfaf6" font-size="14">${state} ${key}${exists?'':' (not captured)'}</text></svg>`),left:0,top:0}]).png().toBuffer();
      tiles.push(tile);
    }
  }
  if(!tiles.length) return;
  await sharp({create:{width:640,height:Math.ceil(tiles.length/2)*268,channels:3,background:'#383837'}}).composite(tiles.map((input,index)=>({input,left:(index%2)*320,top:Math.floor(index/2)*268}))).png().toFile(path.join(output,'before-after-grid.png'));
}

(async()=>{
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH}:{})});
  await responsive(); await interactions(); await sourceFallback(); await fallbacks(); await grids();
})().catch(error=>failures.push(error.stack||error.message)).finally(async()=>{
  if(browser) await browser.close().catch(error=>failures.push(`Browser cleanup: ${error.message}`));
  let sha=process.env.GITHUB_SHA||null;
  if(!sha) try { sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch {}
  const result={sha,browser:'Chromium; emulated CSS viewports, reduced motion and connection hints',scope:'Homepage hero only; local GET assets; external/API requests blocked; no submissions, providers, database or publication',viewports:rows,states,blocked,pageErrors,failures};
  fs.writeFileSync(path.join(output,'hero-video-metrics.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({viewports:rows.length,states:states.length,failures,pageErrors,blocked},null,2));
  if(failures.length||pageErrors.length) process.exitCode=1;
});

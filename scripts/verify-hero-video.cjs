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
const output = path.resolve('test-results/hero-video-no-controls');
fs.mkdirSync(output, { recursive: true });
const viewports = [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080]];
const failures = [], failureRecords = [], rows = [], states = [], pageErrors = [], blocked = {};
const check = (ok, message, category='functional') => { if (!ok) { failures.push(message); failureRecords.push({category,message}); } };
const mediaPath = /\/boise-construction-co-background(?:-\d+p)?\.(?:mp4|webm)$/;
// Cover every whole second and both sides of the scene dissolves and loop.
const sampleTimes = [...new Set([...Array.from({length:30},(_,index)=>index),5.75,6.25,11.75,12.25,17.75,18.25,23.75,24.25,29.75,29.966])].sort((a,b)=>a-b);
const screenshotTimes = new Set([0,6,12,18,24,29]);
// Bounded behavior/fallback supplements avoid repeating an unchanged video
// contrast scan. Normal CI invocation always runs every phase.
const fallbacksOnly=process.argv.includes('--fallbacks-only');
const behaviorOnly=process.argv.includes('--behavior-only');
let browser;
let firstContrastConflictReported=false;

async function contextFor(options = {}) {
  const { saveData = false, effectiveType, failMedia = false, failWebm = false, corruptMedia = false, denyAutoplay = false, ...browserOptions } = options;
  const context = await browser.newContext({ serviceWorkers: 'block', ...browserOptions });
  // Test instrumentation records real app play attempts. It is not shipped UI.
  await context.addInitScript(({denyAutoplay})=>{
    window.__heroPlayAttempts=[];
    window.__heroControlViolations=[];
    new MutationObserver(()=>{
      const hero=document.querySelector('.home-hero section.fam-hero');
      if(!hero) return;
      const video=hero.querySelector('video');
      const custom=hero.querySelectorAll('button,[role="button"],[role="switch"],[role="slider"],input,select,textarea,.hero-video-control').length;
      if(custom || video?.controls || (video && video.tabIndex>=0)) window.__heroControlViolations.push({custom,native:video?.controls,videoTabIndex:video?.tabIndex});
    }).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['controls','role','tabindex']});
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args) {
      if(this.closest('.home-hero')) {
        window.__heroPlayAttempts.push({muted:this.muted,loop:this.loop,playsInline:this.playsInline,denied:denyAutoplay});
        if(denyAutoplay) return Promise.reject(new DOMException('Autoplay denied by test browser policy','NotAllowedError'));
      }
      return play.apply(this,args);
    };
  },{denyAutoplay});
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
    if(allowed && isMedia && corruptMedia) {
      blocked['expected-decode-failure']=(blocked['expected-decode-failure']||0)+1;
      return route.fulfill({status:200,contentType:url.pathname.endsWith('.webm')?'video/webm':'video/mp4',body:'Invalid media bytes: deliberate local decode-failure fixture'});
    }
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

async function observedState(label,predicate,timeout=30000) {
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline) {
    if(await predicate()) return;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function fallbackReady(page,settings,requests) {
  const started=Date.now();
  const poster=page.locator('.home-hero [data-hero-poster]');
  await observedState('decoded hero poster',()=>poster.evaluate(image=>image.complete && image.naturalWidth>0));
  await poster.evaluate(image=>image.decode());
  if(settings.failMedia || settings.corruptMedia) {
    const terminal=page.viewportSize().width>=1024?'background-1080p.mp4':'background-720p.mp4';
    await observedState('terminal hero media request',()=>requests.some(url=>url.endsWith(terminal)));
    await observedState('terminal media failure poster',()=>page.locator('.home-hero video').evaluate(video=>video.paused && video.querySelectorAll('source').length===0 && getComputedStyle(video).opacity==='0'));
  } else if(settings.denyAutoplay) {
    await page.waitForFunction(()=>window.__heroPlayAttempts?.some(attempt=>attempt.denied) && document.querySelector('.home-hero video')?.paused && getComputedStyle(document.querySelector('.home-hero video')).opacity==='0',null,{timeout:30000});
  }
  return {elapsedMs:Date.now()-started,posterDecoded:true};
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
    const proof = document.querySelector('.fam-proof');
    const accessible = element => {
      const r = element.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
      return !!hit && (hit === element || element.contains(hit));
    };
    return {
      hero:rect(hero), video:rect(video), poster:rect(poster), header:header?rect(header):null,
      headline:rect(hero.querySelector('h1')), copy:rect(hero.querySelector('.fam-hero-copy')),
      cta:{...rect(cta),href:cta.getAttribute('href'),text:cta.textContent.trim(),unobstructed:accessible(cta)},
      playbackControls:{custom:hero.querySelectorAll('button,[role="button"],[role="switch"],[role="slider"],input,select,textarea,.hero-video-control').length,native:video.controls,nativeAttribute:video.hasAttribute('controls'),videoTabIndex:video.tabIndex,observedViolations:window.__heroControlViolations??[]},
      playAttempts:window.__heroPlayAttempts??[],
      bottomBar:barRect, horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      visualViewport:window.visualViewport?{height:visualViewport.height,width:visualViewport.width,offsetTop:visualViewport.offsetTop}:null,
      proof:proof?rect(proof):null,
      media:{src:video.currentSrc,muted:video.muted,loop:video.loop,playsInline:video.playsInline,duration:video.duration,width:video.videoWidth,height:video.videoHeight,objectFit:getComputedStyle(video).objectFit,opacity:getComputedStyle(video).opacity,paused:video.paused},
      posterLoaded:poster.complete && poster.naturalWidth>0,
      heading:hero.querySelector('h1').textContent.trim(),
      links:[...hero.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})),
    };
  });
}

async function overlayContract(page) {
  return page.evaluate(()=>{
    const hero=document.querySelector('.home-hero section.fam-hero');
    const overlay=hero.querySelector('.fam-hero-scrim');
    const paint=element=>{
      const css=getComputedStyle(element);
      return {backgroundColor:css.backgroundColor,backgroundImage:css.backgroundImage,opacity:css.opacity,filter:css.filter,backdropFilter:css.backdropFilter,mixBlendMode:css.mixBlendMode,boxShadow:css.boxShadow};
    };
    const transparent=color=>{
      const values=color.match(/[\d.]+/g)?.map(Number);
      return color==='transparent' || (values?.length===4 && values[3]===0);
    };
    const otherPaintedLayers=[],paintedPseudos=[],ancestorEffects=[],ancestors=[],rootPseudos=[];
    for(let element=hero;element;element=element.parentElement) {
      const value={element:`${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`,...paint(element)};
      ancestors.push(value);
      if(Number(value.opacity)!==1 || value.filter!=='none' || (value.backdropFilter && value.backdropFilter!=='none') || value.mixBlendMode!=='normal') ancestorEffects.push(value);
    }
    for(const element of [hero,...hero.querySelectorAll('*')]) {
      if(element.matches('[data-hero-cta="primary"]') || element.closest('[data-hero-cta="primary"]')) continue;
      const css=getComputedStyle(element);
      const label=`${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;
      if(element!==hero && element!==overlay && css.display!=='none' && (!transparent(css.backgroundColor) || css.backgroundImage!=='none' || css.boxShadow!=='none' || css.filter!=='none' || (css.backdropFilter && css.backdropFilter!=='none') || css.mixBlendMode!=='normal' || Number(css.opacity)!==1)) {
        // Video opacity zero is the static-poster fallback, not another overlay.
        if(!(element.tagName==='VIDEO' && Number(css.opacity)===0 && transparent(css.backgroundColor) && css.backgroundImage==='none' && css.boxShadow==='none' && css.filter==='none' && (!css.backdropFilter || css.backdropFilter==='none') && css.mixBlendMode==='normal')) otherPaintedLayers.push({element:label,...paint(element)});
      }
      for(const pseudo of ['::before','::after']) {
        const style=getComputedStyle(element,pseudo);
        if(element===hero || element===overlay) rootPseudos.push({element:label,pseudo,content:style.content,display:style.display,backgroundColor:style.backgroundColor,backgroundImage:style.backgroundImage,opacity:style.opacity,filter:style.filter,backdropFilter:style.backdropFilter,mixBlendMode:style.mixBlendMode});
        if(style.display!=='none' && !['none','normal'].includes(style.content) && (!transparent(style.backgroundColor) || style.backgroundImage!=='none' || style.boxShadow!=='none' || style.filter!=='none' || (style.backdropFilter && style.backdropFilter!=='none') || style.mixBlendMode!=='normal')) paintedPseudos.push({element:label,pseudo,content:style.content,backgroundColor:style.backgroundColor,backgroundImage:style.backgroundImage,boxShadow:style.boxShadow,filter:style.filter,backdropFilter:style.backdropFilter,mixBlendMode:style.mixBlendMode});
      }
    }
    const accent=hero.querySelector('.fam-hero-accent');
    const accentPseudos=['::before','::after'].map(pseudo=>{const css=getComputedStyle(accent,pseudo);return {pseudo,content:css.content,display:css.display};});
    const rect=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const textShadows=[...hero.querySelectorAll('.fam-hero-copy,.fam-hero-copy *')].map(element=>({element:element.tagName.toLowerCase(),textShadow:getComputedStyle(element).textShadow})).filter(item=>item.textShadow!=='none');
    return {overlay:{...paint(overlay),rect:rect(overlay)},hero:rect(hero),otherPaintedLayers,paintedPseudos,accentPseudos,textShadows,ancestors,ancestorEffects,rootPseudos};
  });
}

function assertOverlay(contract,label) {
  const overlay=contract.overlay;
  const verify=(ok,message)=>check(ok,message,'overlayContract');
  verify(overlay.backgroundColor==='rgba(0, 0, 0, 0.71)' && overlay.backgroundImage==='none',`${label}: overlay must be exactly uniform rgba(0, 0, 0, 0.71), without a background image`);
  verify(overlay.opacity==='1' && overlay.filter==='none' && (!overlay.backdropFilter || overlay.backdropFilter==='none') && overlay.mixBlendMode==='normal' && overlay.boxShadow==='none',`${label}: overlay has compounded opacity, filtering, blending or shadow`);
  verify(['x','y','width','height'].every(key=>Math.abs(overlay.rect[key]-contract.hero[key])<=1),`${label}: uniform overlay does not fill the hero`);
  verify(!contract.otherPaintedLayers.length && !contract.paintedPseudos.length,`${label}: additional hero background or pseudo layers (${JSON.stringify({layers:contract.otherPaintedLayers,pseudos:contract.paintedPseudos})})`);
  verify(!contract.ancestorEffects.length,`${label}: hero or ancestor opacity, filtering or blending compounds the overlay (${JSON.stringify(contract.ancestorEffects)})`);
  verify(contract.accentPseudos.every(pseudo=>pseudo.display==='none' || ['none','normal'].includes(pseudo.content)),`${label}: localized accent pseudo scrim remains`);
  verify(!contract.textShadows.length,`${label}: hero text has a shadow`);
}

function assertNoControls(m,label) {
  check(m.playbackControls.custom===0 && !m.playbackControls.native && !m.playbackControls.nativeAttribute && m.playbackControls.videoTabIndex<0,`${label}: custom, native, hidden or keyboard-focusable playback controls remain`);
  check(m.playbackControls.observedViolations.length===0,`${label}: a playback control appeared during initialization or a transition`);
  check(m.links.length===2,`${label}: unexpected hero action could expose a renamed playback toggle`);
}

function assertLayout(m,label,width,height) {
  const verify=(ok,message)=>check(ok,message,'layoutFold');
  const visualBottom=m.visualViewport?m.visualViewport.height+m.visualViewport.offsetTop:height;
  const floor=m.bottomBar?.y??Math.min(height,visualBottom);
  const same=(a,b)=>['x','y','width','height'].every(key=>Math.abs(a[key]-b[key])<=1);
  const fold={visibleBottom:floor,heroBottom:m.hero.bottom,delta:m.hero.bottom-floor,actualHeaderHeight:m.header?.height,actualBottomBarHeight:m.bottomBar?.height??0,naturalContentException:width===320?'320px: headline and primary CTA must fit; remaining copy may naturally scroll':null};
  verify(same(m.hero,m.video) && same(m.hero,m.poster),`${label}: video/poster do not fill the complete hero`);
  verify(Math.abs(m.hero.y-m.header.bottom)<=1,`${label}: hero does not begin directly below the actual persistent header`);
  verify(m.hero.bottom>=floor-1,`${label}: hero ends above the visible fold (${m.hero.bottom.toFixed(2)} vs ${floor.toFixed(2)})`);
  if(width>=360) verify(Math.abs(m.hero.bottom-floor)<=1,`${label}: hero does not exactly fill the visible fold after actual header/bar clearance (${m.hero.bottom.toFixed(2)} vs ${floor.toFixed(2)})`);
  fold.proofVisible=!!m.proof && m.proof.y<floor-1 && m.proof.bottom>m.header.bottom;
  verify(!fold.proofVisible,`${label}: proof/next section peeks into the initial visible fold`);
  verify(!m.horizontalOverflow,`${label}: horizontal overflow`);
  verify(m.posterLoaded,`${label}: poster did not decode`);
  verify(m.media.muted && m.media.loop && m.media.playsInline,`${label}: muted inline looping flags missing`);
  verify(m.media.objectFit==='cover',`${label}: video object-fit must cover`);
  verify(m.cta.href==='/estimate' && m.cta.text==='Request a quote',`${label}: changed primary CTA`);
  verify(m.links.some(a=>a.href==='tel:+12084771169' && a.text==='Call or text (208) 477-1169'),`${label}: changed telephone action`);
  verify(m.heading==='Custom home builder in Boise. Built around you.',`${label}: changed headline`);
  verify(m.headline.y>=m.header.bottom-1 && m.headline.bottom<=floor+1,`${label}: headline outside first screen`);
  verify(m.cta.y>=m.header.bottom-1 && m.cta.bottom<=floor+1 && m.cta.unobstructed,`${label}: primary CTA outside first screen or obstructed`);
  if(width>=360) verify(m.copy.bottom<=floor+1,`${label}: complete hero copy does not fit first screen`);
  assertNoControls(m,label);
  return fold;
}

// Measure actual composited background pixels under each rendered text line.
// Sampling each line's whole box is conservative: spaces are checked too.
async function textContrast(page, label, {raster=true}={}) {
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
  const foregroundPixels=raster?await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true}):null;
  // Insert synchronously: addStyleTag waits for a load-event callback which
  // cannot run in the deliberately JavaScript-disabled fallback context.
  const style = await page.evaluateHandle(()=>{
    const element=document.createElement('style');
    element.textContent='.home-hero .fam-hero-copy, .home-hero .fam-hero-copy * { transition:none !important; color:transparent !important; text-shadow:none !important; }';
    document.head.appendChild(element);
    getComputedStyle(document.querySelector('.home-hero .fam-hero-copy')).color;
    return element;
  });
  let pixels;
  try { pixels = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject:true }); }
  finally {
    await style.evaluate(element=>{
      element.textContent='.home-hero .fam-hero-copy, .home-hero .fam-hero-copy * { transition:none !important; }';
      // A style flush restores the text without a color transition and works
      // when page JavaScript is disabled (animation-frame callbacks do not).
      getComputedStyle(document.querySelector('.home-hero .fam-hero-copy')).color;
      element.remove();
    });
    await style.dispose();
  }
  const luminance = rgb => rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
  const results = runs.map(run => {
    let minimum = Infinity, opaqueWhiteMinimum=Infinity, actualInkPixels=0;
    const left=Math.max(0,Math.ceil(run.x)), top=Math.max(0,Math.ceil(run.y));
    const right=Math.min(pixels.info.width,Math.floor(run.x+run.width)), bottom=Math.min(pixels.info.height,Math.floor(run.y+run.height));
    for(let y=top;y<bottom;y+=2) for(let x=left;x<right;x+=2) {
      const index=(y*pixels.info.width+x)*pixels.info.channels;
      const background=[...pixels.data.subarray(index,index+3)];
      const foreground=run.color.slice(0,3).map((v,i)=>v*run.color[3]+background[i]*(1-run.color[3]));
      const a=luminance(foreground), b=luminance(background);
      minimum=Math.min(minimum,(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05));
      opaqueWhiteMinimum=Math.min(opaqueWhiteMinimum,1.05/(b+0.05));
    }
    if(raster && run.fontSize>=32 && run.color[3]===1) {
      // Trim the range's leading/trailing metric space so neighboring line
      // glyphs cannot satisfy a dimmed line's foreground-color requirement.
      const inset=Math.ceil(run.height*0.12);
      for(let y=top+inset;y<bottom-inset;y++) for(let x=left;x<right;x++) {
        const index=(y*foregroundPixels.info.width+x)*foregroundPixels.info.channels;
        const actual=[...foregroundPixels.data.subarray(index,index+3)];
        if(Math.max(...actual.map((value,index)=>Math.abs(value-run.color[index])))<=5) actualInkPixels++;
      }
    }
    const required=run.fontSize>=24 || (run.fontSize>=18.66 && run.weight>=700)?3:4.5;
    return {...run,minimum:Number.isFinite(minimum)?minimum:null,opaqueWhiteMinimum:Number.isFinite(opaqueWhiteMinimum)?opaqueWhiteMinimum:null,required,...(raster&&run.fontSize>=32&&run.color[3]===1?{actualInkPixels}:{})};
  });
  check(results.length>0 && results.every(run=>run.minimum!==null && run.minimum>=run.required),`${label}: text contrast failed (${results.filter(run=>run.minimum===null || run.minimum<run.required).map(run=>`${run.text}: ${run.minimum?.toFixed(2)} / ${run.required}`).join('; ')})`,'contrast');
  if(!firstContrastConflictReported) {
    const conflict=results.find(run=>run.minimum===null || run.minimum<run.required);
    if(conflict) {
      firstContrastConflictReported=true;
      console.log(JSON.stringify({firstContrastConflict:{label,text:conflict.text,ratio:conflict.minimum,required:conflict.required}}));
    }
  }
  check(results.filter(run=>run.actualInkPixels!==undefined).every(run=>run.actualInkPixels>=8),`${label}: a hero scrim dims the expected opaque H1 glyph color`,'raster');
  return results;
}

// A background scrim must not paint over the established solid CTA surface.
// Sample clear fill above/below its label to catch foreground stacking defects.
async function ctaFill(page, label) {
  const geometry=await page.locator('.home-hero [data-hero-cta="primary"]').evaluate(button=>{
    const r=button.getBoundingClientRect(), color=getComputedStyle(button).backgroundColor.match(/[\d.]+/g)?.map(Number);
    return {x:r.x,y:r.y,width:r.width,height:r.height,color};
  });
  const pixels=await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const samples=[];
  for(const fraction of [0.25,0.5,0.75]) for(const inset of [5,geometry.height-5]) {
    const x=Math.round(geometry.x+geometry.width*fraction), y=Math.round(geometry.y+inset);
    const index=(y*pixels.info.width+x)*pixels.info.channels;
    const actual=[...pixels.data.subarray(index,index+3)];
    const difference=geometry.color?Math.max(...actual.map((value,index)=>Math.abs(value-geometry.color[index]))):Infinity;
    samples.push({x,y,actual,difference});
  }
  check(geometry.color && (geometry.color[3]??1)===1 && samples.every(sample=>sample.difference<=5),`${label}: hero scrim or overlay paints over the solid primary CTA fill`,'raster');
  return {expected:geometry.color,samples};
}

async function responsive() {
  for(const [width,height] of viewports) {
    const label=`${width}x${height}`, {context,requests}=await contextFor({viewport:{width,height},reducedMotion:'no-preference'});
    const row={viewport:label}; rows.push(row);
    try {
      const page=await open(context,label);
      await playing(page);
      await frame(page,0);
      row.geometry=await geometry(page); row.requests=requests;
      row.overlay=await overlayContract(page);
      assertOverlay(row.overlay,label);
      const m=row.geometry;
      row.fold=assertLayout(m,label,width,height);
      check(Math.abs(m.media.duration-30)<0.1,`${label}: expected approved 30-second video`);
      check(m.media.width===(width<1024?1280:1920) && m.media.height===(width<1024?720:1080),`${label}: wrong responsive media dimensions`);
      check(width<1024?/background-720p\.mp4$/.test(m.media.src):/background(?:-1080p\.mp4|\.webm)$/.test(m.media.src),`${label}: wrong responsive source (${m.media.src})`);
      await page.screenshot({path:path.join(output,`after-${label}.png`)});
      row.sceneContrast=[];
      for(const time of sampleTimes) {
        if(time!==0) await frame(page,time);
        const representative=(width===390 || width===1440) && screenshotTimes.has(time);
        const raster=time===0 || representative;
        if(representative) await page.screenshot({path:path.join(output,`scene-${time}s-${label}.png`)});
        const sample={time,actualTime:await page.locator('.home-hero video').evaluate(video=>video.currentTime),runs:await textContrast(page,`${label} at ${time}s`,{raster})};
        if(raster) sample.ctaFill=await ctaFill(page,`${label} at ${time}s`);
        row.sceneContrast.push(sample);
        if(time===0) {row.contrast=sample.runs;row.ctaFill=sample.ctaFill;}
      }
      console.log(`${label}: sampled ${row.sceneContrast.length} video times; ${row.sceneContrast.filter(scene=>scene.runs.some(run=>run.minimum===null || run.minimum<run.required)).length} frames have text contrast failures`);
    } catch(error) { failures.push(`${label}: ${error.message}`); }
    finally { await context.close(); }
  }
}

async function continuedPlayback(page) {
  const time=await page.locator('.home-hero video').evaluate(video=>video.currentTime);
  await page.waitForFunction(({time,started})=>{
    const video=document.querySelector('.home-hero video');
    return video && !video.paused && video.readyState>=2 && performance.now()-started>=500 && Math.abs(video.currentTime-time)>0.25;
  },{time,started:await page.evaluate(()=>performance.now())},{timeout:10000});
}

async function interactions() {
  const {context}=await contextFor({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const record={name:'automatic-playback-and-lifecycle'}; states.push(record);
  try {
    const page=await open(context,record.name);
    await playing(page);
    record.initial=await geometry(page); assertNoControls(record.initial,record.name);
    check(record.initial.playAttempts.length>0 && record.initial.playAttempts.every(attempt=>attempt.muted && attempt.loop && attempt.playsInline),'default autoplay was not attempted with muted inline looping flags');
    await page.locator('.home-hero video').evaluate(video=>{video.currentTime=29.7;});
    await page.waitForFunction(()=>{const v=document.querySelector('.home-hero video');return v && v.currentTime>0 && v.currentTime<1 && !v.paused;},null,{timeout:10000});
    record.naturalLoop=true;
    record.resizes=[];
    for(const [width,height,source] of [[390,844,'background-720p.mp4'],[1440,900,'background.webm']]) {
      await page.setViewportSize({width,height});
      await page.waitForFunction(source=>document.querySelector('.home-hero video')?.currentSrc.endsWith(source),source,{timeout:30000});
      await playing(page);
      const m=await geometry(page); assertNoControls(m,`${record.name} resize ${width}`);
      record.resizes.push({width,height,src:m.media.src,playAttempts:m.playAttempts});
    }
    await page.evaluate(()=>scrollTo(0,document.querySelector('.home-hero').getBoundingClientRect().bottom+scrollY+innerHeight));
    await paused(page); record.offScreenPause=true;
    assertNoControls(await geometry(page),'offscreen state');
    await page.evaluate(()=>scrollTo(0,0)); await playing(page); record.offScreenResume=true;
    // Headless foregrounding is unreliable. This deliberately exercises the
    // Page Visibility listener as API emulation, not physical tab switching.
    await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
      Object.defineProperty(document,'hidden',{configurable:true,get:()=> true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await paused(page); record.hiddenTabPause='Page Visibility API emulation';
    assertNoControls(await geometry(page),'hidden-tab state');
    await page.evaluate(()=>{
      delete document.visibilityState; delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await playing(page); record.visibleTabResume='Page Visibility API emulation';
    await page.emulateMedia({reducedMotion:'reduce'}); await continuedPlayback(page);
    await page.emulateMedia({reducedMotion:'no-preference'}); await continuedPlayback(page);
    record.runtimeReducedMotionDoesNotPause=true;
    record.final=await geometry(page); assertNoControls(record.final,'after lifecycle transitions');
    await page.screenshot({path:path.join(output,'automatic-playback-lifecycle.png')});
  } catch(error) { failures.push(`${record.name}: ${error.message}`); }
  finally { await context.close(); }
}

async function preferencePlayback() {
  const preferences=[
    {name:'reduced-motion',reducedMotion:'reduce'},
    {name:'data-saver',saveData:true},
    {name:'slow-connection',effectiveType:'2g'},
    {name:'slow-2g-connection',effectiveType:'slow-2g'},
  ];
  for(const [width,height] of [[390,844],[1440,900]]) for(const options of preferences) {
    const {name,...settings}=options;
    const label=`autoplay-${name}-${width}x${height}`;
    const {context,requests}=await contextFor({viewport:{width,height},...settings});
    const record={name:label,kind:'preference-autoplay',viewport:`${width}x${height}`}; states.push(record);
    try {
      const page=await open(context,label);
      await playing(page); await continuedPlayback(page);
      record.geometry=await geometry(page); record.requests=[...requests];
      record.overlay=await overlayContract(page); assertOverlay(record.overlay,label);
      record.fold=assertLayout(record.geometry,label,width,height);
      check(record.geometry.playAttempts.length>0 && record.geometry.playAttempts.every(attempt=>attempt.muted && attempt.loop && attempt.playsInline),`${label}: no muted inline looping autoplay attempt`);
      check(record.requests.length>0 && !record.geometry.media.paused && Number(record.geometry.media.opacity)===1,`${label}: preference setting suppressed video playback`);
      check(width<1024?/background-720p\.mp4$/.test(record.geometry.media.src):/background(?:-1080p\.mp4|\.webm)$/.test(record.geometry.media.src),`${label}: preference setting selected wrong responsive source`);
      check(Math.abs(record.geometry.media.duration-30)<0.1,`${label}: approved duration changed`);
      if(settings.saveData || settings.effectiveType) {
        await page.evaluate(()=>{
          navigator.connection.saveData=!navigator.connection.saveData;
          navigator.connection.effectiveType=navigator.connection.effectiveType==='4g'?'slow-2g':'4g';
          navigator.connection.dispatchEvent(new Event('change'));
        });
        await continuedPlayback(page);
        await page.evaluate(()=>{
          navigator.connection.saveData=true;
          navigator.connection.effectiveType='slow-2g';
          navigator.connection.dispatchEvent(new Event('change'));
        });
        await continuedPlayback(page);
        record.runtimeConnectionChangesDoNotPause=true;
      }
      assertNoControls(await geometry(page),`${label} after preference changes`);
      // Freeze only for deterministic screenshot/contrast measurement after
      // actual moving playback and preference behavior have been established.
      await frame(page,12);
      await page.screenshot({path:path.join(output,`${label}.png`)});
      record.contrast=await textContrast(page,`${label} 12s`);
      record.ctaFill=await ctaFill(page,`${label} 12s`);
    } catch(error) { failures.push(`${label}: ${error.message}`); }
    finally { await context.close(); }
  }
}

async function fallbacks() {
  for(const options of [
    {name:'failed-media',failMedia:true},
    {name:'desktop-all-media-failed',failMedia:true,viewport:{width:1440,height:900}},
    {name:'decode-failure',corruptMedia:true},
    {name:'desktop-decode-failure',corruptMedia:true,viewport:{width:1440,height:900}},
    {name:'autoplay-denied',denyAutoplay:true},
    {name:'desktop-autoplay-denied',denyAutoplay:true,viewport:{width:1440,height:900}},
    {name:'no-javascript',javaScriptEnabled:false},
  ]) {
    const {name,...settings}=options, {context,requests}=await contextFor({viewport:{width:390,height:844},...settings});
    const record={name,kind:'technical-static-poster'}; states.push(record);
    try {
      const page=await open(context,name);
      record.readiness=await fallbackReady(page,settings,requests);
      record.requests=[...requests]; record.geometry=await geometry(page);
      record.overlay=await overlayContract(page); assertOverlay(record.overlay,name);
      const viewport=page.viewportSize(); record.viewport=`${viewport.width}x${viewport.height}`;
      record.fold=assertLayout(record.geometry,name,viewport.width,viewport.height);
      check(record.geometry.posterLoaded,`${name}: poster not available`);
      check(record.geometry.cta.unobstructed,`${name}: CTA obstructed`);
      check(await page.locator('.home-hero video').evaluate(video=>video.paused),`${name}: technical fallback video is playing`);
      check(Number(record.geometry.media.opacity)===0,`${name}: technical fallback does not reveal poster`);
      if(settings.denyAutoplay) check(record.geometry.playAttempts.some(attempt=>attempt.denied && attempt.muted && attempt.loop && attempt.playsInline),`${name}: browser policy denial was not reached through an app autoplay attempt`);
      if(settings.javaScriptEnabled===false) check(!requests.length && record.geometry.playAttempts.length===0,`${name}: video initiated despite unavailable JavaScript`);
      await page.screenshot({path:path.join(output,`fallback-${name}.png`)});
      record.contrast=await textContrast(page,`${name} static poster`);
      record.ctaFill=await ctaFill(page,`${name} static poster`);
      assertNoControls(await geometry(page),`${name} after fallback checks`);
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
    assertNoControls(record.geometry,record.name);
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

function contrastSummary() {
  const measurements=rows.flatMap(row=>(row.sceneContrast??[]).flatMap(scene=>scene.runs.map(run=>({...run,viewport:row.viewport,time:scene.time,actualTime:scene.actualTime}))));
  const role=run=>run.text==='Request a quote'?'primary CTA':run.fontSize>=32?(run.color[0]===196?'ochre H1':'white H1'):run.text.startsWith('We answer your questions')?'microcopy':run.text.includes('Custom home building')?'eyebrow':run.text.startsWith('From bare lot')?'support':'telephone action';
  const brief=run=>({text:run.text,viewport:run.viewport,time:run.time,actualTime:run.actualTime,ratio:run.minimum,required:run.required,x:run.x,y:run.y,width:run.width,height:run.height});
  const minima=items=>Object.fromEntries([...new Set(items.map(role))].map(name=>{
    const selected=items.filter(run=>role(run)===name);
    const worst=selected.reduce((a,b)=>(a.minimum??-Infinity)<(b.minimum??-Infinity)?a:b);
    return [name,brief(worst)];
  }));
  const worstByTextFrame=new Map();
  for(const run of measurements) {
    const key=JSON.stringify([run.viewport,run.time,run.text]);
    const prior=worstByTextFrame.get(key);
    if(!prior || (run.minimum??-Infinity)<(prior.minimum??-Infinity)) worstByTextFrame.set(key,run);
  }
  const failed=[...worstByTextFrame.values()].filter(run=>run.minimum===null || run.minimum<run.required).sort((a,b)=>(a.minimum??-Infinity)-(b.minimum??-Infinity));
  const whiteMeasurements=measurements.filter(run=>role(run)!=='primary CTA').map(run=>({...run,minimum:run.opaqueWhiteMinimum}));
  const whiteByTextFrame=new Map();
  for(const run of whiteMeasurements) {
    const key=JSON.stringify([run.viewport,run.time,run.text]);
    const prior=whiteByTextFrame.get(key);
    if(!prior || (run.minimum??-Infinity)<(prior.minimum??-Infinity)) whiteByTextFrame.set(key,run);
  }
  const whiteFailures=[...whiteByTextFrame.values()].filter(run=>run.minimum===null || run.minimum<run.required);
  return {
    method:'Actual composited background pixels sampled every 2 CSS pixels within rendered text-line boxes, including spaces; conservative minimum. H1 ink and solid CTA fill pixel guards run at first frames and saved representative scenes. Viewport emulation only; no field performance or physical-device claim.',
    sampleTimes,sampledFrames:rows.reduce((total,row)=>total+(row.sceneContrast?.length??0),0),
    minimaByRole:minima(measurements),
    byViewport:rows.map(row=>({viewport:row.viewport,frames:row.sceneContrast?.length??0,minimaByRole:minima(measurements.filter(run=>run.viewport===row.viewport))})),
    failedTextFrames:failed.length,
    failuresByText:[...new Set(failed.map(run=>run.text))].map(text=>({text,failedFrames:failed.filter(run=>run.text===text).length,worst:brief(failed.find(run=>run.text===text))})),
    contrastFailures:failed.map(brief),
    staticFallbacks:states.filter(record=>record.kind==='technical-static-poster' && record.contrast).map(record=>({name:record.name,viewport:record.viewport,minimaByRole:minima(record.contrast.map(run=>({...run,viewport:record.viewport,time:'poster',actualTime:null}))),failedRuns:record.contrast.filter(run=>run.minimum===null || run.minimum<run.required).length})),
    preferenceAutoplay:states.filter(record=>record.kind==='preference-autoplay' && record.contrast).map(record=>({name:record.name,viewport:record.viewport,minimaByRole:minima(record.contrast.map(run=>({...run,viewport:record.viewport,time:12,actualTime:12}))),failedRuns:record.contrast.filter(run=>run.minimum===null || run.minimum<run.required).length})),
    opaqueWhiteHypothesis:{
      assumption:'Numerical recomputation from the same background samples with fully opaque #ffffff for text over the video. CTA text remains unchanged. Existing size/weight thresholds retained. No fonts, text colors, media or styles were changed to produce this hypothesis.',
      wouldPass:whiteMeasurements.length? !whiteFailures.length:null,
      failedTextFrames:whiteFailures.length,
      minimaByOriginalRole:minima(whiteMeasurements),
    },
  };
}

(async()=>{
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH}:{})});
  if(!fallbacksOnly && !behaviorOnly) await responsive();
  if(!fallbacksOnly) { await interactions(); await sourceFallback(); await preferencePlayback(); }
  await fallbacks();
  if(!fallbacksOnly && !behaviorOnly) await grids();
})().catch(error=>failures.push(error.stack||error.message)).finally(async()=>{
  if(browser) await browser.close().catch(error=>failures.push(`Browser cleanup: ${error.message}`));
  let sha=process.env.GITHUB_SHA||null;
  if(!sha) try { sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch {}
  const summary=contrastSummary();
  const failureCategories=Object.fromEntries(['overlayContract','layoutFold','contrast','raster','functional'].map(category=>[category,failureRecords.filter(record=>record.category===category).map(record=>record.message)]));
  const recorded=new Set(failureRecords.map(record=>record.message));
  failureCategories.execution=failures.filter(message=>!recorded.has(message));
  const failureCounts=Object.fromEntries(Object.entries(failureCategories).map(([category,items])=>[category,items.length]));
  const result={sha,phase:fallbacksOnly?'technical fallback supplement':behaviorOnly?'behavior supplement':'complete hero verification',browser:'Chromium; emulated CSS viewports, reduced motion and connection hints',scope:'Homepage hero only; user-directed autoplay independent of motion/data preferences, no visitor controls, uniform 71% black overlay and visible-fold contract; local GET assets; external/API requests blocked; no submissions, providers, database or publication',accessibilityTradeoff:'Automatic moving content over five seconds has no visitor pause mechanism; WCAG 2.2.2 is not met. No full WCAG compliance is claimed. Browser/OS autoplay restrictions and unavailable JavaScript can still prevent playback.',viewports:rows,states,blocked,pageErrors,failures,failureCategories,failureCounts,contrastSummary:summary};
  fs.writeFileSync(path.join(output,fallbacksOnly?'fallback-only-metrics.json':behaviorOnly?'behavior-only-metrics.json':'hero-video-metrics.json'),JSON.stringify(result,null,2));
  fs.writeFileSync(path.join(output,fallbacksOnly?'fallback-only-contrast-summary.json':behaviorOnly?'behavior-only-contrast-summary.json':'contrast-summary.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify({viewports:rows.length,states:states.length,sampledFrames:summary.sampledFrames,failureCount:failures.length,failureCounts,failures:failures.slice(0,12),failedTextFrames:summary.failedTextFrames,minimaByRole:summary.minimaByRole,opaqueWhiteWouldPass:summary.opaqueWhiteHypothesis.wouldPass,pageErrors,blocked},null,2));
  if(failures.length||pageErrors.length) process.exitCode=1;
});

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from '@playwright/test';
const base=process.env.P5_TEST_BASE_URL||'http://127.0.0.1:5000';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local synthetic test only');
const output='p5-verification/construction-quote';await fs.mkdir(output,{recursive:true});
// The one-screen form check lives here: scripts/lib/quoteEntry.mjs is a shared estimator
// file (lib/p5/shared-manifest.json) edited only in boise-remodeling-co.
const focusedTestId=page=>page.evaluate(()=>document.activeElement?.getAttribute('data-testid'));
// Validation resolves asynchronously; wait for focus to settle on the expected field.
const focusSettles=(page,id)=>page.waitForFunction(id=>document.activeElement?.getAttribute('data-testid')===id,id,{timeout:3000}).catch(()=>{});
const unobstructed=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));});

/** One screen: the heading and the first field on arrival, validation in place,
 * "Have us call you" reducing the form, the draft surviving a reload. Never sends. */
async function fillConstructionQuote(page, method) {
  const form=page.getByTestId('consultation-wizard');
  await form.waitFor();
  assert.equal(await form.getAttribute('data-step'),'project');
  assert.equal(await page.getByTestId('consult-wizard-actions').count(),0,'No Continue: the request is one screen');
  const name=page.getByTestId('input-name');
  assert.ok(await name.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'First field visible on arrival');
  assert.notEqual(await focusedTestId(page),'input-name','No text field is auto-focused on arrival');
  const send=page.getByTestId('button-send-request');
  await page.locator('[data-testid="button-send-request"][data-hydrated="true"]').waitFor();
  // Let fonts and the frame settle so the tap is not lost to a late layout shift.
  await page.waitForLoadState('load');await page.evaluate(()=>document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  await send.click();await focusSettles(page,'input-name');
  assert.equal(await focusedTestId(page),'input-name','Empty send focuses the first error');
  assert.match(await form.innerText(),/Please enter your name/);
  await name.fill('Synthetic Navigation Check');
  await page.getByTestId('textarea-message').fill('Synthetic local-only test. '+'LongUnbrokenMaterialSpecification'.repeat(20));
  await page.getByTestId('button-preferred-contact-'+method).click();
  const field=page.getByTestId('input-'+(method==='email'?'email':'phone'));
  await field.fill(method==='email'?'invalid':'123');
  await send.click();await focusSettles(page,'input-'+(method==='email'?'email':'phone'));
  assert.equal(await focusedTestId(page),'input-'+(method==='email'?'email':'phone'),'Invalid contact blocks the send');
  await field.fill(method==='email'?'navigation@example.invalid':'2085550102');
  assert.equal(await page.getByTestId('quote-more-detail').evaluate(el=>el.open),false,'Extra detail stays collapsed and optional');
  await page.getByTestId('request-mode-callback').click();
  assert.equal(await form.getAttribute('data-request-kind'),'callback');
  assert.equal(await page.getByTestId('textarea-message').count(),0,'Callback asks for name and number only');
  assert.equal(await page.getByTestId('select-best-time').count(),1);
  await page.getByTestId('request-mode-quote').click();
  assert.equal(await form.getAttribute('data-request-kind'),'quote');
  await page.reload();await form.waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-testid="input-name"]')?.value==='Synthetic Navigation Check');
  assert.match(await page.getByTestId('textarea-message').inputValue(),/Synthetic local-only test/);
  for(const link of ['link-quote-call','link-quote-text']) assert.equal(await page.getByTestId(link).count(),1);
  await send.scrollIntoViewIfNeeded();assert.ok(await unobstructed(send),'Quote action must be unobstructed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Quote horizontal overflow');
}

const browserName=process.env.P5_TEST_BROWSER||'chromium';
const browser=await ({chromium,webkit}[browserName]).launch();
const results=[];
try {
 for(const width of [320,390,768,1440]) for(const method of ['email','phone','text']) {
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  let blocked=0;
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==base||u.pathname.startsWith('/api/')){blocked++;return route.abort();}return route.continue();});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  try {
   await page.goto(base+'/estimate');
   await fillConstructionQuote(page,method);
   await page.screenshot({path:`${output}/${browserName}-${width}-${method}.png`});
   results.push({width,method,passed:true,blocked,submission:'not attempted'});
  } catch(error) {results.push({width,method,passed:false,error:String(error)});throw error;} finally {await context.close();}
 }
} finally {await browser.close();await fs.writeFile(`${output}/${browserName}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}

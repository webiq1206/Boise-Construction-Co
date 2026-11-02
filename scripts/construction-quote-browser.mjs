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

/** Step 1 is one screen: the heading and the first field ("What can we help with?")
 * on arrival, the optional attachment tile, validation in place, "Have us call you"
 * reducing the form, the draft surviving a reload. Never sends. */
async function fillConstructionQuote(page, method) {
  const form=page.getByTestId('consultation-wizard');
  await form.waitFor();
  assert.equal(await form.getAttribute('data-step'),'project');
  assert.equal(await page.getByTestId('consult-wizard-actions').count(),0,'No Continue: the request is one screen');
  const name=page.getByTestId('input-name');
  const message=page.getByTestId('textarea-message');
  assert.ok(await message.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'First field visible on arrival');
  assert.ok(await page.evaluate(()=>{const order=['textarea-message','quote-attach-tile','input-name','input-phone','input-email'].map(id=>document.querySelector(`[data-testid="${id}"]`));return order.every(Boolean)&&order.every((el,i)=>i===0||order[i-1].compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING);}),'Step 1 order: need, files, name, phone, email');
  assert.ok(!['textarea-message','input-name','input-phone','input-email'].includes(await focusedTestId(page)),'No text field is auto-focused on arrival');
  // The attachment tile: native multi-file picker for photos and PDFs, optional.
  const files=page.getByTestId('input-files');
  assert.equal(await files.getAttribute('accept'),'image/*,application/pdf,.heic,.heif');
  assert.equal(await files.evaluate(el=>el.multiple),true);
  assert.ok((await page.getByTestId('quote-attach-tile').boundingBox()).height>=56,'Attachment tile is at least 56px tall');
  // Project type, build site and timing belong to the optional second step.
  for(const id of ['input-address','consult-project-custom-home','quote-more-detail']) assert.equal(await page.getByTestId(id).count(),0,id+' is not on step 1');
  const send=page.getByTestId('button-send-request');
  await page.locator('[data-testid="button-send-request"][data-hydrated="true"]').waitFor();
  // Let fonts and the frame settle so the tap is not lost to a late layout shift.
  await page.waitForLoadState('load');await page.evaluate(()=>document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  await send.click();await focusSettles(page,'textarea-message');
  assert.equal(await focusedTestId(page),'textarea-message','Empty send focuses the first error');
  assert.match(await form.innerText(),/Please tell us a few words/);
  assert.match(await form.innerText(),/Please enter your name/);
  await message.fill('Synthetic local-only test. '+'LongUnbrokenMaterialSpecification'.repeat(20));
  await name.fill('Synthetic Navigation Check');
  assert.equal(await page.locator('[data-testid="button-preferred-contact-text"] input').isChecked(),true,'Text is the default way to reach you');
  await page.getByTestId('button-preferred-contact-'+method).click();
  // Phone is always required; Email also needs the address when Email is chosen.
  if(method==='email') await page.getByTestId('input-phone').fill('2085550102');
  const field=page.getByTestId('input-'+(method==='email'?'email':'phone'));
  await field.fill(method==='email'?'invalid':'123');
  await send.click();await focusSettles(page,'input-'+(method==='email'?'email':'phone'));
  assert.equal(await focusedTestId(page),'input-'+(method==='email'?'email':'phone'),'Invalid contact blocks the send');
  await field.fill(method==='email'?'navigation@example.invalid':'2085550102');
  await page.getByTestId('request-mode-callback').click();
  assert.equal(await form.getAttribute('data-request-kind'),'callback');
  assert.equal(await page.getByTestId('textarea-message').count(),0,'Callback asks for name and number only');
  assert.equal(await page.getByTestId('quote-attach-tile').count(),0,'Callback has no attachment tile');
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

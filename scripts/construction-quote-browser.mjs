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

/** Step 1 is one clean screen (owner, 11 November: "it cannot look cluttered"): the
 * first field ("What can we help with?") on arrival, name and phone, ONE quiet text
 * toggle holding everything optional (email, how to reach you), one send button, then
 * the talk line that carries the callback mode and the no-obligation line. No step
 * indicator, no tabs, no footnote, no boxes, no attachment tile before sending.
 * Validation in place (it opens the toggle when the email needs attention), "Have us
 * call you" reducing the form, the draft surviving a reload. Never sends. */
async function fillConstructionQuote(page, method) {
  const form=page.getByTestId('consultation-wizard');
  await form.waitFor();
  assert.equal(await form.getAttribute('data-step'),'project');
  assert.equal(await page.getByTestId('consult-wizard-actions').count(),0,'No Continue: the request is one screen');
  const name=page.getByTestId('input-name');
  const message=page.getByTestId('textarea-message');
  assert.ok(await message.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'First field visible on arrival');
  assert.ok(await page.evaluate(()=>{const order=['textarea-message','input-name','input-phone','quote-options','input-email','button-send-request','quote-request-mode','link-quote-call','request-mode-callback'].map(id=>document.querySelector(`[data-testid="${id}"]`));return order.every(Boolean)&&order.every((el,i)=>i===0||order[i-1].compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING);}),'Step 1 order: need, name, phone, optional toggle (email), send, talk line with the callback control');
  // Nothing in the form area but fields, the button and two quiet lines.
  assert.equal(await page.locator('[data-testid="quote-steps"],[data-quote-steps]').count(),0,'No step indicator');
  assert.equal(await page.getByTestId('link-quote-text').count()+await page.getByTestId('button-quote-chat').count(),0,'The talk line offers the call link and the callback only');
  const lines=await page.evaluate(()=>{const send=document.querySelector('[data-testid="button-send-request"]');return [...send.parentElement.children].filter(el=>el!==send).map(el=>{const c=el.cloneNode(true);c.querySelectorAll('.sr-only').forEach(n=>n.remove());return c.textContent.replace(/\s+/g,' ').trim();});});
  assert.equal(lines.length,2,'Exactly two lines follow the send button');
  assert.match(lines[0],/^Prefer to talk\? Call \(\d{3}\) \d{3}-\d{4} or have us call you\.$/);
  assert.match(lines[1],/^No obligation\. Privacy policy$/);
  // No box inside the form: only the inputs and the button carry a border or a background.
  assert.deepEqual(await form.evaluate(f=>[...f.querySelectorAll('details,summary,fieldset,p,div')].filter(el=>{const s=getComputedStyle(el);return el.offsetParent&&!el.closest('[aria-hidden="true"]')&&(parseFloat(s.borderTopWidth)>0||parseFloat(s.borderBottomWidth)>0||s.backgroundColor!=='rgba(0, 0, 0, 0)');}).map(el=>el.tagName+'.'+el.className.slice(0,40))),[],'No bordered or filled wrapper in the form');
  // Name and phone share a row from 640px up and stack below.
  assert.equal(await page.evaluate(()=>{const a=document.querySelector('[data-testid="input-name"]').getBoundingClientRect(),b=document.querySelector('[data-testid="input-phone"]').getBoundingClientRect();return Math.abs(a.top-b.top)<1;}),page.viewportSize().width>=640,'Name and phone side by side from 640px');
  // On a phone the whole empty form, first field through the send button, fits one screen.
  if(page.viewportSize().width<640) assert.ok(await page.evaluate(()=>{const top=document.querySelector('[data-testid="textarea-message"]').getBoundingClientRect().top,bottom=document.querySelector('[data-testid="button-send-request"]').getBoundingClientRect().bottom;return top>=0&&bottom<=innerHeight;}),'Empty form fits one phone screen');
  // Optional fields: one native dropdown, closed on arrival, holding the email and the reach choice.
  const options=page.getByTestId('quote-options');
  assert.equal(await options.evaluate(el=>el.tagName),'DETAILS');
  assert.equal(await options.evaluate(el=>el.open),false,'Optional fields are closed on arrival');
  assert.match(await options.locator('summary').innerText(),/^Add address, email or contact preference \(optional\)$/);
  assert.ok(await options.locator('summary').evaluate(el=>{const s=getComputedStyle(el);return parseFloat(s.borderTopWidth)===0&&s.backgroundColor==='rgba(0, 0, 0, 0)';}),'The toggle is a line of text, not a box');
  // The optional project address is the first field in the toggle, a plain text input, never required.
  const address=options.getByTestId('input-project-address');
  assert.deepEqual(await address.evaluate(el=>({type:el.type,autocomplete:el.autocomplete,required:el.required||el.getAttribute('aria-required')==='true',first:el===el.closest('details').querySelector('input,select,textarea'),label:el.labels[0]?.textContent.trim(),hint:document.getElementById(el.id+'-hint')?.textContent.trim()})),{type:'text',autocomplete:'street-address',required:false,first:true,label:'Project address',hint:'Leave blank if you do not have one yet.'});
  assert.equal(await address.isVisible(),false,'The address is hidden until the toggle is opened');
  for(const id of ['input-email','button-preferred-contact-phone','button-preferred-contact-text','button-preferred-contact-email']){
    assert.equal(await options.getByTestId(id).count(),1,id+' sits inside the optional dropdown');
    assert.equal(await page.getByTestId(id).isVisible(),false,id+' is hidden until the dropdown is opened');
  }
  // The callback mode is the same pair of native radios, drawn as one inline text link: the mode
  // you are in stays checked but visually hidden, the other one is the visible link.
  assert.equal(await page.getByRole('radio',{name:'Send a request',exact:true}).isChecked(),true);
  assert.equal(await page.getByRole('radio',{name:'Have us call you',exact:true}).isChecked(),false);
  assert.equal(await page.getByTestId('request-mode-callback').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>40&&r.height>10&&getComputedStyle(el).textDecorationLine.includes('underline');}),true,'Have us call you is a visible text link');
  assert.equal(await page.getByTestId('request-mode-quote').evaluate(el=>el.getBoundingClientRect().width<=1),true,'The active mode is visually hidden');
  assert.ok(!['textarea-message','input-name','input-phone','input-email'].includes(await focusedTestId(page)),'No text field is auto-focused on arrival');
  // Files, project type, build site and timing belong to the optional second step, after sending.
  for(const id of ['input-files','quote-attach-tile','quote-details-disclosure','input-address','consult-project-custom-home','quote-more-detail']) assert.equal(await page.getByTestId(id).count(),0,id+' is not on step 1');
  assert.equal(await form.locator('input[type=file]').count(),0,'No file control before the request is sent');
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
  assert.equal(await options.evaluate(el=>el.open),false,'An empty send does not open the optional dropdown');
  await options.locator('summary').click();
  await page.getByTestId('button-preferred-contact-'+method).click();
  // Phone is always required; Email also needs the address when Email is chosen.
  if(method==='email'){
    await page.getByTestId('input-phone').fill('2085550102');
    // Close the dropdown again: a send that needs the email must reopen it and focus the field.
    await options.locator('summary').click();
    assert.equal(await options.evaluate(el=>el.open),false);
    await send.click();await focusSettles(page,'input-email');
    assert.equal(await options.evaluate(el=>el.open),true,'A missing email opens the optional dropdown');
    assert.equal(await focusedTestId(page),'input-email','A missing email takes focus');
  }
  const field=page.getByTestId('input-'+(method==='email'?'email':'phone'));
  await field.fill(method==='email'?'invalid':'123');
  await send.click();await focusSettles(page,'input-'+(method==='email'?'email':'phone'));
  assert.equal(await focusedTestId(page),'input-'+(method==='email'?'email':'phone'),'Invalid contact blocks the send');
  await field.fill(method==='email'?'navigation@example.invalid':'2085550102');
  await page.getByTestId('request-mode-callback').click();
  assert.equal(await form.getAttribute('data-request-kind'),'callback');
  assert.equal(await page.getByTestId('textarea-message').count(),0,'Callback asks for name and number only');
  assert.equal(await page.getByTestId('quote-options').count(),0,'Callback has no optional dropdown');
  assert.equal(await page.getByRole('radio',{name:'Have us call you',exact:true}).isChecked(),true);
  assert.equal(await page.getByTestId('quote-request-mode').evaluate(el=>{const c=el.cloneNode(true);c.querySelectorAll('.sr-only').forEach(n=>n.remove());return c.textContent.replace(/\s+/g,' ').trim();}),'Rather write it down? Send a request');
  assert.equal(await page.getByTestId('select-best-time').count(),1);
  await page.getByTestId('request-mode-quote').click();
  assert.equal(await form.getAttribute('data-request-kind'),'quote');
  await page.reload();await form.waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-testid="input-name"]')?.value==='Synthetic Navigation Check');
  assert.match(await page.getByTestId('textarea-message').inputValue(),/Synthetic local-only test/);
  // A restored draft never hides what was already entered in the dropdown.
  assert.equal(await page.getByTestId('quote-options').evaluate(el=>el.open),method!=='text','The dropdown reopens for a restored email or a non-default reach choice');
  assert.equal(await page.getByTestId('link-quote-call').count(),1);
  assert.equal(await page.locator('[data-testid="consultation-wizard"] button[type=submit], button[form][type=submit]').count(),1,'One primary send button');
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

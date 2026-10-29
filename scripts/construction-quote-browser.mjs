import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from '@playwright/test';
const base=process.env.P5_TEST_BASE_URL||'http://127.0.0.1:5000';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local synthetic test only');
const output='p5-verification/construction-quote';await fs.mkdir(output,{recursive:true});
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
   const form=page.getByTestId('consultation-wizard');
   const step=async value=>page.waitForFunction(value=>document.querySelector('[data-testid="consultation-wizard"]')?.dataset.step===value,value);
   const next=()=>page.getByTestId('consult-wizard-actions').getByRole('button',{name:'Continue',exact:true}).click();
   await step('project');await next();assert.equal(await form.getAttribute('data-step'),'project');
   await page.getByTestId('consult-project-looking-for-land').click();await next();await step('name');
   await next();assert.equal(await form.getAttribute('data-step'),'name');
   await page.getByTestId('input-name').fill('Synthetic Navigation Check');await next();await step('prefer');
   await page.getByTestId('button-preferred-contact-'+method).click();await next();await step('reach');
   const field=page.getByTestId('input-'+(method==='email'?'email':'phone'));
   await field.fill(method==='email'?'invalid':'123');await next();assert.equal(await form.getAttribute('data-step'),'reach');
   await field.fill(method==='email'?'navigation@example.invalid':'2085550102');await next();await step('review');
   assert.match(await form.innerText(),/Synthetic Navigation Check/);
   assert.match(await form.innerText(),/Still Looking for Land/);
   assert.equal(await page.getByTestId('input-address').count(),0);
   await page.getByTestId('button-add-note').click();
   await page.getByTestId('textarea-message').fill('Synthetic local-only test. '+ 'LongUnbrokenMaterialSpecification'.repeat(20));
   await page.reload();await step('review');assert.match(await form.innerText(),/Synthetic Navigation Check/);
   const send=page.getByTestId('consult-wizard-actions').getByRole('button').last();
   await send.scrollIntoViewIfNeeded();assert.ok(await send.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));}));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:`${output}/${browserName}-${width}-${method}.png`});
   results.push({width,method,passed:true,blocked,submission:'not attempted'});
  } catch(error) {results.push({width,method,passed:false,error:String(error)});throw error;} finally {await context.close();}
 }
} finally {await browser.close();await fs.writeFile(`${output}/${browserName}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}

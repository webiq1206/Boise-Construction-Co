import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from '@playwright/test';
import {fillConstructionQuote} from './lib/quoteEntry.mjs';
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
   await fillConstructionQuote(page,method);
   await page.screenshot({path:`${output}/${browserName}-${width}-${method}.png`});
   results.push({width,method,passed:true,blocked,submission:'not attempted'});
  } catch(error) {results.push({width,method,passed:false,error:String(error)});throw error;} finally {await context.close();}
 }
} finally {await browser.close();await fs.writeFile(`${output}/${browserName}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}

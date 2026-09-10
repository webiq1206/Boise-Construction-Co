import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch();const results=[];
await mkdir('p5-verification',{recursive:true});
for(const width of [320,390,430,768,1024,1440,1920])for(const landOwnership of ['own','looking']){
 const page=await browser.newPage({viewport:{width,height:900}});page.setDefaultTimeout(10000);
 await page.addInitScript(({landOwnership})=>sessionStorage.setItem('brc_estimate_wizard_v1',JSON.stringify({planningStage:'exploring',landOwnership,activeProject:'custom-home',sqft:2400,finish:'mid-range',structures:[],bathCount:2,kitchenIn:true,chosen:{stage:true,land:true,project:true,subtype:true,finish:true},wizStep:'contact',view:'steps',buildArea:'',gateAddress:''})),{landOwnership});
 let payload=null;
 await page.route('**/api/estimate-lead',async route=>{payload=route.request().postDataJSON();await route.fulfill({contentType:'application/json',body:JSON.stringify({accepted:true,inquiryKey:payload.inquiryKey,conversionId:'synthetic-address-test'})});});
 try{
  await page.goto('http://127.0.0.1:5000/estimate',{waitUntil:'networkidle'});
  await page.getByTestId('gate-input-name').fill('Synthetic Address Test');await page.getByTestId('gate-input-email').fill('address-test@example.invalid');
  const location=page.getByTestId(landOwnership==='own'?'gate-input-address':'gate-input-build-area');assert.equal(await location.inputValue(),'');
  await page.getByRole('button',{name:'Reveal My Estimate',exact:true}).click();
  await page.getByTestId('estimate-range').waitFor();
  assert.ok(payload);assert.ok(!payload.address);assert.ok(!payload.buildArea);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
  results.push({width,landOwnership,passed:true,scope:'Saved-draft contact gate with location omitted; estimate transport simulated.'});
 }catch(error){results.push({width,landOwnership,passed:false,error:String(error)});await page.screenshot({path:`p5-verification/address-${width}-${landOwnership}.png`,fullPage:true}).catch(()=>{});}
 await page.close();
}
await browser.close();await writeFile('p5-verification/optional-address-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(x=>!x.passed))process.exitCode=1;

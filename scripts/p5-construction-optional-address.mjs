import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch();const results=[];await mkdir('p5-verification',{recursive:true});
for(const width of [320,390,430,768,1024,1440,1920])for(const landOwnership of ['own','not-yet']){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.setDefaultTimeout(12000);let saved=null,submitted=null;
 await context.route('**/api/p5-estimator/**',async route=>{
  const request=route.request();const endpoint=new URL(request.url()).pathname.split('/').at(-1);const send=data=>route.fulfill({json:data});
  if(endpoint==='draft'){
   if(request.method()==='GET')return send({draft:saved});const input=request.postDataJSON();saved={...saved,...input,revision:(saved?.revision||0)+1,uploads:[],status:'draft',extraction:saved?.extraction||null};return send({draft:saved,pricedFields:[],conflicts:[]});
  }
  if(endpoint==='scope'){
   saved={...saved,revision:saved.revision+1,answers:{service:'new-construction',sqft:'2400',finish:'mid-range',taskList:'Build a new home. Land ownership: '+landOwnership},extraction:{summary:'Synthetic new home',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[]}};return send({draft:saved,analysis:{extraction:saved.extraction},pricedFields:[],conflicts:[]});
  }
  if(endpoint==='submit'){submitted=saved;return send({accepted:true,result:{range:{low:350000,high:450000},summary:saved.text,assumptions:['Location and jurisdiction remain to be confirmed.'],nextStep:'Synthetic address check complete.',message:'Simulated planning result; no delivery.',disclaimer:'Not a quote.'},delivery:[]});}
  return route.fulfill({status:404});
 });
 try{
  await page.goto('http://127.0.0.1:5000/estimate');const est=page.locator('[data-p5-estimator]');
  await est.getByLabel('Tell us about your project',{exact:true}).fill('Synthetic new home: 2400 square feet, standard finishes. Land ownership: '+landOwnership);
  await est.getByRole('button',{name:'Continue',exact:true}).click();await est.getByLabel('Your name',{exact:true}).fill('Synthetic Address Test');await est.getByLabel('Email',{exact:true}).fill('address-test@example.invalid');
  assert.equal(await est.getByRole('region',{name:'Project question'}).count(),0,'Known project requires no location question');
  await est.getByRole('checkbox').check();await est.getByRole('button',{name:'Get my estimate',exact:true}).click();await est.getByText('Synthetic address check complete.',{exact:true}).waitFor();
  assert.ok(submitted);assert.ok(!submitted.answers.address&&!submitted.answers.location);assert.ok(submitted.text.includes(landOwnership));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  results.push({width,landOwnership,passed:true,scope:'Unified typed project reaches result without location or address. Analysis, pricing and delivery simulated.'});
 }catch(error){results.push({width,landOwnership,passed:false,error:String(error)});await page.screenshot({path:`p5-verification/address-${width}-${landOwnership}.png`,fullPage:true}).catch(()=>{});}await context.close();
}
await browser.close();await writeFile('p5-verification/optional-address-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(x=>!x.passed))process.exitCode=1;

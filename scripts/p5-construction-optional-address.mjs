import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.P5_TEST_BASE_URL||'http://127.0.0.1:5000';
// The review intake separates the whole-project confirmation from the customer confirmation.
const SCOPE_REVIEW_LABEL='I checked the whole project type, supporting work and exclusions against this description.';
const INTAKE_CONFIRM_LABEL='These details reflect my project. I understand the team will review them before preparing an estimate.';
const browser=await chromium.launch();const results=[];await mkdir('p5-verification',{recursive:true});
for(const width of [320,390,430,768,1024,1440,1920])for(const landOwnership of ['own','not-yet']){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.setDefaultTimeout(12000);let saved=null,submitted=null,receipt=null;
 await context.route('**/*',route=>{const url=new URL(route.request().url());return url.origin!==new URL(base).origin||url.pathname.startsWith('/api/')?route.abort('blockedbyclient'):route.continue();});
 await context.route('**/api/estimator-session',route=>route.fulfill({json:{ok:true}}));
 await context.route('**/api/p5-estimator/**',async route=>{
  const request=route.request();const endpoint=new URL(request.url()).pathname.split('/').at(-1);const send=(data,status=200)=>route.fulfill({status,json:data});
  if(endpoint==='draft'){
   if(request.method()==='GET')return send({draft:saved});const input=request.postDataJSON();const id=request.headers()['x-p5-draft-id']||saved?.id;
   // The server derives the intake identity from its own saved state (lib/p5/intakeDraft.ts).
   const intake={desiredOutcome:'',workContext:'',budget:'',supportingServices:[],transcript:[],...(saved?.intake||{}),...(input.intake||{}),projectId:saved?.intake?.projectId||`construction:${id}`,originSite:'construction',currentSite:'construction',version:saved?.revision||0,contact:{...(input.contact||{}),preferredContact:input.intake?.contact?.preferredContact||'either'}};
   saved={...saved,...input,revision:(saved?.revision||0)+1,uploads:[],status:'draft',extraction:saved?.extraction||null,intake};return send({draft:saved,pricedFields:[],conflicts:[]});
  }
  if(endpoint==='scope'){
   saved={...saved,revision:saved.revision+1,answers:{service:'new-construction',sqft:'2400',finish:'mid-range',taskList:'Build a new home. Land ownership: '+landOwnership},extraction:{summary:'Synthetic new home',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[]}};return send({draft:saved,analysis:{extraction:saved.extraction},pricedFields:[],conflicts:[]});
  }
  if(endpoint==='intake'){
   if(request.method()==='GET')return send({receipt});
   const body=request.postDataJSON();if(!saved)return send({error:'Save your project before sending it.'},404);
   if(body.revision!==saved.revision||body.confirmed!==true)return send({error:'Review and confirm the latest project details before sending.'},409);
   submitted=saved;
   receipt={accepted:true,projectId:saved.intake.projectId,reference:'P5-SYNTHETIC1',revision:saved.revision,team:{primaryTeam:'construction',teamName:'Boise Construction Co',supportingServices:[],handoff:null,unresolved:[]},unresolved:['Synthetic detail left for the team.'],savedAt:new Date().toISOString(),delivery:{customer:'blocked',team:'blocked',crm:'blocked'},deliveryDetails:{customer:'Simulated; no delivery.',team:'Simulated; no delivery.',crm:''}};
   return send(receipt);
  }
  return route.fulfill({status:404});
 });
 try{
  await page.goto(`${base}/estimate`);const est=page.locator('[data-p5-estimator]');
  await est.getByLabel('Tell us about your project',{exact:true}).fill('Synthetic new home: 2400 square feet, standard finishes. Land ownership: '+landOwnership);
  await est.getByRole('button',{name:'Send message',exact:true}).click();
  // Construction asks its build questions and the optional location and timing questions before
  // review; a suggested answer or Not sure yet answers each. The review and contact form follow.
  for(let i=0;i<10;i++){const name=est.getByLabel('Your name',{exact:true});const q=est.locator('section[aria-label="Project question"]');await name.or(q).first().waitFor({timeout:60000});if(await name.count())break;const chips=q.locator('[aria-label="Suggested answers"] button');const unsure=q.getByRole('button',{name:'Not sure yet',exact:true});if(await chips.count()){await chips.first().click();await est.getByRole('button',{name:'Send answer',exact:true}).click();}else if(await unsure.count())await unsure.click();else throw new Error('Unexpected question: '+(await q.innerText()).slice(0,120));await page.waitForFunction(()=>!document.querySelector('[data-p5-estimator][aria-busy=true]'));}
  await est.getByLabel('Your name',{exact:true}).fill('Synthetic Address Test');await est.getByLabel(/^Email/).fill('address-test@example.invalid');
  assert.equal(await est.getByRole('region',{name:'Project question'}).count(),0,'The review screen asks no further question');
  await est.getByLabel(SCOPE_REVIEW_LABEL,{exact:true}).check();await est.getByLabel(INTAKE_CONFIRM_LABEL,{exact:true}).check();
  await est.getByRole('button',{name:'Send project request',exact:true}).click();await est.getByRole('heading',{name:'Your project request is saved',exact:true}).waitFor();
  assert.ok(submitted);assert.ok(!submitted.answers.address&&!submitted.answers.location);assert.ok(submitted.text.includes(landOwnership));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const text=await est.innerText();assert.ok(!/\$\s?\d/.test(text),'The review intake shows no price');
  results.push({width,landOwnership,passed:true,scope:'Unified typed project reaches the saved request without location or address. Analysis and delivery simulated.'});
 }catch(error){results.push({width,landOwnership,passed:false,error:String(error)});await page.screenshot({path:`p5-verification/address-${width}-${landOwnership}.png`,fullPage:true}).catch(()=>{});}await context.close();
}
await browser.close();await writeFile('p5-verification/optional-address-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(x=>!x.passed))process.exitCode=1;

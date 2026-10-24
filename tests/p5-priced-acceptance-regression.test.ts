import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {completeSubmission} from '../lib/p5/submitProgress.ts';
import {requireIntakeReceipt} from '../lib/p5/intakeContract.ts';
import {trackGoogleAdsLeadConversion,GOOGLE_ADS_ESTIMATOR_LABEL,GOOGLE_ADS_LEAD_LABEL} from '../lib/googleAdsConversion.ts';

async function finish(payload:unknown,key:string){
 const data=await completeSubmission(async()=>Response.json(payload),()=>{},async()=>{});
 return trackGoogleAdsLeadConversion({service:'new-build'},key,{accepted:data.accepted===true});
}
test('priced server acceptance controls primary conversion, including replay and duplicate clicks',async()=>{
 const prior=(globalThis as any).window;const events:any[][]=[];const storage=new Map<string,string>();
 (globalThis as any).window={gtag:(...args:any[])=>events.push(args),sessionStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}};
 const result={range:{low:100,high:150}};
 const labels=()=>events.map(e=>e[2].send_to);
 try{
  assert.equal(await finish({accepted:true,result},'estimator:accepted-regression'),true);
  assert.equal(await finish({accepted:true,result},'estimator:accepted-regression'),false);
  assert.equal(await finish({accepted:false,duplicate:true,result},'estimator:accepted-regression'),false);
  assert.deepEqual(labels(),[GOOGLE_ADS_ESTIMATOR_LABEL,GOOGLE_ADS_LEAD_LABEL]);
  events.length=0;
  // A replay loaded in a fresh tracking session must still not become a new form lead.
  await finish({accepted:false,duplicate:true,result},'estimator:replay-regression');
  assert.deepEqual(labels(),[GOOGLE_ADS_ESTIMATOR_LABEL]);
  for(const [index,accepted] of [undefined,null,'true',1].entries()){
   events.length=0;await finish({accepted,result},`estimator:invalid-acceptance-${index}`);
   assert.deepEqual(labels(),[GOOGLE_ADS_ESTIMATOR_LABEL]);
  }
  events.length=0;
  for(const payload of [{accepted:true},{accepted:true,result:null}])await assert.rejects(()=>finish(payload,'estimator:missing-result'),/retry/i);
  assert.deepEqual(events,[]);
  assert.throws(()=>requireIntakeReceipt({accepted:true}),/could not be confirmed/);
  assert.deepEqual(events,[]);
 }finally{(globalThis as any).window=prior;}
});
test('production producer passes strict priced acceptance and retains validated intake receipt ordering',()=>{
 const source=fs.readFileSync(new URL('../components/P5Estimator.tsx',import.meta.url),'utf8');
 assert.match(source,/trackGoogleAdsLeadConversion\(\{service:d.answers.service\},`estimator:\$\{d.id\}`,\{accepted:data.accepted===true\}\)/);
 assert.match(source,/const receipt=requireIntakeReceipt\(value\);if\(receipt.revision!==latest.revision\)throw/);
 assert.match(source,/setIntakeReceipt\(receipt\);setStatus\(''\);trackGoogleAdsLeadConversion\(\{service:latest.answers.service\},`intake:\$\{receipt.projectId\}`\)/);
});

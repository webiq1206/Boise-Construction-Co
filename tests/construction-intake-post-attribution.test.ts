/** Execute the real intake endpoint with fail-closed storage/provider doubles. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {captureTouch,sanitizeAttribution} from '../lib/leadAttribution.ts';
import {DraftError} from '../lib/p5/store.ts';
import {limitedBody,json,failed} from '../lib/p5/http.ts';
import * as contract from '../lib/p5/intakeContract.ts';
import * as policy from '../lib/p5/intakePolicy.ts';
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';

const site=policy.intakeSite(ESTIMATOR_BRAND.id)!;
const attribution=(click:string)=>{
 const touch=captureTouch(`https://boiseconstruction.co/estimate/scope?gclid=${click}&email=private%40example.invalid`,'https://google.com/search?q=private');
 return {version:1,consent:{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'},first:touch,latest:touch};
};
function endpoint(){
 const exports:any={},saved:any[]=[];let existing:any=null;
 const draft={brand:ESTIMATOR_BRAND.id,revision:1,text:'Fictional new home.',uploads:[],answers:{service:'new-construction'},extraction:null,contact:{name:'Fictional Customer',email:'fixture@example.invalid',phone:''},intake:{...contract.emptyIntakeDetails(),projectId:`${site}:fixture`,originSite:site,version:1,contact:{preferredContact:'email'}}};
 class IntakeConflict extends Error{}
 const deps:Record<string,unknown>={
  './intakeReferenceStore.ts':{reserveIntakeReference:async()=> 'P5-C-FIXTURE'},
  './store.ts':{DraftError,draftCredentials:()=>({id:'fixture',key:'fixture'}),readDraft:async()=>draft},
  './database.ts':{query:async()=>{throw Error('Unexpected database access');}},
  './http.ts':{limitedBody,json,failed,protectRequest:()=>{}},
  './brand.ts':{ESTIMATOR_BRAND},'./intakePolicy.ts':policy,
  './intakeContract.ts':{...contract,intakeScopeReviewed:()=>true},
  './intakeStore.ts':{IntakeConflict,intakeStore:()=>({read:async()=>existing,save:async(snapshot:any)=>{saved.push(snapshot);existing={accepted:true,reference:snapshot.reference,revision:snapshot.revision};return existing;}})},
  './scope.ts':{SCOPE_FIELDS:{}},'./estimateDriver.ts':{kickDriver:()=>{}},'../leadAttribution.ts':{sanitizeAttribution},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('lib/p5/intakeEndpoint.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:(name:string)=>{assert.ok(Object.hasOwn(deps,name),`Unexpected dependency ${name}`);return deps[name];},TextDecoder,JSON});
 return {post:exports.postIntake,saved};
}
function request(body:unknown){return new Request('http://fixture.invalid/api/p5-estimator/intake',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
test('current browser attribution survives a body above2048bytes and immutable retry preserves its first saved evidence',async()=>{
 const api=endpoint(),first=attribution('first-click');
 const accepted=await api.post(request({revision:1,confirmed:true,attribution:first,padding:'x'.repeat(3000)}));
 assert.equal(accepted.status,200);assert.equal(api.saved.length,1);
 assert.deepEqual(api.saved[0].attribution,sanitizeAttribution(first));
 assert.doesNotMatch(JSON.stringify(api.saved[0].attribution),/private/);
 const retried=await api.post(request({revision:1,confirmed:true,attribution:attribution('later-click')}));
 assert.deepEqual(await retried.json(),await accepted.json());assert.equal(api.saved.length,1,'Lost-response retry must not create or replace the accepted snapshot');
});
test('the retained24576byte intake cap rejects oversized bodies before saving',async()=>{
 const api=endpoint();const response=await api.post(request({revision:1,confirmed:true,padding:'x'.repeat(25000)}));
 assert.equal(response.status,413);assert.equal(api.saved.length,0);
});

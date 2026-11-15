/** Real brand adapter and acceptance wrapper, with no configured provider or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {checkedEmailSender} from '../lib/emailDelivery.ts';
import {safeEmailReplyTo} from '../lib/p5/emailReplyTo.ts';
import {ESTIMATOR_BRAND as brand} from '../lib/p5/brand.ts';
function fixture(responses:any[]){
 const calls:any[]=[],exports:any={};
 const send=checkedEmailSender(async(body:any,options:any)=>{calls.push({body,options});return responses.shift();},'p5homeco.com');
 const deps:Record<string,unknown>={'./emailReplyTo.ts':{safeEmailReplyTo},'./brand':{ESTIMATOR_BRAND:brand},'../../server/services/emailTransport':{getUncachableEmailClient:async()=>({client:{emails:{send}}})},'../../server/services/emailLayout':{},'./crmPayload':{},'./keyedCrm':{}};
 vm.runInNewContext(ts.transpileModule(readFileSync('lib/p5/deliveryAdapter.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:(name:string)=>{assert.ok(Object.hasOwn(deps,name),`Unexpected dependency ${name}`);return deps[name];},Buffer,console:{error:()=>{}},process:{env:{}}});
 return {sendEmail:exports.sendEmail,calls};
}
const payload={to:'fixture@example.invalid',subject:'Fictional estimate',text:'Fixture only',attachments:[],key:'fixture-key'};
test('returned transient provider statuses retry once with the same key; permanent refusal never retries',async()=>{
 for(const statusCode of [429,500,503]){
  const f=fixture([{error:{statusCode,message:'private details'}},{data:{id:'fixture-accepted'},error:null}]);
  assert.equal(await f.sendEmail(payload),'fixture-accepted');assert.equal(f.calls.length,2);
  assert.ok(f.calls.every(call=>call.options.idempotencyKey===payload.key));
 }
 const f=fixture([{error:{statusCode:422,message:'private details'}}]);
 await assert.rejects(()=>f.sendEmail(payload),/did not accept/);assert.equal(f.calls.length,1);
});

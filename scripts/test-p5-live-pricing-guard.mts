import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readdir,readFile,symlink,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {digest,openGuard,canonicalSourcePath,eligibleGenerationEndpoints,type Allowance} from './lib/livePricingGuard.mts';

const endpoint='https://api.anthropic.com/v1/messages';
const request={method:'POST',body:JSON.stringify({model:'simulated',max_tokens:10})};
async function fixture(transport:typeof fetch,budget=20,changes:Partial<Allowance>={}){
 const directory=await mkdtemp(join(tmpdir(),'pricing-guard-'));
 const allowance:Allowance={version:1,authorization:'Simulated test only',currency:'USD',
  budgetMicrousd:budget,perCallMicrousd:10,boundEvidence:'Simulated explicit bound, not a real rate',
  coversAllTokensAndTools:true,expiresAt:'2099-01-01',ledgerDirectory:join(directory,'ledger'),
  configurationFile:'unused',configurationSha256:'unused',sourceSha256:{},endpoints:[endpoint],
  models:['simulated'],maxRequestBytes:1000,maxOutputTokens:10,requestBodySha256:[digest(request.body)],...changes};
 const file=join(directory,'allowance.json');await writeFile(file,JSON.stringify(allowance));
 return {file,guard:await openGuard(file,transport),directory};
}
test('missing allowance fails without transport',async()=>{
 let calls=0;await assert.rejects(openGuard('/nonexistent/allowance',async()=>{calls++;return new Response();}));
 assert.equal(calls,0);
});
test('unknown timeout survives restart; no fallback or retry',async()=>{
 let calls=0;const transport:typeof fetch=async()=>{calls++;throw new Error('simulated timeout');};
 const {file,guard}=await fixture(transport);
 await assert.rejects(guard.fetch(endpoint,request));
 const restarted=await openGuard(file,transport);
 await assert.rejects(restarted.fetch(endpoint,request));assert.equal(calls,1);
});
test('pending/crashed request blocks concurrent process-equivalent guard',async()=>{
 let calls=0;const transport:typeof fetch=async()=>{calls++;return new Promise(()=>{});};
 const {file,guard}=await fixture(transport);
 void guard.fetch(endpoint,request);
 // Wait for durable reservation, not an arbitrary transport timing.
 for(let i=0;i<200;i++){
  if(calls===1 && (await readdir(guard.ledgerDirectory)).some(n=>n.endsWith('.reservation.json')))break;
  await new Promise(r=>setTimeout(r,5));
 }
 const other=await openGuard(file,transport);
 await assert.rejects(other.fetch(endpoint,request));assert.equal(calls,1);
});
test('immutable billing proof allows remaining budget only, full reserve never refunded',async()=>{
 let calls=0;const transport:typeof fetch=async()=>{calls++;return new Response('{}');};
 const {file,guard}=await fixture(transport,10);
 await guard.fetch(endpoint,request);
 const name=(await readdir(guard.ledgerDirectory)).find(n=>n.endsWith('.reservation.json'))!;
 const entry=JSON.parse(await readFile(join(guard.ledgerDirectory,name),'utf8'));
 const proof='simulated billing evidence';
 await writeFile(join(guard.ledgerDirectory,`${entry.id}.billing-evidence`),proof,{flag:'wx',mode:0o600});
 await writeFile(join(guard.ledgerDirectory,`${entry.id}.reconciled.json`),JSON.stringify({
  reservationId:entry.id,allowanceSha256:digest(await readFile(file)),chargedAtMostMicrousd:10,
  reviewedBy:'test operator',providerEvidenceSha256:digest(proof)}),{flag:'wx',mode:0o600});
 await assert.rejects(guard.fetch(endpoint,request));assert.equal(calls,1);
});
test('unapproved network and metadata never spend',async()=>{
 let calls=0;const {guard}=await fixture(async()=>{calls++;return new Response();});
 await assert.rejects(guard.fetch('https://crm.example/send',request));
 await assert.rejects(guard.fetch('https://api.anthropic.com/v1/models',{method:'GET'}));
 assert.equal(calls,0);
 assert.equal((await readdir(guard.ledgerDirectory)).filter(n=>n.endsWith('.reservation.json')).length,0);
});
test('successful response still unresolved without billing evidence',async()=>{
 let calls=0;const {guard}=await fixture(async()=>{calls++;return new Response('{}');});
 await guard.fetch(endpoint,request);
 await assert.rejects(guard.fetch(endpoint,request));assert.equal(calls,1);
});
test('crash transaction lock never auto-resets on restart',async()=>{
 let calls=0;const transport:typeof fetch=async()=>{calls++;return new Response('{}');};
 const {file,guard}=await fixture(transport);
 await mkdir(join(guard.ledgerDirectory,'LOCK'));
 await assert.rejects(openGuard(file,transport));assert.equal(calls,0);
});
test('reconciled request permits exactly the remaining reservation',async()=>{
 let calls=0;const transport:typeof fetch=async()=>{calls++;return new Response('{}');};
 const {file,guard}=await fixture(transport,20);
 await guard.fetch(endpoint,request);
 const name=(await readdir(guard.ledgerDirectory)).find(n=>n.endsWith('.reservation.json'))!;
 const entry=JSON.parse(await readFile(join(guard.ledgerDirectory,name),'utf8'));
 const proof='simulated reviewed provider invoice';
 await writeFile(join(guard.ledgerDirectory,`${entry.id}.billing-evidence`),proof,{flag:'wx',mode:0o600});
 await writeFile(join(guard.ledgerDirectory,`${entry.id}.reconciled.json`),JSON.stringify({
  reservationId:entry.id,allowanceSha256:digest(await readFile(file)),chargedAtMostMicrousd:10,
  reviewedBy:'test operator',providerEvidenceSha256:digest(proof)}),{flag:'wx',mode:0o600});
 const restarted=await openGuard(file,transport);
 await restarted.fetch(endpoint,request);
 await assert.rejects(restarted.fetch(endpoint,request));
 assert.equal(calls,2);
});
test('arbitrary allowance host cannot receive transport',async()=>{
 let calls=0;
 await assert.rejects(fixture(async()=>{calls++;return new Response();},20,{endpoints:['https://exfil.example/v1/messages']}));
 assert.equal(calls,0);
});
test('managed endpoint eligible only when selected by runtime integration pair',()=>{
 const base='https://managed.example/provider/v1';
 assert.ok(!eligibleGenerationEndpoints({AI_INTEGRATIONS_OPENAI_BASE_URL:base}).includes(base+'/responses'));
 assert.ok(eligibleGenerationEndpoints({AI_INTEGRATIONS_OPENAI_BASE_URL:base,AI_INTEGRATIONS_OPENAI_API_KEY:'simulated'}).includes(base+'/responses'));
});
test('endpoint-specific token fields reject alternates, missing and duplicate keys',async()=>{
 for(const body of [
  '{"model":"simulated","max_output_tokens":10}',
  '{"model":"simulated","max_tokens":10,"max_output_tokens":1}',
  '{"model":"simulated","max_tokens":10,"max_tokens":1}',
  '{"model":"simulated"}'
 ]){
  let calls=0;const {guard}=await fixture(async()=>{calls++;return new Response();},20,{requestBodySha256:[digest(body)]});
  await assert.rejects(guard.fetch(endpoint,{method:'POST',body}));assert.equal(calls,0);
 }
});
test('OpenAI exact output field enforced even for pinned contract',async()=>{
 const url='https://api.openai.com/v1/responses';
 const body=JSON.stringify({model:'simulated',max_tokens:10});
 const {guard}=await fixture(async()=>{assert.fail('transport must not run');},20,{endpoints:[url],requestBodySha256:[digest(body)]});
 await assert.rejects(guard.fetch(url,{method:'POST',body}));
});
test('unreviewed tool budgets, service tiers, unknown fields and inputs cannot spend',async()=>{
 let calls=0;const {guard}=await fixture(async()=>{calls++;return new Response();});
 for(const extra of [{tools:[{type:'web_search',max_uses:100}]},{service_tier:'priority'},{future_paid_option:true},{messages:[{role:'user',content:'changed'}]}]){
  await assert.rejects(guard.fetch(endpoint,{method:'POST',body:JSON.stringify({...JSON.parse(request.body),...extra})}));
 }
 assert.equal(calls,0);
});
test('source audit rejects traversal and file/directory symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'source-audit-'));
 const inside=join(root,'inside');await mkdir(inside);
 const file=join(inside,'source.ts');await writeFile(file,'export {};');
 assert.equal(await canonicalSourcePath(inside,file),file);
 await assert.rejects(canonicalSourcePath(inside,join(root,'outside.ts')));
 await symlink(file,join(inside,'link.ts'));
 await assert.rejects(canonicalSourcePath(inside,join(inside,'link.ts')));
 await symlink(inside,join(root,'linked-directory'));
 await assert.rejects(canonicalSourcePath(root,join(root,'linked-directory','source.ts')));
});
test('malformed allowance, body and corrupt ledger produce controlled errors',async()=>{
 const {file,guard}=await fixture(async()=>new Response('{}'));
 await assert.rejects(guard.fetch(endpoint,{method:'POST',body:'{"secret":'}),/Live qualification blocked/);
 await writeFile(file,'{"sensitive":');
 await assert.rejects(openGuard(file,async()=>new Response()),/Live qualification blocked/);
 const fresh=await fixture(async()=>{assert.fail('corrupt ledger must not dispatch');});
 await writeFile(join(fresh.guard.ledgerDirectory,'00000000-0000-0000-0000-000000000000.reservation.json'),'{"sensitive":',{mode:0o600});
 await assert.rejects(fresh.guard.fetch(endpoint,request),/Live qualification blocked/);
});
test('new ledger directory and all output files have private modes',async()=>{
 const {guard}=await fixture(async()=>new Response('{}'));
 await guard.fetch(endpoint,request);
 assert.equal((await stat(guard.ledgerDirectory)).mode&0o777,0o700);
 for(const name of await readdir(guard.ledgerDirectory)){
  assert.equal((await stat(join(guard.ledgerDirectory,name))).mode&0o777,0o600);
 }
});
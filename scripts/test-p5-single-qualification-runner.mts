import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {prepare,prepareAudit,runStage,MODEL,MAX_OUTPUT_TOKENS} from './lib/singleQualificationRunner.mts';

const approved='.local/qualification/authorized-mapping-20260919/configuration.json';
const mapping={tasks:[{id:'base-moulding-labor',description:'Building Alpha / first floor / Install 100 LF of owner-supplied paint-grade interior base moulding, including normal fitting, cutting, fastening, and joints; labor only.',evidence:'Explicit reviewed scope: 100 LF of first-floor base-moulding installation labor; owner supplies materials.',existingLineIds:[],additions:[{code:'03-18-02-L',quantity:100,quantityEvidence:'100 LF explicitly reviewed installation quantity',quantityRange:null}],researchDescription:'',issues:[]}],issues:[],notes:[],replacements:[],removeExclusions:[]};
const audit={coveredTaskIds:['base-moulding-labor'],issues:[],notes:[],resolvedIssues:[]};
function provider(value:any,model=MODEL,status='completed',usage={input_tokens:2000,output_tokens:500,total_tokens:2500},httpStatus=200){return new Response(JSON.stringify({status,model,service_tier:'default',usage,output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]}),{status:httpStatus});}
async function fixture(){
 const dir=await mkdtemp(join(tmpdir(),'qualification-v2-')),configuration=join(dir,'configuration.json'),manifest=join(dir,'mapping.json'),auditManifest=join(dir,'audit.json'),ledger=join(dir,'ledger');
 await writeFile(configuration,await readFile(approved),{mode:0o600});
 const saved={model:process.env.P5_SCOPE_OPENAI_MODEL,pricing:process.env.P5_PRICING_OPENAI_MODEL,key:process.env.AI_INTEGRATIONS_OPENAI_API_KEY,base:process.env.AI_INTEGRATIONS_OPENAI_BASE_URL};
 process.env.P5_SCOPE_OPENAI_MODEL=MODEL;delete process.env.P5_PRICING_OPENAI_MODEL;delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
 const prepared=await prepare(configuration,manifest,ledger);
 const restore=()=>{for(const [k,v] of [['P5_SCOPE_OPENAI_MODEL',saved.model],['P5_PRICING_OPENAI_MODEL',saved.pricing],['AI_INTEGRATIONS_OPENAI_API_KEY',saved.key],['AI_INTEGRATIONS_OPENAI_BASE_URL',saved.base]] as const)if(v===undefined)delete process.env[k];else process.env[k]=v;};
 return {dir,manifest,auditManifest,ledger,prepared,restore};
}
test('prepares supported new-construction mapping without reserving spend',async()=>{const f=await fixture();try{assert.equal(f.prepared.scope.answers.service,'new-construction');assert.match(f.prepared.scope.text,/100 linear feet/);assert.ok(f.prepared.stages.mapping.ceilingMicrousd<1_000_000);assert.deepEqual(await readdir(f.ledger).catch(()=>[]),[]);assert.equal((await stat(f.manifest)).mode&0o777,0o600);}finally{f.restore();}});
test('mapping then pinned audit complete one scenario under total cap',async()=>{
 const f=await fixture();let calls=0;try{
  await runStage(f.manifest,'mapping',async(_input,init)=>{calls++;const body=JSON.parse(String(init?.body));assert.equal(body.max_output_tokens,MAX_OUTPUT_TOKENS);assert.equal(body.service_tier,'default');assert.ok(!body.tools);return provider(mapping);},f.ledger);
  const audited=await prepareAudit(f.manifest,f.auditManifest,f.ledger);assert.ok(audited.stages.mapping.ceilingMicrousd+audited.stages.audit!.ceilingMicrousd<=1_000_000);
  const result=await runStage(f.auditManifest,'audit',async(_input,init)=>{calls++;const body=JSON.parse(String(init?.body));assert.ok(!body.tools);return provider(audit);},f.ledger);
  assert.equal(calls,2);assert.ok(result.result?.customer.range);assert.ok('outputFile' in result);assert.equal((await stat((result as any).outputFile)).mode&0o777,0o600);
  await assert.rejects(runStage(f.auditManifest,'audit',async()=>{calls++;return provider(audit);},f.ledger));assert.equal(calls,2);
 }finally{f.restore();}
});
test('unknown or mismatched mapping permanently blocks reuse and audit preparation',async()=>{
 const f=await fixture();let calls=0;try{
  await assert.rejects(runStage(f.manifest,'mapping',async()=>{calls++;return provider(mapping,'wrong-model');},f.ledger));
  await assert.rejects(runStage(f.manifest,'mapping',async()=>{calls++;return provider(mapping);},f.ledger));
  await assert.rejects(prepareAudit(f.manifest,f.auditManifest,f.ledger));assert.equal(calls,1);
  assert.ok((await readdir(f.ledger)).includes('LOCK'));assert.ok((await readdir(f.ledger)).includes('mapping.reservation.json'));
 }finally{f.restore();}
});
test('unknown transport, HTTP failure, malformed/not-completed response, and usage overshoot each block permanently',async()=>{
 const variants=[
  async()=>{throw new Error('timeout');},
  async()=>provider(mapping,MODEL,'completed',{input_tokens:1,output_tokens:1,total_tokens:2},500),
  async()=>new Response('{bad json'),
  async()=>provider(mapping,MODEL,'incomplete'),
  async()=>provider(mapping,MODEL,'completed',{input_tokens:999999,output_tokens:1,total_tokens:1000000}),
 ];
 for(const transport of variants){const f=await fixture();let calls=0;try{
  await assert.rejects(runStage(f.manifest,'mapping',async()=>{calls++;return transport();},f.ledger));
  await assert.rejects(runStage(f.manifest,'mapping',async()=>{calls++;return provider(mapping);},f.ledger));
  assert.equal(calls,1);assert.ok((await readdir(f.ledger)).includes('LOCK'));
 }finally{f.restore();}}
});
test('concurrent admission and copied/edited manifests cannot reset the canonical authorization ledger or cap',async()=>{
 const f=await fixture();let calls=0,release!:(value:Response)=>void;try{
  const pending=runStage(f.manifest,'mapping',async()=>{calls++;return new Promise<Response>(resolve=>{release=resolve;});},f.ledger);
  for(let i=0;i<100&&!((await readdir(f.ledger).catch(()=>[])).includes('mapping.reservation.json'));i++)await new Promise(r=>setTimeout(r,2));
  const copy=join(f.dir,'copy.json');await writeFile(copy,await readFile(f.manifest),{mode:0o600});
  await assert.rejects(runStage(copy,'mapping',async()=>{calls++;return provider(mapping);},f.ledger));assert.equal(calls,1);
  release(provider(mapping));await pending;
  const auditManifest=join(f.dir,'audit-cap.json'),prepared=await prepareAudit(copy,auditManifest,f.ledger);
  const edited={...prepared,ledgerDirectory:join(f.dir,'fresh-ledger')},editedFile=join(f.dir,'edited-ledger.json');await writeFile(editedFile,JSON.stringify(edited),{mode:0o600});
  await assert.rejects(runStage(editedFile,'audit',async()=>{calls++;return provider(audit);},f.ledger));assert.equal(calls,1);
  prepared.stages.audit!.ceilingMicrousd=1_000_000;const overCap=join(f.dir,'over-cap.json');await writeFile(overCap,JSON.stringify(prepared),{mode:0o600});
  await assert.rejects(runStage(overCap,'audit',async()=>{calls++;return provider(audit);},f.ledger));assert.equal(calls,1);
 }finally{f.restore();}
});
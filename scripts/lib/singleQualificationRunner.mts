import assert from 'node:assert/strict';
import {readFile,open,mkdir,realpath,lstat} from 'node:fs/promises';
import {dirname,relative,resolve,join} from 'node:path';
import {digest} from './livePricingGuard.mts';
import {stageFetch,readStageResponse,sealFinalOutput,type Stage,type StageContract} from './singleScenarioLedger.mts';
import type {EstimatorConfiguration} from '../../lib/p5/costBook.ts';
import type {ReviewedScope} from '../../lib/p5/scope.ts';

export const MODEL='gpt-5.6-sol',MAX_OUTPUT_TOKENS=4096;
const INPUT_RATE=6.875,OUTPUT_RATE=33,FRAMING_TOKENS=1024,TOTAL_CAP=1_000_000;
export const CANONICAL_LEDGER=resolve('.local/qualification/authorized-mapping-20260919/scenario-ledger');
const SOURCE_ROOTS=['lib/p5/scopePricing.ts','scripts/lib/singleQualificationRunner.mts','scripts/lib/singleScenarioLedger.mts','scripts/run-p5-single-qualification.mts'];
type Inventory={tasks:{id:string;description:string;evidence:string}[];issues:string[];notes:string[]};
export interface Manifest {version:2;configurationFile:string;configurationSha256:string;scope:ReviewedScope;approvedInventory:Inventory;ledgerDirectory:string;model:typeof MODEL;serviceTier:'default';sourceSha256:Record<string,string>;stages:{mapping:StageContract;audit?:StageContract}}
const scenario=()=>{
 const scope:ReviewedScope={text:'Install 100 linear feet of owner-supplied paint-grade interior base moulding on the first floor of Building Alpha. Installation labor only, including normal fitting, cutting, fastening, and joints.',answers:{service:'new-construction',location:'Boise, Idaho',estimatingInstructions:'Price only 100 linear feet of first-floor base-moulding installation labor in Building Alpha. Owner supplies all materials. Exclude painting, material purchases, demolition, disposal, electrical, plumbing, and all other work.'},extraction:null,uploads:[],reviewedAt:'2026-09-19T00:00:00.000Z',corrections:[]};
 const approvedInventory:Inventory={tasks:[{id:'base-moulding-labor',description:'Building Alpha / first floor / Install 100 LF of owner-supplied paint-grade interior base moulding, including normal fitting, cutting, fastening, and joints; labor only.',evidence:'Explicit reviewed scope: 100 LF of first-floor base-moulding installation labor; owner supplies materials.'}],issues:[],notes:['Inventory is an explicit reviewed fixture, not a live model response.']};
 return {scope,approvedInventory};
};
const privateWrite=async(file:string,value:unknown)=>{await mkdir(dirname(file),{recursive:true,mode:0o700});const fd=await open(file,'wx',0o600);try{await fd.writeFile(JSON.stringify(value,null,2));await fd.sync();}finally{await fd.close();}const d=await open(dirname(file),'r');try{await d.sync();}finally{await d.close();}};
async function sources(){const found=new Set<string>(['package-lock.json']);const visit=async(file:string)=>{file=relative(process.cwd(),resolve(file));if(found.has(file))return;found.add(file);const source=await readFile(file,'utf8');for(const m of source.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)){let next=resolve(dirname(file),m[1]);if(!/\.[cm]?[jt]sx?$/.test(next))next+='.ts';await visit(next);}};for(const root of SOURCE_ROOTS)await visit(root);return Object.fromEntries(await Promise.all([...found].sort().map(async f=>[f,digest(await readFile(f))])));}
const parseProvider=(bytes:Uint8Array)=>{const body=JSON.parse(Buffer.from(bytes).toString());assert.equal(body.status,'completed');assert.equal(body.model,MODEL);assert.equal(body.service_tier,'default');const usage=body.usage;assert.ok(Number.isSafeInteger(usage?.input_tokens)&&usage.input_tokens>=0);assert.ok(Number.isSafeInteger(usage?.output_tokens)&&usage.output_tokens>=0&&usage.output_tokens<=MAX_OUTPUT_TOKENS);assert.equal(usage.total_tokens,usage.input_tokens+usage.output_tokens);const text=(body.output||[]).flatMap((o:any)=>o.content||[]).filter((p:any)=>p.type==='output_text').map((p:any)=>p.text).join('\n');return {body,usage,value:JSON.parse(text)};};
const mappingValue=(inventory:Inventory)=>({tasks:inventory.tasks.map(t=>({...t,existingLineIds:[],additions:[{code:'03-18-02-L',quantity:100,quantityEvidence:'100 LF explicitly reviewed installation quantity',quantityRange:null}],researchDescription:'',issues:[]})),issues:[],notes:[],replacements:[],removeExclusions:[]});
const auditValue={coveredTaskIds:['base-moulding-labor'],issues:[],notes:[],resolvedIssues:[]};
function fakeResponse(value:unknown){return new Response(JSON.stringify({status:'completed',model:MODEL,service_tier:'default',usage:{input_tokens:1,output_tokens:1,total_tokens:2},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]}),{status:200});}
function validateConfiguration(c:any):asserts c is EstimatorConfiguration{assert.ok(c?.finance&&Array.isArray(c.costBooks)&&c.costBooks.length&&c.planningCatalog?.rates?.some((r:any)=>r.code==='03-18-02-L'));}
async function execute(manifest:Manifest,stage:Stage,transport:typeof fetch,replayMapping?:unknown){
 assert.equal(process.env.P5_SCOPE_OPENAI_MODEL,MODEL);assert.ok(!process.env.P5_PRICING_OPENAI_MODEL);
 const configuration=JSON.parse(await readFile(manifest.configurationFile,'utf8'));validateConfiguration(configuration);
 const {priceCompleteScope,requestPricing}=await import('../../lib/p5/scopePricing.ts');let providerCalls=0;
 const request=async(instructions:string,input:unknown,search:boolean,remaining:number)=>{
  if(input&&typeof input==='object'&&Object.hasOwn(input,'priorTaskDescriptions'))return {value:manifest.approvedInventory,sourceUrls:[]};
  if(stage==='audit'&&providerCalls++===0)return {value:replayMapping,sourceUrls:[]};
  if(stage==='mapping'&&providerCalls++===0){assert.equal(search,false);return requestPricing(instructions,input,false,remaining,{provider:'openai',noFallback:true,toolFree:true,maxOutputTokens:MAX_OUTPUT_TOKENS,serviceTier:'default'});}
  if(stage==='audit'&&providerCalls===2){assert.equal(search,false);return requestPricing(instructions,input,false,remaining,{provider:'openai',noFallback:true,toolFree:true,maxOutputTokens:MAX_OUTPUT_TOKENS,serviceTier:'default'});}
  throw new Error('single-scenario-stage-limit');
 };
 const oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY,oldBase=process.env.OPENAI_BASE_URL;if(oldKey===undefined)process.env.OPENAI_API_KEY='qualification-transport-key';delete process.env.OPENAI_BASE_URL;globalThis.fetch=transport;
 try{return await priceCompleteScope(manifest.scope,configuration,request,new Date(manifest.scope.reviewedAt));}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;if(oldBase===undefined)delete process.env.OPENAI_BASE_URL;else process.env.OPENAI_BASE_URL=oldBase;}
}
async function capture(manifest:Manifest,stage:Stage,replay?:unknown){
 let body='',endpoint='';await execute(manifest,stage,async(input,init)=>{assert.equal(body,'');endpoint=String(input);body=String(init?.body);return fakeResponse(stage==='mapping'?mappingValue(manifest.approvedInventory):auditValue);},replay);
 assert.ok(body&&endpoint);const bytes=Buffer.byteLength(body),inputCeiling=bytes+FRAMING_TOKENS,ceiling=Math.ceil(inputCeiling*INPUT_RATE+MAX_OUTPUT_TOKENS*OUTPUT_RATE);
 return {stage,endpoint,requestSha256:digest(body),requestBytes:bytes,ceilingMicrousd:ceiling,model:MODEL,serviceTier:'default' as const,maxOutputTokens:MAX_OUTPUT_TOKENS};
}
export async function prepare(configurationFile:string,manifestFile:string,authorizationLedger=CANONICAL_LEDGER){
 const configurationPath=resolve(configurationFile),raw=await readFile(configurationPath);validateConfiguration(JSON.parse(raw.toString()));assert.equal((await lstat(configurationPath)).mode&0o077,0);assert.equal(await realpath(configurationPath),configurationPath);
 const base:Manifest={version:2,configurationFile:configurationPath,configurationSha256:digest(raw),...scenario(),ledgerDirectory:resolve(authorizationLedger),model:MODEL,serviceTier:'default',sourceSha256:await sources(),stages:{} as any};
 base.stages.mapping=await capture(base,'mapping');assert.ok(base.stages.mapping.ceilingMicrousd<=TOTAL_CAP);await privateWrite(resolve(manifestFile),base);return base;
}
export async function prepareAudit(manifestFile:string,auditManifestFile:string,authorizationLedger=CANONICAL_LEDGER){
 const manifest=JSON.parse(await readFile(resolve(manifestFile),'utf8')) as Manifest;await verify(manifest,authorizationLedger);
 const mapping=parseProvider(await readStageResponse(manifest.ledgerDirectory,'mapping')).value;
 assert.deepEqual(Object.keys(mapping).sort(),['issues','notes','removeExclusions','replacements','tasks']);assert.equal(mapping.tasks?.length,1);assert.equal(mapping.tasks[0].id,'base-moulding-labor');assert.equal(mapping.tasks[0].researchDescription,'');assert.ok(mapping.tasks[0].additions?.some((a:any)=>a.code==='03-18-02-L'&&a.quantity===100));
 const next=structuredClone(manifest);next.stages.audit=await capture(next,'audit',mapping);assert.ok(next.stages.mapping.ceilingMicrousd+next.stages.audit.ceilingMicrousd<=TOTAL_CAP);await privateWrite(resolve(auditManifestFile),next);return next;
}
async function verify(m:Manifest,authorizationLedger=CANONICAL_LEDGER){assert.equal(m.version,2);assert.equal(m.model,MODEL);assert.equal(resolve(m.ledgerDirectory),resolve(authorizationLedger));assert.equal(digest(await readFile(m.configurationFile)),m.configurationSha256);assert.deepEqual(await sources(),m.sourceSha256);}
export async function runStage(manifestFile:string,stage:Stage,transport:typeof fetch=globalThis.fetch,authorizationLedger=CANONICAL_LEDGER){
 const manifest=JSON.parse(await readFile(resolve(manifestFile),'utf8')) as Manifest;await verify(manifest,authorizationLedger);const contract=manifest.stages[stage];assert.ok(contract);const inputCeiling=contract.requestBytes+FRAMING_TOKENS;
 let accepted=false;const guarded=await stageFetch(manifest.ledgerDirectory,contract,transport,bytes=>{const parsed=parseProvider(bytes);assert.ok(parsed.usage.input_tokens<=inputCeiling);const accounted=Math.ceil(parsed.usage.input_tokens*INPUT_RATE+parsed.usage.output_tokens*OUTPUT_RATE);accepted=true;return {usage:parsed.usage,accountedMicrousd:accounted};},async()=>{await verify(manifest,authorizationLedger);assert.deepEqual(manifest.stages[stage],contract);});
 const replay=stage==='audit'?parseProvider(await readStageResponse(manifest.ledgerDirectory,'mapping')).value:undefined;const result=await execute(manifest,stage,guarded,replay);assert.ok(accepted);
 if(stage==='mapping')return {stage,result:null,status:'Mapping response saved and verified; prepare the pinned audit request before the second dispatch.'};
 const internal=result.internal as any,scopePricing=internal.scopePricing;assert.ok(scopePricing?.verification,'Mandatory coverage audit did not complete');
 if(Object.hasOwn(scopePricing,'completeScopeVerified'))assert.equal(scopePricing.completeScopeVerified,true,'Complete-scope verification was false');
 assert.deepEqual(scopePricing.verification.coveredTaskIds,['base-moulding-labor']);assert.deepEqual(scopePricing.verification.issues,[]);assert.ok(result.customer.range,'Verified qualification did not produce a range');
 assert.equal(internal.lines?.length,1,'Qualification must contain exactly one priced line');const line=internal.lines[0];assert.equal(line.quantity,100);assert.equal(line.unit,'LF');assert.equal(line.category,'field-labor');assert.match(line.description,/trim|mould/i);
 const safeStages=Object.fromEntries(Object.entries(manifest.stages).map(([name,value])=>[name,{stage:value.stage,requestSha256:value.requestSha256,requestBytes:value.requestBytes,ceilingMicrousd:value.ceilingMicrousd,model:value.model,serviceTier:value.serviceTier,maxOutputTokens:value.maxOutputTokens,transport:'configured-managed'}]));
 const output={scope:manifest.scope,configuration:JSON.parse(await readFile(manifest.configurationFile,'utf8')),result,requestMetadata:safeStages,responseMetadata:{mapping:JSON.parse(await readFile(join(manifest.ledgerDirectory,'mapping.completed.json'),'utf8')),audit:JSON.parse(await readFile(join(manifest.ledgerDirectory,'audit.completed.json'),'utf8'))},qualification:{inventory:'explicit reviewed fixture; not live',complete:true,scopeVerification:'actual',invoice:false}};
 const outputFile=resolve(`${manifestFile}.result.json`);await privateWrite(outputFile,output);const outputBytes=await readFile(outputFile);await sealFinalOutput(manifest.ledgerDirectory,outputFile,outputBytes);return {stage,result,outputFile};
}
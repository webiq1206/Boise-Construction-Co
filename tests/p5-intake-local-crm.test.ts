/**
 * This site's half of "the document estimator's leads reach P5" (owner decisions, 13, 17 and 18
 * November 2026). Brand-owned: it runs this site's own wiring, the two files the shared engine leaves
 * to each brand (lib/p5/intakeDeliveryRuntime.ts and lib/p5/deliveryAdapter.ts).
 *
 *  1. A visitor's unpriced PROJECT REQUEST: the runtime's `crm` channel is the shared P5 lead
 *     transport, off (`crm-disabled`) without `P5_CRM_DELIVERY=on`.
 *  2. The ESTIMATE the team publishes: `syncCrm()` posts it to P5's lead intake with customer amounts
 *     only, and throws when P5 does not accept it.
 *
 * FAKE FETCH ONLY. Nothing here reaches p5homeco.com, the old lead dashboard, a database or a mailbox:
 * every post is answered by a function in this file, and a call to any other address fails the test.
 * The shared builders themselves are held by tests/p5-lead-intake.test.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateIntakeLocalCrm} from '../lib/p5/intakeCrmValidation.ts';
import {runtimeIntakeTransports} from '../lib/p5/intakeDeliveryRuntime.ts';
import {syncCrm} from '../lib/p5/deliveryAdapter.ts';
import {P5_INTAKE_URL,P5_LEAD_RETRY_WINDOW_MS,p5LeadIntakeTransport,projectLeadKey} from '../lib/p5/p5LeadIntake.ts';
import {intakeDeliveryEnvelope} from '../lib/p5/intakeDeliveryPayload.ts';
import {emptyIntakeDetails,type IntakeSnapshot} from '../lib/p5/intakeContract.ts';
import {INTAKE_SITES,intakeSite,routeIntake} from '../lib/p5/intakePolicy.ts';
import {COST_CATEGORIES,calculateP5Estimate,customerEstimate,type FinancePolicy,type PricingInput,type Service} from '../lib/p5/pricing.ts';
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';

const site=intakeSite(ESTIMATOR_BRAND.id);
assert.ok(site&&site!=='p5','This brand is a specialty intake site');
const BRAND=INTAKE_SITES[site].name,DOMAIN=INTAKE_SITES[site].domain;
assert.equal(BRAND,'Boise Construction Co');
assert.equal(ESTIMATOR_BRAND.name,BRAND,'the adapter names this brand exactly as the P5 intake expects it');

const DRAFT='12345678-1234-4234-8234-123456789abc',DIGEST='a'.repeat(64);
const INTERNAL_WORD=/cost|margin|mark-?up|profit|overhead|contingenc/i;
const round2=(value:number)=>Math.round(value*100)/100;
const read=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

type Call={url:string;init:RequestInit};
const accepted=(body:unknown={ok:true,accepted:true,alert:'none'},status=201)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function fakeFetch(answer:(call:Call)=>Response|Promise<Response>=()=>accepted()){
 const calls:Call[]=[];
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{const call={url:String(input),init:init||{}};calls.push(call);return answer(call);}) as typeof fetch;
 return {calls,fetcher};
}
const sentBody=(call:Call)=>JSON.parse(String(call.init.body)) as Record<string,any>;
const ENV_KEYS=['P5_CRM_DELIVERY','P5_REQUEST_LEADS_SINCE','P5_CANONICAL_REVIEW_TOKEN','LEAD_DASHBOARD_KEY','LEAD_DASHBOARD_API_URL','SYNTHETIC_QA_EMAIL_ALLOWLIST'];
/** Run with exactly these settings and this global fetch, and put everything back afterwards. */
async function withSite<T>(env:Record<string,string>,fetcher:typeof fetch,run:()=>Promise<T>):Promise<T>{
 const before=ENV_KEYS.map(key=>process.env[key]),oldFetch=globalThis.fetch;
 for(const key of ENV_KEYS)delete process.env[key];
 Object.assign(process.env,env);globalThis.fetch=fetcher;
 try{return await run();}
 finally{globalThis.fetch=oldFetch;ENV_KEYS.forEach((key,index)=>{if(before[index]===undefined)delete process.env[key];else process.env[key]=before[index];});}
}
/** A global fetch that fails the test: for paths that must not touch the network at all. */
const noNetwork=(async()=>{throw new Error('unexpected network call');}) as typeof fetch;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A request taken on this site. `savedAt` is after the lead system began taking requests. */
function request(service:string,extra:Record<string,unknown>={}):IntakeSnapshot{
 return {schema:1,projectId:`${site}:${DRAFT}`,reference:'BCC-4F7K2Q',originSite:site,currentSite:site,draftId:DRAFT,revision:1,contextVersion:0,savedAt:'2099-01-02T12:00:00.000Z',
  contact:{name:'Fictional Person',email:'customer@example.invalid',phone:'2085550142',preferredContact:'phone'},
  details:{...emptyIntakeDetails(),desiredOutcome:'Fictional outcome',workContext:'Fictional existing home'},
  scope:{text:'Fictional whole scope',answers:{service,address:'123 N Main St',location:'Boise'},extraction:null,
   uploads:[{id:'11111111-1111-4111-8111-111111111111',name:'private-plan-name.pdf',type:'application/pdf',size:1234,sha256:'c'.repeat(64),status:'stored'}]},
  routing:routeIntake(site!,service),unresolved:[],...extra} as unknown as IntakeSnapshot;
}
const envelope=(s:IntakeSnapshot,channel:'crm'|'team'='crm')=>intakeDeliveryEnvelope(s,channel,DIGEST);

const finance:FinancePolicy={annualOverhead:420000,annualRevenue:6000000,forecastSource:'TEST FIXTURE ONLY: conservative forecast',reviewedAt:'2026-09-10',approvedBy:['Nick']};
const ADDITION=[
 {description:'Foundation and slab for the addition',quantity:1,unit:'LS',unitCost:18873.37,trade:'Concrete'},
 {description:'Frame walls and roof',quantity:420,unit:'SF',unitCost:41.19,trade:'Framing'},
 {description:'Roofing to match the existing house',quantity:6.5,unit:'SQ',unitCost:688.83,trade:'Roofing'},
 {description:'Rough and finish electrical',quantity:1,unit:'LS',unitCost:9944.61,trade:'Electrical'},
 {description:'Interior finishes',quantity:420,unit:'SF',unitCost:27.13},
];
/** A published estimate as the estimator builds one: the real pricing engine, then the real customer view. */
function published(service:Service='addition',extra:Record<string,unknown>={}){
 const input:PricingInput={service,revision:'fixture-revision-1',scopeSummary:'Fixture project scope',uncertainty:'low',locationProvided:true,
  lines:ADDITION.map((line,index)=>({id:`line-${index+1}`,category:'subcontractors',description:line.description,unit:line.unit,quantity:line.quantity,unitCost:line.unitCost,
   ...(line.trade?{trade:line.trade as never}:{}),quantitySource:'TEST signed scope',evidence:{basis:'written-quote',reference:'TEST quote',verifiedAt:'2026-09-01',validUntil:'2026-10-01'}})),
  coverage:COST_CATEGORIES.map(category=>({category,status:category==='subcontractors'?'included':'not-applicable',reason:'TEST ONLY: reviewed fixture coverage'})),
  risks:[],assumptions:[],exclusions:[],missingInformation:[],allowances:[]};
 const internal=calculateP5Estimate(input,finance,[],new Date('2026-09-10T12:00:00Z'));
 const customer=customerEstimate(internal,'Fixture scope summary for the customer');
 return {draftId:DRAFT,revision:2,projectId:`${site}:${DRAFT}`,brand:BRAND,estimator:'p5-policy',
  contact:{name:'Fictional Person',email:'customer@example.invalid',phone:'(208) 555-0142'},
  scope:{text:'Fixture scope',answers:{service,address:'123 N Main St',location:'Boise'}},internal,customer,...extra};
}
/** Every number an internal estimate holds that the customer, and so P5 and QuickBooks, must never be sent. */
function internalFigures(internal:unknown):number[]{
 const values:number[]=[];
 const walk=(value:unknown,key:string)=>{
  if(typeof value==='number'){if(INTERNAL_WORD.test(key)||/riskAdjusted|divisor|allocation/i.test(key))values.push(round2(value));return;}
  if(Array.isArray(value)){for(const item of value)walk(item,key);return;}
  if(value&&typeof value==='object')for(const [name,item] of Object.entries(value))walk(item,INTERNAL_WORD.test(key)||/allocation/i.test(key)?key:name);
 };
 walk(internal,'');
 return values.filter(value=>value>1);
}
const numbersIn=(value:unknown):number[]=>typeof value==='number'?[round2(value)]:Array.isArray(value)?value.flatMap(numbersIn):value&&typeof value==='object'?Object.values(value).flatMap(numbersIn):[];

// ---------------------------------------------------------------------------
// 1. The visitor's project request
// ---------------------------------------------------------------------------

test('the local check is the P5 lead transport\'s own: what may be posted, and what is held before any send',()=>{
 assert.equal(validateIntakeLocalCrm(envelope(request('addition'))),null);
 assert.equal(validateIntakeLocalCrm(envelope(request('addition',{contact:{name:'Fictional Phone Person',email:'',phone:'2085550100',preferredContact:'phone'}}))),null);
 // Held: another channel's envelope, an envelope that is not this request, nobody to reach, a synthetic request.
 assert.equal(validateIntakeLocalCrm(envelope(request('addition'),'team')),'payload-review');
 assert.equal(validateIntakeLocalCrm({...envelope(request('addition')),leadKey:'p5-intake-'+'0'.repeat(64)}),'payload-review');
 assert.equal(validateIntakeLocalCrm(envelope(request('addition',{projectId:`${site}:not-a-project`}))),'payload-review');
 assert.equal(validateIntakeLocalCrm(envelope(request('addition',{contact:{name:'Fictional Person',email:'',phone:'',preferredContact:'either'}}))),'contact-review');
 // A synthetic request is never a lead, whatever mailbox it names: there is no allowlist that lets one through.
 const qa=request('addition',{contact:{name:'[QA] Fictional Person',email:'fictional@unapproved.invalid',phone:'',preferredContact:'email'}});
 const previous=process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST;
 try{
  delete process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST;assert.equal(validateIntakeLocalCrm(envelope(qa)),'synthetic-suppressed');
  process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST='fictional@unapproved.invalid';assert.equal(validateIntakeLocalCrm(envelope(qa)),'synthetic-suppressed');
 }finally{if(previous===undefined)delete process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST;else process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST=previous;}
});

test('the runtime crm channel is the P5 lead transport, and crm-disabled without the variable',async()=>{
 const fresh=request('addition'),old=request('addition',{savedAt:'2026-10-20T12:00:00.000Z'});
 const reference=p5LeadIntakeTransport({enabled:true});
 // Without the variable, and with any value that is not exactly "on".
 for(const env of [{},{P5_CRM_DELIVERY:'off'},{P5_CRM_DELIVERY:'ON'},{P5_CRM_DELIVERY:'true'},{P5_CANONICAL_REVIEW_TOKEN:'offline-only'},{LEAD_DASHBOARD_KEY:'offline-only',LEAD_DASHBOARD_API_URL:'https://crm.example.invalid/api/external/leads'}] as Record<string,string>[])
  await withSite(env,noNetwork,async()=>{
   const {crm}=await runtimeIntakeTransports();
   assert.equal(await crm.readiness(fresh),'crm-disabled',JSON.stringify(env));
   await assert.rejects(crm.send(envelope(fresh)),/crm-disabled/,JSON.stringify(env));
  });
 await withSite({P5_CRM_DELIVERY:'on'},noNetwork,async()=>{
  const {crm,customer,team}=await runtimeIntakeTransports();
  assert.equal(await crm.readiness(fresh),null);
  // It is that transport: the same identity (the production intake address), retry window and checks.
  assert.equal(crm.identityScope,reference.identityScope);
  assert.equal(crm.retryWindowMs,P5_LEAD_RETRY_WINDOW_MS);
  assert.equal(crm.validate!(envelope(fresh)),null);
  assert.equal(crm.validate!(envelope(fresh,'team')),'payload-review');
  // Requests saved before the lead system began taking them stay out, so old ones do not arrive all at once.
  assert.equal(await crm.readiness(old),'crm-disabled');
  // The two mail channels are unchanged: this site's own transport, never replayed automatically.
  for(const mail of [customer,team]){assert.equal(mail.retryWindowMs,0);assert.equal(mail.identityScope,`${ESTIMATOR_BRAND.id}-email-no-automatic-replay`);}
  assert.notEqual(crm,customer);
 });
 // A runtime may bring older requests in on purpose.
 await withSite({P5_CRM_DELIVERY:'on',P5_REQUEST_LEADS_SINCE:'2026-10-01T00:00:00Z'},noNetwork,async()=>assert.equal(await (await runtimeIntakeTransports()).crm.readiness(old),null));
});

test('a project request is posted to P5 once: form p5-project-request, team_alert site, this site\'s routing and no price',async()=>{
 // Work this team does itself is filed under this brand; work another team leads is filed under that team.
 for(const [service,brand] of [['new-construction',BRAND],['addition',BRAND],['adu',BRAND],['kitchen','Boise Remodeling Co']] as const){
  const {calls,fetcher}=fakeFetch();
  const frozen=envelope(request(service));
  const providerId=await withSite({P5_CRM_DELIVERY:'on'},fetcher,async()=>(await runtimeIntakeTransports()).crm.send(frozen));
  assert.equal(calls.length,1,service);
  assert.equal(calls[0].url,P5_INTAKE_URL);
  assert.equal(calls[0].url,'https://p5homeco.com/api/leads/intake');
  assert.equal(calls[0].init.method,'POST');
  assert.equal(calls[0].init.redirect,'error');
  assert.deepEqual(calls[0].init.headers,{'Content-Type':'application/json'},'no credential is sent');
  const {message,...rest}=sentBody(calls[0]);
  assert.deepEqual(rest,{
   brand,name:'Fictional Person',email:'customer@example.invalid',phone:'2085550142',
   projectType:service,address:'123 N Main St',city:'Boise',form:'p5-project-request',request_kind:'quote',contact_preference:'phone',
   sourceDetail:`p5-project-request:${DRAFT}`,external_id:projectLeadKey(`${site}:${DRAFT}`),team_alert:'site',
  },service);
  assert.equal(frozen.leadKey,rest.external_id,'the id is the request\'s lead key, one per project');
  assert.equal(providerId,`p5-intake:${rest.external_id}`);
  // The summary names this site and its team, and says there is no price.
  assert.match(message,new RegExp(`^Project request BCC-4F7K2Q, revision 1, sent from ${DOMAIN.replace('.','\\.')}\\. No price has been given\\.$`,'m'));
  assert.match(message,new RegExp(`^Team: ${brand}$`,'m'));
  assert.match(message,/^Files attached: 1$/m);
  assert.match(message,new RegExp(`^Full request and files \\(staff sign-in\\): https://${DOMAIN.replace('.','\\.')}/api/admin/p5-intake\\?draftId=${DRAFT}&revision=1$`,'m'));
  // No price, no file contents and no team-only notes travel with a request.
  const body=sentBody(calls[0]);
  for(const priced of ['estimate','low','high','base','lines','amount','verified','team_notes','team_internal_notes','request_external_id'])assert.equal(priced in body,false,priced);
  assert.doesNotMatch(JSON.stringify(body),/\$|private-plan-name|c{20}|11111111-1111/);
  assert.doesNotMatch(JSON.stringify(body),INTERNAL_WORD);
 }
});

test('a request P5 refuses is an error, and a synthetic or switched-off request is never posted',async()=>{
 const frozen=envelope(request('addition'));
 for(const [name,answer,expected] of [
  ['rate limited',()=>accepted({ok:false,error:'SECRET customer@example.invalid'},429),/^P5 intake refused the project request \(HTTP 429\)$/],
  ['server error',()=>new Response('SECRET',{status:500}),/^P5 intake refused the project request \(HTTP 500\)$/],
  ['not accepted',()=>accepted({ok:false,error:'SECRET'},200),/^P5 intake did not accept the project request$/],
  ['unreachable',()=>{throw new Error('connect ECONNREFUSED SECRET');},/^P5 intake could not be reached; the project request was not confirmed$/],
 ] as [string,()=>Response,RegExp][]){
  const {calls,fetcher}=fakeFetch(answer);
  const error=await withSite({P5_CRM_DELIVERY:'on'},fetcher,async()=>(await runtimeIntakeTransports()).crm.send(frozen).then(()=>null,(e:Error)=>e));
  assert.ok(error instanceof Error,name);
  assert.match(error.message,expected,name);
  assert.ok(!error.message.includes('SECRET')&&!error.message.includes('@'),name);
  assert.equal(calls.length,1,`${name}: one post; the delivery worker decides about a retry`);
 }
 const qa=envelope(request('addition',{contact:{name:'[QA] Acceptance',email:'qa@example.invalid',phone:'',preferredContact:'either'}}));
 await withSite({P5_CRM_DELIVERY:'on'},noNetwork,async()=>assert.rejects((await runtimeIntakeTransports()).crm.send(qa),/synthetic-suppressed/));
 await withSite({},noNetwork,async()=>assert.rejects((await runtimeIntakeTransports()).crm.send(frozen),/crm-disabled/));
});

// ---------------------------------------------------------------------------
// 2. The published estimate
// ---------------------------------------------------------------------------

test('syncCrm posts a published estimate to P5: form p5-estimator, team_alert site, an estimate of kind document',async()=>{
 const record=published('addition');
 const {calls,fetcher}=fakeFetch();
 // The production call: two arguments, the global fetch, and old dashboard settings that must change nothing.
 const providerId=await withSite({LEAD_DASHBOARD_KEY:'offline-only',LEAD_DASHBOARD_API_URL:'https://crm.example.invalid/api/external/leads'},fetcher,()=>syncCrm(record,'p5-outbox-key'));
 assert.equal(providerId,`p5-intake:p5-estimator:${DRAFT}`);
 assert.equal(calls.length,1,'one post, and nothing to the old lead dashboard');
 assert.equal(calls[0].url,'https://p5homeco.com/api/leads/intake');
 assert.equal(calls[0].init.method,'POST');
 assert.equal(calls[0].init.redirect,'error');
 assert.ok(calls[0].init.signal instanceof AbortSignal,'the post is timed');
 assert.deepEqual(calls[0].init.headers,{'Content-Type':'application/json'},'no credential is sent: no dashboard key, no bearer token');
 const {estimate,...lead}=sentBody(calls[0]);
 assert.deepEqual(lead,{
  brand:BRAND,name:'Fictional Person',email:'customer@example.invalid',phone:'(208) 555-0142',
  projectType:'addition',address:'123 N Main St',city:'Boise',message:'Fixture scope summary for the customer',
  form:'p5-estimator',sourceDetail:`p5-estimator:${DRAFT}`,external_id:`p5-estimator:${DRAFT}`,
  request_external_id:projectLeadKey(`${site}:${DRAFT}`),team_alert:'site',
 });
 // The estimate joins the lead its project request made: the same key the request was posted under.
 assert.equal(lead.request_external_id,envelope(request('addition')).leadKey);
 // The figures: the range the customer was shown, the contract price, and one customer amount per line.
 assert.equal(estimate.kind,'document');
 assert.equal(estimate.verified,true);
 assert.equal(estimate.label,'Document estimate, addition');
 assert.equal(estimate.low,record.customer.range!.low);
 assert.equal(estimate.high,record.customer.range!.high);
 assert.equal(estimate.base,round2(record.internal.contractPrice));
 assert.deepEqual(Object.keys(estimate).sort(),['base','high','kind','label','lines','low','verified']);
 assert.equal(estimate.lines.length,ADDITION.length);
 assert.equal(round2(estimate.lines.reduce((sum:number,line:{amount:number})=>sum+line.amount,0)),estimate.base,'the lines add up to the contract price to the cent');
 const selling=record.internal.lines.map(line=>round2(line.sellingAmount));
 estimate.lines.forEach((line:Record<string,unknown>,index:number)=>{
  assert.ok(Math.abs(Number(line.amount)-selling[index])<=0.05,`line ${index+1} is that line's customer amount`);
  assert.equal(line.title,ADDITION[index].description);
  for(const key of Object.keys(line))assert.ok(['title','description','quantity','unit','amount','division'].includes(key),key);
 });
});

test('customer amounts only: no cost, margin, markup, profit, contingency or overhead by word or by value',async()=>{
 for(const service of ['addition','new-construction','adu'] as Service[]){
  const record=published(service);
  const {calls,fetcher}=fakeFetch();
  await syncCrm(record,'p5-outbox-key',{fetch:fetcher});
  const body=sentBody(calls[0]);
  assert.equal(body.estimate.kind,'document',service);
  assert.doesNotMatch(JSON.stringify(body),INTERNAL_WORD,service);
  for(const forbidden of ['internal','team_notes','team_internal_notes','unitCost','directCost'])assert.equal(JSON.stringify(body).includes(`"${forbidden}"`),false,forbidden);
  const sent=new Set(numbersIn(body));
  const leaked=internalFigures(record.internal).filter(value=>sent.has(value)&&value!==body.estimate.base);
  assert.deepEqual(leaked,[],`${service}: an internal figure was sent`);
 }
});

test('one lead per project: a stable id per draft, and the request key with or without a stamped project id',async()=>{
 const send=async(record:unknown,key='p5-outbox-key')=>{const {calls,fetcher}=fakeFetch();await syncCrm(record,key,{fetch:fetcher});return sentBody(calls[0]);};
 const first=await send(published('addition'));
 // A revised estimate, or the same one sent again under another outbox key, is the same lead at P5.
 assert.equal((await send(published('addition',{revision:9}),'another-key')).external_id,first.external_id);
 // A record published before the stamp existed is read as a project that began on this site.
 const unstamped=published('addition') as Record<string,unknown>;delete unstamped.projectId;
 assert.equal((await send(unstamped)).request_external_id,projectLeadKey(`${site}:${DRAFT}`));
 // A project handed over from another site keeps the key its request was posted under there.
 assert.equal((await send(published('addition',{projectId:`remodeling:${DRAFT}`}))).request_external_id,projectLeadKey(`remodeling:${DRAFT}`));
 // The test seam may name another address, over HTTPS without credentials only.
 const other=fakeFetch();
 await syncCrm(published('addition'),'k',{fetch:other.fetcher,url:'https://staging.example.invalid/api/leads/intake'});
 assert.equal(other.calls[0].url,'https://staging.example.invalid/api/leads/intake');
});

test('syncCrm throws on a refused post: a short error, one post, never a replay and nothing secret in it',async()=>{
 const record=published('addition');
 const secret='SECRET-RESPONSE-BODY customer@example.invalid https://user:password@private';
 const timeout=()=>{const error=new Error('The operation was aborted due to timeout');error.name='TimeoutError';throw error;};
 const cases:[string,()=>Response,RegExp][]=[
  ['conflict',()=>accepted({duplicate:true,error:secret},409),/^P5 intake refused the estimate \(HTTP 409\)$/],
  ['too large',()=>accepted({ok:false,error:secret},413),/^P5 intake refused the estimate \(HTTP 413\)$/],
  ['rejected',()=>accepted({ok:false,errors:[secret]},422),/^P5 intake refused the estimate \(HTTP 422\)$/],
  ['rate limited',()=>accepted({ok:false,error:secret},429),/^P5 intake refused the estimate \(HTTP 429\)$/],
  ['server error',()=>new Response(secret,{status:500}),/^P5 intake refused the estimate \(HTTP 500\)$/],
  ['not accepted',()=>accepted({ok:false,error:secret},200),/^P5 intake did not accept the estimate$/],
  ['no ok in the answer',()=>accepted({success:true,leadId:DRAFT,note:secret},201),/^P5 intake did not accept the estimate$/],
  ['not json',()=>new Response(`<html>${secret}</html>`,{status:200}),/^P5 intake answer was not valid JSON$/],
  ['unreachable',()=>{throw new Error(`connect ECONNREFUSED ${secret}`);},/^P5 intake could not be reached; the estimate was not confirmed$/],
  ['timed out',timeout,/^P5 intake did not answer in time; the estimate was not confirmed$/],
 ];
 for(const [name,answer,expected] of cases){
  const {calls,fetcher}=fakeFetch(answer);
  const error=await withSite({},fetcher,()=>syncCrm(record,'p5-outbox-key').then(()=>null,(e:Error)=>e));
  assert.ok(error instanceof Error,name);
  assert.match(error.message,expected,name);
  assert.ok(error.message.length<120&&!/SECRET|password|private|@/.test(error.message),name);
  assert.equal(calls.length,1,`${name}: one POST, no second POST and no lookup`);
  assert.equal(calls[0].init.method,'POST',name);
 }
});

test('nothing leaves before it should: a synthetic estimate, one nobody can be reached about, an unsafe address',async()=>{
 const record=published('addition');
 const {calls,fetcher}=fakeFetch();
 for(const qa of [{contact:{name:'[QA] Acceptance',email:'qa@example.invalid',phone:''}},{contact:{name:'SYNTHETIC QA run',email:'qa@example.invalid',phone:''}}])
  await assert.rejects(syncCrm({...record,...qa},'k',{fetch:fetcher}),/synthetic QA estimate is never forwarded/);
 await assert.rejects(syncCrm({...record,contact:{name:'Fictional Person',email:'',phone:''}},'k',{fetch:fetcher}),/email address or a phone number/);
 for(const url of ['http://p5homeco.com/api/leads/intake','https://user:password@p5homeco.com/api/leads/intake','not-a-url'])
  await assert.rejects(syncCrm(record,'k',{fetch:fetcher,url}),/credential-free HTTPS endpoint/);
 assert.equal(calls.length,0,'nothing was posted');
 // Figures that cannot be used: the lead still goes, without estimate and without team_alert, so P5 sends its usual email.
 await syncCrm({...record,customer:{summary:'Held for review'}},'k',{fetch:fetcher});
 const body=sentBody(calls[0]);
 assert.equal(body.form,'p5-estimator');
 assert.equal('estimate' in body,false);
 assert.equal('team_alert' in body,false);
});

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

test('wiring: the runtime and the adapter use the P5 lead intake, the old destinations are gone from both, and the gates are untouched',()=>{
 const runtime=read('lib/p5/intakeDeliveryRuntime.ts'),adapter=read('lib/p5/deliveryAdapter.ts'),local=read('lib/p5/intakeCrmValidation.ts');
 assert.match(runtime,/import \{p5LeadIntakeTransport\} from '\.\/p5LeadIntake\.ts';/);
 assert.match(runtime,/const crm=p5LeadIntakeTransport\(\{enabled:process\.env\.P5_CRM_DELIVERY==='on',since:process\.env\.P5_REQUEST_LEADS_SINCE\}\);/);
 assert.doesNotMatch(runtime,/canonicalReviewTransport\(|from '\.\/canonicalReviewTransport|P5_CANONICAL_REVIEW_TOKEN|LEAD_DASHBOARD/);
 // The forwarder is loaded on demand: the shared reply-to test runs the adapter in a VM with a fixed dependency list.
 assert.match(adapter,/await import\('\.\/p5LeadIntake\.ts'\)/);
 assert.doesNotMatch(adapter,/^import[^\n]*p5LeadIntake/m);
 assert.match(adapter,/forwardEstimateToP5\(record,key,\{[^}]*brand:brand\.name\}\)/);
 assert.doesNotMatch(adapter,/LEAD_DASHBOARD_KEY|LEAD_DASHBOARD_API_URL|crmUrl|deliverKeyedCrm|buildCrmPayload|crmIdentity/);
 assert.match(local,/projectRequestHold/);
 // The canonical review transport stays where it was, gated: nothing in this change activates it.
 assert.match(read('lib/p5/intakeDeliveryPolicy.ts'),/INTAKE_RUNTIME_PROOF:\{email:string\|null;crm:string\|null\}=\{email:'[^']+',crm:null\}/);
 assert.ok(read('lib/p5/canonicalReviewTransport.ts').includes('canonicalReviewTransport'));
 // The published estimate still reaches syncCrm only through the outbox's crm job, behind the site setting.
 assert.match(read('lib/p5/outbox.ts'),/if\(destination==="crm"\)\{if\(!CRM_DELIVERY_ENABLED\)throw new Error\("CRM delivery is turned off"\);providerId=await syncCrm\(record,key\);\}/);
 for(const [name,source] of [['runtime',runtime],['adapter',adapter],['local check',local],['this test',read('tests/p5-intake-local-crm.test.ts')]] as const)assert.equal(source.includes(String.fromCharCode(8212)),false,`${name} has no em dash`);
});

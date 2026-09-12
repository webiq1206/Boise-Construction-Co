import assert from 'node:assert/strict';
import {cp,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// This is deliberately not a build check. It runs the durable analysis queue
// against only an in-memory PGlite database and an explicitly authorized live
// provider. It creates no upload, submission, delivery, lead, or CRM record.
const offlineSafetyCheck=process.env.P5_LIVE_ANALYSIS_OFFLINE_CHECK==='true';
if(!offlineSafetyCheck&&process.env.P5_RUN_LIVE_ANALYSIS!=='true')throw new Error('Set P5_RUN_LIVE_ANALYSIS=true only for an authorized configured-provider analysis diagnostic.');

const syntheticText='Replace one existing bathroom vanity with a new owner-supplied 36-inch vanity in the same location. Reconnect the existing sink plumbing. No flooring, painting, or layout changes.';
const startedAt=Date.now();
const overallLimitMs=180_000;
// Leave time to persist a useful result and clean up before the hard limit.
const providerDeadline=startedAt+175_000;
const reportDirectory=path.join(process.cwd(),'.local/diagnostics/startup-preservation/live-analysis');
const reportPath=path.join(reportDirectory,`analysis-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const originalDatabaseUrl=process.env.DATABASE_URL;
const originalFetch=globalThis.fetch;
const originalConsoleWarn=console.warn;
const originalConsoleError=console.error;
const httpEvents:Array<{provider:string;model:string|null;status:number|null;error?:string}>=[];
const runtimeWarnings:Array<{level:'warn'|'error';message:string}>=[];
const blockedRequests:string[]=[];
let businessDatabaseImports=0;
let deliveryModuleImports=0;
let outboxEmpty=false;
const deliverySentinelKey=Symbol.for('p5-live-analysis-delivery-sentinel');
const deliverySentinelState={importAttempts:0};
(globalThis as Record<symbol,unknown>)[deliverySentinelKey]=deliverySentinelState;
let database:any;
let finalJob:any;
let diagnosticError:string|undefined;
let dir='';

function redact(value:unknown):string {
  return String(value??'')
    .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
    .replace(/(?:sk|key|token)[-_][A-Za-z0-9_-]+/gi,'[redacted]')
    .replace(/((?:api[_-]?key|authorization|x-api-key|token|secret)\s*[=:]\s*)\S+/gi,'$1[redacted]')
    .replace(/https?:\/\/[^\s"'<>]+/gi,'[url-redacted]')
    .replace(/\s+/g,' ')
    .trim()
    .slice(0,600);
}

function captureRuntimeWarning(level:'warn'|'error',values:unknown[]){
  const message=redact(values.map(value=>value instanceof Error?value.message:typeof value==='string'?value:String(value)).join(' '));
  // The analysis provider fallback diagnostic is intentionally emitted by the
  // runtime. Capture only that bounded, redacted P5 signal, not arbitrary logs.
  if(message.includes('[p5-analysis]'))runtimeWarnings.push({level,message});
}
console.warn=(...values:unknown[])=>{captureRuntimeWarning('warn',values);originalConsoleWarn(...values);};
console.error=(...values:unknown[])=>{captureRuntimeWarning('error',values);originalConsoleError(...values);};

function configuredEndpoints(){
  const endpoints:Array<{url:string;provider:'OpenAI'|'Anthropic'}>=[];
  const integrated=Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY&&process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
  const openAiKey=integrated?process.env.AI_INTEGRATIONS_OPENAI_API_KEY:process.env.OPENAI_API_KEY;
  const openAiBase=integrated?process.env.AI_INTEGRATIONS_OPENAI_BASE_URL:(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1');
  if(openAiKey&&openAiBase)endpoints.push({provider:'OpenAI',url:`${openAiBase.replace(/\/+$/,'')}/responses`});
  if(process.env.ANTHROPIC_API_KEY)endpoints.push({provider:'Anthropic',url:'https://api.anthropic.com/v1/messages'});
  return endpoints;
}

function modelFromRequest(init:RequestInit|undefined):string|null {
  if(typeof init?.body!=='string')return null;
  try {
    const model=JSON.parse(init.body).model;
    return typeof model==='string'&&/^[A-Za-z0-9._:-]{1,160}$/.test(model)?model:null;
  } catch {
    return null;
  }
}

function safeJob(job:any){
  if(!job)return null;
  const analysis=job.result?.analysis;
  return {
    state:job.state,
    attempts:Number(job.attempts||0),
    progress:redact(job.progress),
    retryAt:Number(job.retryAt||0)||undefined,
    processing:job.processing?{
      phase:redact(job.processing.phase),
      message:redact(job.processing.message),
      readPages:Number(job.processing.readPages||0),
      totalPages:Number(job.processing.totalPages||0),
    }:undefined,
    analysis:analysis?{
      provider:redact(analysis.provider),
      model:redact(analysis.model),
      analyzedAt:analysis.analyzedAt,
      summary:redact(analysis.extraction?.summary),
      factCount:Array.isArray(analysis.extraction?.facts)?analysis.extraction.facts.length:0,
      clarificationCount:Array.isArray(analysis.extraction?.clarifications)?analysis.extraction.clarifications.length:0,
      reviewNoteCount:Array.isArray(analysis.extraction?.reviewNotes)?analysis.extraction.reviewNotes.length:0,
    }:undefined,
  };
}

async function sleep(milliseconds:number){await new Promise(resolve=>setTimeout(resolve,milliseconds));}

async function main(){
  const endpoints=configuredEndpoints();
  assert.ok(endpoints.length>0,'No configured OpenAI or Anthropic analysis provider is available in this runtime.');
  const allowed=new Map(endpoints.map(endpoint=>[new URL(endpoint.url).toString(),endpoint.provider]));
  globalThis.fetch=(async (input:RequestInfo|URL,init?:RequestInit)=>{
    const requestUrl=typeof input==='string'?input:input instanceof URL?input.toString():input.url;
    let normalized:string;
    try{normalized=new URL(requestUrl).toString();}catch{
      blockedRequests.push('invalid-url');
      throw new Error('diagnostic-blocked-outgoing-request');
    }
    const provider=allowed.get(normalized);
    const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    if(!provider||method!=='POST'){
      blockedRequests.push(provider?`${provider}:non-post`:'unapproved-endpoint');
      throw new Error('diagnostic-blocked-outgoing-request');
    }
    const model=modelFromRequest(init);
    const remaining=Math.max(1,providerDeadline-Date.now());
    const signals=[AbortSignal.timeout(remaining),init?.signal].filter(Boolean) as AbortSignal[];
    // Do not allow a permitted provider URL to redirect this diagnostic to a
    // different host or endpoint. Redirects are failures, never a second fetch.
    const guarded={...init,redirect:'error' as RequestRedirect,signal:signals.length===1?signals[0]:AbortSignal.any(signals)};
    try {
      const response=await originalFetch(input,guarded);
      const event:{provider:string;model:string|null;status:number|null;error?:string}={provider,model,status:response.status};
      if(!response.ok){
        let detail='';
        try{detail=await response.clone().text();}catch{}
        event.error=redact(detail||`HTTP ${response.status}`);
      }
      httpEvents.push(event);
      return response;
    } catch(error) {
      httpEvents.push({provider,model,status:null,error:redact(error instanceof Error?error.message:'provider request failed')});
      throw error;
    }
  }) as typeof fetch;

  await mkdir('node_modules/.cache',{recursive:true});
  dir=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-live-analysis-'));
  await cp('lib/p5',dir,{recursive:true});
  await writeFile(path.join(dir,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(s:string,v:unknown[]=[]){return (await database.query(s,v)).rows;}`);
  const deliverySentinel=`const state=(globalThis as Record<symbol,any>)[Symbol.for('p5-live-analysis-delivery-sentinel')]||((globalThis as Record<symbol,any>)[Symbol.for('p5-live-analysis-delivery-sentinel')]={importAttempts:0});state.importAttempts=(state.importAttempts||0)+1;throw new Error('diagnostic-delivery-module-import-blocked');export {};`;
  // These modules are not in the analysis path. Replacing both with import-time
  // sentinels makes an accidental delivery import fail before it can call email
  // or CRM code, and records that import for the final assertion.
  await Promise.all([
    writeFile(path.join(dir,'outbox.ts'),deliverySentinel),
    writeFile(path.join(dir,'deliveryAdapter.ts'),deliverySentinel),
  ]);
  assert.match(deliverySentinel,/diagnostic-delivery-module-import-blocked/,'Delivery sentinel must fail closed before runtime imports.');
  const isolatedDatabaseSource=await readFile(path.join(dir,'database.ts'),'utf8');
  assert.ok(!isolatedDatabaseSource.includes('../db')&&!isolatedDatabaseSource.includes('drizzle'),'The copied diagnostic database module must not import the business database.');
  const runtimeSources=await Promise.all(['backgroundJobs','analysisWork','store','workStore'].map(name=>readFile(path.join(dir,`${name}.ts`),'utf8')));
  businessDatabaseImports=[isolatedDatabaseSource,...runtimeSources].filter(source=>/from\s+["'][^"']*(?:\.\.\/db|drizzle)[^"']*["']/.test(source)).length;
  deliveryModuleImports=runtimeSources.filter(source=>/from\s+["']\.\/(?:outbox|deliveryAdapter)["']/.test(source)).length;

  // Do not let the copied worker start a timer tied to a production database.
  delete process.env.DATABASE_URL;
  const mod=(name:string)=>import(pathToFileURL(path.join(dir,`${name}.ts`)).href);
  const store=await mod('store');
  const db=await mod('database');
  const background=await mod('backgroundJobs');
  database=db.database;

  const draft=await store.saveDraft(randomUUID(),randomBytes(32).toString('hex'),'diagnostic',{
    text:syntheticText,answers:{},extraction:null,reviewed:null,contact:{name:'',email:'',phone:''},
  },0);
  const input={kind:'analysis' as const,draft,text:syntheticText,answers:{}};
  await background.queuedJob(input);

  const readJob=async()=>{
    const rows=await db.query("SELECT payload FROM p5_estimator_work WHERE draft_id=$1 AND work_key LIKE 'background-v1-%'",[draft.id]);
    assert.equal(rows.length,1,'The isolated durable queue must contain exactly one analysis job.');
    return rows[0].payload;
  };
  for(let queueAttempt=1;queueAttempt<=3;queueAttempt++){
    while(Date.now()<providerDeadline){
      const job=await readJob();
      if(job.state==='complete'||Number(job.attempts||0)>=queueAttempt){finalJob=job;break;}
      await sleep(100);
    }
    finalJob=finalJob||await readJob();
    if(finalJob.state==='complete'||finalJob.state==='failed'||Date.now()>=providerDeadline)break;
    // Background retries are intentionally durable. Make its saved retry due now
    // only in the isolated PGlite copy, never in a business database.
    finalJob.retryAt=0;
    finalJob.state='queued';
    await db.query('UPDATE p5_estimator_work SET payload=$1::jsonb,lease_until=now()-interval \'1 minute\' WHERE draft_id=$2 AND work_key LIKE \'background-v1-%\'',[JSON.stringify(finalJob),draft.id]);
    await background.drainEstimatorJobs();
    finalJob=undefined;
  }
  finalJob=await readJob();

  const [outboxCount]=await db.query('SELECT COUNT(*)::int AS count FROM p5_estimator_outbox');
  outboxEmpty=Number(outboxCount.count)===0;
  assert.equal(outboxEmpty,true,'Analysis must not create an outbox record.');
  assert.equal(deliveryModuleImports,0,'The exercised analysis runtime must not import delivery code.');
  assert.equal(deliverySentinelState.importAttempts,0,'Any delivery module import must be blocked before an email or CRM call.');
  assert.equal(businessDatabaseImports,0,'Diagnostic modules must not import or connect to the business database.');
  assert.equal(blockedRequests.length,0,'No request may leave except an exact configured analysis endpoint.');
  assert.ok(Number(finalJob.attempts||0)<=3,'The diagnostic may make at most three durable queue attempts.');
  assert.ok(httpEvents.length>0,'The durable analysis job did not reach a configured provider.');
  assert.equal(finalJob.state,'complete',`Live analysis did not complete after ${finalJob.attempts||0} durable attempt(s).`);
  assert.ok(finalJob.result?.analysis?.provider&&finalJob.result?.analysis?.model,'A completed job must contain a real provider and model result.');
  assert.ok(httpEvents.some(event=>event.status!==null&&event.status>=200&&event.status<300),'A completed job requires an actual successful provider response.');
}

if(offlineSafetyCheck){
  const source=await readFile(new URL(import.meta.url),'utf8');
  assert.match(source,/redirect:'error'/,'The provider request must fail rather than follow redirects.');
  assert.match(source,/diagnostic-delivery-module-import-blocked/,'The copied delivery modules must remain fail-closed sentinels.');
  const before=runtimeWarnings.length;
  console.warn('[p5-analysis] offline runtime warning capture verification');
  assert.equal(runtimeWarnings.length,before+1,'P5 analysis warnings must be captured alongside original console output.');
  assert.equal(runtimeWarnings.at(-1)?.level,'warn');
  assert.ok(runtimeWarnings.at(-1)?.message.length&&runtimeWarnings.at(-1)!.message.length<=600,'Captured runtime warnings must be bounded.');
  console.warn=originalConsoleWarn;
  console.error=originalConsoleError;
  console.log(JSON.stringify({passed:true,offlineSafetyCheck:true,runtimeWarningCapture:true,redirectPolicy:'error',deliverySentinel:'fail-closed'}));
}else{
  try {
    await main();
  } catch(error) {
    diagnosticError=redact(error instanceof Error?error.message:'Live analysis diagnostic failed');
  } finally {
    const elapsedMs=Date.now()-startedAt;
    try {
      if(database)await database.close();
    } catch(error) {
      diagnosticError=diagnosticError||redact(error instanceof Error?error.message:'Failed to close isolated PGlite database');
    }
    globalThis.fetch=originalFetch;
    console.warn=originalConsoleWarn;
    console.error=originalConsoleError;
    if(originalDatabaseUrl===undefined)delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL=originalDatabaseUrl;
    await mkdir(reportDirectory,{recursive:true});
    const report={
      synthetic:true,
      durableQueue:true,
      isolatedPGlite:true,
      configuredProviders:configuredEndpoints().map(endpoint=>endpoint.provider),
      requestPolicy:'Only exact configured OpenAI /responses and Anthropic /v1/messages POST requests were permitted.',
      elapsedMs,
      withinOverallLimit:elapsedMs<=overallLimitMs,
      httpEvents,
      runtimeWarnings,
      job:safeJob(finalJob),
      safety:{
        outboxEmpty,
        deliveryModuleImports,
        deliverySentinelImportAttempts:deliverySentinelState.importAttempts,
        deliveryExecutionBlocked:true,
        businessDatabaseImports,
        blockedRequests,
        productionDatabaseUrlUsed:false,
      },
      error:diagnosticError,
    };
    await writeFile(reportPath,JSON.stringify(report,null,2));
    console.log(JSON.stringify({passed:!diagnosticError,elapsedMs,job:report.job,httpEvents:report.httpEvents,runtimeWarnings:report.runtimeWarnings,safety:report.safety,report:path.relative(process.cwd(),reportPath),error:diagnosticError}));
  }
  if(diagnosticError)process.exitCode=1;
  if(Date.now()-startedAt>overallLimitMs)process.exitCode=1;
  await rm(dir,{recursive:true,force:true});
}
delete (globalThis as Record<symbol,unknown>)[deliverySentinelKey];
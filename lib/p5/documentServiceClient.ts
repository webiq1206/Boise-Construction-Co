import {createHash,createHmac,randomUUID} from 'node:crypto';
import {query} from './database.ts';
import {readStoredBytes} from './objectStorage.ts';
import {claimWork,writeWork,releaseWork} from './workStore.ts';
import {ESTIMATOR_BRAND} from './brand.ts';
import {SCOPE_FILE_LIMIT,combineScopeExtractions,validateExtraction,type ScopeAnswers,type ScopeUpload} from './scope.ts';
import type {AnalysisResult} from './extraction.ts';
import {type Draft,DraftError} from './store.ts';
import {fetchWithinDeadline,remainingBudget} from './processingBudget.ts';
import type {ProcessingStatus} from './processingStatus.ts';
const VERSION='p5-documents-2026-09-17-v1';
const digest=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
/** This is the existing host contract, not evidence of a 250 MiB host upgrade. */
export const DOCUMENT_SERVICE_DEFAULT_MAX_BYTES=50*1024*1024;
export function documentServiceMaxBytes(env:Readonly<Record<string,string|undefined>>=process.env){
 const limit=Number(env.P5_DOCUMENT_SERVICE_MAX_BYTES||DOCUMENT_SERVICE_DEFAULT_MAX_BYTES);
 if(!Number.isSafeInteger(limit)||limit<=0||limit>SCOPE_FILE_LIMIT)throw new DraftError('The document size limit needs configuration. Your files are saved.',503);
 return limit;
}
/** Pure, redacted configuration check. It never probes a host or proves capability. */
export function documentServiceReadiness(env:Readonly<Record<string,string|undefined>>=process.env){
 if(!env.P5_DOCUMENT_SERVICE_MODE||env.P5_DOCUMENT_SERVICE_MODE==='local')return {enabled:false,state:'off' as const,configurationReady:false,maxBytes:null,uploadMaxBytes:SCOPE_FILE_LIMIT,hostVerified:false as const,issues:[] as string[]};
 const issues:string[]=[];let maxBytes:number|null=null;
 try{maxBytes=documentServiceMaxBytes(env);}catch{issues.push('Invalid remote byte limit (must be within the upload limit).');}
 try{
  const url=new URL(env.P5_DOCUMENT_SERVICE_URL||'');
  if(url.protocol!=='https:'||url.username||url.password||!['/','/api/p5-documents','/api/p5-documents/'].includes(url.pathname)||url.search||url.hash)issues.push('Use an HTTPS service origin or /api/p5-documents base without credentials, query or fragment.');
 }catch{issues.push('A valid document service URL is required.');}
 if((env.P5_DOCUMENT_SERVICE_KEY||'').length<32)issues.push('A signing key of at least 32 characters is required.');
 if(env.P5_DOCUMENT_SERVICE_MODE&& !['local','remote'].includes(env.P5_DOCUMENT_SERVICE_MODE))issues.push('Document service mode must be local or remote.');
 return {enabled:env.P5_DOCUMENT_SERVICE_MODE==='remote',state:issues.length?'invalid' as const:'configured-unverified' as const,configurationReady:issues.length===0,maxBytes,uploadMaxBytes:SCOPE_FILE_LIMIT,hostVerified:false as const,issues};
}
export function partitionDocumentServiceUploads(uploads:ScopeUpload[],env:Readonly<Record<string,string|undefined>>=process.env){
 const remote:ScopeUpload[]=[],local:ScopeUpload[]=[];
 const limit=env.P5_DOCUMENT_SERVICE_MODE==='remote'?documentServiceMaxBytes(env):0;
 for(const upload of uploads)(upload.status==='stored'&&upload.type==='application/pdf'&&upload.size>0&&upload.size<=limit?remote:local).push(upload);
 return {remote,local};
}
export function documentServiceEligible(uploads:ScopeUpload[],env:Readonly<Record<string,string|undefined>>=process.env){
 return partitionDocumentServiceUploads(uploads,env).remote.length>0;
}
export type DocumentAnalysisStep=({pending:true;progress:string;retryAfterMs?:number}|{pending:false;version:string;analysis:AnalysisResult;expectedPages?:{source:string;page:number}[]})&{processing?:ProcessingStatus};
type BranchReader=(draft:Draft,text:string,answers:ScopeAnswers,workKey:string,request:typeof fetch,retryFailed:boolean,deadline:number)=>Promise<DocumentAnalysisStep>;
type MixedState={routes?:ReturnType<typeof partitionDocumentServiceUploads>;local?:AnalysisResult;remote?:AnalysisResult;localRetry?:boolean;remoteRetry?:boolean;branchProcessing?:Partial<Record<'local'|'remote',ProcessingStatus>>;processing?:ProcessingStatus&{branches?:Partial<Record<'local'|'remote',ProcessingStatus>>}};
/** Validate before merging: the merger intentionally coalesces detail tiles. */
export function assertCompleteSourceCoverage(extraction:AnalysisResult['extraction'],sources:string[],expected?:{source:string;page:number}[],requiresPages=false){
 const fail=()=>{throw new DraftError('Some source evidence is still unread or its coverage could not be verified. Your files and completed work are saved. Use Retry to resume.',422);};
 if(!extraction||typeof extraction!=='object')fail();
 const coverage=extraction?.documentCoverage;
 if(!coverage){if(requiresPages||expected?.length)fail();return;}
 if(coverage.complete!==true||!Number.isSafeInteger(coverage.expectedPages)||coverage.expectedPages<0||!Array.isArray(coverage.pages)||coverage.pages.length!==coverage.expectedPages)fail();
 const seen=new Set<string>(),wanted=expected&&new Set(expected.map(p=>JSON.stringify([p.source,p.page])));
 for(const page of coverage.pages){
  const key=JSON.stringify([page.source,page.page]);
  if(!sources.includes(page.source)||!Number.isSafeInteger(page.page)||page.page<=0||page.status!=='read'||seen.has(key)||(wanted&&!wanted.has(key)))fail();
  seen.add(key);
 }
 if((wanted&&seen.size!==wanted.size)||(requiresPages&&!seen.size))fail();
}
export function assertProjectSourceCoverage(uploads:ScopeUpload[],extraction:AnalysisResult['extraction']|null|undefined){
 if(!uploads.length)return; // Typed-only projects have no page ledger.
 if(!extraction)throw new DraftError('Source verification is missing. Your files are preserved; complete document reading before pricing.',422);
 assertCompleteSourceCoverage(extraction,uploads.map(u=>uploads.filter(v=>v.name===u.name).length>1?`${u.name} [${u.id.slice(0,8)}]`:u.name),undefined,uploads.some(u=>u.type==='application/pdf'));
}
/** No implicit migration may replay already-spent legacy read attempts. */
export async function assertAnalysisMigrationSafe(draft:Draft,text:string,answers:ScopeAnswers,currentKey:string,read=query){
 const fingerprint=digest(JSON.stringify([text,answers,draft.uploads.map(f=>[f.id,f.sha256])]));
 let rows:Record<string,any>[];
 try{rows=await read('SELECT work_key FROM p5_estimator_work WHERE draft_id=$1 AND work_key LIKE $2',[draft.id,`analysis:%:${fingerprint}`]);}
 catch{throw new DraftError('Saved source checkpoints could not be verified. Your files are preserved; retry before starting any new reading.',503);}
 if(rows.some(row=>row.work_key!==currentKey))throw new DraftError('Existing source checkpoints need a verified migration before this reader can resume. Your files and prior attempt budgets are preserved; no automatic rereading was started.',409);
}
export async function readSavedSource(upload:ScopeUpload,draftId:string,dependencies={query,readStoredBytes}){
 let file:Record<string,any>|undefined,bytes:Buffer;
 try{
  [file]=await dependencies.query('SELECT name,mime_type,data_base64,storage_bucket,storage_key,sha256,size_bytes FROM p5_estimator_files WHERE draft_id=$1 AND id=$2',[draftId,upload.id]);
  if(!file)throw new Error('missing');
  bytes=await dependencies.readStoredBytes(file);
 }catch{throw new DraftError('A saved source file could not be read. Your files are preserved. Please retry.',503);}
 if(digest(bytes)!==upload.sha256)throw new DraftError('A saved document failed its integrity check. Your files are preserved; please reattach it.',422);
 return {file,bytes};
}
/** Independently checkpoint both readers, then use the existing evidence merger.
 * No non-PDF payload or invented protocol field is sent to the remote host. */
export async function advanceMixedDocumentAnalysis(draft:Draft,text:string,answers:ScopeAnswers,workKey:string,request:typeof fetch,retryFailed:boolean,deadline:number,localReader:BranchReader,
 dependencies={claimWork,writeWork,releaseWork,remoteReader:advanceDocumentService as BranchReader}):Promise<DocumentAnalysisStep>{
 const lease=await dependencies.claimWork(draft.id,workKey,{},Math.max(30,Math.ceil((deadline-Date.now())/1000)+30));
 if(!lease)return {pending:true,progress:'Your source review is already running.',retryAfterMs:1000};
 const state=lease.payload as MixedState;
 const save=()=>dependencies.writeWork(draft.id,workKey,lease.token,state);
 try{
  if(!state.routes){
   // Capture configuration exactly once. Saved choices survive limit changes.
   const env={...process.env};
   state.routes=partitionDocumentServiceUploads(draft.uploads.map(upload=>({...upload,name:draft.uploads.filter(u=>u.name===upload.name).length>1?`${upload.name} [${upload.id.slice(0,8)}]`:upload.name})),env);
   await save();
  }
  const routes=state.routes;
  if(retryFailed){state.localRetry=true;state.remoteRetry=true;await save();}
  const waits:number[]=[],messages:string[]=[];
  // Local first prevents a long remote upload from starving photos/sheets.
  for(const branch of ['local','remote'] as const){
   if(state[branch])continue;
   remainingBudget(deadline);
   const uploads=routes[branch];
   if(!uploads.length)continue;
   const retryKey=branch==='local'?'localRetry':'remoteRetry';
   const step=await (branch==='local'?localReader:dependencies.remoteReader)({...draft,uploads},text,answers,`${workKey}:${branch}`,request,Boolean(state[retryKey]),deadline);
   state[retryKey]=false;
   state.branchProcessing||={};
   if(step.processing)state.branchProcessing[branch]=step.processing;
   if(step.pending){messages.push(`${branch==='local'?'Photos, spreadsheets and local files':'PDF reader'}: ${step.progress}`);waits.push(step.retryAfterMs||750);}
   else{
    assertCompleteSourceCoverage(step.analysis.extraction,uploads.map(u=>u.name),step.expectedPages,uploads.some(u=>u.type==='application/pdf'));
    state[branch]=step.analysis;
    const coverage=step.analysis.extraction.documentCoverage;
    if(coverage)state.branchProcessing[branch]={...state.branchProcessing[branch],phase:'cross-referencing',message:'Source evidence verified.',readPages:coverage.pages.length,totalPages:coverage.expectedPages,updatedAt:new Date().toISOString()};
   }
   const statuses=Object.values(state.branchProcessing);
   state.processing={phase:'reading',message:messages.join(' ')||'Source evidence saved. Checking remaining files.',updatedAt:new Date().toISOString(),branches:state.branchProcessing,...Object.fromEntries(['readPages','totalPages','readSections','totalSections'].flatMap(key=>statuses.some(s=>typeof (s as any)[key]==='number')?[[key,statuses.reduce((sum,s)=>sum+((s as any)[key]||0),0)]]:[])),currentItems:statuses.flatMap(s=>s.currentItems||[]).slice(0,3)};
   await save();
  }
  if((routes.local.length&&!state.local)||(routes.remote.length&&!state.remote))return {pending:true,progress:messages.join(' '),retryAfterMs:Math.min(...waits),processing:state.processing};
  const results=[state.remote,state.local].filter((r):r is AnalysisResult=>Boolean(r));
  const extraction=combineScopeExtractions(results.map(r=>r.extraction));
  return {pending:false,version:digest(JSON.stringify([text,answers,draft.uploads.map(f=>[f.id,f.sha256])])),analysis:{extraction,provider:results.map(r=>r.provider).join(' + '),model:results.map(r=>r.model).join(' + '),analyzedAt:new Date().toISOString()}};
 }finally{await dependencies.releaseWork(draft.id,workKey,lease.token);}
}
export function documentServiceHeaders(method:string,path:string,tenant:string,secret:string,body:Buffer,now=Date.now(),nonce:string=randomUUID()){
 const timestamp=String(now),bodyHash=digest(body);
 return {'x-p5-tenant':tenant,'x-p5-time':timestamp,'x-p5-nonce':nonce,'x-p5-body-sha256':bodyHash,'x-p5-signature':createHmac('sha256',secret).update([method,path,tenant,timestamp,nonce,bodyHash].join('\n')).digest('hex')};
}
export function remoteDocumentId(tenant:string,project:string,sha256:string){return digest(JSON.stringify([VERSION,tenant,project,sha256]));}
export async function advanceDocumentService(draft:Draft,text:string,answers:ScopeAnswers,workKey:string,request:typeof fetch,retryFailed:boolean,deadline:number,
 dependencies={claimWork,writeWork,releaseWork,query,readStoredBytes}):Promise<DocumentAnalysisStep>{
 const tenant=ESTIMATOR_BRAND.domain;
 if(!documentServiceReadiness().configurationReady)throw new DraftError('The document service configuration needs attention. Your files are saved.',503);
 const secret=process.env.P5_DOCUMENT_SERVICE_KEY||'',configured=process.env.P5_DOCUMENT_SERVICE_URL||'';
 let origin:URL;try{origin=new URL(configured);}catch{throw new DraftError('The document service is not configured. Your files are saved.',503);}
 if(origin.protocol!=='https:'||origin.username||origin.password||!['/','/api/p5-documents','/api/p5-documents/'].includes(origin.pathname)||origin.search||origin.hash||secret.length<32)throw new DraftError('The document service configuration needs attention. Your files are saved.',503);
 const base=`/v1/projects/${encodeURIComponent(draft.id)}`;
 const send=async(method:string,path:string,body:Buffer=Buffer.alloc(0),contentType='application/json')=>{
  const response=await fetchWithinDeadline(request,origin.origin+origin.pathname.replace(/\/$/,'')+path,{method,headers:{...documentServiceHeaders(method,path,tenant,secret,body),'content-type':contentType},...(method==='POST'?{body:body as unknown as BodyInit}:{}),redirect:'error'},Math.min(deadline,Date.now()+60000));
  let value:any;try{value=await response.json();}catch{throw new DraftError('The document service returned an invalid response. Saved files are preserved.',503);}
  return {ok:response.ok,status:response.status,value};
 };
 const lease=await dependencies.claimWork(draft.id,workKey,{processing:{},remote:true},Math.max(30,Math.ceil((deadline-Date.now())/1000)+30));
 if(!lease)return {pending:true as const,progress:'Your source review is already running.',retryAfterMs:1000};
 const state=lease.payload as {processing?:ProcessingStatus;remote?:boolean};
 const pending=async(progress:string,details:Partial<ProcessingStatus>={},wait=750)=>{
  state.remote=true;state.processing={phase:'reading',message:progress,updatedAt:new Date().toISOString(),...details};
   await dependencies.writeWork(draft.id,workKey,lease.token,state);
   return {pending:true as const,progress,retryAfterMs:wait,processing:state.processing};
 };
 try{
  const documents:{id:string;source:string}[]=[],expectedPages=new Set<string>();let complete=true,readPages=0,totalPages=0;
  for(const upload of draft.uploads){
   remainingBudget(deadline);const id=remoteDocumentId(tenant,draft.id,upload.sha256),path=base+'/documents/'+id;
   // One request, progress count and coverage identity per physical PDF.
   if(documents.some(d=>d.id===id))continue;
   let response=await send('GET',path);
   if(response.status===404){
     const {bytes}=await readSavedSource(upload,draft.id,dependencies);
    response=await send('POST',base+'/documents?name='+encodeURIComponent(upload.name),bytes,'application/pdf');
   }
   if(response.status===429||response.status===503)return pending('Your documents are saved. Waiting for reader capacity.',{phase:'queued'},Math.min(10000,response.value.retryAfterMs||2000));
   if(!response.ok)throw new DraftError(`Document reading is unavailable (${response.value.error||response.status}). Your uploaded files are saved.`,503);
   if(response.value.id!==id)throw new DraftError('The document service receipt did not match this project.',503);
   if(response.value.state==='failed'){
    if(retryFailed){const retried=await send('POST',path+'/retry');if(!retried.ok)throw new DraftError('The document retry could not start. Your files are saved.',503);return pending('Retrying only the interrupted document stages.',{phase:'retrying'});}
    throw new DraftError(`Document processing needs attention (${response.value.error||'reader failure'}). Completed work is saved. Use Retry to resume.`,422);
   }
   complete&&=response.value.state==='complete';readPages+=Number(response.value.progress?.checkedPages||0);totalPages+=Number(response.value.progress?.totalPages||0);
   const source=draft.uploads.filter(u=>u.name===upload.name).length>1?`${upload.name} [${upload.id.slice(0,8)}]`:upload.name;
   // Duplicate bytes in the same project are one physical source, even when
   // uploaded twice under different names. They must not multiply quantities.
   documents.push({id,source});
   if(response.value.state==='complete'){
    const coverage=response.value.coverage;
     if(!coverage?.complete||!Number.isSafeInteger(response.value.progress?.totalPages)||response.value.progress.totalPages<=0||!Array.isArray(coverage.pages)||coverage.pages.length!==response.value.progress?.totalPages||coverage.pages.some((p:any,i:number)=>p.page!==i+1||p.status!=='read'||(p.source!==undefined&&p.source!==source)))throw new DraftError('Some document pages still need verification. Your files are saved; an unchecked estimate cannot be submitted.',422);
    for(const page of coverage.pages)expectedPages.add(JSON.stringify([source,page.page]));
   }
  }
  // Queue reconciliation while pages are reading. Once receipts are stored,
  // the worker can finish even when the website or browser stops polling.
  const submitted=await send('POST',base+'/reviews',Buffer.from(JSON.stringify({documents,text,answers})));
  if(submitted.status===429)return pending('Waiting to reconcile the document evidence.',{phase:'queued'},2000);
  if(!submitted.ok||!submitted.value.id)throw new DraftError('Your documents are read, but scope reconciliation could not start. Please retry.',503);
  const review=submitted.value;
  if(review.state==='failed'){
   if(retryFailed){const retried=await send('POST',base+'/reviews/'+review.id+'/retry');if(!retried.ok)throw new DraftError('The scope retry could not start. Your source evidence is saved.',503);return pending('Retrying scope reconciliation without rereading the documents.',{phase:'cross-referencing'});}
   throw new DraftError(`Scope reconciliation needs attention (${review.error||'processing error'}). Your source documents are saved.`,422);
  }
  if(!complete)return pending(totalPages?`Checked ${readPages} of ${totalPages} pages. Reading source evidence.`:'Preparing your document source records.',{readPages,totalPages});
  if(review.state!=='complete')return pending('Matching the source evidence to your project and checking only missing details.',{phase:'cross-referencing',readPages,totalPages});
  assertCompleteSourceCoverage(review.result,documents.map(d=>d.source),[...expectedPages].map(key=>{const [source,page]=JSON.parse(key);return {source,page};}),true);
  const extraction=validateExtraction(review.result);
  const coverage=extraction.documentCoverage,seen=new Set<string>();
  if(!coverage?.complete||coverage.expectedPages!==totalPages||coverage.pages.length!==totalPages||coverage.pages.some(p=>{const key=JSON.stringify([p.source,p.page]);if(p.status!=='read'||!expectedPages.has(key)||seen.has(key))return true;seen.add(key);return false;}))throw new DraftError('The returned document coverage did not match the verified uploaded pages.',503);
  return {pending:false as const,version:digest(JSON.stringify([text,answers,draft.uploads.map(f=>[f.id,f.sha256])])),analysis:{extraction,provider:'P5 Document Service',model:VERSION,analyzedAt:new Date().toISOString()}};
 }finally{await dependencies.releaseWork(draft.id,workKey,lease.token);}
}

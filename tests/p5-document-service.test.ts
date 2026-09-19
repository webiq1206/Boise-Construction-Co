import {test} from 'node:test';
import assert from 'node:assert/strict';
import {documentServiceEligible,documentServiceHeaders,remoteDocumentId,partitionDocumentServiceUploads,documentServiceReadiness,advanceMixedDocumentAnalysis,advanceDocumentService,assertCompleteSourceCoverage,assertProjectSourceCoverage,assertAnalysisMigrationSafe,readSavedSource,type DocumentAnalysisStep} from '../lib/p5/documentServiceClient.ts';
import {priceSavedScope} from '../lib/p5/pricingWork.ts';
import {analysisWorkKey} from '../lib/p5/analysisWork.ts';
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';
const pdf:any={id:'file',name:'scope.pdf',type:'application/pdf',size:1000,sha256:'a'.repeat(64),status:'stored'};
test('shared service is off by default and selects eligible PDFs within mixed inputs',()=>{
 assert.equal(documentServiceEligible([pdf],{}),false);
 assert.equal(documentServiceEligible([pdf],{P5_DOCUMENT_SERVICE_MODE:'remote'}),true);
 assert.equal(documentServiceEligible([pdf,{...pdf,type:'image/png'}],{P5_DOCUMENT_SERVICE_MODE:'remote'}),true);
 assert.equal(documentServiceEligible([{...pdf,size:60*1024*1024}],{P5_DOCUMENT_SERVICE_MODE:'remote'}),false);
 assert.equal(documentServiceEligible([{...pdf,size:0}],{P5_DOCUMENT_SERVICE_MODE:'remote'}),false);
 assert.throws(()=>documentServiceEligible([pdf],{P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_MAX_BYTES:'invalid'}),/configuration/);
});
test('routing conserves every file and never guesses an upgraded host byte limit',()=>{
 const inputs=[pdf,{...pdf,id:'photo',type:'image/png'},{...pdf,id:'sheet',type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},{...pdf,id:'large',size:250*1024*1024}];
 const routes=partitionDocumentServiceUploads(inputs,{P5_DOCUMENT_SERVICE_MODE:'remote'});
 assert.deepEqual(routes.remote.map(u=>u.id),['file']);
 assert.deepEqual(routes.local.map(u=>u.id),['photo','sheet','large']);
 assert.equal(partitionDocumentServiceUploads(inputs,{P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_MAX_BYTES:String(250*1024*1024)}).remote.length,2);
 assert.throws(()=>partitionDocumentServiceUploads(inputs,{P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_MAX_BYTES:String(251*1024*1024)}),/configuration/);
});
test('readiness is redacted, strict about URL shape, and cannot assert host readiness',()=>{
 const env={P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_URL:'https://reader.example/api/p5-documents',P5_DOCUMENT_SERVICE_KEY:'test-only-not-a-real-key-'.repeat(2)};
 const ready=documentServiceReadiness(env);
 assert.equal(ready.configurationReady,true);assert.equal(ready.hostVerified,false);
 assert.equal(ready.maxBytes,50*1024*1024);assert.equal(ready.uploadMaxBytes,250*1024*1024);
 assert.ok(!JSON.stringify(ready).includes(env.P5_DOCUMENT_SERVICE_KEY));
 for(const url of ['http://reader.example','https://user:password@reader.example','https://reader.example/unknown','https://reader.example?key=value','https://reader.example/#fragment'])assert.equal(documentServiceReadiness({...env,P5_DOCUMENT_SERVICE_URL:url}).configurationReady,false);
 assert.equal(documentServiceReadiness({...env,P5_DOCUMENT_SERVICE_KEY:'short'}).configurationReady,false);
 assert.deepEqual(documentServiceReadiness({P5_DOCUMENT_SERVICE_MODE:'local',P5_DOCUMENT_SERVICE_MAX_BYTES:'broken'}).issues,[]);
 assert.equal(documentServiceReadiness({}).state,'off');
 assert.equal(documentServiceReadiness({P5_DOCUMENT_SERVICE_MODE:'remote'}).state,'invalid');
});
const result=(summary:string,complete=true,source=summary):DocumentAnalysisStep=>({pending:false,version:summary,analysis:{provider:'fixture',model:'fixture',analyzedAt:'2026-01-01',extraction:{summary,facts:[],conflicts:[],missingInformation:[],reviewNotes:[],documentCoverage:{pages:[{source,page:1,sheet:'',revision:'',status:complete?'read':'unreadable',notes:[]}],expectedPages:1,complete}}}});
function memoryWork(){
 const saved=new Map<string,any>();
 return {
  saved,
  claimWork:async(_id:string,key:string,initial:unknown)=>({token:'00000000-0000-0000-0000-000000000000' as const,payload:structuredClone(saved.get(key)||initial)}),
  writeWork:async(_id:string,key:string,_token:string,payload:unknown)=>{saved.set(key,structuredClone(payload));},
  releaseWork:async()=>{},
 };
}
test('mixed checkpoints resume across reload and never complete while either reader is pending',async()=>{
 const previous=process.env.P5_DOCUMENT_SERVICE_MODE;process.env.P5_DOCUMENT_SERVICE_MODE='remote';
 try{
  const memory=memoryWork(),calls:{branch:string;ids:string[];names:string[];retry:boolean}[]=[];
  const draft:any={id:'fixture',uploads:[pdf,{...pdf,id:'photo123456',type:'image/png'},{...pdf,id:'sheet123456',name:'sheet.xlsx',type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}]};
  const answers:any={estimatingInstructions:'Owner supplies fixtures; exclude historic prices.'};
  const neverFetch:typeof fetch=async()=>{throw new Error('Network forbidden');};
  let localPass=0;
  const local=async(d:any,text:string,a:any,key:string,_fetch:typeof fetch,retry:boolean)=>{
   assert.equal(text,'one project');assert.deepEqual(a,answers);assert.match(key,/:local$/);
   calls.push({branch:'local',ids:d.uploads.map((u:any)=>u.id),names:d.uploads.map((u:any)=>u.name),retry});
   return ++localPass===1?{pending:true as const,progress:'still reading',retryAfterMs:1000,processing:{phase:'reading' as const,message:'still reading',updatedAt:'fixture',readSections:1,totalSections:3,currentItems:['sheet.xlsx']}}:result('photo and spreadsheet',true,'scope.pdf [photo123]');
  };
  const remote=async(d:any,_text:string,_a:any,_key:string,_fetch:typeof fetch,retry:boolean)=>{
   calls.push({branch:'remote',ids:d.uploads.map((u:any)=>u.id),names:d.uploads.map((u:any)=>u.name),retry});return result('pdf',true,'scope.pdf [file]');
  };
  const first=await advanceMixedDocumentAnalysis(draft,'one project',answers,'mixed',neverFetch,false,Date.now()+10000,local,{...memory,remoteReader:remote});
  assert.equal(first.pending,true);assert.ok(memory.saved.get('mixed').remote);
  assert.equal(memory.saved.get('mixed').processing.readSections,1);assert.equal(memory.saved.get('mixed').processing.totalSections,3);
  assert.equal(memory.saved.get('mixed').branchProcessing.local.currentItems[0],'sheet.xlsx');
  assert.equal(memory.saved.get('mixed').processing.branches.local.totalSections,3);
  const second=await advanceMixedDocumentAnalysis(structuredClone(draft),'one project',answers,'mixed',neverFetch,true,Date.now()+10000,local,{...memory,remoteReader:remote});
  assert.equal(second.pending,false);
  if(!second.pending){assert.match(second.analysis.extraction.summary,/pdf/);assert.match(second.analysis.extraction.summary,/spreadsheet/);assert.equal(second.analysis.extraction.documentCoverage?.expectedPages,2);}
  assert.deepEqual(calls.map(c=>c.branch),['local','remote','local']);
  assert.deepEqual(calls[0].ids,['photo123456','sheet123456']);assert.deepEqual(calls[1].ids,['file']);
  assert.equal(calls[2].retry,true);
  assert.equal(calls[0].names[0],'scope.pdf [photo123]');assert.equal(calls[1].names[0],'scope.pdf [file]');
 }finally{if(previous===undefined)delete process.env.P5_DOCUMENT_SERVICE_MODE;else process.env.P5_DOCUMENT_SERVICE_MODE=previous;}
});
test('an incomplete branch is never cached as a completed mixed project',async()=>{
 const previous=process.env.P5_DOCUMENT_SERVICE_MODE;process.env.P5_DOCUMENT_SERVICE_MODE='remote';
 try{
  const memory=memoryWork();
  await assert.rejects(()=>advanceMixedDocumentAnalysis({id:'fixture',uploads:[pdf,{...pdf,id:'photo',type:'image/png'}]} as any,'',{},'mixed',async()=>{throw new Error('Network forbidden');},false,Date.now()+10000,async()=>result('photo',false),{...memory,remoteReader:async()=>result('pdf')}),/still unread/);
  assert.equal(memory.saved.get('mixed')?.local,undefined);
 }finally{if(previous===undefined)delete process.env.P5_DOCUMENT_SERVICE_MODE;else process.env.P5_DOCUMENT_SERVICE_MODE=previous;}
});
test('remote protocol mocks accept all 250 verified pages and reject missing, partial or zero-page receipts',async()=>{
 const keys=['P5_DOCUMENT_SERVICE_MODE','P5_DOCUMENT_SERVICE_URL','P5_DOCUMENT_SERVICE_KEY','P5_DOCUMENT_SERVICE_MAX_BYTES'];
 const previous=keys.map(key=>process.env[key]);
 Object.assign(process.env,{P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_URL:'https://reader.example',P5_DOCUMENT_SERVICE_KEY:'fixture-signing-key-not-a-secret-12345',P5_DOCUMENT_SERVICE_MAX_BYTES:String(50*1024*1024)});
 try{
  const draft:any={id:'fixture',uploads:[pdf]};
  const pages=Array.from({length:250},(_,i)=>({source:pdf.name,page:i+1,sheet:'',revision:'',status:'read',notes:[]}));
  for(const mode of ['complete','missing','partial','zero','unknown-source','duplicate-page','document-source']){
   const memory=memoryWork();
   const request:typeof fetch=async(url,init)=>{
    assert.equal(init?.redirect,'error');
    const document={id:remoteDocumentId(ESTIMATOR_BRAND.domain,draft.id,pdf.sha256),state:'complete',progress:{checkedPages:250,totalPages:mode==='zero'?0:250},coverage:{complete:true,pages:mode==='zero'?[]:mode==='document-source'?pages.map(p=>({...p,source:'unknown.pdf'})):pages}};
    const returned=mode==='missing'?pages.slice(1):mode==='partial'?pages.map((p,i)=>i? p:{...p,status:'partial'}):mode==='unknown-source'?pages.map(p=>({...p,source:'other.pdf'})):mode==='duplicate-page'?pages.map((p,i)=>i===1?pages[0]:p):pages;
    const review={id:'review-fixture',state:'complete',result:{summary:'250 page fixture',facts:[],conflicts:[],missingInformation:[],reviewNotes:[],documentCoverage:{complete:true,expectedPages:250,pages:returned}}};
    return new Response(JSON.stringify(String(url).endsWith('/reviews')?review:document),{status:200});
   };
   const run=()=>advanceDocumentService(draft,'',{},'remote',request,false,Date.now()+10000,{...memory,query:async()=>{throw new Error('DB forbidden');},readStoredBytes:async()=>{throw new Error('Storage forbidden');}});
   if(mode==='complete'){const step=await run();assert.equal(step.pending,false);if(!step.pending)assert.equal(step.analysis.extraction.documentCoverage?.pages.length,250);}
   else await assert.rejects(run,/coverage|verification/);
  }
 }finally{keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});}
});
test('route snapshot and checkpoint identity survive a changed byte limit',async()=>{
 const previousMode=process.env.P5_DOCUMENT_SERVICE_MODE,previousLimit=process.env.P5_DOCUMENT_SERVICE_MAX_BYTES;
 process.env.P5_DOCUMENT_SERVICE_MODE='remote';process.env.P5_DOCUMENT_SERVICE_MAX_BYTES=String(50*1024*1024);
 try{
  const memory=memoryWork(),draft:any={id:'fixture',uploads:[pdf,{...pdf,id:'large',name:'large.pdf',sha256:'b'.repeat(64),size:60*1024*1024}]};
  const key=analysisWorkKey(draft,'',{}),calls:string[][]=[];
  const local=async(d:any)=>{calls.push(d.uploads.map((u:any)=>u.id));return {pending:true as const,progress:'reading'};};
  const remote=async()=>result('pdf',true,pdf.name);
  const noFetch:typeof fetch=async()=>{throw new Error('Network forbidden');};
  await advanceMixedDocumentAnalysis(draft,'',{},key,noFetch,false,Date.now()+10000,local,{...memory,remoteReader:remote});
  process.env.P5_DOCUMENT_SERVICE_MAX_BYTES=String(250*1024*1024);
  assert.equal(analysisWorkKey(draft,'',{}),key);
  await advanceMixedDocumentAnalysis(draft,'',{},key,noFetch,false,Date.now()+10000,local,{...memory,remoteReader:remote});
  assert.deepEqual(calls,[['large'],['large']]);
  assert.deepEqual(memory.saved.get(key).routes.remote.map((u:any)=>u.id),['file']);
  assert.ok(memory.saved.get(key).remote);
 }finally{
  if(previousMode===undefined)delete process.env.P5_DOCUMENT_SERVICE_MODE;else process.env.P5_DOCUMENT_SERVICE_MODE=previousMode;
  if(previousLimit===undefined)delete process.env.P5_DOCUMENT_SERVICE_MAX_BYTES;else process.env.P5_DOCUMENT_SERVICE_MAX_BYTES=previousLimit;
 }
});
test('unknown legacy checkpoints block migration rather than resetting attempts',async()=>{
 const draft:any={id:'fixture',uploads:[pdf]};
 for(const work_key of ['analysis:v8:fingerprint','analysis:document-service-v1:fingerprint','analysis:document-service-v2-52428800:fingerprint']){
  await assert.rejects(()=>assertAnalysisMigrationSafe(draft,'',{},'new',async()=>[{work_key}]),/prior attempt budgets.*no automatic rereading/i);
 }
 await assert.doesNotReject(()=>assertAnalysisMigrationSafe(draft,'',{},'current',async()=>[{work_key:'current'}]));
 await assert.rejects(()=>assertAnalysisMigrationSafe(draft,'',{},'current',async()=>{throw new Error('private database detail');}),/files are preserved/);
});
test('saved-source database and object failures are stable redacted errors',async()=>{
 const fail=async()=>{throw new Error('private backend details');};
 for(const deps of [{query:fail,readStoredBytes:fail},{query:async()=>[],readStoredBytes:fail},{query:async()=>[{name:pdf.name}],readStoredBytes:fail}]){
  await assert.rejects(()=>readSavedSource(pdf,'fixture',deps),error=>error instanceof Error&&error.name==='Error'&&/files are preserved/.test(error.message)&&!error.message.includes('private backend'));
 }
});
test('strict coverage rejects false-complete records without blocking unpaged typed evidence',()=>{
 const base:any={summary:'fixture',facts:[],conflicts:[],missingInformation:[],reviewNotes:[]};
 const page={source:'local.pdf',page:1,sheet:'',revision:'',status:'read',notes:[]};
 assert.doesNotThrow(()=>assertCompleteSourceCoverage(base,[]));
 assert.throws(()=>assertCompleteSourceCoverage(base,['local.pdf'],undefined,true),/coverage/);
 for(const coverage of [
  {complete:true,expectedPages:2,pages:[page]},
  {complete:true,expectedPages:2,pages:[page,page]},
  {complete:true,expectedPages:1,pages:[{...page,source:'unknown.pdf'}]},
  {complete:true,expectedPages:1,pages:[{...page,status:'partial'}]},
  {complete:true,expectedPages:1,pages:[{...page,page:0}]},
  {complete:true,expectedPages:0,pages:[]},
 ]){
  assert.throws(()=>assertCompleteSourceCoverage({...base,documentCoverage:coverage},['local.pdf'],[{source:'local.pdf',page:1}],true),/coverage/);
 }
 assert.doesNotThrow(()=>assertCompleteSourceCoverage({...base,documentCoverage:{complete:true,expectedPages:1,pages:[page]}},['local.pdf'],[{source:'local.pdf',page:1}],true));
 assert.doesNotThrow(()=>assertProjectSourceCoverage([],null));
 assert.throws(()=>assertProjectSourceCoverage([pdf],null),/verification is missing/);
});
test('local-only partial coverage is blocked before direct pricing touches storage or providers',async()=>{
 const partial=result('fixture',false,pdf.name);
 assert.equal(partial.pending,false);
 if(partial.pending)return;
 await assert.rejects(()=>priceSavedScope('fixture',{uploads:[pdf],extraction:partial.analysis.extraction} as any,{} as any),/still unread/);
});
test('duplicate PDF bytes make one host request and one progress/coverage contribution',async()=>{
 const keys=['P5_DOCUMENT_SERVICE_MODE','P5_DOCUMENT_SERVICE_URL','P5_DOCUMENT_SERVICE_KEY'];
 const previous=keys.map(key=>process.env[key]);
 Object.assign(process.env,{P5_DOCUMENT_SERVICE_MODE:'remote',P5_DOCUMENT_SERVICE_URL:'https://reader.example',P5_DOCUMENT_SERVICE_KEY:'fixture-signing-key-not-a-secret-12345'});
 try{
  const memory=memoryWork(),draft:any={id:'fixture',uploads:[pdf,{...pdf,id:'duplicate',name:'copy.pdf'}]};
  let gets=0,complete=false;
  const pages=Array.from({length:5},(_,i)=>({source:pdf.name,page:i+1,sheet:'',revision:'',status:'read',notes:[]}));
  const request:typeof fetch=async(url,init)=>{
   if(String(url).endsWith('/reviews')){
    assert.equal(JSON.parse(Buffer.from(init!.body as any).toString()).documents.length,1);
    return new Response(JSON.stringify({id:'review',state:complete?'complete':'reading',result:complete?{summary:'five pages',facts:[],conflicts:[],missingInformation:[],reviewNotes:[],documentCoverage:{complete:true,expectedPages:5,pages}}:undefined}));
   }
   gets++;
   return new Response(JSON.stringify({id:remoteDocumentId(ESTIMATOR_BRAND.domain,draft.id,pdf.sha256),state:complete?'complete':'reading',progress:{checkedPages:complete?5:2,totalPages:5},coverage:complete?{complete:true,pages}:undefined}));
  };
  const step=await advanceDocumentService(draft,'',{},'remote',request,false,Date.now()+10000,{...memory,query:async()=>{throw new Error('DB forbidden');},readStoredBytes:async()=>{throw new Error('Storage forbidden');}});
  assert.equal(step.pending,true);assert.equal(gets,1);assert.equal(step.processing?.readPages,2);assert.equal(step.processing?.totalPages,5);
  complete=true;
  const finished=await advanceDocumentService(draft,'',{},'remote',request,false,Date.now()+10000,{...memory,query:async()=>{throw new Error('DB forbidden');},readStoredBytes:async()=>{throw new Error('Storage forbidden');}});
  assert.equal(finished.pending,false);assert.equal(gets,2);
  if(!finished.pending)assert.equal(finished.analysis.extraction.documentCoverage?.expectedPages,5);
 }finally{keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});}
});
test('cross-site and cross-project source identities cannot collide',()=>{
 assert.notEqual(remoteDocumentId('p5homeco.com','one',pdf.sha256),remoteDocumentId('boiseconstruction.co','one',pdf.sha256));
 assert.notEqual(remoteDocumentId('p5homeco.com','one',pdf.sha256),remoteDocumentId('p5homeco.com','two',pdf.sha256));
});
test('signed source requests bind body, method and path',()=>{
 const a=documentServiceHeaders('POST','/v1/projects/one/documents','p5homeco.com','test-secret',Buffer.from('pdf'),1700000000000,'test-nonce');
 const b=documentServiceHeaders('POST','/v1/projects/two/documents','p5homeco.com','test-secret',Buffer.from('pdf'),1700000000000,'test-nonce');
 assert.notEqual(a['x-p5-signature'],b['x-p5-signature']);
 assert.equal(a['x-p5-body-sha256'].length,64);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AUTHORIZATION,prepare,run,RECIPIENT} from './lib/authenticatedRuntimeAcceptance.mts';

async function fixture(fn:(x:any)=>Promise<void>){
  const dir=await mkdtemp(join(tmpdir(),'p5-runtime-'));
  const credentialsFile=join(dir,'credentials.json'),journalFile=join(dir,'journal.json');
  const c={baseUrl:'https://qa.example',id:'01234567-1234-4123-8123-012345678901',key:'a'.repeat(64),qaMarker:'QA-isolated-test'};
  await writeFile(credentialsFile,JSON.stringify(c),{mode:0o600});
  const receiverPreflightFile=join(dir,'preflight.json');
  await writeFile(receiverPreflightFile,JSON.stringify({baseUrl:c.baseUrl,status:'reachable',dns:'resolved',readOnly:true,checkedAt:new Date().toISOString(),evidence:'Isolated fake receiver readiness fixture; no network used'}),{mode:0o600});
  const draft={id:c.id,status:'draft',revision:7,text:c.qaMarker,contact:{name:c.qaMarker,email:RECIPIENT},answers:{service:'construction'},wizard:{},reviewed:{confirmed:true}};
  const calls:any[]=[];
  const transport=async(url:string,init:RequestInit)=>{
    calls.push({url,init});
    assert.equal((init.headers as any)['x-p5-draft-id'],c.id);
    assert.equal((init.headers as any)['x-p5-draft-key'],c.key);
    assert.equal((init.headers as any).origin,c.baseUrl);
    assert.equal(init.redirect,'error');
    return Response.json(url.endsWith('/draft')&&!init.method?{draft}:{accepted:true,delivery:{customer:'sent'}});
  };
  try{await fn({c,draft,calls,transport,credentialsFile,journalFile,options:{credentialsFile,journalFile,authorization:AUTHORIZATION,expectedRevision:7,receiverPreflightFile}});}finally{await rm(dir,{recursive:true,force:true});}
}
test('preparation is offline, secure, exclusive; unauthorized run never transports',()=>fixture(async x=>{
  assert.equal((await prepare(x.credentialsFile,x.journalFile)).networkRequests,0);
  assert.equal((await stat(x.journalFile)).mode&0o777,0o600);
  await assert.rejects(prepare(x.credentialsFile,x.journalFile));
  await assert.rejects(run({...x.options,action:'submit',authorization:undefined},x.transport),/authorization/);
  assert.equal(x.calls.length,0);
}));
test('known unresolved receiver blocks before even an authenticated fetch',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);
  await assert.rejects(run({...x.options,action:'submit',receiverPreflightFile:undefined},x.transport),/NXDOMAIN/);
  assert.equal(x.calls.length,0);
}));
test('revision and recipient checks prevent mutation',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);
  await assert.rejects(run({...x.options,action:'submit',expectedRevision:6},x.transport),/revision/);
  x.draft.contact.email='other@example.com';
  await assert.rejects(run({...x.options,action:'submit'},x.transport),/allowlisted/);
  assert.ok(x.calls.every((c:any)=>!c.init.method));
}));
test('real review and submit protocol, no repeated submission',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);
  await run({...x.options,action:'review'},x.transport);
  const review=x.calls.at(-1);
  assert.equal(review.url,'https://qa.example/api/p5-estimator/draft');
  assert.equal(review.init.method,'PUT');
  assert.equal(JSON.parse(review.init.body).reviewed,true);
  await run({...x.options,action:'submit'},x.transport);
  assert.deepEqual(JSON.parse(x.calls.at(-1).init.body),{revision:7,background:true});
  await assert.rejects(run({...x.options,action:'submit'},x.transport),/already attempted/);
}));
test('ambiguous transport blocks every subsequent mutation, allows read reconciliation',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);
  const transport=async(url:string,init:RequestInit)=>{if(init.method)throw new Error('connection lost');return x.transport(url,init);};
  await assert.rejects(run({...x.options,action:'submit'},transport),/connection lost/);
  assert.equal(JSON.parse(await readFile(x.journalFile,'utf8')).entries[0].state,'intent');
  await assert.rejects(run({...x.options,action:'submit'},x.transport),/Ambiguous/);
  assert.equal((await run({...x.options,action:'inspect'},x.transport) as any).ambiguous,true);
}));
test('submitted state is never posted to delivery endpoint',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);x.draft.status='submitted';
  await assert.rejects(run({...x.options,action:'submit'},x.transport),/Already submitted/);
  assert.ok(x.calls.every((c:any)=>!c.init.method));
}));
test('analysis uses authenticated multipart with revision, no retry switch',()=>fixture(async x=>{
  x.draft.reviewed=null;
  await prepare(x.credentialsFile,x.journalFile);
  await run({...x.options,action:'analyze'},x.transport);
  const call=x.calls.at(-1);
  assert.ok(call.url.endsWith('/scope'));
  assert.equal(call.init.body.get('revision'),'7');
  assert.equal(call.init.body.get('retry'),null);
}));
test('existing QA TEST ONLY scope accepts original contact name without rewrite',()=>fixture(async x=>{
  x.c.qaMarker='QA TEST ONLY:';
  await writeFile(x.credentialsFile,JSON.stringify(x.c),{mode:0o600});
  x.draft.text='QA TEST ONLY: Existing approved scope';
  x.draft.contact.name='Jared';
  await prepare(x.credentialsFile,x.journalFile);
  await run({...x.options,action:'review'},x.transport);
  const saved=JSON.parse(x.calls.at(-1).init.body);
  assert.equal(saved.text,x.draft.text);
  assert.equal(saved.contact.name,'Jared');
}));
test('legacy QA marker must be exact scope prefix',()=>fixture(async x=>{
  x.c.qaMarker='QA TEST ONLY:';
  await writeFile(x.credentialsFile,JSON.stringify(x.c),{mode:0o600});
  x.draft.text='Customer scope mentioning QA TEST ONLY: later';
  await prepare(x.credentialsFile,x.journalFile);
  await assert.rejects(run({...x.options,action:'inspect'},x.transport),/QA scope marker/);
}));
test('existing extraction or completed saved analysis blocks paid reanalysis',()=>fixture(async x=>{
  await prepare(x.credentialsFile,x.journalFile);
  x.draft.reviewed=null;
  for(const field of ['extraction','analyzedFingerprint','reviewed']){
    x.draft[field]=field==='analyzedFingerprint'?'saved-fingerprint':{saved:true};
    await assert.rejects(run({...x.options,action:'analyze'},x.transport),/re-analysis is prohibited/);
    delete x.draft[field];
  }
  assert.ok(x.calls.every((c:any)=>!c.init.method));
  assert.deepEqual(JSON.parse(await readFile(x.journalFile,'utf8')).entries,[]);
}));
test('protocol remains wired to genuine authenticated production endpoints',async()=>{
  for(const [route,implementation] of [['draft','draftEndpoint'],['scope','scopeEndpoint'],['submit','submitEndpoint'],['pdf','customerPdfEndpoint']]){
    assert.match(await readFile(`app/api/p5-estimator/${route}/route.ts`,'utf8'),new RegExp(implementation));
    const source=await readFile(`lib/p5/${implementation}.ts`,'utf8');
    assert.match(source,/draftCredentials\(request\)/);
    assert.match(source,/readDraft\(id,key\)/);
    assert.match(source,/protectRequest\(request/);
  }
  assert.match(await readFile('lib/p5/submitEndpoint.ts','utf8'),/body\.revision!==draft\.revision/);
  assert.match(await readFile('lib/p5/store.ts','utf8'),/timingSafeEqual/);
});
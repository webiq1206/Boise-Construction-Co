import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {instructionPrompts} from '../lib/p5/clarifications.ts';
import {analysisSourceVersion} from '../lib/p5/analysisWork.ts';
import {emptyInstructions} from '../lib/p5/instructions.ts';
import {sourceTransition} from '../lib/p5/scopeEndpoint.ts';
import {isProjectReplacement} from '../lib/p5/projectReplacement.ts';
import {confirmsProjectReplacement} from '../lib/p5/draftEndpoint.ts';

test('source transitions invalidate source state while pending retries stay same-source',()=>{
  const first={sourceVersion:'source-a',sourceTextHash:'text-a'};
  assert.deepEqual(sourceTransition(first,'source-b','text-a'),{sameSource:false,sourceChanged:true,sourceTextChanged:false});
  assert.deepEqual(sourceTransition({sourceVersion:'source-a'},'source-b','text-a'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
  assert.deepEqual(sourceTransition({...first,sourceTextAppended:true},'source-b','text-b'),{sameSource:false,sourceChanged:true,sourceTextChanged:false});
  assert.deepEqual(sourceTransition({sourceVersion:'source-a',sourceTextAppended:true},'source-b','text-b'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
  assert.deepEqual(sourceTransition({...first,pendingSourceVersion:'source-b',pendingSourceTextHash:'text-a'},'source-b','text-a'),{sameSource:true,sourceChanged:false,sourceTextChanged:false});
  assert.deepEqual(sourceTransition(first,'source-c','text-c'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
});

test('only a changed project boundary resets saved source state',()=>{
  assert.equal(isProjectReplacement({previousAnswers:{service:'new-construction'},nextText:'Build a 676 SF garage-to-ADU. This project replaces the prior 2,500 SF home and 800 SF garage.'}),true);
  assert.equal(isProjectReplacement({previousAnswers:{service:'bathroom'},nextText:'This two-page repair project replaces the prior bathroom remodel.'}),true);
  assert.equal(isProjectReplacement({previousAnswers:{service:'bathroom'},nextText:'Replace the bathroom vanity and keep the existing paint.'}),false);
  const replacementExtraction={summary:'',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],instructions:{...emptyInstructions(),questions:['Does this replace the earlier project?']}};
  assert.equal(confirmsProjectReplacement(replacementExtraction as any,{}, {id:'does this replace the earlier project',answer:'Yes, it does.'}),true);
  const ordinaryExtraction={...replacementExtraction,instructions:{...replacementExtraction.instructions,questions:['Is the owner email correct?']}};
  assert.equal(confirmsProjectReplacement(ordinaryExtraction as any,{}, {id:'is the owner email correct',answer:'Yes'}),false);
});

test('lost clarification response cannot clear the server-recorded instruction',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-draft-endpoint-'));
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const database=await mod('database');const store=await mod('store');const endpoint=await mod('draftEndpoint');
    const id=randomUUID(),key=randomBytes(32).toString('hex'),question='Labor only or materials only?';
    const answer='Labor only';
    const extraction={summary:'Synthetic scope',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),questions:[question]},pages:[],takeoffs:[]};
    const sourceVersion=analysisSourceVersion('Bathroom remodel',[]);
    const questionId=instructionPrompts(extraction as any,{} )[0].id;
    await store.saveDraft(id,key,'synthetic',{text:'Bathroom remodel',answers:{service:'bathroom'},extraction,reviewed:null,contact:{name:'',email:'',phone:''},wizard:{skipped:[],resolutions:{},sourceVersion,instructionAnswers:[]}},0);
    const originalFetch=globalThis.fetch;
    process.env.OPENAI_API_KEY='synthetic';
    try{
      globalThis.fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({...extraction,instructions:{...extraction.instructions,questions:[]}})}]}]});
      const put=()=>endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:'Bathroom remodel',answers:{},clarification:{id:questionId,answer},wizard:{skipped:[],resolutions:{}}})}));
      const response=await put();assert.equal(response.status,200);
      const body=await response.json();assert.equal(body.draft.answers.service,'bathroom');assert.match(body.draft.answers.estimatingInstructions,/Answer: Labor only/);assert.equal(body.draft.wizard.instructionAnswers.length,1);
      // Simulate the browser retrying the same request after losing the first
      // response: its revision and answer snapshot are both stale.
      const retry=await put();assert.equal(retry.status,200);
      const retried=await retry.json();assert.equal(retried.draft.revision,2);assert.match(retried.draft.answers.estimatingInstructions,/Answer: Labor only/);
    }finally{globalThis.fetch=originalFetch;delete process.env.OPENAI_API_KEY;await database.database.close();}
  }finally{await rm(runtime,{recursive:true,force:true});}
});

test('same-source answer update reuses extraction without provider or document-reader calls',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-same-source-reuse-'));
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
    await writeFile(path.join(runtime,'documents.ts'),`export function verifyUpload(){throw new Error('document reader sentinel');}export async function prepareAnalysisFiles(){(globalThis as any).__p5DocumentReaderCalls=((globalThis as any).__p5DocumentReaderCalls||0)+1;throw new Error('document reader sentinel');}`);
    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const database=await mod('database');const store=await mod('store');const draftEndpoint=await mod('draftEndpoint');const scopeEndpoint=await mod('scopeEndpoint');
    const id=randomUUID(),key=randomBytes(32).toString('hex'),text='Bathroom remodel',sourceVersion=analysisSourceVersion(text,[]);
    const extraction={summary:'Acknowledged scope',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),questions:[]},documentCoverage:{expectedPages:0,complete:true,pages:[]},pages:[],takeoffs:[]};
    await store.saveDraft(id,key,'synthetic',{text,answers:{service:'bathroom'},extraction,reviewed:null,contact:{name:'',email:'',phone:''},wizard:{skipped:[],resolutions:{},sourceVersion,sourceTextHash:createHash('sha256').update(text).digest('hex'),instructionAnswers:[]}},0);
    const headers={'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'};
    const answerResponse=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers,body:JSON.stringify({revision:1,text,answers:{service:'bathroom',sqft:'80'},contact:{name:'',email:'',phone:''},wizard:{skipped:[],resolutions:{}}})}));
    assert.equal(answerResponse.status,200);
    const savedAnswer=await answerResponse.json();assert.equal(savedAnswer.draft.answers.sqft,'80');
    let providerCalls=0;(globalThis as any).__p5DocumentReaderCalls=0;
    const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{providerCalls++;throw new Error('provider sentinel');};
    try{
      const changedForm=new FormData();changedForm.set('text','Unrelated project');
      const changedResponse=await scopeEndpoint.postScope(new Request('http://test.local/api/p5-estimator/scope',{method:'POST',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key},body:changedForm}));
      assert.equal(changedResponse.status,409);assert.equal(providerCalls,0);assert.equal((globalThis as any).__p5DocumentReaderCalls,0);
      const started=performance.now();const form=new FormData();form.set('text',text);
      const response=await scopeEndpoint.postScope(new Request('http://test.local/api/p5-estimator/scope',{method:'POST',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key},body:form}));
      const elapsedMs=performance.now()-started;
      assert.equal(response.status,200);const body=await response.json();
      assert.equal(body.draft.answers.sqft,'80');assert.equal(body.draft.extraction.summary,'Acknowledged scope');assert.equal(providerCalls,0);assert.equal((globalThis as any).__p5DocumentReaderCalls,0);assert.ok(elapsedMs>=0);
      console.log(`[p5 same-source reuse] providerCalls=${providerCalls} documentReaderCalls=${(globalThis as any).__p5DocumentReaderCalls} elapsedMs=${elapsedMs.toFixed(2)}`);
    }finally{globalThis.fetch=originalFetch;}
    await database.database.close();
  }finally{await rm(runtime,{recursive:true,force:true});}
});

test('review rejects changed, pending-failed, and incomplete source analysis',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-review-source-'));
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const database=await mod('database');const store=await mod('store');const endpoint=await mod('draftEndpoint');
    const extraction=(complete=true,reviewNotes:string[]=[])=>({summary:'Reviewed fixture',facts:[],conflicts:[],reviewNotes,missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),questions:[]},documentCoverage:{expectedPages:complete?0:1,complete,pages:[]},pages:[],takeoffs:[]});
    const save=async(text:string,wizard:any,document:any,answers:any={service:'bathroom'},contact:any={name:'',email:'',phone:''})=>{
      const id=randomUUID(),key=randomBytes(32).toString('hex');
      await store.saveDraft(id,key,'synthetic',{text,answers,extraction:document,reviewed:null,contact,wizard},0);
      return {id,key};
    };
    const review=({id,key}:any,text:string)=>endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'},body:JSON.stringify({revision:1,text,answers:{service:'bathroom'},contact:{name:'',email:'',phone:''},reviewed:true})}));
    const changedText=await save('Original scope',{sourceVersion:analysisSourceVersion('Original scope',[]),instructionAnswers:[],resolutions:{},skipped:[]},extraction());
    assert.equal((await review(changedText,'Replacement scope')).status,409);
    const pending=await save('Pending scope',{sourceVersion:analysisSourceVersion('Old scope',[]),pendingSourceVersion:analysisSourceVersion('Pending scope',[]),instructionAnswers:[],resolutions:{},skipped:[]},extraction());
    assert.equal((await review(pending,'Pending scope')).status,409);
    const incomplete=await save('Incomplete scope',{sourceVersion:analysisSourceVersion('Incomplete scope',[]),instructionAnswers:[],resolutions:{},skipped:[]},extraction(false,['unread section requires review']));
    assert.equal((await review(incomplete,'Incomplete scope')).status,409);
    const textOnlyExtraction=extraction();delete (textOnlyExtraction as any).documentCoverage;
    const textOnly=await save('Text-only scope',{sourceVersion:analysisSourceVersion('Text-only scope',[]),instructionAnswers:[],resolutions:{},skipped:[]},textOnlyExtraction);
    const textOnlyReview=await review(textOnly,'Text-only scope');assert.equal(textOnlyReview.status,200);assert.ok((await textOnlyReview.json()).draft.reviewed);
    const oldText='Bathroom scope';
    const oldWizard={sourceVersion:analysisSourceVersion(oldText,[]),instructionAnswers:[],resolutions:{},skipped:[]};
    const replacement=await save(oldText,oldWizard,extraction(),{service:'bathroom',sqft:'80'},{name:'Dana Smith',email:'dana@example.com',phone:'2085550100'});
    const replaced=await endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':replacement.id,'x-p5-draft-key':replacement.key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:'Unrelated kitchen project',answers:{service:'bathroom',sqft:'80'}})}));
    assert.equal(replaced.status,200);const replacedBody=await replaced.json();assert.equal(replacedBody.draft.answers.service,'bathroom');assert.equal(replacedBody.draft.answers.sqft,'80');assert.equal(replacedBody.draft.extraction.summary,'Reviewed fixture');assert.equal(replacedBody.draft.contact.email,'');
    const appended=await save(oldText,oldWizard,extraction(),{service:'bathroom',sqft:'80'});
    const appendedResponse=await endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':appended.id,'x-p5-draft-key':appended.key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:`${oldText}\n\nAdditional notes`,answers:{service:'bathroom',sqft:'80'},contact:{name:'',email:'',phone:''}})}));
    assert.equal(appendedResponse.status,200);const appendedBody=await appendedResponse.json();assert.equal(appendedBody.draft.answers.service,'bathroom');assert.equal(appendedBody.draft.answers.sqft,'80');assert.equal(appendedBody.draft.extraction.summary,'Reviewed fixture');assert.equal(appendedBody.draft.wizard.sourceTextAppended,true);
    const corrective=await save(oldText,oldWizard,extraction(),{service:'bathroom',sqft:'80'});
    const correctiveResponse=await endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':corrective.id,'x-p5-draft-key':corrective.key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:`${oldText}\n\nActually include painting instead`,answers:{service:'bathroom',sqft:'80'},contact:{name:'',email:'',phone:''}})}));
    assert.equal(correctiveResponse.status,200);const correctiveBody=await correctiveResponse.json();assert.equal(correctiveBody.draft.answers.service,'bathroom');assert.equal(correctiveBody.draft.answers.sqft,'80');assert.equal(correctiveBody.draft.extraction.summary,'Reviewed fixture');assert.equal(correctiveBody.draft.wizard.sourceTextAppended,undefined);
    await database.database.close();
  }finally{await rm(runtime,{recursive:true,force:true});}
});

test('explicit replacement clears old scope through analysis and repeat saves',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-project-replacement-'));
  const originalFetch=globalThis.fetch,originalStorage=process.env.P5_OBJECT_STORAGE_ENABLED,originalOpenAi=process.env.OPENAI_API_KEY;
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const database=await mod('database');const store=await mod('store');const draftEndpoint=await mod('draftEndpoint');const scopeEndpoint=await mod('scopeEndpoint');
    const id=randomUUID(),key=randomBytes(32).toString('hex');
    const oldText='Build a 2,500 SF new home with an 800 SF garage.';
    const oldExtraction={summary:'Old home',facts:[{field:'service',value:'new-construction',confidence:.99,source:'typed scope',evidence:oldText,basis:'stated'}],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),questions:['Does this new ADU replace the prior home project?']},pages:[],takeoffs:[]};
    await store.saveDraft(id,key,'synthetic',{text:oldText,answers:{service:'new-construction',sqft:'2500',garageIncluded:'yes',garageSqft:'800',taskList:'Build the original home',exclusions:'Exclude bathroom painting'},extraction:oldExtraction,reviewed:null,contact:{name:'Saved Customer',email:'saved@example.com',phone:''},wizard:{skipped:[],resolutions:{},sourceVersion:analysisSourceVersion(oldText,[]),sourceTextHash:createHash('sha256').update(oldText).digest('hex'),instructionAnswers:[]}},0);
    const headers={'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'};
    const replacementText='Build a 676 SF garage-to-ADU.';
    const changedService=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers,body:JSON.stringify({revision:1,text:replacementText,answers:{service:'adu',sqft:'676',garageIncluded:'yes',garageSqft:'800',taskList:'Build the original home',exclusions:'Exclude bathroom painting'},contact:{name:'Saved Customer',email:'saved@example.com',phone:''}})}));
    assert.equal(changedService.status,200);const changedServiceBody=await changedService.json();
    // A service correction alone is retained until the visitor explicitly
    // confirms that it is a replacement project.
    assert.equal(changedServiceBody.draft.answers.exclusions,'Exclude bathroom painting');
    const replacementQuestion=changedServiceBody.questions.find((question:any)=>/replace the prior home/i.test(question.reason));
    assert.ok(replacementQuestion?.instructionId);
    const replacement=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers,body:JSON.stringify({revision:changedServiceBody.draft.revision,text:replacementText,answers:changedServiceBody.draft.answers,contact:changedServiceBody.draft.contact,clarification:{id:replacementQuestion.instructionId,answer:'Yes, this replaces it.'}})}));
    assert.equal(replacement.status,200);const replacementBody=await replacement.json();
    assert.deepEqual(replacementBody.draft.answers,{service:'adu',sqft:'676'});assert.equal(replacementBody.draft.extraction,null);assert.equal(replacementBody.draft.wizard.replacement,true);assert.equal(replacementBody.draft.contact.email,'saved@example.com');
    const newExtraction={summary:'676 SF ADU conversion',facts:[{field:'service',value:'adu',confidence:.99,source:'typed scope',evidence:replacementText,basis:'stated'},{field:'sqft',value:'676',confidence:.99,source:'typed scope',evidence:replacementText,basis:'stated'},{field:'taskList',value:'Convert the garage to an ADU',confidence:.99,source:'typed scope',evidence:replacementText,basis:'stated'}],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:emptyInstructions(),pages:[],takeoffs:[]};
    process.env.OPENAI_API_KEY='synthetic';process.env.P5_OBJECT_STORAGE_ENABLED='false';
    let responseExtraction:any=newExtraction,failAnalysis=true;let providerInputs:string[]=[];
    globalThis.fetch=async(_url,init)=>{providerInputs.push(String(init?.body||''));if(failAnalysis)throw new Error('synthetic failed replacement analysis');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(responseExtraction)}]}]});};
    const form=new FormData();form.set('text',replacementText);
    const failedAnalysis=await scopeEndpoint.postScope(new Request('http://test.local/api/p5-estimator/scope',{method:'POST',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key},body:form}));
    assert.equal(failedAnalysis.status,200);const failedBody=await failedAnalysis.json();
    assert.deepEqual(failedBody.draft.answers,{service:'adu',sqft:'676'});assert.equal(failedBody.draft.wizard.replacement,true);
    const refetched=await draftEndpoint.getDraft(new Request('http://test.local/api/p5-estimator/draft',{headers:{'x-p5-draft-id':id,'x-p5-draft-key':key}}));
    assert.equal(refetched.status,200);assert.deepEqual((await refetched.json()).draft.answers,{service:'adu',sqft:'676'});
    failAnalysis=false;const retryForm=new FormData();retryForm.set('text',replacementText);retryForm.set('retry','true');
    const analyzed=await scopeEndpoint.postScope(new Request('http://test.local/api/p5-estimator/scope',{method:'POST',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key},body:retryForm}));
    assert.equal(analyzed.status,200);const analyzedBody=await analyzed.json();
    assert.equal(analyzedBody.draft.answers.service,'adu');assert.equal(analyzedBody.draft.answers.sqft,'676');assert.equal(analyzedBody.draft.answers.garageSqft,undefined);assert.equal(analyzedBody.draft.answers.exclusions,undefined);assert.equal(analyzedBody.draft.wizard.replacement,undefined);assert.equal(analyzedBody.questions.some((q:any)=>/old task list/i.test(q.reason)),false);
    const repeat=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers,body:JSON.stringify({revision:analyzedBody.draft.revision,text:replacementText,answers:analyzedBody.draft.answers,contact:analyzedBody.draft.contact,wizard:analyzedBody.draft.wizard})}));
    assert.equal(repeat.status,200);const repeated=await repeat.json();
    assert.equal(repeated.draft.answers.service,'adu');assert.equal(repeated.draft.answers.taskList,'Convert the garage to an ADU');assert.equal(repeated.draft.answers.exclusions,undefined);assert.equal(repeated.questions.some((q:any)=>/old task list/i.test(q.reason)),false);
    const stale=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers,body:JSON.stringify({revision:failedBody.draft.revision,text:replacementText,answers:failedBody.draft.answers,contact:failedBody.draft.contact})}));
    assert.equal(stale.status,409);
    const afterStale=await draftEndpoint.getDraft(new Request('http://test.local/api/p5-estimator/draft',{headers:{'x-p5-draft-id':id,'x-p5-draft-key':key}}));
    const activeAfterStale=(await afterStale.json()).draft;assert.equal(activeAfterStale.answers.service,'adu');assert.equal(activeAfterStale.answers.sqft,'676');assert.equal(activeAfterStale.answers.exclusions,undefined);assert.equal((activeAfterStale.uploads||[]).some((file:any)=>/old|bathroom|painting/i.test(file.name)),false);

    const repairId=randomUUID(),repairKey=randomBytes(32).toString('hex'),bathroomText='Remodel the existing bathroom.';
    const bathroomExtraction={summary:'Old bathroom',facts:[{field:'service',value:'bathroom',confidence:.99,source:'typed scope',evidence:bathroomText,basis:'stated'}],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),exclusions:['Bathroom painting'],questions:['Should bathroom painting stay excluded?']},pages:[],takeoffs:[]};
    await store.saveDraft(repairId,repairKey,'synthetic',{text:bathroomText,answers:{service:'bathroom',sqft:'80',taskList:'Remodel bathroom',exclusions:'Bathroom painting is excluded'},extraction:bathroomExtraction,reviewed:null,contact:{name:'Saved Customer',email:'saved@example.com',phone:''},wizard:{skipped:[],resolutions:{},sourceVersion:analysisSourceVersion(bathroomText,[]),sourceTextHash:createHash('sha256').update(bathroomText).digest('hex'),instructionAnswers:[]}},0);
    await store.saveUpload(repairId,repairKey,{name:'old-bathroom-page.txt',type:'text/plain',data:Buffer.from('Bathroom painting is excluded.')});
    const repairHeaders={'x-p5-draft-id':repairId,'x-p5-draft-key':repairKey,'content-type':'application/json'};
    const repairText='This two-page repair project replaces the prior bathroom remodel. Repair two sticking doors.';
    const repairSave=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:repairHeaders,body:JSON.stringify({revision:1,text:repairText,answers:{service:'handyman',sqft:'80',taskList:'Repair two sticking doors',exclusions:'Bathroom painting is excluded'}})}));
    assert.equal(repairSave.status,200);assert.equal((await repairSave.json()).draft.answers.exclusions,undefined);
    await store.saveUpload(repairId,repairKey,{name:'repair-page-1.txt',type:'text/plain',data:Buffer.from('Repair two sticking doors, page 1.')});
    await store.saveUpload(repairId,repairKey,{name:'repair-page-2.txt',type:'text/plain',data:Buffer.from('Repair two sticking doors, page 2.')});
    responseExtraction={summary:'Two-page door repair scope',facts:[{field:'service',value:'handyman',confidence:.99,source:'repair.pdf',evidence:'Repair two sticking doors',basis:'stated'},{field:'taskList',value:'Repair two sticking doors',confidence:.99,source:'repair.pdf',evidence:'Repair two sticking doors',basis:'stated'}],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:emptyInstructions(),pages:[{source:'repair.pdf',page:1,sheet:'1',revision:'',status:'read',notes:[]},{source:'repair.pdf',page:2,sheet:'2',revision:'',status:'read',notes:[]}],takeoffs:[]};
    providerInputs=[];const repairForm=new FormData();repairForm.set('text',repairText);
    const repairAnalysis=await scopeEndpoint.postScope(new Request('http://test.local/api/p5-estimator/scope',{method:'POST',headers:{'x-p5-draft-id':repairId,'x-p5-draft-key':repairKey},body:repairForm}));
    assert.equal(repairAnalysis.status,200);const repairBody=await repairAnalysis.json();
    assert.equal(repairBody.draft.answers.service,'handyman');assert.equal(repairBody.draft.answers.exclusions,undefined);assert.deepEqual(repairBody.draft.uploads.map((file:any)=>file.name),['repair-page-1.txt','repair-page-2.txt']);assert.equal(providerInputs.some(body=>/bathroom painting|old-bathroom-page/i.test(body)),false);assert.equal(providerInputs.every(body=>/repair-page-[12]\.txt/i.test(body)),true);assert.equal(repairBody.questions.some((q:any)=>/bathroom painting/i.test(`${q.reason} ${q.detail||''}`)),false);
    const repairRepeat=await draftEndpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:repairHeaders,body:JSON.stringify({revision:repairBody.draft.revision,text:repairText,answers:repairBody.draft.answers,contact:repairBody.draft.contact,wizard:repairBody.draft.wizard})}));
    assert.equal(repairRepeat.status,200);assert.equal((await repairRepeat.json()).draft.answers.exclusions,undefined);
    await database.database.close();
  }finally{
    globalThis.fetch=originalFetch;
    if(originalStorage===undefined)delete process.env.P5_OBJECT_STORAGE_ENABLED;else process.env.P5_OBJECT_STORAGE_ENABLED=originalStorage;
    if(originalOpenAi===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalOpenAi;
    await rm(runtime,{recursive:true,force:true});
  }
});
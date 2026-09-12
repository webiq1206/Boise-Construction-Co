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

test('source transitions invalidate source state while pending retries stay same-source',()=>{
  const first={sourceVersion:'source-a',sourceTextHash:'text-a'};
  assert.deepEqual(sourceTransition(first,'source-b','text-a'),{sameSource:false,sourceChanged:true,sourceTextChanged:false});
  assert.deepEqual(sourceTransition({sourceVersion:'source-a'},'source-b','text-a'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
  assert.deepEqual(sourceTransition({...first,sourceTextAppended:true},'source-b','text-b'),{sameSource:false,sourceChanged:true,sourceTextChanged:false});
  assert.deepEqual(sourceTransition({sourceVersion:'source-a',sourceTextAppended:true},'source-b','text-b'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
  assert.deepEqual(sourceTransition({...first,pendingSourceVersion:'source-b',pendingSourceTextHash:'text-a'},'source-b','text-a'),{sameSource:true,sourceChanged:false,sourceTextChanged:false});
  assert.deepEqual(sourceTransition(first,'source-c','text-c'),{sameSource:false,sourceChanged:true,sourceTextChanged:true});
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
    assert.equal(replaced.status,200);const replacedBody=await replaced.json();assert.equal(replacedBody.draft.answers.service,undefined);assert.equal(replacedBody.draft.answers.sqft,undefined);assert.equal(replacedBody.draft.extraction,null);assert.equal(replacedBody.draft.contact.email,'dana@example.com');
    const appended=await save(oldText,oldWizard,extraction(),{service:'bathroom',sqft:'80'});
    const appendedResponse=await endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':appended.id,'x-p5-draft-key':appended.key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:`${oldText}\n\nAdditional notes`,answers:{service:'bathroom',sqft:'80'},contact:{name:'',email:'',phone:''}})}));
    assert.equal(appendedResponse.status,200);const appendedBody=await appendedResponse.json();assert.equal(appendedBody.draft.answers.service,'bathroom');assert.equal(appendedBody.draft.answers.sqft,'80');assert.equal(appendedBody.draft.extraction.summary,'Reviewed fixture');assert.equal(appendedBody.draft.wizard.sourceTextAppended,true);
    const corrective=await save(oldText,oldWizard,extraction(),{service:'bathroom',sqft:'80'});
    const correctiveResponse=await endpoint.putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':corrective.id,'x-p5-draft-key':corrective.key,'content-type':'application/json'},body:JSON.stringify({revision:1,text:`${oldText}\n\nActually include painting instead`,answers:{service:'bathroom',sqft:'80'},contact:{name:'',email:'',phone:''}})}));
    assert.equal(correctiveResponse.status,200);const correctiveBody=await correctiveResponse.json();assert.equal(correctiveBody.draft.answers.service,undefined);assert.equal(correctiveBody.draft.answers.sqft,undefined);assert.equal(correctiveBody.draft.extraction,null);assert.equal(correctiveBody.draft.wizard.sourceTextAppended,undefined);
    await database.database.close();
  }finally{await rm(runtime,{recursive:true,force:true});}
});
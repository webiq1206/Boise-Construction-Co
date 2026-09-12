import test from 'node:test';
import assert from 'node:assert/strict';
import {instructionPrompts,removeInstructionAnswers,splitInstructionQuestions,upsertInstructionAnswer} from '../lib/p5/clarifications.ts';
import {require as tsxRequire} from 'tsx/cjs/api';
import {pathToFileURL} from 'node:url';
const resolver=()=>tsxRequire('../lib/p5/clarificationAnswer.ts',pathToFileURL(`${process.cwd()}/tests/p5-clarifications.test.ts`).href) as typeof import('../lib/p5/clarificationAnswer.ts');
import {emptyInstructions} from '../lib/p5/instructions.ts';
import {scopeQuestions} from '../lib/p5/adaptive.ts';
import {mergeServerClarificationAnswers} from '../lib/p5/draftEndpoint.ts';
import type {ScopeExtraction} from '../lib/p5/scope.ts';
const scope=():ScopeExtraction=>({summary:'Trim scope',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],instructions:{...emptyInstructions(),inclusions:['Trim'],exclusions:['Plumbing'],questions:['Labor only or materials only?','Should we include or exclude painting?']},documentCoverage:{expectedPages:80,complete:true,pages:[]},takeoffs:[]});

test('legacy paragraphs become distinct, concise questions and exact duplicates collapse',()=>{
  const e=scope();e.instructions!.questions=['Labor only or materials only? Should we include or exclude painting?','Labor only or materials only?'];
  const q=instructionPrompts(e,{});assert.equal(q.length,2);assert.deepEqual(q[0].values,['Labor only','Materials only','Labor and materials']);assert.equal(q[1].question,'Should we include or exclude painting?');
});
test('sentence splitting preserves decimals, units and context fragments',()=>{
  assert.deepEqual(splitInstructionQuestions('Confirm 36.5 sq. ft. of flooring. Include the matching baseboard.'),['Confirm 36.5 sq. ft. of flooring.','Include the matching baseboard.']);
  const e=scope();e.instructions!.questions=['Confirm 36.5 sq. ft. of flooring. Include the matching baseboard.'];
  assert.deepEqual(instructionPrompts(e,{}).map(q=>q.question),['Confirm 36.5 sq. ft. of flooring.','Include the matching baseboard.']);
});
test('legacy company-fit questions use the service picker instead of an instruction loop',()=>{
  const e=scope();e.instructions!.questions=['Does the submitted scope require residential remodel work?','Which of the following services does your requested estimate cover?'];
  const q=scopeQuestions({},e);assert.equal(q.some(q=>q.instructionId),false);assert.ok(q.find(q=>q.field==='service')?.values?.length);
  e.instructions!.questions=['Which of the following services does your estimate cover? Should we include or exclude painting?'];
  assert.deepEqual(instructionPrompts(e,{}).map(q=>q.question),['Should we include or exclude painting?']);
});
test('a supplied clarification answer is not asked again and replacement does not retain the old answer',()=>{
  const e=scope();
  const first=upsertInstructionAnswer('', 'Labor only or materials only?', 'Labor only');
  assert.deepEqual(instructionPrompts(e,{estimatingInstructions:first}).map(q=>q.question),['Should we include or exclude painting?']);
  const replaced=upsertInstructionAnswer(first,'Labor only or materials only?','Materials only');
  assert.match(replaced,/Answer: Materials only/);assert.doesNotMatch(replaced,/Answer: Labor only/);
  assert.equal(removeInstructionAnswers(replaced,[{id:'labor only or materials only',question:'Labor only or materials only?',answer:'Materials only'}]),'');
});
test('clarification updates instructions without sending documents or changing page coverage',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  process.env.OPENAI_API_KEY='synthetic';delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const e=scope();const id=instructionPrompts(e,{})[0].id;let calls=0;
  const request:typeof fetch=async(_url,options)=>{
    calls++;const body=JSON.parse(String(options?.body));assert.equal(body.input[0].content.some((c:any)=>c.type==='input_file'||c.type==='input_image'),false);
    const output={summary:'',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...e.instructions,laborOnly:true,questions:[]},pages:[],takeoffs:[]};
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});
  };
  try{
    const result=await resolveInstructionAnswer(e,{service:'handyman'},{id,answer:'Labor only'},[],request);
    assert.equal(calls,1);assert.equal(result.extraction?.documentCoverage,e.documentCoverage);assert.equal(result.extraction?.takeoffs,e.takeoffs);
    assert.deepEqual(result.extraction?.instructions?.exclusions,['Plumbing']);assert.equal(result.extraction?.instructions?.laborOnly,true);
    assert.deepEqual(instructionPrompts(result.extraction,result.answers).map(q=>q.question),['Should we include or exclude painting?']);
     const repeated=await resolveInstructionAnswer(result.extraction,{}, {id,answer:'Labor only'},result.history,request);
     assert.equal(calls,1);assert.equal(repeated.history.length,1);assert.match(repeated.answers.estimatingInstructions||'',/Answer: Labor only/);
  }finally{delete process.env.OPENAI_API_KEY;}
});
test('draft clarification retry reconstructs the acknowledged answer from server history',()=>{
  const e=scope();const prompt=instructionPrompts(e,{})[0];
  const saved=upsertInstructionAnswer('',prompt.question,'Labor only');
  const restored=mergeServerClarificationAnswers({}, {estimatingInstructions:saved},[{id:prompt.id,question:prompt.question,answer:'Labor only'}],true);
  assert.match(restored.estimatingInstructions||'',/Answer: Labor only/);
});
test('retrying an acknowledged answer does not invoke analysis again',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  const e=scope();const prompt=instructionPrompts(e,{})[0];let calls=0;
  process.env.OPENAI_API_KEY='synthetic';
  try{
    const result=await resolveInstructionAnswer(e,{estimatingInstructions:upsertInstructionAnswer('',prompt.question,'Labor only')},{id:prompt.id,answer:'Labor only'},[{id:prompt.id,question:prompt.question,answer:'Labor only'}],async()=>{calls++;throw new Error('provider should not be called');});
    assert.equal(calls,0);assert.deepEqual(instructionPrompts(result.extraction,result.answers).map(q=>q.question),['Should we include or exclude painting?']);
  }finally{delete process.env.OPENAI_API_KEY;}
});
test('invalid or stale clarification cannot replace the server extraction',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  await assert.rejects(resolveInstructionAnswer(scope(),{},{id:'forged',answer:'yes'}),/question has changed/);
  await assert.rejects(resolveInstructionAnswer(scope(),{},{id:'x',answer:''}),/Enter an answer/);
});

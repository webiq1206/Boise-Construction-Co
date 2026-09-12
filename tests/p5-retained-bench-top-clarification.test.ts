import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {instructionPrompts} from '../lib/p5/clarifications.ts';
import {applyRetainedBenchTopSelection,retainedBenchTopSelectionGuidance,RETAINED_BENCH_TOP_QUESTION} from '../lib/p5/retainedBenchTopSelection.ts';
import {emptyInstructions} from '../lib/p5/instructions.ts';
import {priceCompleteScope,selectedScopeIssues} from '../lib/p5/scopePricing.ts';
import {createPlanningConfiguration,PLANNING_MODEL_VERSION} from '../lib/p5/planningBooks.ts';

const answer='Option 2: matching painted MDF/wood bench top only. Exclude butcher block, laminate and quartz alternatives. Include the two cabinet units and 9 knobs/pulls. Assembly 2 hours + cabinet installation 8 hours + selected top fabrication/install 4 hours = 14 labor hours.';
const extraction=()=>({
  summary:'Retained cabinet drawing',
  facts:[
    {field:'otherDetails' as const,value:'Bench top is 13.3 LF.',confidence:.98,source:'cabinet-plan.pdf',evidence:'Bench-top length is 13.3 LF; no base or tall cabinet run is labeled.',basis:'stated' as const},
    {field:'alternates' as const,value:'butcher block 5h, matching painted MDF/wood 4h, laminate 2h, quartz 5h',confidence:.98,source:'cabinet-plan.pdf',evidence:'Bench-top options: butcher block 5h, matching painted MDF/wood 4h, laminate 2h, quartz 5h. Base assembly 2h + cabinet installation 8h.',basis:'stated' as const},
    {field:'laborHours' as const,value:'10',confidence:.98,source:'cabinet-plan.pdf',evidence:'Prior selected-package labor subtotal: 10 hours.',basis:'stated' as const},
  ],
  conflicts:[],missingInformation:[],reviewNotes:[],
  instructions:{...emptyInstructions(),questions:[RETAINED_BENCH_TOP_QUESTION]},
  documentCoverage:{expectedPages:1,complete:true,pages:[{source:'cabinet-plan.pdf',page:1,sheet:'A4',revision:'R1',status:'read' as const,notes:['Bench-top options and cabinet schedule read.']}]},
  takeoffs:[{id:'bench-top',description:'Bench top',building:'Main',floor:'1',component:'bench top',quantity:13.3,unit:'LF',basis:'stated' as const,evidence:'Bench top is labeled 13.3 LF.',sources:[{source:'cabinet-plan.pdf',page:1,sheet:'A4',revision:'R1'}],supersedes:[],issues:[]}],
});

test('saved retained bench-top clarification carries selected-only scope into pricing without rereading source pages',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-retained-bench-top-'));
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const [{analysisSourceVersion},{saveDraft,readDraft},{putDraft},{priceCompleteScope},{createPlanningConfiguration},planning]=await Promise.all([
      mod('analysisWork'),mod('store'),mod('draftEndpoint'),mod('scopePricing'),mod('planningBooks'),mod('planningBooks'),
    ]);
    const id=randomUUID(),key=randomBytes(32).toString('hex'),text='Retained cabinet scope.';
    const original=extraction(),sourceVersion=analysisSourceVersion(text,[]);
    const prompt=instructionPrompts(original,{})[0];
    await saveDraft(id,key,'synthetic',{text,answers:{service:'handyman'},extraction:original,reviewed:null,contact:{name:'',email:'',phone:''},wizard:{skipped:[],resolutions:{},sourceVersion,instructionAnswers:[]}},0);
    const originalFetch=globalThis.fetch;let providerCalls=0;
    globalThis.fetch=async()=>{providerCalls++;throw new Error('the retained page must not be reread');};
    try{
      const response=await putDraft(new Request('http://test.local/api/p5-estimator/draft',{method:'PUT',headers:{'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'},body:JSON.stringify({revision:1,text,reviewed:true,answers:{service:'handyman'},clarification:{id:prompt.id,answer},wizard:{skipped:[],resolutions:{}}})}));
      assert.equal(response.status,200);const body=await response.json(),saved=body.draft;
      assert.equal(providerCalls,0);
      assert.equal(saved.answers.laborHours,'14');assert.equal(saved.answers.materials,'matching painted MDF/wood');
      assert.match(saved.answers.taskList,/2 cabinet units/);
      assert.equal(saved.answers.cabinetBaseLf,undefined);assert.equal(saved.answers.cabinetTallLf,undefined);assert.equal(saved.extraction.takeoffs[0].quantity,13.3);
      assert.deepEqual(saved.extraction.documentCoverage,original.documentCoverage);assert.deepEqual(saved.extraction.takeoffs,original.takeoffs);
      assert.match(saved.extraction.facts[1].value,/butcher block.*laminate.*quartz/i);
      assert.deepEqual(instructionPrompts(saved.extraction,saved.answers),[]);
      assert.equal(saved.reviewed.answers.laborHours,'14');
      assert.equal(saved.wizard.resolutions.laborHours,'14');
      const persisted=await readDraft(id,key);assert.equal(persisted?.answers.laborHours,'14');

      const required=['03-17-01-M','03-17-01-L','03-15-02-M','03-15-02-L','03-16-01-M','03-16-01-L','03-14-01-M','03-14-01-L','03-04-01','03-04-02','03-04-03','03-05-02-M','03-05-02-L','REF-GENERAL-HOUR','REF-PLUMBING-HOUR','REF-ELECTRICAL-HOUR'];
      const catalog={version:planning.PLANNING_MODEL_VERSION,source:'Synthetic only',authorizedBy:'Synthetic only',importedAt:'2026-09-11T00:00:00.000Z',rates:required.map((code:string)=>({code,description:'Synthetic '+code,type:code==='REF-GENERAL-HOUR'||code.endsWith('-L')?'Labor':code.endsWith('-M')?'Material':'Other',unit:code.includes('HOUR')?'HR':'LF',amount:100,source:'Synthetic only',basis:'owner-average-cost' as const}))};
      const config=createPlanningConfiguration(catalog);
      let stage=0;
      const priced=await priceCompleteScope(saved.reviewed,config,async(_instructions:string,input:unknown)=>{
        const data=input as any;
        assert.deepEqual(data.selectedScope?.exclude,['butcher block','laminate','quartz']);
        assert.equal(data.selectedScope?.laborSubtotal,14);
        if(stage===0){stage++;return {value:{tasks:[{id:'selected-bench-top',description:'Matching painted MDF/wood bench top, two cabinet units and 9 knobs/pulls',evidence:'Visitor selected Option 2; 14 labor hours'}],issues:[]},sourceUrls:[]};}
        if(stage===1){stage++;return {value:{tasks:[{id:'selected-bench-top',description:'Matching painted MDF/wood bench top, two cabinet units and 9 knobs/pulls',evidence:'Visitor selected Option 2; 14 labor hours',existingLineIds:[],additions:[{code:'REF-GENERAL-HOUR',quantity:14,quantityEvidence:'Visitor-confirmed assembly 2 + installation 8 + top 4 hours.'}],researchDescription:'',issues:[]}],issues:[]},sourceUrls:[]};}
        assert.deepEqual(data.tasks.map((task:any)=>task.id),['selected-bench-top']);
        return {value:{coveredTaskIds:['selected-bench-top'],issues:[]},sourceUrls:[]};
      },new Date('2026-09-11T00:00:00.000Z'));
      assert.ok(priced.customer.range);assert.equal(priced.internal.lines.find((line:any)=>line.id==='scope-1')?.quantity,14);
    }finally{globalThis.fetch=originalFetch;}
  }finally{await rm(runtime,{recursive:true,force:true});}
});

test('an exclusion-only or conflicting retained-answer never chooses a bench-top option',()=>{
  for(const incomplete of ['Exclude butcher block, laminate and quartz alternatives.','Option 2: matching painted MDF/wood bench top only. Exclude matching painted MDF/wood.']){
    const original=extraction();
    assert.equal(applyRetainedBenchTopSelection(original,{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,incomplete),null);
    const next=instructionPrompts(original,{service:'handyman'});
    assert.deepEqual(next.map(prompt=>prompt.question),[RETAINED_BENCH_TOP_QUESTION]);
    assert.equal(next[0].values,undefined);
  }
  const applied=applyRetainedBenchTopSelection(extraction(),{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,answer);
  assert.ok(applied);assert.equal(retainedBenchTopSelectionGuidance(applied.answers,applied.extraction)?.laborSubtotal,14);
  assert.deepEqual(retainedBenchTopSelectionGuidance(applied.answers,applied.extraction)?.benchTopQuantity?.quantity,13.3);
  const short=applyRetainedBenchTopSelection(extraction(),{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,'Option 2');
  assert.equal(short?.answers.materials,'matching painted MDF/wood');
  for(const clause of ['Option 2, not Option 1.','Exclude butcher block and select matching painted MDF/wood.','Select matching painted MDF/wood, and exclude butcher block.','Exclude all options except Option 2.']){
    assert.equal(applyRetainedBenchTopSelection(extraction(),{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,clause)?.answers.materials,'matching painted MDF/wood');
  }
  const separate=applyRetainedBenchTopSelection(extraction(),{service:'handyman',taskList:'Driveway excavation 16 hours and concrete 24 hours = 40 hours.'},RETAINED_BENCH_TOP_QUESTION,answer);
  assert.equal(separate?.answers.laborHours,undefined);
  assert.match(separate?.answers.taskList||'',/14 labor-hour subtotal/);
});

test('four retained choices, not their display order or answer wording, control every option selection',()=>{
  const reordered=extraction();
  reordered.facts[1]={...reordered.facts[1],value:'Option 3: quartz 5h; Option 1: butcher block 5h; Option 4: laminate 2h; Option 2: matching painted MDF/wood 4h',evidence:'Bench-top options: Option 3 quartz 5h; Option 1 butcher block 5h; Option 4 laminate 2h; Option 2 matching painted MDF/wood 4h. Base assembly 2h + cabinet installation 8h.'};
  for(const [option,material,hours] of [[1,'butcher block',15],[2,'matching painted MDF/wood',14],[3,'quartz',15],[4,'laminate',12]] as const){
    const resolved=applyRetainedBenchTopSelection(reordered,{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,`Option ${option}`);
    assert.equal(resolved?.answers.materials,material);assert.match(resolved?.answers.taskList||'',new RegExp(`${hours} labor-hour subtotal`));
  }
  const incomplete=extraction();incomplete.facts[1]={...incomplete.facts[1],value:'butcher block 5h, matching painted MDF/wood 4h, laminate 2h',evidence:'Bench-top options: butcher block 5h, matching painted MDF/wood 4h, laminate 2h. Base assembly 2h + cabinet installation 8h.'};
  assert.equal(applyRetainedBenchTopSelection(incomplete,{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,'Option 2'),null);
});

test('selected-scope pricing fails closed on an excluded alternative or changed selected-package labor',async()=>{
  const applied=applyRetainedBenchTopSelection(extraction(),{service:'handyman'},RETAINED_BENCH_TOP_QUESTION,'Option 2')!;
  const scope={text:'Retained cabinet scope',answers:applied.answers,extraction:applied.extraction,uploads:[],reviewedAt:'2026-09-11T00:00:00.000Z',corrections:[]};
  const required=['03-17-01-M','03-17-01-L','03-15-02-M','03-15-02-L','03-16-01-M','03-16-01-L','03-14-01-M','03-14-01-L','03-04-01','03-04-02','03-04-03','03-05-02-M','03-05-02-L','REF-GENERAL-HOUR','REF-PLUMBING-HOUR','REF-ELECTRICAL-HOUR'];
  const catalog={version:PLANNING_MODEL_VERSION,source:'Synthetic only',authorizedBy:'Synthetic only',importedAt:'2026-09-11T00:00:00.000Z',rates:required.map(code=>({code,description:'Synthetic '+code,type:code==='REF-GENERAL-HOUR'||code.endsWith('-L')?'Labor':code.endsWith('-M')?'Material':'Other',unit:code.includes('HOUR')?'HR':'LF',amount:100,source:'Synthetic only',basis:'owner-average-cost' as const}))};
  for(const [description,hours,code] of [['Quartz bench top alternative',14,'REF-GENERAL-HOUR'],['Matching painted MDF/wood bench top',12,'REF-GENERAL-HOUR'],['Matching painted MDF/wood bench top',0,'REF-GENERAL-HOUR'],['Matching painted MDF/wood bench top',14,'03-17-01-L']] as const){
    const result=await priceCompleteScope(scope,createPlanningConfiguration(catalog),async(_instruction,input)=>{
      const data=input as any;
      if(!data.taskBatch&&!data.tasks)return {value:{tasks:[{id:'selected',description,evidence:'Synthetic retained-choice task'}],issues:[]},sourceUrls:[]};
      if(data.taskBatch)return {value:{tasks:data.taskBatch.map((task:any)=>({...task,existingLineIds:[],additions:[{code,quantity:hours,quantityEvidence:'Synthetic labor mapping'}],researchDescription:'',issues:[]})),issues:[]},sourceUrls:[]};
      return {value:{coveredTaskIds:['selected'],issues:[]},sourceUrls:[]};
    },new Date('2026-09-11T00:00:00.000Z'));
    assert.equal(result.customer.range,null);
    if(code==='REF-GENERAL-HOUR'&&hours>0)assert.ok(result.internal.scopePricing.issues.some((issue:string)=>issue.includes('Selected scope violation')),`${description}/${hours}: ${JSON.stringify(result.internal.scopePricing.issues)}`);
  }
});

test('generic clarification quantities must be stated for their own field',async()=>{
  const {resolveInstructionAnswer}=await import('../lib/p5/clarificationAnswer.ts');
  const question='Confirm the cabinet dimensions.';
  const initial={...extraction(),instructions:{...emptyInstructions(),questions:[question]}};
  const reply=(facts:any[])=>async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'',facts,conflicts:[],missingInformation:[],reviewNotes:[],clarifications:[],instructions:{...emptyInstructions(),questions:[]},pages:[],takeoffs:[]})}]}]});
  const prior=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='synthetic';
  try{
    const unsupported=await resolveInstructionAnswer(initial,{service:'handyman'},{id:instructionPrompts(initial,{})[0].id,answer:'The bench top is 13.3 LF.'},[],reply([
      {field:'cabinetBaseLf',value:'13.3',confidence:.99,source:'synthetic',evidence:'Bench top is 13.3 LF.',basis:'stated'},
      {field:'cabinetTallLf',value:'0',confidence:.99,source:'synthetic',evidence:'No tall cabinet dimension was supplied.',basis:'stated'},
    ]) as any);
    assert.equal(unsupported.answers.cabinetBaseLf,undefined);assert.equal(unsupported.answers.cabinetTallLf,undefined);
    const explicit=await resolveInstructionAnswer(initial,{service:'handyman'},{id:instructionPrompts(initial,{})[0].id,answer:'Base cabinets are 13.3 LF. Tall cabinet run is 0 LF. There are 2 bathrooms in 676 sq ft of project area.'},[],reply([
      {field:'cabinetBaseLf',value:'13.3',confidence:.99,source:'synthetic',evidence:'Visitor stated base cabinets are 13.3 LF.',basis:'stated'},
      {field:'cabinetTallLf',value:'0',confidence:.99,source:'synthetic',evidence:'Visitor stated tall cabinet run is 0 LF.',basis:'stated'},
      {field:'bathrooms',value:'2',confidence:.99,source:'synthetic',evidence:'Visitor stated 2 bathrooms.',basis:'stated'},
      {field:'sqft',value:'676',confidence:.99,source:'synthetic',evidence:'Visitor stated 676 sq ft of project area.',basis:'stated'},
    ]) as any);
    assert.equal(explicit.answers.cabinetBaseLf,'13.3');assert.equal(explicit.answers.cabinetTallLf,'0');assert.equal(explicit.answers.bathrooms,'2');assert.equal(explicit.answers.sqft,'676');
  }finally{if(prior===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=prior;}
});

test('unrelated existing driveway hours and non-hourly labor cannot cover selected cabinet labor',()=>{
  const config={planningCatalog:{version:PLANNING_MODEL_VERSION,source:'Synthetic only',authorizedBy:'Synthetic only',importedAt:'2026-09-11T00:00:00.000Z',rates:[
    {code:'REF-GENERAL-HOUR',description:'hourly labor',type:'Labor',unit:'HR',amount:100,source:'Synthetic only',basis:'owner-average-cost'},
    {code:'CABINET-LF-LABOR',description:'linear-foot labor',type:'Labor',unit:'LF',amount:100,source:'Synthetic only',basis:'owner-average-cost'},
  ]}} as any;
  const selected={include:['matching painted MDF/wood'],exclude:[],laborSubtotal:14};
  const driveway=[{id:'driveway-40',description:'Driveway patch labor',quantity:40,unit:'hour',unitCost:100,category:'field-labor',trade:'general',quantitySource:'Existing driveway record'}] as any;
  const noCabinet=selectedScopeIssues([{description:'Matching painted MDF/wood bench top',evidence:'Selected package',existingLineIds:['driveway-40'],additions:[]}],selected,config,driveway);
  assert.ok(noCabinet.some(issue=>issue.includes('no active hourly coverage')));
  const nonHourly=selectedScopeIssues([{description:'Matching painted MDF/wood bench top',evidence:'Selected package',existingLineIds:[],additions:[{code:'CABINET-LF-LABOR',quantity:14}]}],selected,config,[]);
  assert.ok(nonHourly.some(issue=>issue.includes('must use an hourly labor rate')));assert.ok(nonHourly.some(issue=>issue.includes('no active hourly coverage')));
  for(const unit of ['HR','HRS','hour','hours']){
    const eligible=[{id:`cabinet-${unit}`,description:'Cabinet installation labor',quantity:14,unit,unitCost:100,category:'field-labor',trade:'general',quantitySource:'Existing cabinet installation record'}] as any;
    assert.deepEqual(selectedScopeIssues([{description:'Matching painted MDF/wood bench top',evidence:'Selected package',existingLineIds:[`cabinet-${unit}`],additions:[]}],selected,config,eligible),[]);
  }
});
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {priceCompleteScope, type PricingRequest} from '../lib/p5/scopePricing.ts';
import {createPlanningConfiguration, PLANNING_MODEL_VERSION, type PlanningCatalog} from '../lib/p5/planningBooks.ts';
import {DEFAULT_FINANCE} from '../lib/p5/pricing.ts';
import type {ReviewedScope} from '../lib/p5/scope.ts';
import {emptyInstructions} from '../lib/p5/instructions.ts';

// Default: portable, explicitly synthetic approved-rate fixture, following the
// required-code pattern in p5-planning-books.test.ts. It is NOT the owner catalog.
// Private verification is a separate explicit entry point:
// node scripts/offline-run.mjs test scripts/verify-p5-private-catalog-acceptance.mts
// That entry point requires the captured snapshot; missing/invalid data fails.
const codes=[
  '03-17-01-M','03-17-01-L','03-15-02-M','03-15-02-L','03-16-01-M','03-16-01-L',
  '03-14-01-M','03-14-01-L','03-04-01','03-04-02','03-04-03','03-05-02-M','03-05-02-L',
  'REF-GENERAL-HOUR','REF-PLUMBING-HOUR','REF-ELECTRICAL-HOUR','03-18-02-M','03-18-02-L',
];
const syntheticCatalog:PlanningCatalog={
  version:PLANNING_MODEL_VERSION,source:'Synthetic acceptance fixture; not business cost data',
  importedAt:'2026-09-11T00:00:00.000Z',authorizedBy:'Synthetic test owner',
  rates:codes.map(code=>({
    code,
    description:code.startsWith('03-05-02')?`Framing - ${code.endsWith('-M')?'Materials':'Labor'}`:
      code.startsWith('03-18-02')?`Trim - ${code.endsWith('-M')?'Materials':'Labor'}`:'Synthetic required work',
    type:code.endsWith('-M')?'Material':'Labor',
    unit:code.startsWith('03-05-02')?'SF':code.includes('HOUR')?'HR':'LF',
    amount:code==='03-05-02-M'?6:code==='03-18-02-L'?2:10,
    source:'Synthetic acceptance rate; not a supplier quote',basis:'owner-average-cost',
  })),
};
const snapshotPath=process.env.P5_ACCEPTANCE_POLICY_PATH;
const snapshot=snapshotPath
  ?JSON.parse(readFileSync(snapshotPath,'utf8'))
  :{planningCatalog:syntheticCatalog,finance:DEFAULT_FINANCE};
const catalog:PlanningCatalog=snapshot.planningCatalog;
const now=new Date('2026-09-12T00:00:00Z');
type Addition={code:string;quantity:number;quantityEvidence:string};
type Task={id:string;description:string;evidence:string;additions:Addition[]};
const addition=(code:string,quantity:number,quantityEvidence:string):Addition=>({code,quantity,quantityEvidence});

function scope(text:string,laborOnly=false):ReviewedScope{
  return {
    text,answers:{service:'change-order',location:'Boise, Idaho',taskList:text},
    extraction:laborOnly?{
      summary:text,facts:[],conflicts:[],missingInformation:[],reviewNotes:[],
      instructions:{...emptyInstructions(),laborOnly:true},
    }:null,
    uploads:[],reviewedAt:now.toISOString(),corrections:[],
  };
}

async function price(reviewed:ReviewedScope,tasks:Task[],rates=catalog.rates){
  const configuration=createPlanningConfiguration({...catalog,rates},['change-order'],snapshot.finance);
  const before=JSON.stringify(configuration);
  const stages:string[]=[];
  // Only semantic provider replies are simulated. All inventory validation,
  // mapping, quantity/unit checks, book materialization, audit reconciliation,
  // financial arithmetic and customer presentation remain production functions.
  const request:PricingRequest=async(instructions,input,search)=>{
    assert.equal(search,false,'acceptance fixtures must never request web research');
    const data=input as any;
    const reply=(value:unknown)=>({value,sourceUrls:[]});
    if(instructions.startsWith('Inventory ')){
      stages.push('inventory');
      return reply({tasks:tasks.map(({id,description,evidence})=>({id,description,evidence})),issues:[],notes:[]});
    }
    if(instructions.startsWith('You are a construction estimator')){
      stages.push('mapping');
      return reply({
        tasks:data.taskBatch.map((task:any)=>{
          const fixture=tasks.find(item=>task.id.split(':').at(-1)===item.id);
          assert.ok(fixture,`unexpected task ${task.id}`);
          return {...task,existingLineIds:[],additions:fixture.additions,researchDescription:'',issues:[]};
        }),
        issues:[],notes:[],replacements:[],removeExclusions:[],
      });
    }
    assert.ok(instructions.startsWith('Independently audit'),'unexpected provider stage');
    stages.push('audit');
    // Deliberately optimistic audit: deterministic guards, not a cooperative
    // provider reporting our expected error, must catch unsupported pricing.
    return reply({coveredTaskIds:data.tasks.map((task:any)=>task.id),issues:[],notes:[],resolvedIssues:[]});
  };
  const result=await priceCompleteScope(reviewed,configuration,request,now);
  assert.deepEqual(JSON.stringify(configuration),before,'the approved policy is immutable');
  for(const stage of ['inventory','mapping','audit'])assert.ok(stages.includes(stage),`${stage} genuinely ran`);
  return result;
}
function lines(result:Awaited<ReturnType<typeof price>>){
  return (result.internal as any).lines as Array<{description:string;category:string;unit:string;quantity:number;unitCost:number;cost:number}>;
}
const framing=(quantity:number):Task=>({
  id:'framing',description:'Framing material and installation labor',
  evidence:`Supply and frame ${quantity} SF.`,
  additions:[addition('03-05-02-M',quantity,`${quantity} SF framing`),addition('03-05-02-L',quantity,`${quantity} SF framing`)],
});

test(snapshotPath
  ?'PRIVATE SNAPSHOT: 185 approved rates and known dimensional prices'
  :'SYNTHETIC FIXTURE: portable required-code catalog and explicit dimensional prices',()=>{
  assert.equal(catalog.rates.length,snapshotPath?185:codes.length);
  if(!snapshotPath)assert.match(catalog.source,/Synthetic/);
  for(const [code,amount,unit] of [['03-05-02-M',6,'SF'],['03-05-02-L',10,'SF'],['03-18-02-L',2,'LF']] as const){
    const rate=catalog.rates.find(item=>item.code===code);
    assert.ok(rate);assert.equal(rate.amount,amount);assert.equal(rate.unit,unit);
  }
});

test('ordinary framing genuinely extends material and labor once at approved rates',async()=>{
  const result=await price(scope('Supply framing materials and install 100 SF of framing.'),[framing(100)]);
  assert.ok(result.customer.range,JSON.stringify(result.customer.verificationItems));
  const priced=lines(result);
  const material=priced.filter(line=>line.category==='materials');
  const labor=priced.filter(line=>line.category==='field-labor');
  assert.deepEqual(material.map(line=>[line.quantity,line.unit,line.unitCost,line.cost]),[[100,'SF',6,600]]);
  assert.deepEqual(labor.map(line=>[line.quantity,line.unit,line.unitCost,line.cost]),[[100,'SF',10,1000]]);
  const internal=result.internal as any;
  assert.equal(internal.directCost,1600,'no invented extra assembly or duplicate default labor');
  assert.equal(internal.directCost,priced.reduce((sum,line)=>sum+line.cost,0));
  assert.equal(internal.allocations.total,0.2,'approved overhead is applied once');
  assert.equal(internal.contingency,1600*internal.contingencyRate);
  assert.equal(internal.riskAdjustedDirectCost,1600+internal.contingency);
  const expectedPrice=(1600+internal.contingency)/(1-0.2-internal.targetOperatingProfit);
  assert.ok(Math.abs(internal.contractPrice-expectedPrice)<1e-8,'margin uses division rather than markup');
  assert.deepEqual(result.customer.range,internal.planningRange);
});

test('labor-only trim charges exactly 100 LF at $2 and never adds purchased material',async()=>{
  const text='Install 100 LF of trim, labor only. Owner supplies all trim materials.';
  const result=await price(scope(text,true),[{
    id:'trim',description:'Trim installation labor only',evidence:text,
    additions:[addition('03-18-02-L',100,'100 LF of trim installation labor only')],
  }]);
  assert.ok(result.customer.range,JSON.stringify(result.customer.verificationItems));
  assert.ok(lines(result).every(line=>line.category==='field-labor'),'labor-only must not add other cost categories');
  assert.deepEqual(lines(result).map(line=>[line.quantity,line.unit,line.unitCost,line.cost]),[[100,'LF',2,200]]);
  assert.equal((result.internal as any).directCost,200);
});

test('mutually exclusive framing alternatives cannot become a combined base price',async()=>{
  const selected=await price(scope('Selected option A only: supply and install 100 SF framing. Exclude option B, the alternative 200 SF framing.'),[framing(100)]);
  assert.ok(selected.customer.range,JSON.stringify(selected.customer.verificationItems));
  assert.equal(lines(selected).filter(line=>['materials','field-labor'].includes(line.category)).reduce((sum,line)=>sum+line.cost,0),1600);
  const both=await price(scope('Selected option A only: supply and install 100 SF framing. Exclude option B, the alternative 200 SF framing.'),[
    {...framing(100),id:'option-a',description:'Selected option A framing'},
    {...framing(200),id:'option-b',description:'Excluded alternative option B framing',evidence:'Excluded option B: alternative 200 SF framing, not selected.'},
  ]);
  // Either reject the contradictory provider mapping or remove the alternate;
  // never release the apparently plausible combined 300 SF customer price.
  if(both.customer.range)assert.deepEqual(both.customer.range,selected.customer.range,'excluded alternative cannot increase released price');
  else assert.ok(both.customer.verificationItems.length>0);
});

test('missing trim rate cannot release a partial framing estimate despite optimistic audit',async()=>{
  const result=await price(scope('Supply and install 100 SF framing and install 100 LF of owner-supplied trim.'),[
    framing(100),{id:'trim',description:'Trim installation labor',evidence:'Install 100 LF trim.',additions:[addition('03-18-02-L',100,'100 LF trim')]},
  ],catalog.rates.filter(rate=>rate.code!=='03-18-02-L'));
  assert.equal(result.customer.range,null,'partially priced scope is not a releasable estimate');
  assert.match(JSON.stringify(result.internal.scopePricing),/unavailable|unsupported|no supported price/i);
  assert.ok(result.customer.verificationItems.length>0);
});

test('ambiguous feet cannot silently turn into a plausible square-foot framing total',async()=>{
  const text='Supply and install framing for 100 feet. Area and wall height are unknown; square feet were not measured.';
  const result=await price(scope(text),[{
    ...framing(100),evidence:text,
    additions:[addition('03-05-02-M',100,'100 feet; square-foot quantity unknown'),addition('03-05-02-L',100,'100 feet; square-foot quantity unknown')],
  }]);
  assert.equal(result.customer.range,null,'ambiguous length is not supported SF quantity');
  assert.ok(result.customer.verificationItems.length>0);
  assert.match(JSON.stringify(result.internal.scopePricing),/unit|quantity|unknown|measur/i);
});
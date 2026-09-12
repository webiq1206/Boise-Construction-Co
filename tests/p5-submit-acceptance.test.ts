import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {analysisSourceVersion} from '../lib/p5/analysisWork.ts';
import {emptyInstructions} from '../lib/p5/instructions.ts';

test('submit validates saved contact and review, then accepts one revision idempotently',async()=>{
  const runtime=await mkdtemp(path.join(process.cwd(),'node_modules/.cache/p5-submit-acceptance-'));
  const originalFetch=globalThis.fetch;
  try{
    await cp('lib/p5',runtime,{recursive:true});
    await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);

    const customer={
      status:'planning-range',
      range:{low:800,high:1000},
      summary:'Synthetic reviewed addition scope',
      includedCategories:['general'],
      categoryRanges:[{category:'general',low:800,high:1000}],
      lineItems:[{id:'synthetic-scope',category:'general',description:'Synthetic planning package',quantity:1,unit:'package',low:800,high:1000,unitLow:800,unitHigh:1000}],
      allowances:[],
      assumptions:['Synthetic fixture only; verify scope and current costs before a firm proposal.'],
      exclusions:[],
      factors:[],
      nextStep:'Schedule a consultation',
      message:'Synthetic planning range for isolated acceptance testing.',
      disclaimer:'Preliminary planning information only. This is not a bid, quote, offer or guaranteed price.',
    };
    const text='Synthetic reviewed addition scope';
    const reviewed={
      text,
      answers:{service:'addition',location:'Boise',sqft:'100'},
      extraction:{
        summary:'Synthetic reviewed scope',
        facts:[],
        conflicts:[],
        missingInformation:[],
        reviewNotes:[],
        instructions:emptyInstructions(),
      },
      uploads:[],
      reviewedAt:'2026-01-15T00:00:00.000Z',
      corrections:[],
    };
    const internal={
      policyVersion:'synthetic-p5-acceptance',
      revision:'synthetic-revision',
      evaluatedAt:'2026-01-15T00:00:00.000Z',
      estimatePurpose:'verified-cost-review',
      currentCostsConfirmed:true,
      service:'addition',
      requestedService:'addition',
      matrix:{target:.15,floor:.12,stretch:.20,contingency:[.05,.08],method:'Synthetic planning review'},
      lines:[{
        id:'synthetic-direct',
        category:'other-direct',
        trade:'General',
        description:'Synthetic planning package',
        quantity:1,
        unit:'package',
        unitCost:500,
        cost:500,
        quantitySource:'Synthetic reviewed scope',
        evidence:{basis:'approved-cost-book',reference:'Synthetic fixture',verifiedAt:'2026-01-15',validUntil:'2026-12-31'},
      }],
      coverage:[],
      directByCategory:{'other-direct':500},
      directCost:500,
      contingencyRate:.05,
      contingency:25,
      riskAdjustedDirectCost:525,
      allocations:{model:'synthetic',overhead:.2,total:.2,warnings:[]},
      allocationDollars:{overhead:160},
      targetOperatingProfit:.15,
      operatingProfit:120,
      divisor:.65,
      contractPrice:805,
      planningRange:{low:800,high:1000},
      assumptions:customer.assumptions,
      allowances:[],
      exclusions:[],
      missingInformation:[],
      riskFactors:[],
      manualAdjustments:[],
      ownerApprovals:[],
      financeSnapshot:{annualOverhead:420000,annualRevenue:null,forecastSource:'Synthetic fixture',reviewedAt:'2026-01-15',approvedBy:['Synthetic test owner']},
      warnings:[],
      requiresAdminReview:false,
      publishable:true,
      contractMethod:'Synthetic planning review',
      reconciliation:0,
      scope:reviewed,
    };
    await writeFile(path.join(runtime,'pricingWork.ts'),`const snapshot=${JSON.stringify({internal,customer})};\nfunction bump(name:string){const state=(globalThis as any).__p5SubmitCounts||{};state[name]=(state[name]||0)+1;(globalThis as any).__p5SubmitCounts=state;}\nexport async function priceSavedScope(){bump('pricingCalls');return JSON.parse(JSON.stringify(snapshot));}\n`);
    await writeFile(path.join(runtime,'deliveryAdapter.ts'),`function bump(name:string){const state=(globalThis as any).__p5SubmitCounts||{};state[name]=(state[name]||0)+1;(globalThis as any).__p5SubmitCounts=state;}\nexport async function adminRecipients(){bump('adminRecipientCalls');return ['delivery-admin@example.invalid'];}\nexport const EMAIL_SUPPORTS_IDEMPOTENCY=false;\nexport async function sendEmail(_input:unknown){bump('emailAttempts');throw new Error('Synthetic email delivery is disabled');}\nexport async function syncCrm(_record:unknown,_key:string){bump('crmAttempts');throw new Error('Synthetic CRM delivery is disabled');}\n`);

    const mod=(name:string)=>import(pathToFileURL(path.join(runtime,`${name}.ts`)).href);
    const database=await mod('database');
    const store=await mod('store');
    const endpoint=await mod('submitEndpoint');
    const id=randomUUID();
    const key=randomBytes(32).toString('hex');
    const sourceVersion=analysisSourceVersion(text,[]);
    const sourceTextHash=createHash('sha256').update(text).digest('hex');
    const wizard={skipped:[],resolutions:{},sourceVersion,sourceTextHash,instructionAnswers:[]};
    const save=async(payload:{reviewed:any;contact:{name:string;email:string;phone:string}},expectedRevision:number)=>{
      return store.saveDraft(id,key,'synthetic',{text,answers:reviewed?.answers||{service:'addition',location:'Boise',sqft:'100'},extraction:reviewed?.extraction||null,reviewed:payload.reviewed,contact:payload.contact,wizard},expectedRevision);
    };
    await save({reviewed:null,contact:{name:'',email:'',phone:''}},0);
    const headers={'x-p5-draft-id':id,'x-p5-draft-key':key,'content-type':'application/json'};
    const submit=(revision:number)=>endpoint.postSubmission(new Request('http://test.local/api/p5-estimator/submit',{method:'POST',headers,body:JSON.stringify({revision})}));

    globalThis.fetch=async()=>{const state=(globalThis as any).__p5SubmitCounts||{};state.fetchCalls=(state.fetchCalls||0)+1;(globalThis as any).__p5SubmitCounts=state;throw new Error('Unexpected external request in isolated submit test');};

    const missingContact=await submit(1);
    assert.equal(missingContact.status,400);
    assert.match((await missingContact.json()).error,/name and a valid email/i);
    assert.equal((globalThis as any).__p5SubmitCounts?.pricingCalls||0,0);

    const contactSaved=await save({reviewed:null,contact:{name:'Synthetic Contact',email:'submit-customer@example.invalid',phone:''}},1);
    assert.equal(contactSaved.revision,2);
    const missingReview=await submit(2);
    assert.equal(missingReview.status,400);
    assert.match((await missingReview.json()).error,/review and confirm/i);
    assert.equal((globalThis as any).__p5SubmitCounts?.pricingCalls||0,0);

    const reviewedSaved=await save({reviewed,contact:{name:'Synthetic Contact',email:'submit-customer@example.invalid',phone:''}},2);
    assert.equal(reviewedSaved.revision,3);
    const accepted=await submit(3);
    assert.equal(accepted.status,200);
    const acceptedBody=await accepted.json();
    assert.equal(acceptedBody.accepted,true);
    assert.equal(acceptedBody.duplicate,false);
    assert.equal(acceptedBody.id,id);
    assert.deepEqual(acceptedBody.result,customer);

    const counts=()=>((globalThis as any).__p5SubmitCounts||{}) as Record<string,number>;
    assert.equal(counts().pricingCalls,1);
    assert.equal(counts().fetchCalls||0,0);
    assert.equal(counts().emailAttempts,2);
    assert.equal(counts().crmAttempts,1);
    assert.equal(counts().adminRecipientCalls,4);
    assert.equal(acceptedBody.delivery.filter((item:any)=>item.channel==='admin'&&item.status==='needs-review').length,1);
    assert.equal(acceptedBody.delivery.filter((item:any)=>item.channel==='customer'&&item.status==='needs-review').length,1);
    assert.equal(acceptedBody.delivery.filter((item:any)=>item.channel==='crm'&&item.status==='needs-review').length,1);
    // A single administrator alert is deduplicated even when all three
    // synthetic destinations fail.
    assert.equal(acceptedBody.delivery.filter((item:any)=>item.channel==='alert').length,1);

    // Retry the exact same revision after the saved acceptance. The endpoint
    // must return the durable result without repricing or creating new jobs.
    const duplicate=await submit(3);
    assert.equal(duplicate.status,200);
    const duplicateBody=await duplicate.json();
    assert.equal(duplicateBody.accepted,false);
    assert.equal(duplicateBody.duplicate,true);
    assert.equal(duplicateBody.id,id);
    assert.deepEqual(duplicateBody.result,customer);
    assert.deepEqual(duplicateBody.delivery,acceptedBody.delivery);
    assert.equal(counts().fetchCalls||0,0);
    assert.deepEqual(counts(),{pricingCalls:1,emailAttempts:2,crmAttempts:1,adminRecipientCalls:4});

    const rows=await database.query('SELECT destination,status FROM p5_estimator_outbox WHERE draft_id=$1 ORDER BY created_at',[id]);
    assert.equal(rows.length,4);
    assert.equal(rows.filter((row:any)=>!String(row.destination).startsWith('alert:')).length,3);
    const saved=await store.readDraft(id,key);
    assert.equal(saved.status,'submitted');
    assert.equal(saved.revision,3);
    console.log(`[p5 submit acceptance] pricingCalls=${counts().pricingCalls} emailAttempts=${counts().emailAttempts} crmAttempts=${counts().crmAttempts} fetchCalls=${counts().fetchCalls||0} outboxRows=${rows.length}`);
    await database.database.close();
  }finally{
    globalThis.fetch=originalFetch;
    await rm(runtime,{recursive:true,force:true});
  }
});
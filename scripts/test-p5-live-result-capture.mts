import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {chmod,mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {promisify} from 'node:util';
import {test} from 'node:test';
import {COST_CATEGORIES,calculateP5Estimate,customerEstimate} from '../lib/p5/pricing.ts';
import {projectCustomerEstimate} from '../lib/p5/customerProjection.ts';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const exec=promisify(execFile);
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
function artifact(){
  const now=new Date('2026-01-15T00:00:00Z');
  const pricing:any={service:'kitchen',revision:'capture-fixture',scopeSummary:'Offline capture fixture.',uncertainty:'medium',locationProvided:true,
    lines:[{id:'trade',category:'subcontractors',description:'Complete fixture trade scope',quantity:1,unit:'package',unitCost:60000,quantitySource:'fixture',evidence:{basis:'written-quote',reference:'fixture',verifiedAt:'2026-01-01',validUntil:'2026-12-31'}}],
    coverage:COST_CATEGORIES.map(category=>({category,status:category==='subcontractors'?'included':'not-applicable',reason:'fixture'})),risks:[],assumptions:['Existing layout retained.'],exclusions:['Appliances.'],missingInformation:[],allowances:[]};
  const internal:any=calculateP5Estimate(pricing,{annualOverhead:420000,annualRevenue:6000000,forecastSource:'fixture',reviewedAt:'2026-01-01',approvedBy:['Fixture']},[],now);
  internal.scopePricing={verification:{coveredTaskIds:['fixture-task'],issues:[],notes:['Fixture audit note.'],resolvedIssues:[]}};
  return {result:{internal,customer:customerEstimate(internal,pricing.scopeSummary)},scope:{text:'Offline fixture.',answers:{service:'kitchen',location:'Boise'},extraction:null,uploads:[],reviewedAt:'2026-01-01',corrections:[]},configuration:{fixture:true},contact:{name:'Capture Fixture',email:'capture@example.invalid',phone:''}};
}
async function run(file:string,output:string,...extra:string[]){
  return exec(process.execPath,['--import','tsx','scripts/capture-p5-live-result.mts','--result-file',file,'--output-dir',output,...extra],{cwd:process.cwd(),env:{...process.env}});
}
async function sealed(root:string,value:any){
  const file=join(root,'result.json'),ledger=join(root,'ledger');await mkdir(ledger,{mode:0o700});
  value.qualification={complete:true,scopeVerification:'actual',invoice:false};
  value.requestMetadata={};value.responseMetadata={};
  for(const stage of ['mapping','audit']){
    const requestSha256=sha(`${stage}-request`),usage={input_tokens:20,output_tokens:10,total_tokens:30};
    const response=Buffer.from(JSON.stringify({status:'completed',model:'gpt-5.6-sol',service_tier:'default',usage,output:[]}));
    const completed={stage,requestSha256,responseSha256:sha(response),usage,accountedConservativeMicrousd:500,invoice:false,completedAt:'2026-01-01T00:00:00.000Z'};
    value.requestMetadata[stage]={stage,requestSha256,requestBytes:100,ceilingMicrousd:1000,model:'gpt-5.6-sol',serviceTier:'default',maxOutputTokens:4096,transport:'configured-managed'};
    value.responseMetadata[stage]=completed;
    await writeFile(join(ledger,`${stage}.reservation.json`),JSON.stringify({stage,ceilingMicrousd:1000,requestSha256,createdAt:'2026-01-01T00:00:00.000Z'}),{mode:0o600});
    await writeFile(join(ledger,`${stage}.completed.json`),JSON.stringify(completed),{mode:0o600});
    await writeFile(join(ledger,`${stage}.response.json`),response.toString('base64'),{mode:0o600});
  }
  const bytes=Buffer.from(JSON.stringify(value));await writeFile(file,bytes,{mode:0o600});
  await writeFile(join(ledger,'final-output.seal.json'),JSON.stringify({outputFile:resolve(file),sha256:sha(bytes),bytes:bytes.length,sealedAt:'2026-01-01T00:00:00.000Z'}),{mode:0o600});
  await chmod(ledger,0o700);
  return {file,ledger};
}

test('explicit fixture mode captures without claiming provider deliverability',async()=>{
  const root=await mkdtemp(join(tmpdir(),'p5-capture-fixture-')),file=join(root,'input.json'),output=join(root,'capture');
  await writeFile(file,JSON.stringify(artifact()));
  await run(file,output,'--fixture');
  const report=JSON.parse(await readFile(join(output,'capture-report.json'),'utf8'));
  assert.equal(report.passed,true);assert.equal(report.mode,'fixture');assert.match(report.deliveryQualification,/not actual email or CRM provider deliverability/i);
});

test('fixture mode rejects a null range instead of substituting a price',async()=>{
  const root=await mkdtemp(join(tmpdir(),'p5-capture-null-')),file=join(root,'input.json'),value=artifact();
  value.result.customer.range=null;
  await writeFile(file,JSON.stringify(value));
  await assert.rejects(run(file,join(root,'capture'),'--fixture'),/positive customer range/);
});

test('sealed historical customer allowance prose cannot exempt $200 direct cost from projection',async()=>{
  const root=await mkdtemp(join(tmpdir(),'p5-capture-private-')),value=artifact();
  value.result.customer.assumptions.push('Preliminary labor allowance $200 direct cost.');
  value.result.internal.assumptions.push('Preliminary labor allowance $200 direct cost.');
  const {file,ledger}=await sealed(root,value),output=join(root,'capture');
  const original=await readFile(file);
  const ledgerNames=['final-output.seal.json',...['mapping','audit'].flatMap(stage=>[`${stage}.reservation.json`,`${stage}.completed.json`,`${stage}.response.json`])];
  const originals=await Promise.all(ledgerNames.map(name=>readFile(join(ledger,name))));
  await run(file,output,'--fixture');
  for(const name of ['customer-email.txt','customer-email.html'])assert.doesNotMatch(await readFile(join(output,name),'utf8'),/\$200\b/);
  const pdfTask=getDocument({data:new Uint8Array(await readFile(join(output,'customer.pdf'))),useSystemFonts:true});
  const pdf=await pdfTask.promise;
  try{
    let text='';
    for(let page=1;page<=pdf.numPages;page++)text+=(await (await pdf.getPage(page)).getTextContent()).items.map(item=>'str' in item?item.str:'').join(' ');
    assert.doesNotMatch(text,/\$200\b/);
  }finally{await pdfTask.destroy();}
  assert.match(await readFile(join(output,'administrative-email.txt'),'utf8'),/Direct project cost: \$60,000/);
  const crm=JSON.parse(await readFile(join(output,'crm-payload.json'),'utf8'));
  assert.deepEqual(crm.estimate.customer,projectCustomerEstimate(value.result.customer));
  assert.equal(crm.estimate.internal.financialSummary.directCost,value.result.internal.directCost);
  assert.deepEqual(await readFile(file),original,'sealed input is immutable');
  for(let i=0;i<ledgerNames.length;i++)assert.deepEqual(await readFile(join(ledger,ledgerNames[i])),originals[i],'ledger and raw provider fixtures are immutable');
});

test('default mode rejects unverified provenance',async()=>{
  const root=await mkdtemp(join(tmpdir(),'p5-capture-unverified-')),file=join(root,'input.json');
  await writeFile(file,JSON.stringify(artifact()));
  await assert.rejects(run(file,join(root,'capture')),/requires --ledger-dir/);
});

test('default mode rejects an artifact changed after its final seal',async()=>{
  const root=await mkdtemp(join(tmpdir(),'p5-capture-tampered-')),sealedInput=await sealed(root,artifact());
  await writeFile(sealedInput.file,'\n',{flag:'a'});
  await assert.rejects(run(sealedInput.file,join(root,'capture'),'--ledger-dir',sealedInput.ledger),/byte count mismatch|digest mismatch/);
});
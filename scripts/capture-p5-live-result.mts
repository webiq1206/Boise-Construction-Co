import './offline-network-guard.cjs';
import assert from 'node:assert/strict';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {cp,lstat,mkdir,mkdtemp,readFile,realpath,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

/*
 * Offline delivery capture for a completed qualification result.
 *
 * Input contract:
 * {
 *   "result": { "internal": <production internal result>,
 *               "customer": <production customer result> },
 *   "scope": <production ReviewedScope>,
 *   "configuration": <configuration used by the qualification>,
 *   "requestMetadata": { "mapping": {}, "audit": {} },
 *   "responseMetadata": { "mapping": {}, "audit": {} },
 *   "qualification": { "complete": true, "scopeVerification": "actual" },
 *   "contact": { "name": "...", "email": "...@....invalid", "phone": "" }
 * }
 *
 * This script never prices. It feeds the supplied result unchanged through the
 * production outbox, email and PDF code copied to an isolated PGlite runtime.
 * Only the database and delivery adapter boundaries are replaced.
 */

const root=process.cwd();
const args=process.argv.slice(2),fixture=args.includes('--fixture');
const parsed=new Map<string,string>();
for(let i=0;i<args.length;i++){
  const flag=args[i];
  if(flag==='--fixture')continue;
  assert.ok(['--result-file','--output-dir','--ledger-dir'].includes(flag),`Unsupported argument: ${flag}`);
  assert.ok(args[i+1]&&!args[i+1].startsWith('--'),`${flag} requires a value.`);
  assert.ok(!parsed.has(flag),`${flag} may only be supplied once.`);
  parsed.set(flag,args[++i]);
}
assert.ok(parsed.has('--result-file')&&parsed.has('--output-dir'),'--result-file and --output-dir are required.');
assert.equal(fixture, !parsed.has('--ledger-dir'),'Default live mode requires --ledger-dir; synthetic samples require explicit --fixture and no ledger.');
const resultFile=path.resolve(parsed.get('--result-file')!);
const outputDir=path.resolve(parsed.get('--output-dir')!);
const ledgerDir=parsed.has('--ledger-dir')?path.resolve(parsed.get('--ledger-dir')!):null;
const AUTHORIZED_LEDGER=path.resolve('.local/qualification/authorized-mapping-20260919/scenario-ledger');
assert.notEqual(outputDir,root,'Refusing to use the project root.');
assert.notEqual(outputDir,path.join(root,'p5-verification'),'Refusing to overwrite saved verification artifacts.');

for(const key of ['AI_INTEGRATIONS_OPENAI_API_KEY','AI_INTEGRATIONS_OPENAI_BASE_URL','OPENAI_API_KEY','ANTHROPIC_API_KEY','RESEND_API_KEY','LEAD_DASHBOARD_KEY','LEAD_DASHBOARD_API_URL'])delete process.env[key];

type Input={
  result:{internal:Record<string,any>;customer:Record<string,any>};
  scope:Record<string,any>;
  configuration:Record<string,any>;
  requestMetadata?:Record<'mapping'|'audit',Record<string,any>>;
  responseMetadata?:Record<'mapping'|'audit',Record<string,any>>;
  qualification?:Record<string,any>;
  contact?:{name?:string;email?:string;phone?:string};
  draftId?:string;
};
const bytes=await readFile(resultFile);
const input=JSON.parse(bytes.toString('utf8')) as Input;
const digest=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
async function verifyLiveProvenance(){
  assert.ok(ledgerDir,'Live provenance requires a ledger.');
  assert.equal(input.qualification?.complete,true,'Runner qualification is not complete.');
  assert.equal(input.qualification?.scopeVerification,'actual','Runner must explicitly mark qualification.scopeVerification as actual.');
  assert.equal(input.qualification?.invoice,false,'Qualification response must remain marked un-invoiced until reconciliation.');
  const verification=input.result?.internal?.scopePricing?.verification;
  assert.ok(Array.isArray(verification?.coveredTaskIds)&&verification.coveredTaskIds.length>0,'Actual scope verification must cover at least one task.');
  assert.deepEqual(verification?.issues,[],'Actual scope verification must have no unresolved issues.');
  assert.ok(Array.isArray(verification?.notes)&&verification.notes.length>0,'Actual scope verification must retain its audit notes.');
  assert.equal(await realpath(ledgerDir),ledgerDir,'Ledger path must be canonical.');
  const directory=await lstat(ledgerDir);assert.ok(directory.isDirectory()&&!directory.isSymbolicLink()&&!(directory.mode&0o077),'Ledger directory must be private and not a symlink.');
  const expected=['audit.completed.json','audit.reservation.json','audit.response.json','final-output.seal.json','mapping.completed.json','mapping.reservation.json','mapping.response.json'];
  assert.deepEqual((await readdir(ledgerDir)).sort(),expected,'Qualification ledger must be complete, sealed, unlocked, and contain no unknown files.');
  const readPrivate=async(name:string)=>{
    const file=path.join(ledgerDir!,name),stat=await lstat(file);
    assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&!(stat.mode&0o077),`${name} must be a private regular file.`);
    return readFile(file);
  };
  const seal=JSON.parse((await readPrivate('final-output.seal.json')).toString());
  const resultStat=await lstat(resultFile);assert.ok(resultStat.isFile()&&!resultStat.isSymbolicLink()&&!(resultStat.mode&0o077),'Sealed result artifact must be a private regular file.');
  assert.equal(path.resolve(seal.outputFile),await realpath(resultFile),'Seal must name this exact result artifact.');
  assert.equal(seal.bytes,bytes.byteLength,'Sealed result byte count mismatch.');
  assert.equal(seal.sha256,digest(bytes),'Sealed final result digest mismatch.');
  assert.equal(ledgerDir,AUTHORIZED_LEDGER,'Live capture only accepts the source-pinned canonical qualification ledger.');
  for(const stage of ['mapping','audit'] as const){
    const request=input.requestMetadata?.[stage],response=input.responseMetadata?.[stage];
    assert.ok(request&&response,`Missing ${stage} request/response metadata.`);
    assert.equal(request.stage,stage);assert.equal(request.model,'gpt-5.6-sol');assert.equal(request.serviceTier,'default');
    assert.equal(request.transport,'configured-managed');assert.ok(Number.isSafeInteger(request.maxOutputTokens)&&request.maxOutputTokens>0);
    const reservation=JSON.parse((await readPrivate(`${stage}.reservation.json`)).toString());
    const completed=JSON.parse((await readPrivate(`${stage}.completed.json`)).toString());
    assert.deepEqual(response,completed,`${stage} response metadata does not match the immutable ledger.`);
    assert.equal(reservation.stage,stage);assert.equal(reservation.requestSha256,request.requestSha256);
    assert.equal(reservation.ceilingMicrousd,request.ceilingMicrousd);assert.equal(completed.requestSha256,request.requestSha256);
    assert.equal(completed.invoice,false);assert.ok(Number.isSafeInteger(completed.accountedConservativeMicrousd)&&completed.accountedConservativeMicrousd>=0&&completed.accountedConservativeMicrousd<=reservation.ceilingMicrousd);
    const encoded=(await readPrivate(`${stage}.response.json`)).toString(),responseBytes=Buffer.from(encoded,'base64');
    assert.equal(digest(responseBytes),completed.responseSha256,`${stage} provider response hash mismatch.`);
    const provider=JSON.parse(responseBytes.toString());
    assert.equal(provider.status,'completed');assert.equal(provider.model,request.model);assert.equal(provider.service_tier,request.serviceTier);
    assert.deepEqual(provider.usage,completed.usage);assert.ok(Number.isSafeInteger(provider.usage?.input_tokens)&&provider.usage.input_tokens>=0);
    assert.ok(Number.isSafeInteger(provider.usage?.output_tokens)&&provider.usage.output_tokens>=0&&provider.usage.output_tokens<=request.maxOutputTokens);
    assert.equal(provider.usage.total_tokens,provider.usage.input_tokens+provider.usage.output_tokens);
  }
}
assert.ok(input&&typeof input==='object','Result artifact must be a JSON object.');
assert.ok(input.result?.internal&&input.result?.customer,'Result artifact must contain result.internal and result.customer.');
assert.ok(input.scope&&typeof input.scope==='object','Result artifact must contain scope.');
assert.ok(input.scope.answers&&typeof input.scope.answers==='object','Result artifact scope must contain answers.');
assert.ok(input.configuration&&typeof input.configuration==='object','Result artifact must contain configuration.');
if(!fixture)await verifyLiveProvenance();
const range=input.result.customer.range;
assert.ok(range&&Number.isFinite(range.low)&&Number.isFinite(range.high)&&range.low>0&&range.high>=range.low,'Completed live result must contain a positive customer range.');
assert.ok(Number.isFinite(input.result.internal.contractPrice)&&input.result.internal.contractPrice>0,'Completed live result must contain its actual internal contractPrice.');
const contact={name:input.contact?.name||'Offline Qualification',email:input.contact?.email||'qualification-customer@example.invalid',phone:input.contact?.phone||''};
assert.match(contact.email,/^[^\s@]+@[^\s@]+\.invalid$/i,'Capture contacts must use the reserved .invalid TLD.');
const id=input.draftId||randomUUID();
assert.match(id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,'draftId must be a UUID v4 when supplied.');
// Validate the entire input and sealed provenance before reserving a new output
// path. A failed preflight must not strand an apparently completed capture.
await mkdir(path.dirname(outputDir),{recursive:true});
await mkdir(outputDir); // create-exclusive: a stale or previous run must fail
const artifact=(name:string)=>path.join(outputDir,name);
const put=(name:string,data:string|Uint8Array)=>writeFile(artifact(name),data,{flag:'wx',mode:0o600});

async function pdfText(pdf:Uint8Array){
  const task=getDocument({data:Uint8Array.from(pdf),disableFontFace:true});
  const document=await task.promise;
  const pages:string[]=[];
  try{
    for(let page=1;page<=document.numPages;page++){
      const content=await (await document.getPage(page)).getTextContent();
      pages.push(content.items.map(item=>'str' in item?item.str:'').join(' '));
    }
  }finally{await task.destroy();}
  return pages.join(' ').replace(/\s+/g,' ').trim();
}
const money=(n:number,digits=0)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);
const expectedRange=`${money(range.low)} to ${money(range.high)}`;
const runtime=await mkdtemp(path.join(root,'node_modules','.cache','p5-live-capture-'));
try{
  await cp(path.join(root,'lib','p5'),runtime,{recursive:true});
  await writeFile(path.join(runtime,'database.ts'),`import {PGlite} from '@electric-sql/pglite';export const database=new PGlite();export async function query(statement:string,values:unknown[]=[]){return (await database.query(statement,values)).rows as any[];}`);
  await writeFile(path.join(runtime,'deliveryAdapter.ts'),`
import {ESTIMATOR_BRAND as brand} from './brand.ts';
export const EMAIL_SUPPORTS_IDEMPOTENCY=true;
export const emails:any[]=[];export const crm:any[]=[];
export async function adminRecipients(){return ['qualification-admin@example.invalid'];}
export async function sendEmail(input:any){emails.push(input);return 'captured-email-'+input.key;}
export async function syncCrm(record:any,key:string){
 const range=record.customer.range;
 const payload={fullName:record.contact.name,email:record.contact.email,phone:record.contact.phone,
  source:brand.domain,externalLeadId:key,inquiryId:record.draftId,
  propertyAddress:record.scope.answers.address||undefined,city:record.scope.answers.location||undefined,
  projectTypes:[record.scope.answers.service],projectScope:record.customer.summary.slice(0,1900),
  estimate:{brand:brand.name,estimator:'p5-policy',id:record.draftId,scope:record.scope,internal:record.internal,customer:record.customer},
  estimateSummary:JSON.stringify(record.internal).slice(0,19000),
  estimateLow:range?.low,estimateHigh:range?.high,estimateRange:range?'$'+range.low+' to $'+range.high:undefined};
 crm.push({key,payload});return 'captured-crm-'+key;
}`);
  // The unique temporary directory already gives this run a fresh module graph.
  // Do not add a query string: imports inside outbox must resolve to the exact
  // same database and adapter module instances inspected by this harness.
  const load=(name:string)=>import(pathToFileURL(path.join(runtime,name+'.ts')).href);
  const store=await load('store'),outbox=await load('outbox'),transport=await load('deliveryAdapter'),db=await load('database');
  const key=randomBytes(32).toString('hex');
  const payload={text:String(input.scope.text||''),answers:input.scope.answers||{},extraction:input.scope.extraction||null,reviewed:input.scope,contact};
  await store.saveDraft(id,key,'p5',payload,0);
  const record={draftId:id,revision:1,brand:'Boise Construction Co',estimator:'p5-policy',contact,scope:input.scope,internal:input.result.internal,customer:input.result.customer};
  assert.equal(await outbox.enqueueSubmission(id,1,record),true,'Isolated submission must be accepted.');
  await outbox.processOutbox({draftId:id,limit:12});
  assert.equal(transport.emails.length,2,'Production outbox must produce customer and administrative email payloads.');
  assert.equal(transport.crm.length,1,'Production outbox must produce one CRM payload.');
  const customerEmail=transport.emails.find((email:any)=>email.to===contact.email);
  const adminEmail=transport.emails.find((email:any)=>email.to==='qualification-admin@example.invalid');
  assert.ok(customerEmail&&adminEmail,'Expected reserved customer and administrator captures.');
  assert.equal(customerEmail.attachments.length,1);assert.equal(adminEmail.attachments.length,1);
  const customerPdf=Buffer.from(customerEmail.attachments[0].content);
  const adminPdf=Buffer.from(adminEmail.attachments[0].content);
  const customerPdfText=await pdfText(customerPdf),adminPdfText=await pdfText(adminPdf);

  for(const [kind,text] of [['customer PDF',customerPdfText],['customer email text',customerEmail.text],['customer email HTML',customerEmail.html]] as const){
    assert.ok(text.includes(expectedRange),`${kind} must contain the supplied live range.`);
    assert.doesNotMatch(text,/\b(?:direct project cost|operating profit|overhead recovery|recommended contract price|selected pricing divisor|unit cost|confidential internal)\b/i,`${kind} leaked an internal pricing label.`);
  }
  const customerNumbers=new Set<number>();
  const collectNumbers=(value:unknown)=>{
    if(typeof value==='number'&&Number.isFinite(value))customerNumbers.add(value);
    else if(Array.isArray(value))value.forEach(collectNumbers);
    else if(value&&typeof value==='object')Object.values(value).forEach(collectNumbers);
  };
  collectNumbers(input.result.customer);
  // A verified customer result may deliberately disclose a cost-basis note
  // (for example, a preliminary labor allowance). The renderer must not add
  // any internal amount that was absent from that sealed public result, but it
  // must reproduce customer-approved text unchanged.
  const sealedCustomerText=JSON.stringify(input.result.customer);
  const internalNumbers=[
    input.result.internal.directCost,input.result.internal.contingency,input.result.internal.riskAdjustedDirectCost,
    input.result.internal.operatingProfit,input.result.internal.contractPrice,
  ].filter((n):n is number=>Number.isFinite(n)&&!customerNumbers.has(n));
  const publicText=[customerPdfText,customerEmail.text,customerEmail.html].join('\n');
  for(const number of internalNumbers){
    for(const token of new Set([money(number),money(number,2)]))if(!sealedCustomerText.includes(token))assert.ok(!publicText.includes(token),`Customer artifacts leaked internal amount ${token}.`);
  }
  assert.ok(adminPdfText.includes(money(input.result.internal.contractPrice,2)),'Administrative PDF must contain the supplied contract price.');
  const crm=transport.crm[0].payload;
  assert.equal(crm.estimateLow,range.low);assert.equal(crm.estimateHigh,range.high);
  assert.deepEqual(crm.estimate.internal,input.result.internal,'CRM payload must retain the supplied internal result unchanged.');
  assert.deepEqual(crm.estimate.customer,input.result.customer,'CRM payload must retain the supplied customer result unchanged.');

  await put('customer.pdf',customerPdf);
  await put('administrative.pdf',adminPdf);
  await put('customer-email.txt',customerEmail.text);
  await put('customer-email.html',customerEmail.html);
  await put('customer-email.json',JSON.stringify({to:customerEmail.to,subject:customerEmail.subject,key:customerEmail.key,attachments:customerEmail.attachments.map((a:any)=>({filename:a.filename,bytes:a.content.length,sha256:createHash('sha256').update(a.content).digest('hex')}))},null,2));
  await put('administrative-email.txt',adminEmail.text);
  await put('administrative-email.html',adminEmail.html);
  await put('administrative-email.json',JSON.stringify({to:adminEmail.to,subject:adminEmail.subject,key:adminEmail.key,attachments:adminEmail.attachments.map((a:any)=>({filename:a.filename,bytes:a.content.length,sha256:createHash('sha256').update(a.content).digest('hex')}))},null,2));
  await put('crm-payload.json',JSON.stringify(crm,null,2));
  const report={passed:true,mode:fixture?'fixture':'sealed-live-result',input:{path:resultFile,sha256:digest(bytes),configurationSha256:digest(JSON.stringify(input.configuration)),provenance:fixture?'Explicit fixture mode; no claim of a live qualification.':'Final artifact seal, stage ledger, provider response hashes, model, tier, usage, and actual scope verification matched.'},draftId:id,expected:{customerRange:expectedRange,contractPrice:money(input.result.internal.contractPrice,2)},captures:{customerPdf:{bytes:customerPdf.length,sha256:digest(customerPdf)},administrativePdf:{bytes:adminPdf.length,sha256:digest(adminPdf)},emails:2,crm:1},deliveryQualification:'Fixture-only captured transmission through an in-memory adapter. This proves payload construction, not actual email or CRM provider deliverability.',isolation:'Temporary in-memory PGlite and captured .invalid delivery adapter. Production outbox/email/PDF renderers used. Outbound non-loopback network blocked. Supplied result used unchanged; no pricing function invoked.',checks:[...(!fixture?['sealed live-result provenance and immutable stage-ledger identity']:[]),'positive supplied totals','customer range in PDF and email','contract price in administrative PDF','customer internal-label and internal-amount leak scan','CRM totals and unchanged result identity','reserved .invalid contacts']};
  await put('capture-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,outputDir},null,2));
  await db.database.close();
}finally{
  await rm(runtime,{recursive:true,force:true});
}
import {open, lstat, readFile, rename, unlink} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {createHash} from 'node:crypto';

export const AUTHORIZATION='I AUTHORIZE LIVE P5 PROVIDER COSTS AND QA DELIVERY';
export const RECIPIENT='brostjared@gmail.com';
type Credentials={baseUrl:string;id:string;key:string;qaMarker:string};
type Entry={action:string;revision:number;state:'intent'|'complete'|'pending';status?:number;response?:unknown};
type Journal={version:1;identity:string;entries:Entry[]};
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
async function privateRead(path:string){
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o777)!==0o600)throw new Error('Sensitive files must be regular files with mode 0600');
  return JSON.parse(await readFile(path,'utf8'));
}
async function syncDirectory(path:string){const h=await open(dirname(resolve(path)),'r');try{await h.sync();}finally{await h.close();}}
async function save(path:string,value:unknown,exclusive=false){
  const temporary=exclusive?path:`${path}.next`;
  const h=await open(temporary,'wx',0o600);
  try{await h.writeFile(JSON.stringify(value,null,2));await h.sync();}finally{await h.close();}
  if(!exclusive)await rename(temporary,path);
  await syncDirectory(path);
}
export async function prepare(credentialsFile:string,journalFile:string){
  const c=await credentials(credentialsFile);
  await save(journalFile,{version:1,identity:identity(c),entries:[]} satisfies Journal,true);
  return {prepared:true,networkRequests:0,mutations:0};
}
async function credentials(path:string):Promise<Credentials>{
  const c=await privateRead(path);
  const u=new URL(c.baseUrl);
  if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||!['http:','https:'].includes(u.protocol))throw new Error('baseUrl must be an origin');
  if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw new Error('HTTPS required outside localhost');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(c.id)||!/^[a-f0-9]{64}$/i.test(c.key))throw new Error('Existing browser draft credentials required');
  if(typeof c.qaMarker!=='string'||!(c.qaMarker==='QA TEST ONLY:'||/^QA-[A-Za-z0-9_-]{8,80}$/.test(c.qaMarker)))throw new Error('Explicit QA scope marker required');
  return {...c,baseUrl:u.origin};
}
function identity(c:Credentials){return digest(JSON.stringify([c.baseUrl,c.id,c.key,c.qaMarker]));}
export async function run(options:{credentialsFile:string;journalFile:string;action:string;authorization?:string;expectedRevision?:number;receiverPreflightFile?:string},transport:Transport=fetch){
  if(!['inspect','analyze','review','submit','pdf'].includes(options.action))throw new Error('Unknown action');
  // Even reads require opt-in: never contact a host in default preparation mode.
  if(options.authorization!==AUTHORIZATION)throw new Error('Explicit live authorization required');
  const c=await credentials(options.credentialsFile);
  if(!['inspect','pdf'].includes(options.action)){
    if(!options.receiverPreflightFile)throw new Error('CRM receiver reachability unresolved (known NXDOMAIN): external read-only preflight required before any spend/send');
    const proof=await privateRead(options.receiverPreflightFile);
    const checked=Date.parse(proof.checkedAt);
    if(proof.baseUrl!==c.baseUrl||proof.status!=='reachable'||proof.dns!=='resolved'||proof.readOnly!==true||typeof proof.evidence!=='string'||proof.evidence.length<20||!Number.isFinite(checked)||checked>Date.now()||Date.now()-checked>900000)throw new Error('CRM receiver preflight is failed, stale or invalid; spend/send blocked');
  }
  const lock=`${options.journalFile}.lock`;
  const h=await open(lock,'wx',0o600);
  try{
    const journal:Journal=await privateRead(options.journalFile);
    if(journal.version!==1||journal.identity!==identity(c)||!Array.isArray(journal.entries))throw new Error('Journal identity mismatch');
    const headers={'x-p5-draft-id':c.id,'x-p5-draft-key':c.key,origin:c.baseUrl};
    const request=(path:string,init:RequestInit={})=>transport(`${c.baseUrl}/api/p5-estimator/${path}`,{...init,redirect:'error',signal:AbortSignal.timeout(180000),headers:{...headers,...init.headers}});
    const response=await request('draft');
    if(!response.ok)throw new Error(`Authenticated draft read failed (${response.status})`);
    const {draft}=await response.json();
    if(!draft||draft.id!==c.id||!Number.isInteger(draft.revision))throw new Error('Existing draft not found; creation is never automatic');
    const marked=typeof draft.text==='string'&&(c.qaMarker==='QA TEST ONLY:'?draft.text.startsWith(c.qaMarker):draft.text.includes(c.qaMarker));
    if(draft.contact?.email!==RECIPIENT||!marked)throw new Error('QA scope marker and allowlisted recipient required on saved draft');
    if(options.action==='inspect')return {id:c.id,revision:draft.revision,status:draft.status,ambiguous:journal.entries.some(e=>e.state==='intent'),delivery:'Not polled: submitted POST can drive outbox'};
    if(options.action==='pdf'){
      if(draft.status!=='submitted')throw new Error('PDF requires existing submitted state');
      const pdf=await request('pdf');
      if(!pdf.ok||!pdf.headers.get('content-type')?.includes('application/pdf'))throw new Error(`PDF unavailable (${pdf.status})`);
      const bytes=new Uint8Array(await pdf.arrayBuffer());
      if(Buffer.from(bytes.slice(0,5)).toString()!=='%PDF-')throw new Error('Invalid PDF signature');
      const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc=await getDocument({data:bytes.slice(),useSystemFonts:true}).promise;
      let text='';
      try{for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);const content=await page.getTextContent();text+=content.items.map(item=>'str' in item?item.str:'').join(' ')+'\n';}}finally{await doc.destroy();}
      if(!/planning disclaimer/i.test(text)||/Confidential P5 information|Direct project cost|Price and revenue allocation|riskAdjustedDirectCost|key_hash/i.test(text))throw new Error('Customer PDF boundary check failed');
      const evidence={sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,customerBoundary:'sampled text checks passed; manual review still required'};
      journal.entries.push({action:'pdf',revision:draft.revision,state:'complete',response:evidence});await save(options.journalFile,journal);
      return evidence;
    }
    if(draft.status==='submitted')throw new Error('Already submitted: never re-POST or retry delivery; inspect/download only');
    if(options.action==='analyze'&&(draft.extraction||draft.analyzedFingerprint||draft.reviewed))throw new Error('Saved analysis/extraction already exists; paid re-analysis is prohibited');
    if(options.expectedRevision!==draft.revision)throw new Error('Explicit expected revision must match authenticated draft');
    if(journal.entries.some(e=>e.state==='intent'))throw new Error('Ambiguous prior operation: read-only reconciliation required; no reset/retry supported');
    const prior=journal.entries.filter(e=>e.action===options.action).at(-1);
    if(prior&&prior.state!=='pending')throw new Error('Action already attempted; no automatic replay');
    if(options.action==='submit'&&!draft.reviewed)throw new Error('Review the saved scope first');
    let body:BodyInit;let path:string;let method:string;let contentHeaders:Record<string,string>={};
    if(options.action==='analyze'){
      const form=new FormData();form.set('text',draft.text);form.set('revision',String(draft.revision));form.set('background','true');body=form;path='scope';method='POST';
    }else{
      body=JSON.stringify(options.action==='review'?{text:draft.text,answers:draft.answers,contact:draft.contact,wizard:draft.wizard,revision:draft.revision,reviewed:true}:{revision:draft.revision,background:true});
      path=options.action==='review'?'draft':'submit';method=options.action==='review'?'PUT':'POST';contentHeaders={'content-type':'application/json'};
    }
    const entry:Entry={action:options.action,revision:draft.revision,state:'intent'};
    journal.entries.push(entry);await save(options.journalFile,journal);
    // A timeout, invalid JSON, process crash, or failed durable write leaves intent.
    // Never repeat an ambiguous send, even if a later GET still says draft.
    const result=await request(path,{method,body,headers:contentHeaders});
    const data=await result.json();
    if(result.status>=500)throw new Error('Server failure has ambiguous outcome; operation remains blocked');
    entry.status=result.status;entry.response=data;
    entry.state=result.ok&&data.pending===true?'pending':'complete';
    await save(options.journalFile,journal);
    if(!result.ok)throw new Error(`Action stopped (${result.status}); authenticated details retained in private journal`);
    return {action:options.action,status:result.status,pending:entry.state==='pending',revision:data.draft?.revision,delivery:data.delivery??'Not verified'};
  }finally{await h.close();await unlink(lock);}
}
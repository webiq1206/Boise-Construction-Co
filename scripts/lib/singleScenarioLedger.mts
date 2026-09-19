import assert from 'node:assert/strict';
import {mkdir,open,readFile,readdir,rmdir,lstat,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {digest,eligibleGenerationEndpoints} from './livePricingGuard.mts';

export type Stage='mapping'|'audit';
export interface StageContract {stage:Stage;endpoint:string;requestSha256:string;requestBytes:number;ceilingMicrousd:number;model:string;serviceTier:'default';maxOutputTokens:number}
const syncDir=async(root:string)=>{const fd=await open(root,'r');try{await fd.sync();}finally{await fd.close();}};
const writeOnce=async(root:string,name:string,value:unknown)=>{
  const fd=await open(join(root,name),'wx',0o600);try{await fd.writeFile(typeof value==='string'?value:JSON.stringify(value));await fd.sync();}finally{await fd.close();}await syncDir(root);
};
export async function stageFetch(rootInput:string,contract:StageContract,transport:typeof fetch,validate:(bytes:Uint8Array)=>{usage:unknown;accountedMicrousd:number},preflight:()=>Promise<void>):Promise<typeof fetch>{
  const root=resolve(rootInput);await mkdir(root,{recursive:true,mode:0o700});
  assert.equal(await realpath(root),root);assert.equal((await lstat(root)).mode&0o077,0);
  const url=new URL(contract.endpoint),eligible=eligibleGenerationEndpoints();
  assert.ok(eligible.includes(url.href)&&contract.endpoint===url.href);
  return async(input,init)=>{
    assert.equal(input,contract.endpoint);assert.equal(init?.method,'POST');assert.ok(init?.redirect===undefined||init.redirect==='error');
    assert.equal(typeof init.body,'string');assert.equal(Buffer.byteLength(init.body),contract.requestBytes);assert.equal(digest(init.body),contract.requestSha256);
    const body=JSON.parse(init.body);assert.equal(body.model,contract.model);assert.equal(body.service_tier,'default');
    assert.equal(body.max_output_tokens,contract.maxOutputTokens);assert.ok(!body.tools&&!body.tool_choice&&!body.stream);
    const headers=new Headers(init.headers);assert.equal(headers.get('content-type'),'application/json');assert.match(headers.get('authorization')||'',/^Bearer \S+$/);
    try{await mkdir(join(root,'LOCK'),{mode:0o700});}catch{throw new Error('qualification-ledger-blocked');}
    try{
      const names=await readdir(root);
      const allowed=/^(?:(?:mapping|audit)\.(?:reservation|completed|response)|final-output\.seal)\.json$/;
      for(const name of names)if(name!=='LOCK'&&!allowed.test(name))throw new Error('qualification-ledger-corrupt');
      await preflight();
      if(names.includes(`${contract.stage}.reservation.json`))throw new Error('qualification-stage-already-reserved');
      if(contract.stage==='audit'){
        if(!names.includes('mapping.completed.json'))throw new Error('qualification-mapping-not-completed');
        await verifiedStage(root,'mapping');
      }
      if(contract.stage==='mapping'&&names.some(n=>n.startsWith('audit.')))throw new Error('qualification-ledger-order');
      let reserved=0;for(const name of names.filter(n=>n.endsWith('.reservation.json'))){const entry=JSON.parse(await readFile(join(root,name),'utf8'));assert.ok(Number.isSafeInteger(entry.ceilingMicrousd)&&entry.ceilingMicrousd>0);reserved+=entry.ceilingMicrousd;}
      assert.ok(reserved+contract.ceilingMicrousd<=1_000_000,'qualification-total-cap-exceeded');
      await writeOnce(root,`${contract.stage}.reservation.json`,{stage:contract.stage,ceilingMicrousd:contract.ceilingMicrousd,requestSha256:contract.requestSha256,createdAt:new Date().toISOString()});
      let response:Response,bytes:Uint8Array;
      try{response=await transport(input,{...init,redirect:'error'});bytes=new Uint8Array(await response.arrayBuffer());}catch{throw new Error('qualification-result-unknown');}
      assert.ok(response.ok,'qualification-http-not-successful');
      const checked=validate(bytes);
      assert.ok(Number.isSafeInteger(checked.accountedMicrousd)&&checked.accountedMicrousd>=0&&checked.accountedMicrousd<=contract.ceilingMicrousd);
      await writeOnce(root,`${contract.stage}.response.json`,Buffer.from(bytes).toString('base64'));
      await writeOnce(root,`${contract.stage}.completed.json`,{stage:contract.stage,requestSha256:contract.requestSha256,responseSha256:digest(bytes),usage:checked.usage,accountedConservativeMicrousd:checked.accountedMicrousd,invoice:false,completedAt:new Date().toISOString()});
      await rmdir(join(root,'LOCK'));await syncDir(root);
      return new Response(bytes,{status:response.status,headers:response.headers});
    }catch(error){throw error;}
  };
}
export async function sealFinalOutput(rootInput:string,outputFile:string,bytes:Uint8Array){
  const root=resolve(rootInput);await verifiedStage(root,'mapping');await verifiedStage(root,'audit');
  await writeOnce(root,'final-output.seal.json',{outputFile,sha256:digest(bytes),bytes:bytes.byteLength,sealedAt:new Date().toISOString()});
}
export async function readStageResponse(root:string,stage:Stage){
  return verifiedStage(resolve(root),stage);
}
async function verifiedStage(root:string,stage:Stage){
  const reservationFile=join(root,`${stage}.reservation.json`),completedFile=join(root,`${stage}.completed.json`),responseFile=join(root,`${stage}.response.json`);
  for(const file of [reservationFile,completedFile,responseFile]){const stat=await lstat(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&!(stat.mode&0o077));}
  const reservation=JSON.parse(await readFile(reservationFile,'utf8')),completed=JSON.parse(await readFile(completedFile,'utf8'));
  assert.equal(reservation.stage,stage);assert.equal(completed.stage,stage);assert.equal(completed.requestSha256,reservation.requestSha256);
  assert.equal(completed.invoice,false);assert.ok(Number.isSafeInteger(reservation.ceilingMicrousd)&&reservation.ceilingMicrousd>0);
  assert.ok(Number.isSafeInteger(completed.accountedConservativeMicrousd)&&completed.accountedConservativeMicrousd>=0&&completed.accountedConservativeMicrousd<=reservation.ceilingMicrousd);
  const encoded=await readFile(responseFile,'utf8'),bytes=Buffer.from(encoded,'base64');assert.equal(digest(bytes),completed.responseSha256);return bytes;
}
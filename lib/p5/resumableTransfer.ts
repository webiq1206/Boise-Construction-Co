import {SCOPE_CHUNK_SIZE,SCOPE_FILE_LIMIT,SCOPE_BATCH_LIMIT,SCOPE_FILE_COUNT,SCOPE_UPLOAD_HELP} from './scope.ts';
import {requireDraftReceipt,readJson} from './browserDraft.ts';
const digest=async(data:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
/** Retry only unacknowledged segments. Receipts and checksums are verified before clearing local files. */
export async function transferLargeFiles(files:File[],headers:Record<string,string>,progress:(percent:number)=>void,request=fetch){
  if(!files.length||files.length>SCOPE_FILE_COUNT||files.some(f=>!f.size||f.size>SCOPE_FILE_LIMIT)||files.reduce((n,f)=>n+f.size,0)>SCOPE_BATCH_LIMIT)throw new Error(SCOPE_UPLOAD_HELP);
  const total=files.reduce((n,f)=>n+f.size,0);let completed=0;let receipt:unknown;
  const expected:Array<{hash:string;size:number;name:string}>=[];
  const send=async(url:string,body:BodyInit,contentType:string)=>{
    for(let attempt=0;attempt<3;attempt++){
      try{
        const response=await request(url,{method:'POST',headers:{...headers,'Content-Type':contentType},body,signal:AbortSignal.timeout(240000)});
        // Gateways commonly answer transient failures with HTML, not JSON.
        if(!response.ok&&[409,429,502,503,504].includes(response.status)&&attempt<2){await response.body?.cancel();await new Promise(r=>setTimeout(r,1000*(attempt+1)));continue;}
        const data=await readJson(response);
        if(!response.ok)throw new Error(data.error||'Your upload could not be confirmed. Retry to resume the saved segments.');
        return data;
      }catch(error){if(attempt===2||error instanceof Error&& !['TypeError','TimeoutError','AbortError'].includes(error.name))throw error;}
    }
    throw new Error('Your upload connection was interrupted. Retry to resume.');
  };
  for(const file of files){
    const bytes=await file.arrayBuffer();if(bytes.byteLength!==file.size)throw new Error(`${file.name}: not fully read. Select the original file again.`);
    const hash=await digest(bytes),base=`/api/p5-estimator/upload?sha256=${hash}`;
    expected.push({hash,size:file.size,name:file.name});
    const status=await send(`${base}&action=start`,JSON.stringify({name:file.name,size:file.size}),'application/json');
    if(status.chunkSize!==SCOPE_CHUNK_SIZE)throw new Error('The upload settings changed. Reload to continue.');
    if(!status.complete)for(let offset=0,index=0;offset<file.size;offset+=SCOPE_CHUNK_SIZE,index++){
       const data=await file.slice(offset,offset+SCOPE_CHUNK_SIZE).arrayBuffer();
       if(data.byteLength!==Math.min(SCOPE_CHUNK_SIZE,file.size-offset))throw new Error(`${file.name}: upload segment was not fully read. Select the original file again.`);
       const checksum=await digest(data);
      if(status.chunks[index]!==checksum){
        const ack=await send(`${base}&action=part&part=${index}&checksum=${checksum}`,new Uint8Array(data),'application/octet-stream');
        if(ack.part!==index||ack.checksum!==checksum)throw new Error('An upload segment was not confirmed. Please retry.');
      }
      progress(Math.min(99,Math.round((completed+offset+data.byteLength)/total*100)));
    }
    receipt=await send(`${base}&action=finish`,'','application/json');
    const saved=requireDraftReceipt(receipt);
    for(const file of expected)if(!saved.uploads.some(f=>f.sha256===file.hash&&f.size===file.size))throw new Error(`${file.name}: upload was not confirmed. Retry to resume.`);
    completed+=file.size;progress(Math.min(99,Math.round(completed/total*100)));
  }
  return receipt;
}

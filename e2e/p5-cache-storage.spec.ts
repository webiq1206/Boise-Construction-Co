import {test,expect} from '@playwright/test';
import {build} from 'esbuild';

test.use({serviceWorkers:'block'});

test('real IndexedDB retains a >22 MiB mixed selection atomically and survives quota errors',async({page})=>{
  // No app/server/database/provider: the only allowed document is generated here.
  await page.route('**/*',route=>route.request().url()==='https://cache.fixture.invalid/'
    ?route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated cache fixture</title>'})
    :route.abort('blockedbyclient'));
  const bundled=await build({entryPoints:['lib/p5/browserDraft.ts'],bundle:true,write:false,format:'iife',globalName:'fixtureCache',platform:'browser',target:'es2022'});
  await page.goto('https://cache.fixture.invalid/');
  await page.addScriptTag({content:bundled.outputFiles[0].text});
  const result=await page.evaluate(async()=>{
    const cache=(window as any).fixtureCache;
    const bytes=new Uint8Array(23*1024*1024);bytes[0]=19;bytes[bytes.length-1]=219;
    const files=[new File([bytes],'plan.pdf'),new File(['photo fixture'],'site.jpg'),new File(['all spreadsheet exclusions'],'scope.xlsx')];
    let active=0,maxActive=0;
    for(const file of files){
      const read=file.arrayBuffer.bind(file);
      file.arrayBuffer=async()=>{active++;maxActive=Math.max(active,maxActive);try{return await read();}finally{active--;}};
    }
    const digest=async(file:File)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).join(',');
    const expected=await Promise.all(files.map(async f=>({name:f.name,size:f.size,digest:await digest(f)})));
    maxActive=0;
    await cache.cacheFiles('fixture',files);
    const serializedReads=maxActive;
    const recover=async()=>Promise.all((await cache.loadCachedFiles('fixture')).map(async(f:File)=>({name:f.name,size:f.size,digest:await digest(f)})));
    const restored=await recover();
    const originalPut=IDBObjectStore.prototype.put;
    let quotaError='';
    IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){
      if(String(value?.id).startsWith('staging:')&&value?.name==='replacement.xlsx')throw new DOMException('Fixture quota exhausted','QuotaExceededError');
      return key===undefined?originalPut.call(this,value):originalPut.call(this,value,key);
    };
    try{await cache.cacheFiles('fixture',[new File(['new PDF'],'replacement.pdf'),new File(['new spreadsheet'],'replacement.xlsx')]);}
    catch(error){quotaError=(error as Error).name;}
    finally{IDBObjectStore.prototype.put=originalPut;}
    const afterQuota=await recover();
    // Cache callers may time out without cancelling the write. A later clear
    // must queue behind it and remain the final durable state.
    await Promise.all([cache.cacheFiles('fixture',files),cache.clearCachedFiles('fixture')]);
    const cleared=await cache.loadCachedFiles('fixture');
    return {expected,restored,afterQuota,serializedReads,quotaError,cleared:cleared.length};
  });
  expect(result.serializedReads).toBe(1);
  expect(result.restored.sort((a:any,b:any)=>a.name.localeCompare(b.name))).toEqual(result.expected.sort((a:any,b:any)=>a.name.localeCompare(b.name)));
  expect(result.quotaError).toBe('QuotaExceededError');
  expect(result.afterQuota.sort((a:any,b:any)=>a.name.localeCompare(b.name))).toEqual(result.expected);
  expect(result.cleared).toBe(0);
});
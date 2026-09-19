import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import ts from 'typescript';
import {digest,openGuard,canonicalSourcePath} from './lib/livePricingGuard.mts';
import type {PricingRequest} from '../lib/p5/scopePricing';
import {ESTIMATOR_BRAND as brand} from '../lib/p5/brand';
import type {EstimatorConfiguration} from '../lib/p5/costBook';
import type {ReviewedScope} from '../lib/p5/scope';

// Qualification uses an explicitly authorized LOCAL configuration snapshot.
// No customer DB or delivery module is imported. All network except the
// allowance's exact provider generation URLs is denied. Each generation stops
// subsequent calls until immutable operator billing reconciliation is supplied.
if(process.env.P5_RUN_LIVE_PRICING!=='true')throw new Error('Explicit live pricing test authorization is required.');
const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function main(){
 const allowanceFile=process.env.P5_LIVE_PRICING_ALLOWANCE_FILE;
 assert.ok(allowanceFile,'Blocked: explicit documented allowance file required; no paid requests made.');
 const guard=await openGuard(allowanceFile,globalThis.fetch);
 // Pin the entire local import graph before importing the production engine.
 // Only audited global-fetch provider code is allowed to access transport.
 const visited=new Set<string>();
 async function audit(file:string):Promise<void>{
  file=await canonicalSourcePath(process.cwd(),file);if(visited.has(file))return;visited.add(file);
  const source=await readFile(file,'utf8'),key=relative(process.cwd(),file);
  assert.equal(guard.allowance.sourceSha256?.[key],digest(source),'Blocked: unaudited pricing source');
  assert.ok(!/\b(?:require|import)\s*\(|\b(?:XMLHttpRequest|WebSocket|process\s*\[|eval)\b/.test(source),'Blocked: indirect transport');
  if(!['lib/p5/scopePricing.ts','lib/p5/processingBudget.ts'].includes(key)){
   assert.ok(!/\bfetch\b|\bhttps?\b|\bundici\b|\bglobalThis\s*\[/.test(source),'Blocked: unaudited transport path');
  }
  for(const ref of ts.preProcessFile(source).importedFiles){
   if(['node:crypto','zod'].includes(ref.fileName))continue;
   assert.ok(ref.fileName.startsWith('.'),'Blocked: unaudited external dependency');
   const next=resolve(dirname(file),ref.fileName);
   await audit(/\.[cm]?tsx?$/.test(next)?next:`${next}.ts`);
  }
 }
 await audit('lib/p5/scopePricing.ts');
 globalThis.fetch=guard.fetch;
 const {priceCompleteScope,requestPricing}=await import('../lib/p5/scopePricing');
 const configurationBytes=await readFile(guard.allowance.configurationFile);
 assert.equal(digest(configurationBytes),guard.allowance.configurationSha256,'Blocked: configuration snapshot mismatch');
 const configuration=JSON.parse(configurationBytes.toString()) as EstimatorConfiguration,before=fingerprint(configuration),reports:any[]=[];
 assert.ok(configuration.planningCatalog?.rates?.length,'The approved local catalog must be populated');
 const services=brand.services as readonly string[],cabinet=String(brand.id)==='cabinet';
 const baseService=services.includes('handyman')?'handyman':services.includes('kitchen')?'kitchen':services[0];
 const selected=process.env.P5_LIVE_PRICING_SCENARIO||'both';assert.ok(['both','mapping','missing'].includes(selected));
  const outputDirectory=`p5-verification/live-pricing-${Date.now()}-${process.pid}`;
  await mkdir(outputDirectory,{recursive:false,mode:0o700});
 for(const scenario of ['mapping','missing'].filter(s=>selected==='both'||s===selected)){
  const missing=scenario==='missing';
  const text=missing?'Supply 100 linear feet of standard paint-grade wood crown moulding for kitchen cabinets in Boise, Idaho. Materials only; owner installs it. Price the moulding by linear foot using a preliminary average material cost for the area.':cabinet?'Install 20 linear feet of owner-supplied, assembled paint-grade Shaker base cabinets on the first floor of Building Alpha. Installation labor only, including normal leveling, fastening and adjustment.':'Fit and fasten 100 linear feet of paint-grade interior base moulding on the first floor of Building Alpha. Baseboard installation labor only. Owner supplies all materials.';
  const instructions=missing?'Price only the 100 linear feet of crown moulding material. Exclude installation, painting, cabinet casework and all other work. Use sourced regional average material costs per linear foot, or a clearly labeled broader benchmark. Do not shop suppliers or require an exact SKU.':'Price only the specified first-floor installation labor in Building Alpha. Owner supplies all materials. Exclude all plumbing, electrical and second-floor work. Do not charge owner-supplied materials.';
  const scope:ReviewedScope={text,answers:{service:missing&&services.includes('cabinet-product')?'cabinet-product':cabinet?'cabinet-install':baseService,location:'Boise, Idaho',estimatingInstructions:instructions,...(cabinet&&!missing?{cabinetRoom:'kitchen',cabinetBaseLf:'20',cabinetUpperLf:'0',cabinetTallLf:'0'}:{})},extraction:null,uploads:[],reviewedAt:new Date().toISOString(),corrections:[]};
  const config=structuredClone(configuration);
  // A deliberately missing material category in an in-memory test copy forces
  // the research path. The owner's saved185-rate catalog remains untouched.
  if(missing)config.planningCatalog!.rates=config.planningCatalog!.rates.filter(rate=>rate.type!=='Material');
  const stages:any[]=[];const request:PricingRequest=async(instructions,input,search,remaining)=>{
   const start=performance.now();try{const result=await requestPricing(instructions,input,search,remaining);stages.push({search,milliseconds:Math.round(performance.now()-start),sourceUrls:result.sourceUrls,value:result.value});return result;}catch(error){stages.push({search,milliseconds:Math.round(performance.now()-start),error:'Provider qualification blocked or failed; inspect private ledger.'});throw error;}finally{await writeFile(`${outputDirectory}/live-pricing-${scenario}-stage-${stages.length}.json`,JSON.stringify(stages,null,2),{flag:'wx',mode:0o600});}
  };
  const start=performance.now();const result=await priceCompleteScope(scope,config,request);const internal=result.internal as any;
  const issues=internal.scopePricing?.issues||[];const lines=internal.lines||[];
  reports.push({scenario,scope,elapsedMs:Math.round(performance.now()-start),stages,result,passed:Boolean(result.customer.range)&&lines.length>0&&lines.every((line:any)=>line.quantity>0&&line.cost>0)&&issues.length===0});
   await writeFile(`${outputDirectory}/live-pricing-${scenario}-report.json`,JSON.stringify(reports.at(-1),null,2),{flag:'wx',mode:0o600});
 }
 const report={synthetic:true,brand:brand.id,approvedRateCount:configuration.planningCatalog!.rates.length,approvedConfigurationUnchanged:before===fingerprint(configuration),businessWrites:0,delivery:'not invoked; no delivery transport imported',reports};
 await writeFile(`${outputDirectory}/live-pricing-report.json`,JSON.stringify(report,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({brand:brand.id,approvedRateCount:report.approvedRateCount,unchanged:report.approvedConfigurationUnchanged,scenarios:reports.map(r=>({scenario:r.scenario,passed:r.passed,range:r.result.customer.range,elapsedMs:r.elapsedMs,issues:r.result.internal.scopePricing?.issues}))}));
 assert.ok(report.approvedConfigurationUnchanged,'The approved configuration must not change');assert.ok(reports.every(r=>r.passed),'Every synthetic scope must have a complete positive range');
}
main().then(()=>process.exit(0)).catch(()=>{console.error('Live pricing qualification blocked or failed. Inspect allowance and private ledger; do not reset reservations.');process.exit(1);});

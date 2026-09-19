import {prepare,prepareAudit,runStage} from './lib/singleQualificationRunner.mts';
const [command,...args]=process.argv.slice(2);
if(command==='--prepare'){
  if(args.length!==2)throw new Error('Usage: --prepare CONFIGURATION MANIFEST');
  const result=await prepare(args[0],args[1]);
  console.log(JSON.stringify({prepared:true,stage:'mapping',manifest:args[1],requestSha256:result.stages.mapping.requestSha256,ceilingMicrousd:result.stages.mapping.ceilingMicrousd}));
}else if(command==='--run'){
  if(args.length!==1)throw new Error('Usage: --run MANIFEST');
  const result=await runStage(args[0],'mapping');console.log(JSON.stringify(result));
}else if(command==='--prepare-audit'){
  if(args.length!==2)throw new Error('Usage: --prepare-audit MAPPING_MANIFEST AUDIT_MANIFEST');
  const result=await prepareAudit(args[0],args[1]);console.log(JSON.stringify({prepared:true,stage:'audit',manifest:args[1],requestSha256:result.stages.audit!.requestSha256,scenarioCeilingMicrousd:result.stages.mapping.ceilingMicrousd+result.stages.audit!.ceilingMicrousd}));
}else if(command==='--run-audit'){
  if(args.length!==1)throw new Error('Usage: --run-audit AUDIT_MANIFEST');
  const result=await runStage(args[0],'audit');console.log(JSON.stringify({completed:true,outputFile:'outputFile' in result?result.outputFile:undefined}));
}else throw new Error('Specify --prepare, --run, --prepare-audit, or --run-audit');
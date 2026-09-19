import {prepare,run} from './lib/authenticatedRuntimeAcceptance.mts';

const [command,credentialsFile,journalFile,revision,...extra]=process.argv.slice(2);
if(!command||!credentialsFile||!journalFile||extra.length)throw new Error('Usage: --prepare|--inspect|--analyze|--review|--submit|--pdf CREDENTIALS JOURNAL [EXPECTED_REVISION]');
try{
  const result=command==='--prepare'
    ?await prepare(credentialsFile,journalFile)
    :await run({credentialsFile,journalFile,action:command.replace(/^--/,''),expectedRevision:revision===undefined?undefined:Number(revision),authorization:process.env.P5_RUNTIME_AUTHORIZATION,receiverPreflightFile:process.env.P5_RUNTIME_RECEIVER_PREFLIGHT});
  console.log(JSON.stringify(result,null,2));
}catch(error){
  // No response bodies, draft contents, credentials, or network error URLs in logs.
  console.error(error instanceof Error?error.message:'Runtime acceptance stopped');
  process.exitCode=1;
}
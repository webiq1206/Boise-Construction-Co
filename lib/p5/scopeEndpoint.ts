import {ProcessingDeadlineError,PROCESSING_PAUSED} from './processingBudget.ts';
import {applyCabinetIntent} from "./projectIntent";
import {advanceAnalysis,analysisSourceVersion} from "./analysisWork";
import {queuedJob} from './backgroundJobs';
import {reconcileScope,scopeQuestionsForBrand as scopeQuestions,manualScopeAnswers} from "./adaptive";
import {isProjectReplacement} from './projectReplacement';
import {costQuestionFields} from "./questionPolicy";
import {createHash} from "node:crypto";
import { analyzeScope } from "./extraction.ts";
import { prepareAnalysisFiles,verifyUpload } from "./documents";
import {removeInstructionAnswers} from "./clarifications";
import { SCOPE_BATCH_LIMIT,SCOPE_TEXT_LIMIT,SCOPE_FILE_COUNT,SCOPE_UPLOAD_HELP } from "./scope.ts";
import { draftCredentials,readDraft,readUploads,saveUpload,saveDraft,DraftError } from "./store";
import { failed,json,limitedBody,protectRequest } from "./http";
import { ESTIMATOR_BRAND } from "./brand";
export function sourceTransition(wizard:{sourceVersion?:string;sourceTextHash?:string;sourceTextAppended?:boolean;pendingSourceVersion?:string;pendingSourceTextHash?:string}|undefined,version:string,textHash:string){
  const sameSource=wizard?.sourceVersion===version||wizard?.pendingSourceVersion===version;
  const priorTextHash=wizard?.pendingSourceVersion===version?wizard.pendingSourceTextHash:wizard?.sourceTextHash;
  // Legacy drafts have no text hash. A source transition must conservatively
  // discard generated clarification state rather than assume the text stayed
  // compatible merely because the upload set changed.
  return {sameSource,sourceChanged:!sameSource,sourceTextChanged:Boolean(!sameSource&&(!priorTextHash||(!wizard?.sourceTextAppended&&priorTextHash!==textHash)))};
}
export async function postScope(request:Request){
  try{
    protectRequest(request,1000);const {id,key}=draftCredentials(request);let draft=await readDraft(id,key);
    if(!draft)throw new DraftError("Save your draft before analyzing.",404);
    const bytes=await limitedBody(request,24*1024*1024);
    const form=await new Response(bytes as BodyInit,{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData();
    const submittedText=form.get("text");
    const text=String(submittedText??draft.text);
    if(submittedText!==null&&text!==draft.text)throw new DraftError("Save your project details before analyzing the scope.",409);
    if(text.length>SCOPE_TEXT_LIMIT)throw new DraftError("Upload this scope as a document so every section can be processed.");
    const files=form.getAll("files");if(files.length>SCOPE_FILE_COUNT)throw new DraftError(SCOPE_UPLOAD_HELP);
    const requested:string[]=[];const incoming=[];const known=new Set(draft.uploads.map(f=>f.sha256));
    for(const file of files){
      if(!(file instanceof File))throw new DraftError("Invalid file.");
      let verified;try{verified=verifyUpload(file.name,Buffer.from(await file.arrayBuffer()));}catch(error){throw new DraftError(error instanceof Error?error.message:"Invalid upload.");}
      const digest=createHash("sha256").update(verified.data).digest("hex");
      requested.push(digest);
      if(!known.has(digest)){known.add(digest);incoming.push(verified);}
    }
    if(incoming.length+draft.uploads.length>SCOPE_FILE_COUNT)throw new DraftError(SCOPE_UPLOAD_HELP);
    if(incoming.reduce((n,f)=>n+f.data.length,0)+draft.uploads.reduce((n,f)=>n+f.size,0)>SCOPE_BATCH_LIMIT)throw new DraftError(SCOPE_UPLOAD_HELP,413);
    for(const file of incoming)await saveUpload(id,key,file);
    if(incoming.length){draft=await readDraft(id,key);if(!draft)throw new DraftError("Saved project could not be restored. Please retry.",503);}
    if(form.get("analyze")==="false")return json({draft:await readDraft(id,key),analysis:null});
    const checkpointed=form.get("resumable")==="true"&&process.env.P5_OBJECT_STORAGE_ENABLED==="true";
    const activeUploads=draft.uploads.filter(upload=>!(draft.wizard?.retiredUploadIds||[]).includes(upload.id));
    const stored=(checkpointed?[]:await readUploads(id,key)).filter(file=>activeUploads.some(upload=>upload.id===file.id));if(stored.reduce((n,f)=>n+f.data.length,0)>SCOPE_BATCH_LIMIT)throw new DraftError(SCOPE_UPLOAD_HELP,413);
    const version=analysisSourceVersion(text,activeUploads);
    const sourceTextHash=createHash("sha256").update(text).digest("hex");
     const {sameSource,sourceChanged,sourceTextChanged}=sourceTransition(draft.wizard,version,sourceTextHash);
    // A resolution belongs to the source that produced its question. Applying
    // it to a replacement scope would quietly carry an old measurement or
    // exclusion into the new estimate.
     const declaredReplacement=Boolean(draft.wizard?.replacement)||isProjectReplacement({previousText:draft.text,nextText:text,previousAnswers:draft.answers,previousExtraction:draft.extraction});
     const resetForReplacement=declaredReplacement;
     const resolutions=sourceChanged?{}:(draft.wizard?.resolutions||{});
     const appendedText=Boolean(sourceChanged&&draft.wizard?.sourceTextAppended&&!sourceTextChanged);
      const priorAnswers=resetForReplacement?{...(draft.wizard?.replacementAnswers||{})}:appendedText?{...draft.answers}:manualScopeAnswers(draft.answers,draft.extraction,sourceChanged?{}:resolutions);
     if((sourceTextChanged||resetForReplacement)&&draft.wizard?.instructionAnswers?.length){
      const estimatingInstructions=removeInstructionAnswers(priorAnswers.estimatingInstructions,draft.wizard.instructionAnswers);
      if(estimatingInstructions)priorAnswers.estimatingInstructions=estimatingInstructions;
      else delete priorAnswers.estimatingInstructions;
    }
     const visitorAnswers=applyCabinetIntent(text,ESTIMATOR_BRAND.services,priorAnswers).answers;
    let analysis=null;let warning="";let reusedAnalysis=false;
    // Saving a normal answer changes reconciliation input, not the source
    // documents. Reuse the acknowledged extraction instead of entering the
    // reader lifecycle again; warning/retry requests deliberately bypass this
    // fast path so failed pages remain recoverable.
    const incompleteSavedAnalysis=Boolean(draft.extraction?.documentCoverage&&!draft.extraction.documentCoverage.complete);
    const reuseSavedAnalysis=Boolean(sameSource&&draft.extraction&&!incompleteSavedAnalysis&&form.get('retry')!=='true');
    try{
      if(reuseSavedAnalysis){
        reusedAnalysis=true;
      }else if(checkpointed){
        const background=form.get('background')==='true';
        const analysisDraft={...draft,uploads:activeUploads};
        const job=background?await queuedJob({kind:'analysis',draft:analysisDraft,text,answers:visitorAnswers},form.get('retry')==='true'):null;
        if(job&&job.state!=='complete')return json({pending:job.state!=='failed',progress:job.progress,processing:job.processing,...(job.state==='failed'?{error:job.progress}:{})},job.state==='failed'?503:200);
        const step=job?job.result:await advanceAnalysis(analysisDraft,text,visitorAnswers,fetch,form.get("retry")==="true");
        if(step.pending)return json(step);
        analysis=step.analysis;
      }else{
      const {readable,manualReview}=await prepareAnalysisFiles(stored);
      if(!text.trim()&&!readable.length&&!Object.values(draft.answers).some(v=>v?.trim()))throw new Error(manualReview.join(" ")||"Add a project description or a document.");
      analysis=await analyzeScope(text,readable,visitorAnswers);
      analysis.extraction.reviewNotes.push(...manualReview);
      }
      const unread=analysis?.extraction.reviewNotes.filter((note:string)=>/saved for manual review|could not read|automatic read failed|automatic reading could not finish|unread section requires review|unreadable|partial/.test(note))||[];
      if(unread.length)warning="Some files need review before pricing. "+unread.join(" ");
    }catch(error){
      if(error instanceof ProcessingDeadlineError)throw new DraftError(PROCESSING_PAUSED,503);
      console.error("[p5-scope-analysis]",error instanceof Error?error.message:"analysis failed");
      warning="Your files are saved, but automatic reading could not finish. You can retry without uploading again, or add the key details below. Unread documents will need review before pricing.";
    }
     let sourceExtraction=analysis?.extraction||(reusedAnalysis?draft.extraction:null);
    if(sourceExtraction)sourceExtraction=applyCabinetIntent(text,ESTIMATOR_BRAND.services,visitorAnswers,sourceExtraction).extraction!;
     const replacementFromExtraction=Boolean(sourceChanged&&sourceExtraction&&isProjectReplacement({previousText:draft.text,nextText:text,previousAnswers:draft.answers,previousExtraction:draft.extraction,nextExtraction:sourceExtraction}));
     const replacement=resetForReplacement||replacementFromExtraction;
     const effectiveAnswers=replacement?{...(resetForReplacement?draft.wizard?.replacementAnswers||{}:{})}:visitorAnswers;
    const extraction=sourceExtraction||draft.extraction;
     const merged=sourceExtraction?reconcileScope(effectiveAnswers,sourceExtraction,replacement?{}:resolutions):{answers:effectiveAnswers,conflicts:[]};
     const completeCurrentAnalysis=Boolean(analysis&&(!analysis.extraction.documentCoverage||analysis.extraction.documentCoverage.complete)&&!warning);
    const wizard={
       instructionAnswers:(sourceTextChanged||replacement)?[]:draft.wizard?.instructionAnswers||[],
       skipped:(sourceChanged||replacement)?[]:draft.wizard?.skipped||[],
       resolutions:replacement?{}:resolutions,
      // Keep the prior successful fingerprint until this attempt completes.
      // A retry must enter the same durable work record rather than treating a
      // failed replacement as a fresh completed source.
      sourceVersion:analysis?version:draft.wizard?.sourceVersion,
      sourceTextHash:analysis?sourceTextHash:draft.wizard?.sourceTextHash,
      pendingSourceVersion:analysis?undefined:(sourceChanged?version:draft.wizard?.pendingSourceVersion),
      pendingSourceTextHash:analysis?undefined:(sourceChanged?sourceTextHash:draft.wizard?.pendingSourceTextHash),
       replacement:replacement&&!completeCurrentAnalysis||undefined,
       replacementAnswers:replacement&&!completeCurrentAnalysis?draft.wizard?.replacementAnswers:undefined,
       retiredUploadIds:draft.wizard?.retiredUploadIds,
    };
    // Partial analysis is visible and prevents unread documents from being priced.
    const baseExtraction=sourceChanged&&!analysis?null:extraction;
    const safeExtraction=warning&&baseExtraction?{...baseExtraction,summary:baseExtraction.summary||text,facts:baseExtraction.facts||[],conflicts:baseExtraction.conflicts||[],missingInformation:baseExtraction.missingInformation||[],reviewNotes:[...new Set([...(baseExtraction.reviewNotes||[]),warning])]}:baseExtraction;
    const saved=await saveDraft(id,key,ESTIMATOR_BRAND.id,{text,answers:merged.answers,extraction:safeExtraction,reviewed:null,contact:draft.contact,wizard},draft.revision);
    if(requested.some(digest=>!saved.uploads.some(file=>file.sha256===digest)))throw new DraftError("Some files could not be confirmed. Please retry; duplicate files will not be added twice.",503);
    const pricedFields=await costQuestionFields(saved.answers);
    return json({draft:saved,analysis,warning,conflicts:merged.conflicts,pricedFields,questions:scopeQuestions(saved.answers,safeExtraction,merged.conflicts,wizard.skipped,pricedFields)});
  }catch(error){return failed(error);}
}

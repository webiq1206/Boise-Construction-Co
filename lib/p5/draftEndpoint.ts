import {instructionPrompts,upsertInstructionAnswer,type InstructionAnswer} from './clarifications';
import {resolveInstructionAnswer} from './clarificationAnswer';
import {analysisSourceVersion} from './analysisWork';
import {deriveScopeAnswers,reconcileScope,scopeQuestions} from "./adaptive";
import {isProjectReplacement} from './projectReplacement';
import {costQuestionFields} from "./questionPolicy";
import { ESTIMATOR_BRAND } from "./brand";
import { draftCredentials, readDraft, saveDraft, DraftError } from "./store";
import { SCOPE_FIELDS, SCOPE_TEXT_LIMIT, validateAnswer, validateExtraction, type ScopeAnswers, type ReviewedScope, type ScopeExtraction } from "./scope.ts";
import { failed,json,limitedBody,protectRequest } from "./http";
export async function getDraft(request:Request){try{protectRequest(request);const {id,key}=draftCredentials(request);return json({draft:await readDraft(id,key)});}catch(error){return failed(error);}}
export function parseAnswers(raw:unknown):ScopeAnswers {
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new DraftError("Invalid project answers.");
  const answers:ScopeAnswers={};
  for(const [field,value]of Object.entries(raw)){
    if(!Object.hasOwn(SCOPE_FIELDS,field)||typeof value!=="string")throw new DraftError("Invalid project answer.");
    const error=validateAnswer(field as keyof ScopeAnswers,value);if(error)throw new DraftError(error);
    answers[field as keyof ScopeAnswers]=value;
  }return answers;
}
/** Clarification saves are retried with the browser's old answer snapshot.
 * Rebuild generated instruction records from the acknowledged server history
 * before resolving or writing, so a lost response cannot erase the answer. */
export function mergeServerClarificationAnswers(raw:ScopeAnswers,saved:ScopeAnswers,history:InstructionAnswer[],clarification:boolean){
  if(!clarification)return raw;
  let instructions=saved.estimatingInstructions||raw.estimatingInstructions||'';
  for(const record of history)instructions=upsertInstructionAnswer(instructions,record.question,record.answer);
  // The clarification operation does not edit the ordinary scope fields.
  // Start from the acknowledged server snapshot so a stale browser payload
  // cannot clear a field saved by another request.
  const result={...saved,...raw};
  if(instructions)result.estimatingInstructions=instructions;
  else delete result.estimatingInstructions;
  return result;
}
/** A yes/no reply retires a source only when it answers a replacement question,
 * never when it answers an unrelated generic confirmation. */
export function confirmsProjectReplacement(extraction:ScopeExtraction|null|undefined,answers:ScopeAnswers,clarification:{id?:unknown;answer?:unknown}|undefined){
  if(!extraction||typeof clarification?.id!=='string'||typeof clarification.answer!=='string')return false;
  const prompt=instructionPrompts(extraction,answers).find(question=>question.id===clarification.id);
  if(!prompt||!/\b(?:replace|replacement|supersed|instead of|rather than|new (?:project|scope))\b/i.test(`${prompt.question} ${prompt.detail||''}`))return false;
  return /^(?:yes|yeah|yep|confirm(?:ed)?|correct|it does|replace(?:s|d)?)(?:[\s,.!]|$)/i.test(clarification.answer.trim());
}
export async function putDraft(request:Request){
  try{
    protectRequest(request);const {id,key}=draftCredentials(request);
    const raw=JSON.parse(new TextDecoder().decode(await limitedBody(request,24*1024*1024)));
    if(typeof raw.text!=="string"||raw.text.length>SCOPE_TEXT_LIMIT||!Number.isInteger(raw.revision)||raw.revision<0)throw new DraftError("Invalid draft.");
     const rawAnswers=deriveScopeAnswers(parseAnswers(raw.answers));const existing=await readDraft(id,key);
     const previousText=existing?.text?.trim()||'',nextText=raw.text.trim();
     const analyzedExisting=Boolean(existing?.extraction||existing?.wizard?.sourceVersion||existing?.wizard?.sourceTextHash||existing?.wizard?.pendingSourceVersion);
     const appendCandidate=Boolean(previousText&&nextText.length>previousText.length&&nextText.startsWith(previousText));
     const correctiveAppend=appendCandidate&&/\b(?:actually|instead|rather|no longer|correction|correct|change|changed|replace|replaced|update|updated|remove|removed|exclude|excluded|delete|deleted|revision)\b/i.test(nextText.slice(previousText.length));
     const appendedText=appendCandidate&&!correctiveAppend;
      const confirmation=raw.clarification as {id?:unknown;answer?:unknown}|undefined;
      const replacementConfirmation=confirmsProjectReplacement(existing?.extraction,existing?.answers||{},confirmation);
      const replacedText=Boolean(analyzedExisting&&previousText&&nextText!==previousText&&isProjectReplacement({previousText,nextText,previousAnswers:existing?.answers,nextAnswers:rawAnswers,previousExtraction:existing?.extraction})||replacementConfirmation);
     // A replacement can arrive with the browser's old answer snapshot. Keep
     // only fields that actually changed in this request; generated
     // clarification history never crosses into an unrelated project.
     const replacementAnswers:ScopeAnswers={};
      if(replacedText)for(const [field,value] of Object.entries(rawAnswers)){
        const key=field as keyof ScopeAnswers;
        const numericMention=SCOPE_FIELDS[key].kind==='number'&&new RegExp(`(?:^|\\D)${value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|\\D)`).test(nextText);
        const serviceMention=key==='service'&&new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(nextText);
        if(field!=='estimatingInstructions'&&(existing?.answers[key]!==value||(replacementConfirmation&&(numericMention||serviceMention))))replacementAnswers[key]=value;
      }
      const pendingReplacementAnswers=replacedText?replacementAnswers:existing?.wizard?.replacement?{...(existing.wizard.replacementAnswers||{}),...Object.fromEntries(Object.entries(rawAnswers).filter(([field,value])=>existing.answers[field as keyof ScopeAnswers]!==value))}:undefined;
     let answers=replacedText?replacementAnswers:mergeServerClarificationAnswers(rawAnswers,existing?.answers||{},existing?.wizard?.instructionAnswers||[],Boolean(raw.clarification));
     const sourceVersion=analysisSourceVersion(raw.text,existing?.uploads||[]);
     const savedWizard=raw.clarification&&existing?.wizard?existing.wizard:raw.wizard;
     const skipped=replacedText?[]:Array.isArray(savedWizard?.skipped)?savedWizard.skipped.filter((k:unknown)=>typeof k==="string"&&Object.hasOwn(SCOPE_FIELDS,k)&&k!=="service"):[];
     const resolutions=replacedText?{}:parseAnswers(savedWizard?.resolutions||{});
      const retiredUploadIds=replacedText?[...new Set([...(existing?.wizard?.retiredUploadIds||[]),...(existing?.uploads||[]).map(upload=>upload.id)])]:existing?.wizard?.retiredUploadIds;
      const wizard={skipped,resolutions,sourceVersion:replacedText?undefined:existing?.wizard?.sourceVersion,sourceTextHash:replacedText?undefined:existing?.wizard?.sourceTextHash,sourceTextAppended:replacedText?undefined:(appendedText||existing?.wizard?.sourceTextAppended||undefined),pendingSourceVersion:replacedText?undefined:existing?.wizard?.pendingSourceVersion,pendingSourceTextHash:replacedText?undefined:existing?.wizard?.pendingSourceTextHash,replacement:replacedText||existing?.wizard?.replacement||undefined,replacementAnswers:pendingReplacementAnswers,retiredUploadIds,instructionAnswers:replacedText?[]:existing?.wizard?.instructionAnswers||[]};
      const clarification=confirmation;
     const repeatedClarification=Boolean(existing&&clarification&&typeof clarification.id==="string"&&typeof clarification.answer==="string"&&existing.wizard?.instructionAnswers?.some(item=>item.id===clarification.id&&item.answer===String(clarification.answer).trim())&&(existing.wizard.sourceVersion===sourceVersion||existing.wizard.pendingSourceVersion===sourceVersion));
     // A response can be lost after the server commits but before the browser
     // receives the new revision. Return that acknowledged answer idempotently
     // instead of asking the stale browser snapshot to overwrite it.
     if(clarification&&existing&&raw.revision!==existing.revision&&repeatedClarification){
       const pricedFields=await costQuestionFields(existing.answers);
       const conflicts=existing.extraction?reconcileScope(existing.answers,existing.extraction,existing.wizard?.resolutions||{}).conflicts:[];
       return json({draft:existing,conflicts,questions:scopeQuestions(existing.answers,existing.extraction,conflicts,existing.wizard?.skipped||[],pricedFields),pricedFields});
     }
    // Provider extraction is immutable to public clients. Corrections live in answers.
     let extraction=replacedText?null:existing?.extraction||null;
     if(raw.clarification&&!replacementConfirmation){
      if(!existing||raw.revision!==existing.revision)throw new DraftError('Your project changed in another tab. Refresh to continue.',409);
       if(existing.wizard?.sourceVersion!==sourceVersion&&existing.wizard?.pendingSourceVersion!==sourceVersion)throw new DraftError('This question belongs to an earlier project scope. Refresh and review the replacement scope before answering.',409);
      const resolved=await resolveInstructionAnswer(extraction,answers,raw.clarification,wizard.instructionAnswers);
      extraction=resolved.extraction;answers=resolved.answers;wizard.instructionAnswers=resolved.history;
      wizard.resolutions.estimatingInstructions=answers.estimatingInstructions;
       // A clarification can authoritatively replace a retained extracted fact
       // (for example, a selected assembly's labor subtotal). Record only the
       // fields actually changed by its resolver, never a browser's full stale
       // answer snapshot, so reconciliation does not re-open that decision.
       for(const field of resolved.resolvedFields||[])if(field!=='estimatingInstructions'&&answers[field]?.trim())wizard.resolutions[field]=answers[field];
    }
    if(extraction?.instructions){
      const instructions=extraction.instructions;
      extraction={...extraction,instructions:{...instructions,questions:instructionPrompts(extraction,answers).map(q=>q.detail||q.question)}};
    }
     const contact={
       name:String(replacedText&&raw.contact?.name===undefined?existing?.contact?.name||"":raw.contact?.name||"").trim(),
       email:String(replacedText&&raw.contact?.email===undefined?existing?.contact?.email||"":raw.contact?.email||"").trim().toLowerCase(),
       phone:String(replacedText&&raw.contact?.phone===undefined?existing?.contact?.phone||"":raw.contact?.phone||"").trim(),
     };
    if(contact.name.length>120||contact.email.length>200||contact.phone.length>40)throw new DraftError("Contact details are too long.");
    let reviewed:ReviewedScope|null=null;
    if(raw.reviewed===true){
       const acknowledgedSource=Boolean(existing?.wizard?.sourceVersion===sourceVersion&&!existing?.wizard?.pendingSourceVersion);
       const incompleteCoverage=Boolean(extraction?.documentCoverage&&!extraction.documentCoverage.complete);
       const missingUploadedCoverage=Boolean(existing?.uploads.length&&!extraction?.documentCoverage);
       const failedAnalysis=Boolean(extraction?.reviewNotes.some(note=>/saved for manual review|could not read|automatic read failed|automatic reading could not finish|unread section requires review|unreadable|partial/i.test(note)));
       if(!existing||!extraction||!acknowledgedSource||incompleteCoverage||missingUploadedCoverage||failedAnalysis)throw new DraftError('Analyze the current project scope completely before reviewing it.',409);
      if(extraction?.instructions?.questions.length)throw new DraftError('Answer the remaining scope question before continuing.');
      const unresolved=extraction?reconcileScope(answers,extraction,resolutions).conflicts:[];
      if(unresolved.length)throw new DraftError(`Confirm ${SCOPE_FIELDS[unresolved[0].field].label} before submitting.`);
      for(const conflict of extraction?.conflicts||[])if(!answers[conflict.field]?.trim())throw new DraftError(`Resolve ${SCOPE_FIELDS[conflict.field].label} before submitting.`);
      reviewed={text:raw.text,answers,extraction,uncertainFields:skipped,uploads:existing?.uploads||[],reviewedAt:new Date().toISOString(),
        corrections:Object.entries(answers).filter(([field,value])=>{const fact=extraction?.facts.find(f=>f.field===field);return fact&&fact.value!==value;}).map(([field,value])=>({field:field as keyof ScopeAnswers,previous:extraction!.facts.find(f=>f.field===field)!.value,value:value!})),
      };
    }
    const draft=await saveDraft(id,key,ESTIMATOR_BRAND.id,{text:raw.text,answers,extraction,reviewed,contact,wizard},raw.revision);
    const pricedFields=await costQuestionFields(answers);
    const conflicts=extraction?reconcileScope(answers,extraction,resolutions).conflicts:[];
    return json({draft,conflicts,questions:scopeQuestions(answers,extraction,conflicts,skipped,pricedFields),pricedFields});
  }catch(error){return failed(error);}
}

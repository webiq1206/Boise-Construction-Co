import {analyzeBatch} from './extraction';
import {clarificationContext,instructionPrompts,questionKey,upsertInstructionAnswer,type InstructionAnswer} from './clarifications';
import {DraftError} from './store';
import {mergeScopeFacts,SCOPE_FIELDS,SCOPE_TEXT_LIMIT,type ScopeAnswers,type ScopeExtraction,type ScopeField} from './scope';
import type {ScopeInstructions} from './instructions';
import {applyRetainedBenchTopSelection} from './retainedBenchTopSelection';

const numericCue:Partial<Record<ScopeField,RegExp>>={
  sqft:/\b(?:project\s*)?area\b|\b(?:sq\.?\s*ft|square\s*feet?)\b/i,
  garageSqft:/\bgarage\b/i,
  coveredOutdoorSqft:/\b(?:covered\s*)?(?:outdoor|patio|porch|deck)\b/i,
  cabinetBaseLf:/\b(?:base|lower)\s+cabinet(?:s|\s+run)?\b/i,
  cabinetUpperLf:/\b(?:upper|wall)\s+cabinet(?:s|\s+run)?\b/i,
  cabinetTallLf:/\btall\s+cabinet(?:s|\s+run)?\b/i,
  length:/\blength\b/i,
  width:/\bwidth\b/i,
  rooms:/\brooms?\b/i,
  bathrooms:/\bbath(?:room)?s?\b/i,
  stories:/\b(?:stories|story|storeys|storey)\b/i,
  flooringSqft:/\bfloor(?:ing)?\b/i,
  tileSqft:/\btile\b/i,
  laborHours:/\b(?:labor|labour|hours?|assembly|install(?:ation)?)\b/i,
  countertopSqft:/\b(?:counter|bench)\s*top\b/i,
  demolitionSqft:/\bdemolition\b/i,
  fixtureCount:/\bfixtures?\b/i,
  trimLf:/\b(?:trim|baseboard)\b/i,
  projectMonths:/\b(?:months?|duration)\b/i,
};
function answerNamesNumber(answer:string,value:string){
  const escaped=value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/,/g,'[,]?');
  return new RegExp(`(?:^|[^0-9.])${escaped}(?:$|[^0-9.])`).test(answer);
}
/** A provider's confidence cannot promote a value that the visitor did not
 * state. This is especially important where a known top LF can look like an
 * unsupported base-cabinet LF in an abbreviated clarification response. */
function groundedClarificationFacts(extraction:ScopeExtraction,answer:string){
  return extraction.facts.filter(fact=>{
    if(fact.confidence<.85||!['stated','calculated'].includes(fact.basis||'inferred'))return false;
    if(SCOPE_FIELDS[fact.field].kind==='number'){
      const cue=numericCue[fact.field]||new RegExp(SCOPE_FIELDS[fact.field].label.split(/\s+/).slice(0,2).join('\\s+'),'i');
      return answerNamesNumber(answer,fact.value)&&cue.test(answer);
    }
    const value=fact.value.toLowerCase().replace(/[^a-z0-9]+/g,'');
    return value.length>2&&answer.toLowerCase().replace(/[^a-z0-9]+/g,'').includes(value);
  });
}

export async function resolveInstructionAnswer(extraction:ScopeExtraction|null,answers:ScopeAnswers,raw:unknown,prior:InstructionAnswer[]=[],request=fetch):Promise<{extraction:ScopeExtraction|null;answers:ScopeAnswers;history:InstructionAnswer[];resolvedFields?:ScopeField[]}>{
  const value=raw as {id?:unknown;answer?:unknown};
  if(typeof value?.id!=='string'||typeof value.answer!=='string'||!value.answer.trim()||value.answer.length>SCOPE_TEXT_LIMIT)throw new DraftError('Enter an answer to continue.');
  // Search against the extraction before filtering already-recorded answers. A
  // browser can retry an acknowledged save while the provider's old prompt is
  // still present; that retry must not read the documents again.
  const prompt=instructionPrompts(extraction,{...answers,estimatingInstructions:''}).find(q=>q.id===value.id);
  if(!prompt||!extraction){
    if(prior.some(p=>p.id===value.id&&p.answer===String(value.answer).trim())){
      const restored=prior.reduce((text,item)=>upsertInstructionAnswer(text,item.question,item.answer),answers.estimatingInstructions);
      return {extraction,answers:{...answers,estimatingInstructions:restored},history:prior};
    }
    throw new DraftError('This question has changed. Refresh your saved project to continue.',409);
  }
  const answer=value.answer.trim(),question=prompt.detail||prompt.question;
  const previous=prior.find(p=>p.id===prompt.id);
  if(previous&&previous.answer===answer){
    if(!extraction.instructions)throw new DraftError('This question has changed. Refresh your saved project to continue.',409);
    const correctedAnswers={...answers,estimatingInstructions:upsertInstructionAnswer(answers.estimatingInstructions,question,answer)};
    const instructions:ScopeInstructions={...extraction.instructions,questions:instructionPrompts(extraction,correctedAnswers).map(q=>q.detail||q.question)};
    return {extraction:{...extraction,instructions},answers:correctedAnswers,history:prior};
  }
  // This response resolves every material, quantity and inclusion in the
  // retained four-option bench-top record. Apply it locally so its original
  // pages are not sent back for another read and cannot be replaced by a
  // provider's abbreviated clarification response.
  const retained=applyRetainedBenchTopSelection(extraction,answers,question,answer);
  if(retained){
    const record={id:prompt.id,question,answer};
    const resolvedFields=Object.keys(retained.answers).filter(field=>retained.answers[field as ScopeField]!==answers[field as ScopeField]) as ScopeField[];
    return {extraction:retained.extraction,answers:retained.answers,history:[...prior.filter(item=>item.id!==record.id),record],resolvedFields};
  }
  const result=await analyzeBatch(clarificationContext(extraction,question,answer),[],answers,request,60000);
  if(!result.extraction.instructions)throw new DraftError('Your answer is still here. We could not save its scope update. Please retry.',503);
  const instructions=result.extraction.instructions;
  const repeated=instructions.questions.find(q=>questionKey(q)===prompt.id);
  if(repeated)throw new DraftError('Please make the scope decision explicit, such as what to include or exclude. Your answer is saved in this tab.');
  // Preserve other unanswered questions even if a provider omitted them.
  const priorWithoutThisAnswer=answers.estimatingInstructions?.split(/\n{2,}/).filter(part=>questionKey(part.match(/^Question:\s*([\s\S]*?)\s*\nAnswer:/i)?.[1]||'')!==questionKey(question)).join('\n\n');
  instructions.questions=[...new Set([...instructionPrompts(extraction,{...answers,estimatingInstructions:priorWithoutThisAnswer}).filter(q=>q.id!==prompt.id).map(q=>q.detail||q.question),...instructions.questions])];
  const record={id:prompt.id,question,answer};
  // A clarification may explicitly correct a quantity or material. Promote only
  // high-confidence returned facts into reviewed answers while retaining the
  // original document ledger and takeoffs as immutable history.
  const groundedFacts=groundedClarificationFacts(result.extraction,answer);
  const factAnswers=mergeScopeFacts(answers,{...result.extraction,facts:groundedFacts}).answers;
  const combined=upsertInstructionAnswer(factAnswers.estimatingInstructions,question,answer);
  if(combined.length>SCOPE_TEXT_LIMIT)throw new DraftError('Upload the additional scope notes as a document to preserve them in full.');
  const updatedExtraction={
    ...result.extraction,
    facts:[...extraction.facts,...groundedFacts].filter((fact,index,all)=>all.findIndex(item=>item.field===fact.field&&item.value===fact.value&&item.source===fact.source&&item.evidence===fact.evidence)===index),
    conflicts:[...extraction.conflicts,...result.extraction.conflicts].filter((conflict,index,all)=>all.findIndex(item=>item.field===conflict.field&&item.explanation===conflict.explanation&&item.values.length===conflict.values.length&&item.values.every(value=>conflict.values.includes(value)))===index),
    documentCoverage:extraction.documentCoverage,
    takeoffs:extraction.takeoffs,
    reviewNotes:[...new Set([...extraction.reviewNotes,...result.extraction.reviewNotes])],
    missingInformation:[...new Set([...extraction.missingInformation,...result.extraction.missingInformation])],
  };
  const nextAnswers={...factAnswers,estimatingInstructions:combined};
  const resolvedFields=Object.keys(nextAnswers).filter(field=>nextAnswers[field as ScopeField]!==answers[field as ScopeField]) as ScopeField[];
  return {extraction:{...updatedExtraction,instructions},answers:nextAnswers,history:[...prior.filter(item=>item.id!==record.id),record],resolvedFields};
}

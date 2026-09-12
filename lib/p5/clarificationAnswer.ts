import {analyzeBatch} from './extraction';
import {clarificationContext,instructionPrompts,questionKey,upsertInstructionAnswer,type InstructionAnswer} from './clarifications';
import {DraftError} from './store';
import {SCOPE_TEXT_LIMIT,type ScopeAnswers,type ScopeExtraction} from './scope';
import type {ScopeInstructions} from './instructions';

export async function resolveInstructionAnswer(extraction:ScopeExtraction|null,answers:ScopeAnswers,raw:unknown,prior:InstructionAnswer[]=[],request=fetch):Promise<{extraction:ScopeExtraction|null;answers:ScopeAnswers;history:InstructionAnswer[]}>{
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
  const result=await analyzeBatch(clarificationContext(extraction,question,answer),[],answers,request,60000);
  if(!result.extraction.instructions)throw new DraftError('Your answer is still here. We could not save its scope update. Please retry.',503);
  const instructions=result.extraction.instructions;
  const repeated=instructions.questions.find(q=>questionKey(q)===prompt.id);
  if(repeated)throw new DraftError('Please make the scope decision explicit, such as what to include or exclude. Your answer is saved in this tab.');
  // Preserve other unanswered questions even if a provider omitted them.
  const priorWithoutThisAnswer=answers.estimatingInstructions?.split(/\n{2,}/).filter(part=>questionKey(part.match(/^Question:\s*([\s\S]*?)\s*\nAnswer:/i)?.[1]||'')!==questionKey(question)).join('\n\n');
  instructions.questions=[...new Set([...instructionPrompts(extraction,{...answers,estimatingInstructions:priorWithoutThisAnswer}).filter(q=>q.id!==prompt.id).map(q=>q.detail||q.question),...instructions.questions])];
  const record={id:prompt.id,question,answer};
  const combined=upsertInstructionAnswer(answers.estimatingInstructions,question,answer);
  if(combined.length>SCOPE_TEXT_LIMIT)throw new DraftError('Upload the additional scope notes as a document to preserve them in full.');
  return {extraction:{...extraction,instructions},answers:{...answers,estimatingInstructions:combined},history:[...prior.filter(item=>item.id!==record.id),record]};
}

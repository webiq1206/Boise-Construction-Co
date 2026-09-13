import {atomicInstructionQuestions,textBenchTopChoices,cabinetQuestionField} from './atomicQuestions.ts';
import type {ScopeAnswers,ScopeExtraction,ScopeField} from './scope.ts';

export interface InstructionAnswer {id:string;question:string;answer:string}
export interface InstructionPrompt {id:string;question:string;detail?:string;values?:string[];field?:ScopeField}
export const questionKey=(text:string)=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const serviceQuestion=(text:string)=>/which .*services|what .*remodel.*service|company.s scope|typical .*services|offered.*services|services.*offered|residential remodel|boise .*estimate|requested subset/i.test(text);
const sentenceAbbreviation=/\b(?:approx|e\.g|i\.e|etc|no|sq|ft|in|oz|lb|lbs|yd|yds|hr|hrs|min|sec|cm|mm|kg|gal|pt|qt|dr|mr|mrs|ms|prof|st|vs)\.$/i;

/** Split legacy paragraphs at actual question/sentence boundaries without
 * turning decimal measurements or units into standalone prompts. */
export function splitInstructionQuestions(text:string){
  const parts:string[]=[];let start=0;
  const flush=(end:number)=>{
    const part=text.slice(start,end).trim();
    if(part)parts.push(part);
    start=end;
  };
  for(let index=0;index<text.length;index++){
    const mark=text[index];
    if(mark==='?'){flush(index+1);continue;}
    if(mark!=='!'&&mark!=='.')continue;
    const previous=text[index-1]||'',next=text[index+1]||'';
    if(mark==='.'&&/\d/.test(previous)&&/\d/.test(next))continue;
    const remainder=/^\s+([A-Za-z])/.exec(text.slice(index+1));
    if(!remainder||remainder[1]!==remainder[1].toUpperCase())continue;
    const before=text.slice(start,index+1).trim();
    if(sentenceAbbreviation.test(before)||/^[A-Z]\.$/.test(before.slice(-2)))continue;
    flush(index+1);
  }
  flush(text.length);
  return parts;
}

function answerBlocks(text:string):string[]{
  return text.split(/\n{2,}/).map(part=>part.trim()).filter(Boolean);
}

/** A clarification answer is a durable scope fact, not a new document source. */
export function hasInstructionAnswer(text:string|undefined,question:string){
  if(!text)return false;
  const wanted=questionKey(question);
  return answerBlocks(text).some(block=>{
    const match=/^Question:\s*([\s\S]*?)\s*\nAnswer:\s*([\s\S]+)$/i.exec(block);
    return Boolean(match&&questionKey(match[1])===wanted&&match[2].trim());
  });
}

/** Replace a prior answer to the same decision instead of accumulating stale answers. */
export function upsertInstructionAnswer(text:string|undefined,question:string,answer:string){
  const blocks=answerBlocks(text||'').filter(block=>{
    const match=/^Question:\s*([\s\S]*?)\s*\nAnswer:\s*([\s\S]+)$/i.exec(block);
    return !(match&&questionKey(match[1])===questionKey(question));
  });
  blocks.push(`Question: ${question}\nAnswer: ${answer}`);
  return blocks.join('\n\n');
}

/** Remove generated clarification records when the visitor replaces the source scope. */
export function removeInstructionAnswers(text:string|undefined,history:InstructionAnswer[]=[]){
  if(!text||!history.length)return text||'';
  const answered=new Set(history.map(item=>questionKey(item.question)));
  return answerBlocks(text).filter(block=>{
    const match=/^Question:\s*([\s\S]*?)\s*\nAnswer:\s*([\s\S]+)$/i.exec(block);
    return !(match&&answered.has(questionKey(match[1])));
  }).join('\n\n');
}

/** One question per card, including older extractions that stored paragraphs. */
export function instructionPrompts(extraction:ScopeExtraction|null,answers:ScopeAnswers):InstructionPrompt[]{
  const result:InstructionPrompt[]=[];
  for(const raw of extraction?.instructions?.questions||[]){
    for(const part of splitInstructionQuestions(raw).flatMap(part=>atomicInstructionQuestions(part,answers,extraction?.conflicts))){
      const full=part.replace(/\s+/g,' ').trim();if(!full)continue;
      // Filter each question separately so a legacy paragraph cannot lose a real scope decision.
      if(serviceQuestion(full))continue;
      const field=cabinetQuestionField(full);
      if(field&&answers[field]?.trim()&&!extraction?.conflicts.some(conflict=>conflict.field===field))continue;
      const id=questionKey(full);
      if(result.some(q=>q.id===id))continue;
      // Clarification responses are appended to the scope as durable records. Do
      // not ask one of those records again if a provider retained its old prompt.
      if(hasInstructionAnswer(answers.estimatingInstructions,full))continue;
      const question=full.length<=180?full:'What should we include for this part of your project?';
      const values=/labor.only/i.test(full)&&/materials.only/i.test(full)?['Labor only','Materials only','Labor and materials']:
        /include or exclude|include.*or.*exclude/i.test(full)?['Include it','Exclude it']:undefined;
      result.push({id,question,...(field?{field}:{}),...(question!==full?{detail:full}:{}),values:/^Who should install the /i.test(full)?['Include installation in this estimate','Owner handles installation']:values?.length?values:textBenchTopChoices(extraction,full)});
    }
  }
  return result;
}

/** Answers remain scope data for the pricing audit, with original pages intact. */
export function clarificationContext(extraction:ScopeExtraction,question:string,answer:string){
  return JSON.stringify({
    task:'Resolve only this answered scope question using the answer below. Return the complete updated instructions, preserving every unrelated inclusion, exclusion, responsibility, building and floor. An explicit selection controls over alternatives retained in the original document: include only the selected alternative and record every explicitly excluded alternative as an exclusion; never choose an excluded mention. Apply every stated quantity, labor breakdown and inclusion change from the answer. Remove this question when answered. Never ask it again because a page was not reuploaded. This is a clarification of a document review already completed. Do not produce page records, takeoffs, or unreadable-file notes. If the answer is insufficient, return one short, specific follow-up explaining the missing decision.',
    previousInstructions:extraction.instructions,question,answer,
  });
}

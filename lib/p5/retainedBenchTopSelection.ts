import {questionKey,upsertInstructionAnswer} from './clarifications.ts';
import {laborQuantityClarificationUpdate,reconcileLaborEvidence,type LaborEvidenceRecord} from './laborEvidence.ts';
import type {ScopeAnswers,ScopeExtraction} from './scope.ts';

export const RETAINED_BENCH_TOP_QUESTION='Which bench top option should be included in the estimate?';
export interface RetainedBenchTopChoice {option:number;description:string;laborHours:number}
interface RetainedBenchTopData {choices:RetainedBenchTopChoice[];assemblyHours?:number;installationHours?:number}

const normalized=(value:string)=>value.replace(/\s+/g,' ').trim();
const compact=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'');
const sameQuestion=(a:string,b:string)=>questionKey(a)===questionKey(b);
const isBenchTopQuestion=(question:string)=>/\bbench\s*top\b/i.test(question)&&/\boption\b/i.test(question)&&/\binclude(?:d)?\b/i.test(question);
const hours=/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/gi;

function documentText(extraction:ScopeExtraction,answers?:ScopeAnswers){
  return [
    extraction.summary,
    ...extraction.facts.flatMap(f=>[f.value,f.evidence]),
    ...(extraction.instructions?[...extraction.instructions.inclusions,...extraction.instructions.exclusions,...extraction.instructions.responsibilities]:[]),
    ...extraction.takeoffs?.flatMap(t=>[t.description,t.evidence])||[],
    answers?.taskList,answers?.otherDetails,answers?.alternates,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value.trim())).join('\n');
}
function retainedSources(extraction:ScopeExtraction){
  return [
    extraction.summary,
    ...extraction.facts.map(f=>`${f.evidence}\n${f.value}`),
    ...extraction.takeoffs?.flatMap(t=>[t.description,t.evidence])||[],
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value.trim()));
}
function cleanDescription(value:string){
  return normalized(value.replace(/^.*?(?:bench\s*top\s*(?:options?|alternates?)?|options?)\s*:\s*/i,'').replace(/^(?:and|or)\s+/i,'').replace(/[(:\-–\s]+$/,''));
}
/** Read alternatives only from the retained extraction. A four-option choice
 * cannot be reconstructed from an answer that merely says “Option 2”. */
export function retainedBenchTopChoices(extraction:ScopeExtraction):RetainedBenchTopChoice[]{
  const seen=new Set<string>(),items:(RetainedBenchTopChoice&{position:number})[]=[];
  let position=0;
  for(const source of retainedSources(extraction)){
    if(!/\b(?:bench\s*top|counter\s*top|options?|alternates?)\b/i.test(source))continue;
    const entry=/(?:^|[,;])\s*(?:option\s*(\d+)\s*[:\-–]?\s*)?([^,;\n]+?)\s*(?:[-:–]?\s*)\(?\s*(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/gi;
    for(const match of source.matchAll(entry)){
      const cleaned=cleanDescription(match[2]),embedded=/^option\s*(\d+)\s*[:\-–]?\s*(.+)$/i.exec(cleaned);
      const description=embedded?embedded[2]:cleaned,option=match[1]?Number(match[1]):embedded?Number(embedded[1]):0;
      const laborHours=Number(match[3]),key=compact(description);
      if(!description||!Number.isFinite(laborHours)||laborHours<=0||seen.has(key))continue;
      seen.add(key);items.push({option,description,laborHours,position:position++});
    }
  }
  if(items.length!==4)return [];
  const explicit=items.every(item=>Number.isInteger(item.option)&&item.option>0)
    &&new Set(items.map(item=>item.option)).size===4;
  return items.sort((a,b)=>explicit?a.option-b.option:a.position-b.position).map((item,index)=>({option:explicit?item.option:index+1,description:item.description,laborHours:item.laborHours}));
}
function namedHours(text:string,description:RegExp){
  let result:number|undefined;
  for(const match of text.matchAll(hours)){
    const before=text.slice(0,match.index);
    const separator=Math.max(before.lastIndexOf('+'),before.lastIndexOf(';'),before.lastIndexOf(','),before.lastIndexOf('\n'),before.lastIndexOf('.'));
    const tail=before.slice(separator+1);
    if(description.test(tail))result=Number(match[1]);
  }
  return result&&Number.isFinite(result)&&result>0?result:undefined;
}
function choicePhrase(choice:RetainedBenchTopChoice){
  const pieces=choice.description.split(/[^a-z0-9]+/i).filter(Boolean).map(piece=>piece.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  return pieces.join('[\\s/\\-]*');
}
function explicitlyExcluded(answer:string,choice:RetainedBenchTopChoice){
  const target=`(?:option\\s*${choice.option}\\b|${choicePhrase(choice)})`;
  const negative='(?:exclude|excluded|without|omit|omitted|remove|removed|not|no)';
  // “Exclude all options except Option 2” is an affirmative selection of the
  // exception; it must win over the broad exclusion list that precedes it.
  if(new RegExp(`\\bexcept\\s+(?:the\\s+)?${target}`,'i').test(answer))return false;
  // Negation applies to its own named/numbered option, not every option in a
  // comma-separated answer such as “Option 2, not Option 1”.
  if(new RegExp(`\\b${negative}\\b\\s+(?:the\\s+)?${target}|${target}\\s+(?:is\\s+)?\\b${negative}\\b`,'i').test(answer))return true;
  // “Exclude A, B, and C; select D” has one negation governing a list. Keep
  // that list bounded at the next affirmative selection verb.
  return answer.split(/[.\n;]/).some(clause=>{
    const start=clause.search(new RegExp(`\\b${negative}\\b`,'i'));if(start<0)return false;
    const remainder=clause.slice(start);
    const affirmative=remainder.search(/\b(?:select|selected|include|choose|use)\b/i);
    const excluded=affirmative<0?remainder:remainder.slice(0,affirmative);
    return new RegExp(target,'i').test(excluded);
  });
}
function selectedChoice(answer:string,choices:RetainedBenchTopChoice[]){
  const selected=new Set<RetainedBenchTopChoice>();
  for(const choice of choices){
    const numeric=new RegExp(`\\boption\\s*${choice.option}\\b`,'i');
    if((numeric.test(answer)||compact(answer).includes(compact(choice.description)))&&!explicitlyExcluded(answer,choice))selected.add(choice);
  }
  return selected.size===1?[...selected][0]:null;
}
function quantity(text:string,expression:RegExp){
  const match=expression.exec(text);if(!match)return undefined;
  const words:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  return Number(match[1])||words[match[1].toLowerCase()];
}
function retainedData(extraction:ScopeExtraction,answers?:ScopeAnswers):RetainedBenchTopData|null{
  const choices=retainedBenchTopChoices(extraction);if(!choices.length)return null;
  const text=documentText(extraction,answers);
  const assemblyHours=namedHours(text,/\b(?:base\s*)?(?:cabinet\s*)?assembly\b/i);
  const installationHours=namedHours(text,/\bcabinet(?:ry)?\s+install(?:ation)?\b/i);
  return {choices,assemblyHours,installationHours};
}
function provenance(extraction:ScopeExtraction,needle:string){
  const fact=extraction.facts.find(item=>compact(`${item.value} ${item.evidence}`).includes(compact(needle)))||extraction.facts[0];
  return {source:fact?.source||'retained document',evidence:fact?.evidence||extraction.summary||'Retained document selection.'};
}
function selectedLaborEvidence(extraction:ScopeExtraction,choice:RetainedBenchTopChoice,answer:string,assemblyHours?:number,installationHours?:number,topHours?:number){
  const source=provenance(extraction,choice.description),answerSource={source:'visitor clarification',evidence:answer};
  const records:LaborEvidenceRecord[]=[
    {id:'selected-bench-assembly',workId:'selected-bench-assembly',hours:assemblyHours??null,kind:'task',...source,basis:'stated'},
    {id:'selected-cabinet-installation',workId:'selected-cabinet-installation',hours:installationHours??null,kind:'task',...source,basis:'stated'},
    {id:'selected-bench-top',workId:'selected-bench-top',hours:topHours??null,kind:'task',...(answer?answerSource:source),basis:'stated'},
  ];
  return reconcileLaborEvidence({records,requiredWorkIds:records.map(record=>record.workId)});
}
function hasSeparateScopedWork(extraction:ScopeExtraction,answers:ScopeAnswers){
  if(answers.taskList?.trim())return true;
  // A global answer copied directly from the retained labor fact is the stale
  // subtotal being clarified, not evidence of another work package.
  if(answers.laborHours?.trim()&&!extraction.facts.some(f=>f.field==='laborHours'&&f.value===answers.laborHours))return true;
  return Boolean(extraction.takeoffs?.some(item=>!/\bbench\s*top\b|\bcounter\s*top\b|\bcabinet\b/i.test(`${item.description} ${item.component}`)));
}
function appendUnique(values:string[],value:string){
  return values.some(item=>compact(item)===compact(value))?values:[...values,value];
}

/** Apply an unambiguous visitor selection against four choices retained in the
 * original document. No alternative name, duration, or quantity is hardcoded. */
export function applyRetainedBenchTopSelection(extraction:ScopeExtraction,answers:ScopeAnswers,question:string,answer:string){
  if(!isBenchTopQuestion(question))return null;
  const data=retainedData(extraction,answers),choice=data&&selectedChoice(answer,data.choices);
  if(!data||!choice)return null;
  // A selected option and its own explicit exclusion are contradictory. Keep
  // the existing concise question rather than silently selecting either one.
  if(explicitlyExcluded(answer,choice))return null;
  const answerAssembly=namedHours(answer,/\b(?:base\s*)?(?:cabinet\s*)?assembly\b/i);
  const answerInstallation=namedHours(answer,/\bcabinet(?:ry)?\s+install(?:ation)?\b/i);
  const answerTop=namedHours(answer,/\b(?:bench\s*)?top\b.{0,45}\b(?:fabricat|install)|\b(?:fabricat|install).{0,45}\b(?:bench\s*)?top\b/i);
  const assemblyHours=answerAssembly??data.assemblyHours,installationHours=answerInstallation??data.installationHours,topHours=answerTop??choice.laborHours;
  const laborReconciliation=selectedLaborEvidence(extraction,choice,answer,assemblyHours,installationHours,topHours);
  const laborUpdate=laborQuantityClarificationUpdate(laborReconciliation);
  const laborSubtotal=laborReconciliation.aggregate.complete?laborReconciliation.aggregate.hours:undefined;
  const cabinets=quantity(answer,/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+cabinet\s+units?\b/i);
  const hardware=quantity(answer,/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+knobs?\s*\/\s*pulls?\b/i);
  const quantities=[cabinets&&`${cabinets} cabinet units`,hardware&&`${hardware} knobs/pulls`].filter(Boolean).join(' and ');
  const laborTerms=[assemblyHours&&`cabinet assembly ${assemblyHours} hours`,installationHours&&`cabinet installation ${installationHours} hours`,topHours&&`${choice.description} fabrication/install ${topHours} hours`].filter(Boolean).join(' + ');
  const selectedTask=`Selected bench top: ${choice.description}.${quantities?` Include ${quantities}.`:''}${laborTerms?` ${laborTerms}${laborSubtotal?` = ${laborSubtotal} labor-hour subtotal for this selected cabinet/bench package.`:'.'}`:''}`;
  const exclusions=data.choices.filter(item=>item!==choice).map(item=>`${item.description} bench top alternative`);
  const existingTask=answers.taskList?.trim();
  const existingOtherScope=Boolean(existingTask&&compact(existingTask)!==compact(selectedTask));
  const instructions=extraction.instructions!;
  const nextInstructions={
    ...instructions,
    inclusions:appendUnique(instructions.inclusions,selectedTask),
    exclusions:exclusions.reduce((all,item)=>appendUnique(all,`Exclude ${item}.`),instructions.exclusions),
    questions:instructions.questions.filter(item=>!sameQuestion(item,question)),
  };
  if(!laborSubtotal)nextInstructions.questions=appendUnique(nextInstructions.questions,'Confirm the cabinet assembly and installation labor hours for the selected bench package.');
  const nextAnswers:ScopeAnswers={
    ...answers,
    materials:choice.description,
    taskList:[existingTask,selectedTask].filter(Boolean).join('\n'),
    estimatingInstructions:upsertInstructionAnswer(answers.estimatingInstructions,question,answer.trim()),
  };
  // laborHours is a project-wide field. Only write it where the retained
  // document contains no separate labor package and no pre-existing task total.
  if(laborUpdate.laborHours&&!hasSeparateScopedWork(extraction,answers)&&!existingOtherScope)nextAnswers.laborHours=laborUpdate.laborHours;
  return {extraction:{...extraction,instructions:nextInstructions},answers:nextAnswers};
}

/** A document-derived pricing projection. Original pages/facts are still sent
 * separately as retained history, while this tells every pricing stage which
 * one of the four alternatives controls. */
export function retainedBenchTopSelectionGuidance(answers:ScopeAnswers,extraction:ScopeExtraction|null){
  if(!extraction)return null;
  const data=retainedData(extraction,answers),answer=answers.estimatingInstructions||'';
  const choice=data&&selectedChoice(answer,data.choices);if(!data||!choice||explicitlyExcluded(answer,choice))return null;
  const answerAssembly=namedHours(answer,/\b(?:base\s*)?(?:cabinet\s*)?assembly\b/i);
  const answerInstallation=namedHours(answer,/\bcabinet(?:ry)?\s+install(?:ation)?\b/i);
  const answerTop=namedHours(answer,/\b(?:bench\s*)?top\b.{0,45}\b(?:fabricat|install)|\b(?:fabricat|install).{0,45}\b(?:bench\s*)?top\b/i);
  const assemblyHours=answerAssembly??data.assemblyHours,installationHours=answerInstallation??data.installationHours,topHours=answerTop??choice.laborHours;
  const laborReconciliation=selectedLaborEvidence(extraction,choice,answer,assemblyHours,installationHours,topHours);
  const laborSubtotal=laborReconciliation.aggregate.complete?laborReconciliation.aggregate.hours:undefined;
  const topTakeoff=extraction.takeoffs?.find(item=>/\bbench\s*top\b|\bcounter\s*top\b/i.test(`${item.description} ${item.component}`)&&item.quantity!==null);
  return {
    decision:`Visitor selected retained document option ${choice.option}: ${choice.description}.`,
    include:[choice.description,...(laborSubtotal?[`selected cabinet/bench package labor subtotal: ${laborSubtotal} hours`]:[])],
    exclude:data.choices.filter(item=>item!==choice).map(item=>item.description),
    laborSubtotal,
    laborBreakdown:{cabinetAssembly:assemblyHours??null,cabinetInstallation:installationHours??null,selectedTop:topHours??null},
    ...(topTakeoff?{benchTopQuantity:{quantity:topTakeoff.quantity,unit:topTakeoff.unit,evidence:topTakeoff.evidence}}:{}),
    constraints:[
      'Price no explicitly excluded retained-document alternative.',
      'This selected-package labor subtotal is not a complete project labor total when other or unmeasured work remains.',
      'Use a separately documented bench-top quantity; do not infer it from cabinet footage.',
      'An undocumented tall-cabinet length remains unknown, not zero.',
    ],
  };
}
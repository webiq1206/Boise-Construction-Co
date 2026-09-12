import type {ScopeAnswers,ScopeExtraction} from './scope.ts';

type ReplacementInput={
  previousText?:string;nextText?:string;previousAnswers?:ScopeAnswers;nextAnswers?:ScopeAnswers;
  previousExtraction?:ScopeExtraction|null;nextExtraction?:ScopeExtraction|null;
};

function serviceInText(text:string|undefined){
  const value=(text||'').toLowerCase();
  if(/\b(?:accessory dwelling unit|adu)\b/.test(value))return 'adu';
  if(/\b(?:new (?:home|house|residence)|new[- ]construction)\b/.test(value))return 'new-construction';
  if(/\b(?:home|house)\s+addition\b|\baddition\b/.test(value))return 'addition';
  if(/\b(?:bathroom|bath)\s+(?:remodel|renovation)\b/.test(value)||/\b(?:bathroom|bath)\b.*\b(?:project|scope)\b/.test(value))return 'bathroom';
  if(/\bkitchen\s+(?:remodel|renovation)\b/.test(value)||/\bkitchen\b.*\b(?:project|scope)\b/.test(value))return 'kitchen';
  if(/\b(?:repair|repairs|handyman)\b/.test(value))return 'handyman';
  return undefined;
}

function serviceInExtraction(extraction:ScopeExtraction|null|undefined){
  return extraction?.facts.find(f=>f.field==='service'&&f.confidence>=.85)?.value;
}

/** True only when the request establishes a new project boundary, not when it
 * merely changes an item in an otherwise continuing scope. */
export function isProjectReplacement(input:ReplacementInput){
  const previousService=input.previousAnswers?.service||serviceInExtraction(input.previousExtraction)||serviceInText(input.previousText);
  // Typed wording is more current than a browser payload that can still carry
  // the previous project's service selection.
  const nextService=serviceInText(input.nextText)||input.nextAnswers?.service||serviceInExtraction(input.nextExtraction);
  const text=input.nextText||'';
  const replacement=/\b(?:replaces?|replaced|replacement|supersedes?|superseded|instead of|rather than)\b/i.test(text);
  const boundary=/\b(?:project|scope|home|house|residence|dwelling|adu|accessory dwelling|building|garage)\b/i.test(text);
  const namedNewBoundary=/\b(?:new|unrelated|different)\s+(?:project|scope)\b/i.test(text);
  // A service picker correction alone is not a new project. Require the
  // visitor to state a project boundary before retiring any saved source.
  if(previousService&&nextService&&previousService!==nextService)return replacement&&boundary||namedNewBoundary;
  if(!replacement)return false;
  const areas=(text.match(/\b\d[\d,]*(?:\.\d+)?\s*(?:sq(?:uare)?\.?\s*(?:feet|foot)|sq\.?\s*ft|sf)\b/gi)||[]).length;
  // Replacing a fixture is an ordinary edit. Replacement language has to name
  // a project boundary, or distinguish two stated project areas, before it can
  // discard durable answers.
  return boundary&&(/\b(?:project|scope)\b/i.test(text)||areas>=2);
}
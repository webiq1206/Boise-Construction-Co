import test from 'node:test';
import assert from 'node:assert/strict';
import {completeLaborHoursAnswer,laborQuantityClarificationUpdate,reconcileLaborEvidence,type LaborEvidenceRecord} from '../lib/p5/laborEvidence.ts';
import {combineScopeExtractions,mergeScopeFacts,validateExtraction,type ExtractedFact, type ScopeExtraction} from '../lib/p5/scope.ts';
import {emptyInstructions} from '../lib/p5/instructions.ts';

const record=(overrides:Partial<LaborEvidenceRecord>&Pick<LaborEvidenceRecord,'id'|'workId'|'hours'>):LaborEvidenceRecord=>({
  kind:'task',source:'typed scope',evidence:'Explicit labor task evidence.',basis:'stated',...overrides,
});

test('independent explicit trade labor is aggregated once',()=>{
  const result=reconcileLaborEvidence({records:[
    record({id:'excavation',workId:'excavation',hours:16,source:'site-notes.pdf',evidence:'Excavation labor is 16 hours.'}),
    record({id:'concrete',workId:'concrete',hours:24,source:'foundation.pdf',evidence:'Concrete labor is 24 hours.'}),
  ]});
  assert.equal(result.aggregate.hours,40);
  assert.equal(result.aggregate.complete,true);
  assert.deepEqual(result.aggregate.measuredWorkIds,['concrete','excavation']);
  assert.deepEqual(result.sourceHistory.map(item=>item.source),['site-notes.pdf','foundation.pdf']);
});

test('different explicit values for the same work are a conflict, never a sum',()=>{
  const result=reconcileLaborEvidence({records:[
    record({id:'excavation-a',workId:'excavation',hours:16,evidence:'Excavation labor is 16 hours.'}),
    record({id:'excavation-b',workId:'excavation',hours:24,source:'revision.pdf',evidence:'Excavation labor is 24 hours.'}),
  ]});
  assert.equal(result.aggregate.hours,0);
  assert.equal(result.aggregate.complete,false);
  assert.deepEqual(result.aggregate.conflictedWorkIds,['excavation']);
  assert.equal(result.conflicts[0].reason,'different-task-values');
  assert.equal(result.sourceHistory.length,2);
});

test('repeated explicit summary totals remain evidence history without double counting',()=>{
  const result=reconcileLaborEvidence({records:[
    record({id:'excavation',workId:'excavation',hours:16,evidence:'Excavation labor is 16 hours.'}),
    record({id:'concrete',workId:'concrete',hours:24,evidence:'Concrete labor is 24 hours.'}),
    record({id:'summary-a',workId:'labor-summary-a',kind:'summary',hours:40,coveredWorkIds:['excavation','concrete'],evidence:'Labor summary total is 40 hours.'}),
    record({id:'summary-b',workId:'labor-summary-b',kind:'summary',hours:40,coveredWorkIds:['excavation','concrete'],source:'summary.pdf',evidence:'Repeated labor summary total is 40 hours.'}),
  ]});
  assert.equal(result.aggregate.hours,40);
  assert.equal(result.aggregate.complete,true);
  assert.equal(result.resolutions.filter(item=>item.status==='duplicate').length,2);
  assert.equal(result.sourceHistory.length,4);
});

test('a selected-work subtotal remains partial when another required labor task is unmeasured',()=>{
  const result=reconcileLaborEvidence({requiredWorkIds:['cabinet-assembly','cabinet-installation','bench-top','other-labor'],records:[
    record({id:'selected-cabinet',workId:'selected-cabinet',kind:'subtotal',hours:14,coveredWorkIds:['cabinet-assembly','cabinet-installation','bench-top'],evidence:'Selected cabinet labor subtotal is 14 hours.'}),
    record({id:'other-labor',workId:'other-labor',hours:null,evidence:'Other included labor has no stated hours.'}),
  ]});
  assert.equal(result.aggregate.hours,14);
  assert.equal(result.aggregate.complete,false);
  assert.deepEqual(result.aggregate.unmeasuredWorkIds,['other-labor']);
  assert.equal(completeLaborHoursAnswer(result),undefined);
  const update=laborQuantityClarificationUpdate(result);
  assert.equal(update.aggregate.hours,14);
  assert.equal(update.aggregate.complete,false);
  assert.equal(update.laborHours,undefined);
});

test('an unscoped summary is known evidence but cannot claim complete project coverage',()=>{
  const result=reconcileLaborEvidence({records:[
    record({id:'subtotal',workId:'selected-cabinet',kind:'subtotal',hours:14,evidence:'Selected work subtotal is 14 labor hours.'}),
  ]});
  assert.equal(result.aggregate.hours,14);
  assert.equal(result.aggregate.complete,false);
  assert.deepEqual(result.aggregate.unconfirmedAggregateIds,['selected-cabinet']);
  assert.equal(completeLaborHoursAnswer(result),undefined);
});

const fact=(value:string,source:string,evidence:string,basis:'stated'|'calculated'='stated'):ExtractedFact=>({
  field:'laborHours',value,confidence:.98,source,evidence,basis,
});
const taskFact=(value:string,source='scope.pdf'):ExtractedFact=>({
  field:'taskList',value,confidence:.98,source,evidence:value,basis:'stated',
});
const extraction=(facts:ExtractedFact[]):ScopeExtraction=>({
  summary:'Labor evidence fixture',facts,conflicts:[],missingInformation:[],reviewNotes:[],
});

test('ScopeExtraction fact reconciliation projects only a complete independent aggregate',()=>{
  const combined=combineScopeExtractions([
    extraction([fact('16','excavation.pdf','Excavation labor is 16 hours.'),taskFact('Excavate and pour concrete.')]),
    extraction([fact('24','concrete.pdf','Concrete labor is 24 hours.')]),
    extraction([fact('40','summary.pdf','Total labor is 40 hours.')]),
  ]);
  assert.equal(combined.laborEvidence?.aggregate.hours,40);
  assert.equal(combined.laborEvidence?.aggregate.complete,true);
  assert.equal(combined.laborEvidence?.sourceHistory.length,3);
  assert.equal(combined.conflicts.filter(conflict=>conflict.field==='laborHours').length,0);
  assert.equal(mergeScopeFacts({},combined).answers.laborHours,'40');
});

test('ScopeExtraction preserves a repeated summary while retaining only the independent total',()=>{
  const first=extraction([fact('16','excavation.pdf','Excavation labor is 16 hours.')]);
  const second=extraction([fact('24','concrete.pdf','Concrete labor is 24 hours.')]);
  const summary=extraction([fact('40','summary.pdf','Total labor is 40 hours.')]);
  const original=structuredClone([first,second,summary]);
  const combined=combineScopeExtractions([first,second,summary]);
  assert.equal(combined.laborEvidence?.aggregate.hours,40);
  assert.equal(combined.laborEvidence?.aggregate.complete,true);
  assert.equal(combined.laborEvidence?.resolutions.filter(item=>item.status==='duplicate').length,1);
  assert.deepEqual([first,second,summary],original,'reconciliation must not rewrite original source facts');
});

test('ScopeExtraction recognizes the same work across different labor sentence framing',()=>{
  const combined=combineScopeExtractions([
    extraction([fact('16','original.pdf','Excavation labor is 16 hours.')]),
    extraction([fact('24','revision.pdf','Allow 24 labor hours for excavation.')]),
  ]);
  assert.equal(combined.laborEvidence?.aggregate.hours,0);
  assert.equal(combined.laborEvidence?.aggregate.complete,false);
  assert.equal(combined.conflicts.filter(conflict=>conflict.field==='laborHours').length,1);
  assert.equal(mergeScopeFacts({},combined).answers.laborHours,undefined);
});

test('ScopeExtraction keeps a known task subtotal partial when included task scope has another unmeasured package',()=>{
  const combined=combineScopeExtractions([
    extraction([
      fact('16','site.pdf','Excavation labor is 16 hours.'),
      taskFact('Excavate and pour concrete.'),
    ]),
  ]);
  assert.equal(combined.laborEvidence?.aggregate.hours,16);
  assert.equal(combined.laborEvidence?.aggregate.complete,false);
  assert.ok(combined.laborEvidence?.aggregate.unmeasuredWorkIds.some(workId=>workId.includes('pour-concrete')));
  assert.equal(mergeScopeFacts({},combined).answers.laborHours,undefined);
});

test('mergeScopeFacts rechecks current saved task scope instead of trusting cached extraction labor metadata',()=>{
  const validated=validateExtraction({
    summary:'Excavation labor fixture',
    facts:[fact('16','site.pdf','Excavation labor is 16 hours.')],
    conflicts:[],missingInformation:[],reviewNotes:[],
  });
  assert.equal(validated.laborEvidence?.aggregate.complete,true);
  const merged=mergeScopeFacts({taskList:'Excavate and pour concrete.'},validated);
  assert.equal(merged.answers.laborHours,undefined);
  assert.ok(merged.conflicts.length===0);
  assert.equal(validated.laborEvidence?.aggregate.hours,16,'cached source history remains unchanged');
});

test('included ScopeInstructions also establish required labor coverage',()=>{
  const partial=extraction([fact('16','site.pdf','Excavation labor is 16 hours.')]);
  partial.instructions={...emptyInstructions(),inclusions:['Excavate and pour concrete.']};
  const combined=combineScopeExtractions([partial]);
  assert.equal(combined.laborEvidence?.aggregate.hours,16);
  assert.equal(combined.laborEvidence?.aggregate.complete,false);
  assert.equal(mergeScopeFacts({},combined).answers.laborHours,undefined);
});

test('ScopeExtraction holds an unscoped cabinet subtotal when task or clarification evidence names other unmeasured labor',()=>{
  const selected=extraction([fact('14','cabinet.pdf','Selected cabinet subtotal is 14 labor hours.')]);
  selected.missingInformation=['Other trade labor hours are unmeasured.'];
  const before=structuredClone(selected);
  const combined=combineScopeExtractions([selected]);
  assert.equal(combined.laborEvidence?.aggregate.hours,14);
  assert.equal(combined.laborEvidence?.aggregate.complete,false);
  assert.ok(combined.laborEvidence?.aggregate.unmeasuredWorkIds.length);
  assert.equal(mergeScopeFacts({laborHours:'40'},combined).answers.laborHours,'40','a partial clarification must preserve a prior confirmed global answer');
  assert.deepEqual(selected,before,'source facts and missing-information confirmations must remain unchanged');
});
/**
 * Labor quantities are evidence about a particular work package, not an
 * automatically replaceable project-wide total.  Keep the work identity and
 * the original source with every quantity so a later clarification can decide
 * whether the known quantity is complete.
 */
import type {ExtractedFact} from './scope.ts';

export type LaborEvidenceBasis = 'stated'|'calculated'|'visual'|'inferred';
export type LaborEvidenceKind = 'task'|'subtotal'|'summary';

export interface LaborEvidenceRecord {
  /** Stable identifier for this source assertion, not its work identity. */
  id: string;
  /** Stable physical work identity supplied by the caller. */
  workId: string;
  /** Null explicitly records included labor whose duration is still unknown. */
  hours: number|null;
  kind: LaborEvidenceKind;
  source: string;
  evidence: string;
  basis: LaborEvidenceBasis;
  /**
   * Work identities included by a subtotal or summary.  This is required to
   * safely use an aggregate beside its component task records.
   */
  coveredWorkIds?: readonly string[];
}

export interface LaborEvidenceInput {
  records: readonly LaborEvidenceRecord[];
  /**
   * Every labor work package that must be measured before this can represent
   * a complete project labor quantity.  Omit only when the supplied records
   * themselves are the complete scoped work list.
   */
  requiredWorkIds?: readonly string[];
}

/** Adapts a preserved ScopeExtraction fact after its task identity is known. */
export function laborEvidenceFromFact(
  fact:ExtractedFact,
  identity:{id:string;workId:string;kind:LaborEvidenceKind;coveredWorkIds?:readonly string[]},
):LaborEvidenceRecord|null {
  if(fact.field!=='laborHours')return null;
  const hours=Number(fact.value);
  if(!Number.isFinite(hours)||hours<0)return null;
  return {
    ...identity,hours,source:fact.source,evidence:fact.evidence,
    basis:fact.basis||'inferred',
  };
}

export interface LaborEvidenceConflict {
  workIds: string[];
  records: LaborEvidenceRecord[];
  reason: 'different-task-values'|'aggregate-disagrees'|'aggregate-overlaps';
}

export type LaborEvidenceStatus = 'counted'|'duplicate'|'conflict'|'unmeasured'|'ignored';
export interface LaborEvidenceResolution {
  record: LaborEvidenceRecord;
  status: LaborEvidenceStatus;
  reason: string;
}

export interface LaborHoursAggregate {
  /** Sum of non-overlapping explicit work packages only. */
  hours: number;
  /** True only when every required work package is measured without conflict. */
  complete: boolean;
  measuredWorkIds: string[];
  unmeasuredWorkIds: string[];
  conflictedWorkIds: string[];
  /** Explicit totals with no component coverage remain known, but incomplete. */
  unconfirmedAggregateIds: string[];
}

export interface LaborEvidenceReconciliation {
  aggregate: LaborHoursAggregate;
  conflicts: LaborEvidenceConflict[];
  resolutions: LaborEvidenceResolution[];
  /** Every supplied source assertion, including duplicates and conflicts. */
  sourceHistory: LaborEvidenceRecord[];
}

type AccountedGroup={workIds:Set<string>;hours:number};
const explicit=(record:LaborEvidenceRecord)=>record.basis==='stated'||record.basis==='calculated';
const cleanIds=(values:readonly string[]|undefined)=>[...new Set((values||[]).map(value=>value.trim()).filter(Boolean))];
const usableHours=(hours:number|null)=>hours===null||Number.isFinite(hours)&&hours>=0;

/**
 * Reconciles only caller-classified, explicit task evidence.  It never
 * extracts work identities from prose and never chooses between disagreeing
 * values.  A summary is counted only when it does not overlap a measured
 * package; an equal repeated summary is retained as history but not added.
 */
export function reconcileLaborEvidence(input:LaborEvidenceInput):LaborEvidenceReconciliation {
  const sourceHistory=input.records.map(record=>({...record,coveredWorkIds:record.coveredWorkIds?[...record.coveredWorkIds]:undefined}));
  const resolutions:LaborEvidenceResolution[]=[],conflicts:LaborEvidenceConflict[]=[];
  const valid=sourceHistory.filter(record=>{
    const validRecord=Boolean(record.id.trim()&&record.workId.trim()&&record.source.trim()&&record.evidence.trim()&&usableHours(record.hours));
    if(!validRecord)resolutions.push({record,status:'ignored',reason:'Labor evidence is missing a stable work identity, source, evidence, or valid hours.'});
    else if(!explicit(record))resolutions.push({record,status:'ignored',reason:'Labor evidence is not stated or calculated from explicit operands.'});
    return validRecord&&explicit(record);
  });
  const byWork=new Map<string,LaborEvidenceRecord[]>();
  for(const record of valid.filter(record=>record.kind==='task')){
    const group=byWork.get(record.workId)||[];group.push(record);byWork.set(record.workId,group);
  }
  const groups:AccountedGroup[]=[];
  const conflictIds=new Set<string>(),unmeasuredIds=new Set<string>(),unconfirmedAggregateIds=new Set<string>();
  for(const [workId,records] of byWork){
    const numeric=[...new Set(records.map(record=>record.hours).filter((hours):hours is number=>hours!==null))];
    const hasUnknown=records.some(record=>record.hours===null);
    if(numeric.length>1||numeric.length===1&&hasUnknown){
      conflictIds.add(workId);
      conflicts.push({workIds:[workId],records,reason:'different-task-values'});
      records.forEach(record=>resolutions.push({record,status:'conflict',reason:'Explicit records for the same work package have different labor quantities.'}));
    }else if(hasUnknown){
      unmeasuredIds.add(workId);
      records.forEach(record=>resolutions.push({record,status:'unmeasured',reason:'This included work package has no explicit labor quantity.'}));
    }else if(numeric.length===1){
      groups.push({workIds:new Set([workId]),hours:numeric[0]});
      records.forEach((record,index)=>resolutions.push({record,status:index?'duplicate':'counted',reason:index?'Repeated task quantity for the same work package.':'Independent explicit task quantity.'}));
    }
  }
  const aggregateRecords=valid.filter(record=>record.kind!=='task');
  for(const record of aggregateRecords){
    if(record.hours===null){
      unmeasuredIds.add(record.workId);
      resolutions.push({record,status:'unmeasured',reason:'This subtotal or summary has no explicit labor quantity.'});
      continue;
    }
    const covered=cleanIds(record.coveredWorkIds);
    const coveredSet=new Set(covered);
    const intersecting=groups.filter(group=>[...group.workIds].some(workId=>coveredSet.has(workId)));
    const fullyCovered=covered.length>0&&intersecting.length>0&&intersecting.every(group=>[...group.workIds].every(workId=>coveredSet.has(workId)));
    const exactCoverage=fullyCovered&&new Set(intersecting.flatMap(group=>[...group.workIds])).size===coveredSet.size;
    const coveredHours=intersecting.reduce((total,group)=>total+group.hours,0);
    // An unscoped summary can still be recognized as a repeated total when it
    // exactly restates all independently measured work in this reconciliation.
    const repeatsAll=!covered.length&&groups.length>0&&record.hours===groups.reduce((total,group)=>total+group.hours,0);
    if((exactCoverage&&record.hours===coveredHours)||repeatsAll){
      resolutions.push({record,status:'duplicate',reason:'Repeated subtotal or summary of already counted work.'});
      continue;
    }
    if(intersecting.length){
      const workIds=covered.length?covered:[...new Set(intersecting.flatMap(group=>[...group.workIds]))];
      conflicts.push({workIds,records:[...intersecting.flatMap(group=>valid.filter(item=>item.kind==='task'&&[...group.workIds].includes(item.workId))),record],reason:exactCoverage?'aggregate-disagrees':'aggregate-overlaps'});
      workIds.forEach(workId=>conflictIds.add(workId));
      resolutions.push({record,status:'conflict',reason:exactCoverage?'The aggregate differs from its explicit task quantities.':'The aggregate overlaps only part of already counted work and cannot be allocated safely.'});
      continue;
    }
    const workIds=covered.length?covered:[record.workId];
    groups.push({workIds:new Set(workIds),hours:record.hours});
    if(!covered.length)unconfirmedAggregateIds.add(record.workId);
    resolutions.push({record,status:'counted',reason:covered.length?'Explicit non-overlapping aggregate quantity.':'Explicit aggregate quantity with no component records.'});
  }
  const required=cleanIds(input.requiredWorkIds);
  const requiredIds=new Set(required.length?required:groups.flatMap(group=>[...group.workIds]));
  for(const workId of byWork.keys())if(!input.requiredWorkIds?.length)requiredIds.add(workId);
  const measured=new Set(groups.flatMap(group=>[...group.workIds]));
  for(const workId of requiredIds)if(!measured.has(workId)&&!conflictIds.has(workId))unmeasuredIds.add(workId);
  const aggregate:LaborHoursAggregate={
    hours:groups.reduce((total,group)=>total+group.hours,0),
    complete:conflicts.length===0&&unconfirmedAggregateIds.size===0&&[...requiredIds].every(workId=>measured.has(workId)),
    measuredWorkIds:[...measured].sort(),
    unmeasuredWorkIds:[...unmeasuredIds].sort(),
    conflictedWorkIds:[...conflictIds].sort(),
    unconfirmedAggregateIds:[...unconfirmedAggregateIds].sort(),
  };
  return {aggregate,conflicts,resolutions,sourceHistory};
}

/**
 * The only safe projection to ScopeAnswers.laborHours.  Callers should retain
 * aggregate metadata even when this returns undefined; partial subtotals must
 * not overwrite a project-wide answer.
 */
export function completeLaborHoursAnswer(reconciliation:LaborEvidenceReconciliation):string|undefined {
  return reconciliation.aggregate.complete?String(reconciliation.aggregate.hours):undefined;
}

/** A clarification payload that makes aggregate completeness impossible to ignore. */
export function laborQuantityClarificationUpdate(reconciliation:LaborEvidenceReconciliation):{aggregate:LaborHoursAggregate;laborHours?:string} {
  const laborHours=completeLaborHoursAnswer(reconciliation);
  return laborHours===undefined?{aggregate:reconciliation.aggregate}:{aggregate:reconciliation.aggregate,laborHours};
}
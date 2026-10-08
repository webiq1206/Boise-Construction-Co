import {createHash} from 'node:crypto';
import {projectReviewTransport} from './intakeProjectReview.ts';
import {query} from './database.ts';
import {ESTIMATOR_BRAND} from './brand.ts';
import {intakeSite} from './intakePolicy.ts';
import {intakeDeliveryWorker,type IntakeTransport} from './intakeDelivery.ts';
import {INTAKE_RUNTIME_PROOF} from './intakeDeliveryPolicy.ts';
import {formatFromAddress} from '../../server/services/emailLayout';

/** Existing brand adapter; no credential changes or connector secret reads during preflight. */
export function runtimeIntakeTransports():Record<'customer'|'team'|'crm',IntakeTransport>{
 const direct=!!process.env.RESEND_API_KEY;
 const configured=direct||!!(process.env.REPLIT_CONNECTORS_HOSTNAME&&(process.env.REPL_IDENTITY||process.env.WEB_REPL_RENEWAL));
 // A changing connector account cannot establish replay scope. Direct keys are fingerprinted,
 // never persisted. A key/from/proof change conservatively stops any uncertain replay.
 const identityScope=createHash('sha256').update(JSON.stringify(['resend',process.env.RESEND_API_KEY||'connector-no-replay',formatFromAddress(),ESTIMATOR_BRAND.email,INTAKE_RUNTIME_PROOF.email])).digest('hex');
 const email:IntakeTransport={retryWindowMs:direct?23*3600000:0,identityScope,
  readiness:async()=>!configured?'configuration-missing':INTAKE_RUNTIME_PROOF.email?null:'runtime-proof-pending',
  send:async envelope=>{if(!envelope.email)throw new Error('payload-review');const {sendEmail}=await import('./deliveryAdapter');return sendEmail({...envelope.email,attachments:envelope.email.attachments.map(f=>({filename:f.filename,content:Buffer.from(f.base64,'base64')})),key:envelope.key});},
 };
 const crm=projectReviewTransport({enabled:process.env.P5_CRM_DELIVERY==='on',token:process.env.LEAD_DASHBOARD_KEY||'',url:process.env.LEAD_DASHBOARD_API_URL||ESTIMATOR_BRAND.crmUrl,proof:INTAKE_RUNTIME_PROOF.crm,qaAllowlist:process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST});
 return {customer:email,team:email,crm};
}
export async function processIntakeDeliveries(limit=2){
 const site=intakeSite(ESTIMATOR_BRAND.id);if(!site)return {processed:0};
 return intakeDeliveryWorker({query,site,transports:runtimeIntakeTransports(),suppressed:s=>[s.contact.name,(s.scope.answers as Record<string,unknown>).projectName].some(value=>typeof value==='string'&&/^(?:\[QA\](?:\s|$)|SYNTHETIC\s+QA\b)/i.test(value.trim()))}).run(limit);
}

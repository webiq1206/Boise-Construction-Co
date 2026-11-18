import {prepareIntakeEmail} from './intakeEmailDelivery.ts';
import {readStoredBytes} from './objectStorage.ts';
import {linkSecret} from './estimateLinks.ts';
import {query} from './database.ts';
import {ESTIMATOR_BRAND} from './brand.ts';
import {intakeSite} from './intakePolicy.ts';
import {intakeDeliveryWorker,type IntakeTransport} from './intakeDelivery.ts';
import {INTAKE_RUNTIME_PROOF} from './intakeDeliveryPolicy.ts';
import {suppressSyntheticEstimateNotifications} from './estimatorNotifications.ts';
import {qaOperationContext} from './qaOperationContext.ts';
import {p5LeadIntakeTransport} from './p5LeadIntake.ts';

/**
 * What happens to a visitor's unpriced project request once it is saved on this site.
 *
 * - `customer` and `team`: this site emails the customer and its own team through the brand's
 *   existing transport (deliveryAdapter.ts). Runtime proof is a reviewed source gate, not a
 *   user-supplied option or a credential toggle.
 * - `crm`: the request is posted to P5 Home Co's lead intake (owner decision, 18 November 2026),
 *   where it becomes a P5 lead and a HubSpot deal in the first stage. The shared
 *   `p5LeadIntakeTransport()` in p5LeadIntake.ts builds the post: form `p5-project-request`, the
 *   brand of the PRIMARY TEAM the request was routed to, the request's lead key as its id, and
 *   `team_alert: "site"` because the `team` channel has already emailed the team, so P5 sends no
 *   second email. There is no price in it, so nothing goes to QuickBooks; the estimate the team
 *   later publishes joins the same lead (`syncCrm()` in deliveryAdapter.ts).
 *   On only while `P5_CRM_DELIVERY` is `on` (`crm-disabled` otherwise), and only for requests saved
 *   since the lead system began taking them (`PROJECT_REQUEST_LEADS_SINCE`; `P5_REQUEST_LEADS_SINCE`
 *   sets another moment), so older requests the team already answered do not arrive all at once.
 *   A synthetic QA request is never posted, and a failed post may be retried because P5 keeps one
 *   lead per request id.
 *
 * The canonical review receiver (canonicalReviewTransport.ts) is not used here and stays gated,
 * untouched. Configuration values and provider errors never enter status payloads.
 */
export async function runtimeIntakeTransports():Promise<Record<'customer'|'team'|'crm',IntakeTransport>>{
 const email:IntakeTransport={retryWindowMs:0,identityScope:`${ESTIMATOR_BRAND.id}-email-no-automatic-replay`,
  // The brand adapter owns transport configuration. Loaded lazily, like send, so an
  // isolated harness that replaces the adapter never needs the site's email modules.
  readiness:async()=>{const adapter=await import('./deliveryAdapter.ts');if(typeof adapter.emailTransportReady!=='function'||!adapter.emailTransportReady())return 'configuration-missing';return INTAKE_RUNTIME_PROOF.email?null:'runtime-proof-pending';},
  prepare:(snapshot,envelope)=>prepareIntakeEmail(snapshot,envelope,{query,readBytes:readStoredBytes,secret:linkSecret}),
  send:async envelope=>{if(!envelope.email)throw new Error('payload-review');const {sendEmail}=await import('./deliveryAdapter.ts');return sendEmail({...envelope.email,attachments:envelope.email.attachments.map(f=>({filename:f.filename,content:Buffer.from(f.base64,'base64'),contentType:f.contentType})),key:envelope.key});},
 };
 // P5's public lead intake: no credential is sent, and the site's existing CRM setting is the switch.
 const crm=p5LeadIntakeTransport({enabled:process.env.P5_CRM_DELIVERY==='on',since:process.env.P5_REQUEST_LEADS_SINCE});
 return {customer:email,team:email,crm};
}
export async function processIntakeDeliveries(limit=2){
 if(qaOperationContext())return {processed:0};
 const site=intakeSite(ESTIMATOR_BRAND.id);if(!site)return {processed:0};
 return intakeDeliveryWorker({query,site,transports:await runtimeIntakeTransports(),suppressed:suppressSyntheticEstimateNotifications}).run(limit);
}

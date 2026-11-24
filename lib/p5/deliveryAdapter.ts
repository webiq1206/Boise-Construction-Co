import {safeEmailReplyTo} from './emailReplyTo.ts';
import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails,formatFromAddress } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
export async function adminRecipients(){return [...new Set(await getAdminRecipientEmails(brand.email))];}
export const EMAIL_SUPPORTS_IDEMPOTENCY=true;
export async function sendEmail(input:{to:string;replyTo?:string;subject:string;text:string;html?:string;attachments:{filename:string;content:Buffer;contentType?:string}[];key:string}){
  const {client,fromEmail}=await getUncachableEmailClient();
  const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
  const result=await sender.send({from:formatFromAddress(fromEmail),to:input.to,replyTo:safeEmailReplyTo(input.replyTo,brand.email),subject:input.subject,text:input.text,html:input.html,attachments:input.attachments},{idempotencyKey:input.key});
  if(result?.error)throw new Error("Email provider rejected delivery");
  const id=result?.data?.id||result?.id;
  if(!id||id==="noop"||result?.skipped)throw new Error("Email delivery is not configured");
  return String(id);
}
/** Allowlisted codes only: provider messages, URLs and credentials never enter delivery errors. */
export function crmTransportCode(error:unknown):string{
  const allowed=new Set(["ENOTFOUND","EAI_AGAIN","ECONNREFUSED","ECONNRESET","ETIMEDOUT","EHOSTUNREACH","ENETUNREACH","UND_ERR_CONNECT_TIMEOUT","UND_ERR_HEADERS_TIMEOUT","UND_ERR_SOCKET","CERT_HAS_EXPIRED","DEPTH_ZERO_SELF_SIGNED_CERT","ERR_TLS_CERT_ALTNAME_INVALID"]);
  const seen=new Set<unknown>();let current:any=error;
  for(let depth=0;current&&depth<8&&!seen.has(current);depth++){
    seen.add(current);
    if(allowed.has(current.code))return current.code;
    if(current.name==="TimeoutError"||current.name==="AbortError")return current.name;
    current=current.cause;
  }
  return "UNKNOWN_TRANSPORT";
}
/**
 * A published estimate goes to P5 Home Co's lead system (owner decisions, 13, 17 and 18 November 2026).
 * The outbox calls this for its `crm` job, which exists only while `P5_CRM_DELIVERY` is `on`. The shared
 * `forwardEstimateToP5()` posts it to P5's lead intake as form `p5-estimator` with `estimate` of kind
 * `document` (customer amounts only, adding up to the contract price) and `team_alert: "site"`, because
 * this site has already emailed the team its estimate record. P5 attaches it to the lead the visitor's
 * project request made (`request_external_id`) and creates the QuickBooks customer and an UNSENT estimate.
 *
 * Throws a short error when P5 does not accept the post, so the outbox records the failure. A synthetic
 * QA record is never posted. The old lead dashboard is no longer called from here.
 *
 * The forwarder is loaded on demand, never as a static import: the shared reply-to test runs this
 * adapter in a VM with a fixed dependency list. `options` is a test seam (a fake fetch, another address).
 */
export async function syncCrm(record:any,key:string,options?:{fetch?:typeof fetch;url?:string}){
 const {forwardEstimateToP5}=await import('./p5LeadIntake.ts');
 const transport=options?.fetch||fetch;
 const withOwnerItems:typeof fetch=async (url,init)=>{
   if(record.internal?.ownerServices&&typeof init?.body==="string"){
     const body=JSON.parse(init.body);
     if(Array.isArray(body.estimate?.lines)){
       for(const line of body.estimate.lines){
         const owner=record.internal.ownerServices.lines.find((item:any)=>item.description===line.title);
         if(owner)Object.assign(line,{description:`${line.description||owner.description}; SKU ${owner.sku}; QuickBooks item ${owner.qboItemId}`,quantity:owner.hours,unit:"hour"});
       }
       init={...init,body:JSON.stringify(body)};
     }
   }
   return transport(url,init);
 };
 return forwardEstimateToP5(record,key,{fetch:withOwnerItems,url:options?.url,brand:brand.name});
}
/** Synchronous readiness only: the Resend key or the Replit connector identity must be present before an intake notification is attempted. */
export function emailTransportReady(){return Boolean(process.env.RESEND_API_KEY||(process.env.REPLIT_CONNECTORS_HOSTNAME&&(process.env.REPL_IDENTITY||process.env.WEB_REPL_RENEWAL)));}

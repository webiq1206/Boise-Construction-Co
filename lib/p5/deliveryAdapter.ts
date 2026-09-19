import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails,formatFromAddress } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
import { buildCrmPayload } from "./crmPayload";
import {crmIdentity,deliverKeyedCrm} from "./keyedCrm";
export async function adminRecipients(){return [...new Set(await getAdminRecipientEmails(brand.email))];}
export const EMAIL_SUPPORTS_IDEMPOTENCY=true;
export async function sendEmail(input:{to:string;subject:string;text:string;html?:string;attachments:{filename:string;content:Buffer}[];key:string}){
  const {client,fromEmail}=await getUncachableEmailClient();
  const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
  const result=await sender.send({from:formatFromAddress(fromEmail),to:input.to,replyTo:brand.email,subject:input.subject,text:input.text,html:input.html,attachments:input.attachments},{idempotencyKey:input.key});
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
export async function syncCrm(record:any,key:string,options?:{token:string;url:string;fetch:typeof fetch}){
 const identity=crmIdentity(record,key,brand.domain);
 const built=buildCrmPayload(record,identity.externalLeadId);
 const payload={...built.payload,...identity};
 return deliverKeyedCrm(payload,key,options?options.token:process.env.LEAD_DASHBOARD_KEY||'',options?options.url:process.env.LEAD_DASHBOARD_API_URL||brand.crmUrl,options?.fetch||fetch);
}

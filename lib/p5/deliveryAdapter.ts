import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails,formatFromAddress } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
import { buildCrmPayload } from "./crmPayload";
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
  const token=options?options.token:process.env.LEAD_DASHBOARD_KEY;
  if(!token)throw new Error("CRM synchronization is not configured");
  let destination:URL;
  try{destination=new URL(options?options.url:process.env.LEAD_DASHBOARD_API_URL||brand.crmUrl);}
  catch{throw new Error("CRM destination must be a valid credential-free HTTPS URL; nothing sent");}
  if(destination.protocol!=="https:"||destination.username||destination.password)
    throw new Error("CRM destination must be a valid credential-free HTTPS URL; nothing sent");
  const projection=buildCrmPayload(record,key);
  let response:Response;
  try{
    response=await (options?.fetch||fetch)(destination.href,{
      method:"POST",redirect:"error",signal:AbortSignal.timeout(20000),
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,"Idempotency-Key":key},
      body:projection.body,
    });
  }catch(error){throw new Error(`CRM transport failed (${crmTransportCode(error)}); delivery unconfirmed; verify before any manual retry`);}
  if(!response.ok)throw new Error(`CRM returned HTTP ${response.status}; delivery unconfirmed; verify before any manual retry`);
  let body:any;
  try{body=await response.json();}catch{throw new Error("CRM response was not valid JSON; delivery unconfirmed; verify before any manual retry");}
  if(!body||body.success===false||body.accepted===false||body.error||body.status==="error")
    throw new Error("CRM did not confirm acceptance; delivery unconfirmed; verify before any manual retry");
  const id=body.leadId??body.id??body.lead?.id??body.dealId;
  const positiveId=typeof id==="number"?Number.isSafeInteger(id)&&id>0:
    typeof id==="string"&&(/^[1-9]\d*$/.test(id)||/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  if(!positiveId)throw new Error("CRM acknowledged without a positive record identifier; delivery unconfirmed; verify before any manual retry");
  return String(id);
}

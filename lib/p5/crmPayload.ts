import {ESTIMATOR_BRAND as brand} from './brand';
import {buildCrmPayload as boundedPayload,crmPayloadBytes,CRM_PAYLOAD_LIMIT_BYTES} from './boundedCrmPayload';
export const CRM_PAYLOAD_MAX_BYTES=CRM_PAYLOAD_LIMIT_BYTES;
export const CRM_PROJECTION_VERSION='p5-crm-v2';
export function buildCrmPayload(record:any,key:string){
 const payload:any=boundedPayload({...record,brand:record.brand||brand.name,estimator:record.estimator||"p5-policy"},key,brand.domain);
 payload.estimate.projectionVersion=CRM_PROJECTION_VERSION;
 return {payload,body:JSON.stringify(payload),bytes:crmPayloadBytes(payload)};
}

import { ESTIMATOR_BRAND as brand } from "./brand";
import { projectCustomerEstimate } from "./customerProjection";

// Conservative sender budget, not a claim about the unreachable deployed receiver.
export const CRM_PAYLOAD_MAX_BYTES = 96 * 1024;
export const CRM_PROJECTION_VERSION = "p5-crm-v1";
const pick = (value:any, fields:string[]) => Object.fromEntries(fields
  .filter(field => value?.[field] !== undefined).map(field => [field,value[field]]));

/** Full scope is retained once; priced lines are never dropped to fit the budget. */
export function buildCrmPayload(record:any,key:string) {
  const customer = projectCustomerEstimate(record.customer);
  const internal = record.internal || {};
  const reference = {
    draftId:record.draftId,
    revision:internal.revision,
    externalLeadId:key,
    url:`https://${brand.domain}/api/admin/p5-estimators?id=${encodeURIComponent(record.draftId)}`,
    authenticationRequired:true,
    description:"Full saved estimate, catalog snapshots, source evidence and calculation traces remain in the authenticated local administrative record.",
  };
  const projectionNotice = "Compact CRM projection, not the full administrative record. Complete scope and customer estimate are included below; catalog/finance snapshots, per-line evidence and calculation traces, duplicated scope, and detailed warnings are omitted. See authenticated administrative reference.";
  const financial = pick(internal,[
    "policyVersion","revision","evaluatedAt","estimatePurpose","service","requestedService",
    "currentCostsConfirmed","directByCategory","directCost","contingencyRate","contingency",
    "riskAdjustedDirectCost","allocations","allocationDollars","targetOperatingProfit",
    "operatingProfit","divisor","contractPrice","planningRange","reconciliation",
    "requiresAdminReview","publishable","contractMethod",
  ]);
  const lines = (internal.lines || []).map((line:any)=>pick(line,[
    "id","category","trade","description","quantity","unit","building","floor",
    "quantityRange","unitCost","unitCostRange","cost","contingency","riskAdjustedCost",
    "overheadRecovery","operatingProfit","sellingAmount","sellingUnitPrice",
    "allowance","estimatingBasis","priceBasis","ownerLaborTreatment",
  ]));
  const payload = {
    fullName:record.contact.name,email:record.contact.email,phone:record.contact.phone,
    source:brand.domain,externalLeadId:key,inquiryId:record.draftId,
    propertyAddress:record.scope.answers.address || undefined,city:record.scope.answers.location || undefined,
    projectTypes:[record.scope.answers.service],
    projectScope:"Complete project scope is preserved in estimate.scope; see the authenticated administrative reference for the full saved record.",
    estimate:{
      projectionVersion:CRM_PROJECTION_VERSION,projectionNotice,administrativeReference:reference,
      brand:brand.name,estimator:"p5-policy",id:record.draftId,scope:record.scope,customer,
      internal:{
        financialSummary:financial,lines,warningCount:(internal.warnings || []).length,
        warningCodes:[...new Set((internal.warnings || []).map((warning:any)=>`${warning.severity}:${warning.code}`))],
        missingInformation:internal.missingInformation,pricingWarnings:internal.pricingWarnings,
      },
    },
    estimateSummary:projectionNotice,
    estimateLow:customer.range?.low,estimateHigh:customer.range?.high,
    estimateRange:customer.range?`$${customer.range.low} to $${customer.range.high}`:undefined,
  };
  for (const [field,max] of Object.entries({fullName:255,email:255,phone:50,propertyAddress:500,city:100,estimateRange:100})) {
    const value = payload[field as keyof typeof payload];
    if (value !== undefined && (typeof value !== "string" || value.length > max))
      throw new Error(`CRM field ${field} exceeds receiver-compatible validation; nothing sent`);
  }
  const body = JSON.stringify(payload);
  const bytes = Buffer.byteLength(body,"utf8");
  if (bytes > CRM_PAYLOAD_MAX_BYTES)
    throw new Error(`CRM projection exceeds ${CRM_PAYLOAD_MAX_BYTES}-byte sender budget (${bytes} bytes); nothing sent. Review the saved administrative record; scope and priced lines were not truncated`);
  return {payload,body,bytes};
}
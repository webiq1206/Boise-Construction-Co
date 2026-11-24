import { getAdminEstimates, putAdminPolicy, postAdminAction } from "@/lib/p5/adminEndpoint";
import { savedOwnerServiceResponse } from "@/lib/pricing/ownerSubmissionResponse";
import { applyDocumentOwnerServices } from "@/lib/pricing/ownerDocumentAdapter";
import { customerEstimate } from "@/lib/p5/pricing";
import { query } from "@/lib/p5/database";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = getAdminEstimates;
export const PUT = putAdminPolicy;
export async function POST(request: Request) {
  const body = await request.clone().json().catch(() => ({}));
  const response = await postAdminAction(request);
  if (response.ok && body.action === "save-review") {
    const result = await response.clone().json();
    if (result.estimate) {
      const [saved] = await query("SELECT internal_estimate,customer_estimate,status FROM p5_estimator_drafts WHERE id=$1", [body.id]);
      const preserveOriginal = Boolean(saved?.customer_estimate && !saved.internal_estimate?.ownerServices)
        || Boolean(saved?.internal_estimate?.signed || saved?.internal_estimate?.acceptedAt);
      const options = { ...(body.input?.ownerServices || saved?.internal_estimate?.ownerServices?.options || {}), preserveOriginal };
      result.estimate = applyDocumentOwnerServices(result.estimate, customerEstimate(result.estimate, body.input?.scopeSummary || ""), options).internal;
      return Response.json(result, { status: response.status });
    }
  }
  return savedOwnerServiceResponse(response, body.id);
}

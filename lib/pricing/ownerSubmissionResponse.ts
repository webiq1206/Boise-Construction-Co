import { query } from "../p5/database";
import { customerPresentation, HIDE_CUSTOMER_UNIT_RATES } from "../p5/presentation";
import { buildEstimateDocument, type EstimateBrand } from "../p5/estimateDocument";
import { ESTIMATOR_BRAND } from "../p5/brand";
import { legalIdentityLine } from "../p5/brandIdentity";

/** Called only AFTER the normal handler has validated credentials and accepted the write. */
export async function savedOwnerServiceResponse(response: Response, suppliedId?: string): Promise<Response> {
  if (!response.ok) return response;
  const body = await response.clone().json().catch(() => null);
  if (!body || (!body.accepted && !body.published)) return response;
  const id = body.id || suppliedId;
  if (!id || !body.result) return response;
  const [saved] = await query("SELECT internal_estimate,customer_estimate,submitted_at FROM p5_estimator_drafts WHERE id=$1", [id]);
  if (!saved?.internal_estimate?.ownerServices || !saved.customer_estimate) return response;
  body.result = customerPresentation(saved.customer_estimate, { hideUnitRates: HIDE_CUSTOMER_UNIT_RATES });
  if (body.document) body.document = buildEstimateDocument({
    id, result: saved.customer_estimate, brand: ESTIMATOR_BRAND as unknown as EstimateBrand,
    submittedAt: saved.submitted_at ? new Date(saved.submitted_at).toISOString() : null, legalLine: legalIdentityLine(),
  });
  const headers = new Headers(response.headers); headers.delete("content-length");
  return Response.json(body, { status: response.status, headers });
}

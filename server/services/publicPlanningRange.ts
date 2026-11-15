import {calculateEstimate, EMPTY_REFINEMENTS} from "../../shared/estimateEngine.ts";
import {planningRangeInput, publicPlanningRange, type PlanningRangeInput, type PublicPlanningRange} from "../../shared/publicPlanningRange.ts";

/** Pure server-side pricing. Return selling endpoints only, never the internal result. */
export function calculatePublicPlanningRange(input: PlanningRangeInput): PublicPlanningRange {
  const result = calculateEstimate({project: input.project, finish: "mid-range", sqft: input.sqft, refinements: {...EMPTY_REFINEMENTS}});
  return {priceLow: result.priceLow, priceHigh: result.priceHigh};
}

const MAX_BODY_BYTES = 512;
const response = (value: unknown, status = 200) => Response.json(value, {status, headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});

/** No persistence, credentials, provider requests, lead creation or notifications. */
export async function publicPlanningRangePost(request: Request): Promise<Response> {
  if (request.method !== "POST") return response({error: "Use POST for a planning request."}, 405);
  if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") return response({error: "Use a JSON planning request."}, 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return response({error: "Planning request is too large."}, 413);
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let input: PlanningRangeInput | null;
  try {
    if (reader) while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_BODY_BYTES) {await reader.cancel(); return response({error: "Planning request is too large."}, 413);}
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
    input = planningRangeInput(JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes)));
  } catch {
    return response({error: "Choose a supported project and living area."}, 400);
  } finally {reader?.releaseLock();}
  if (!input) return response({error: "Choose a supported project and living area."}, 400);
  try {
    const range = publicPlanningRange(calculatePublicPlanningRange(input));
    if (!range) throw new Error("Planning result unavailable");
    return response(range);
  } catch {
    return response({error: "We could not update the planning range. Please try again."}, 503);
  }
}

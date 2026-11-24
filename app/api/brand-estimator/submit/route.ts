import { after } from "next/server";
import { postSubmission } from "@/lib/p5/submitEndpoint";
import { savedOwnerServiceResponse } from "@/lib/pricing/ownerSubmissionResponse";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(request: Request) {
  return savedOwnerServiceResponse(await postSubmission(request, task => after(task)));
}

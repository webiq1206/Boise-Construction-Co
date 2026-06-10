import { NextResponse } from "next/server";

/**
 * Legacy quote wizard endpoint. The public quote wizard UI was removed
 * (marketing URLs like /get-quote redirect to /#consult in next.config.js);
 * homeowner lead capture now flows exclusively through POST /api/consultation.
 *
 * This stub is kept so old clients receive an explicit 410 instead of a 404
 * or a silently-created legacy lead.
 */
function gone() {
  return NextResponse.json(
    {
      message:
        "This endpoint has been retired. Please request a consultation at /#consult or POST /api/consultation.",
    },
    { status: 410 }
  );
}

export async function POST() {
  return gone();
}

export async function GET() {
  return gone();
}

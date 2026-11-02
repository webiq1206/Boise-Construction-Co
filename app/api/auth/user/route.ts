import { authFailureResponse, logAuthFailure } from "@/lib/authDiagnostics";
import { NextResponse } from "next/server";
import { getSession, getUserFromDb, upsertUserFromClaims } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.expiresAt && session.expiresAt < Date.now() / 1000) {
      session.destroy();
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    if (session.claims) {
      const user = await upsertUserFromClaims(session.claims);
      if (user) return NextResponse.json(user);
    }

    const user = await getUserFromDb(session.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logAuthFailure("session-user", error);
    const failure = authFailureResponse(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

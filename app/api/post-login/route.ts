import { logAuthFailure } from "@/lib/authDiagnostics";
import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserFromDb, getExternalUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.redirect(getExternalUrl(request, "/"));
    }

    let user = null;
    try {
      user = await getUserFromDb(session.userId);
    } catch (dbError) {
      logAuthFailure("post-login-user", dbError);
    }
    const returnTo = session.returnTo;
    delete session.returnTo;
    await session.save();

    const safeReturnTo = 
      typeof returnTo === "string" && returnTo.startsWith("/") 
        ? returnTo 
        : null;

    if (safeReturnTo?.startsWith("/admin") && user?.role !== "admin") {
      return NextResponse.redirect(getExternalUrl(request, "/admin"));
    }

    if (user?.role === "subcontractor") {
      return NextResponse.redirect(getExternalUrl(request, safeReturnTo || "/subcontractor"));
    }

    if (user?.role === "admin") {
      return NextResponse.redirect(getExternalUrl(request, safeReturnTo || "/admin/dashboard"));
    }

    return NextResponse.redirect(getExternalUrl(request, safeReturnTo || "/"));
  } catch (error) {
    logAuthFailure("post-login", error);
    return NextResponse.redirect(getExternalUrl(request, "/"));
  }
}

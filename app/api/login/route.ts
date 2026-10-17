import { logAuthFailure } from "@/lib/authDiagnostics";
import { NextRequest, NextResponse } from "next/server";
import { getSession, getOidcConfig, getExternalUrl } from "@/lib/auth";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const config = await getOidcConfig();

    const returnTo = request.nextUrl.searchParams.get("returnTo");
    if (returnTo && returnTo.startsWith("/")) {
      session.returnTo = returnTo;
    }

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();

    session.codeVerifier = codeVerifier;
    session.state = state;
    await session.save();

    const redirectUri = getExternalUrl(request, "/api/callback");

    const authUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      prompt: "login consent",
    });

    return NextResponse.redirect(authUrl.href);
  } catch (error) {
    logAuthFailure("login", error);
    return NextResponse.redirect(getExternalUrl(request, "/"));
  }
}

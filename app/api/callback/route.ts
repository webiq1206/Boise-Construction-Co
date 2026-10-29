import { logAuthFailure } from "@/lib/authDiagnostics";
import { NextRequest, NextResponse } from "next/server";
import { getSession, getOidcConfig, getExternalUrl, upsertUserFromClaims } from "@/lib/auth";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const config = await getOidcConfig();

    const redirectUri = getExternalUrl(request, "/api/callback");

    if (!session.codeVerifier || !session.state) {
      console.error("Missing code verifier or state in session");
      return NextResponse.redirect(getExternalUrl(request, "/api/login"));
    }

    const externalCallbackUrl = getExternalUrl(request, `/api/callback?${request.nextUrl.searchParams.toString()}`);
    const currentUrl = new URL(externalCallbackUrl);
    
    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: session.codeVerifier,
      expectedState: session.state,
      idTokenExpected: true,
    }, { redirect_uri: redirectUri });

    const claims = tokens.claims();

    session.userId = claims?.sub as string;
    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.expiresAt = claims?.exp as number;
    session.claims = {
      sub: claims?.sub as string,
      email: claims?.email as string,
      first_name: claims?.first_name as string,
      last_name: claims?.last_name as string,
      profile_image_url: claims?.profile_image_url as string,
    };

    delete session.codeVerifier;
    delete session.state;

    await session.save();

    try {
      await upsertUserFromClaims(session.claims);
    } catch (dbError) {
      logAuthFailure("callback-user", dbError);
    }

    return NextResponse.redirect(getExternalUrl(request, "/api/post-login"));
  } catch (error) {
    logAuthFailure("callback", error);
    return NextResponse.redirect(getExternalUrl(request, "/?login_error=callback_failed"));
  }
}

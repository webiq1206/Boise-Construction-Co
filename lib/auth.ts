import { getIronSession, SessionOptions, IronSession } from "iron-session";
import { cookies } from "next/headers";
import * as client from "openid-client";
import { db } from "./db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getDesignatedRole } from "./adminAccess";

export interface SessionData {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
  returnTo?: string;
  codeVerifier?: string;
  state?: string;
}

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return secret;
}

function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "brc_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60,
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getValidatedSession() {
  const session = await getSession();
  
  if (!session.userId) {
    return null;
  }

  if (session.expiresAt && session.expiresAt < Date.now() / 1000) {
    session.destroy();
    return null;
  }

  return session;
}

let oidcConfig: Awaited<ReturnType<typeof client.discovery>> | null = null;

export async function getOidcConfig() {
  if (oidcConfig) return oidcConfig;

  const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
  const clientId = process.env.REPL_ID;

  if (!clientId) {
    throw new Error("REPL_ID environment variable is required for authentication");
  }

  oidcConfig = await client.discovery(new URL(issuerUrl), clientId);
  return oidcConfig;
}

function getExternalProtocol(request: { headers: { get(name: string): string | null } }) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0].trim();
  return process.env.NODE_ENV === "production" ? "https" : "http";
}

export function getExternalHostname(request: { headers: { get(name: string): string | null }, url?: string }) {
  return request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:5000";
}

export function getExternalBaseUrl(request: { headers: { get(name: string): string | null }, url?: string }) {
  const protocol = getExternalProtocol(request);
  const hostname = getExternalHostname(request);
  return `${protocol}://${hostname}`;
}

export function getExternalUrl(request: { headers: { get(name: string): string | null }, url?: string }, path: string) {
  return `${getExternalBaseUrl(request)}${path}`;
}

export function getRedirectUri(hostname: string, requestUrl?: string) {
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${hostname}/api/callback`;
  }
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${hostname}/api/callback`;
}

export function getBaseUrl(hostname: string, requestUrl?: string) {
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${hostname}`;
  }
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${hostname}`;
}

export async function getUserFromDb(userId: string) {
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

// The admin allowlist lives in lib/adminAccess.ts so this login path and the
// user-upsert path in server/storage.ts cannot disagree about who is an admin.

export async function upsertUserFromClaims(claims: SessionData["claims"]) {
  if (!db || !claims?.sub) return null;

  const designatedRole = getDesignatedRole(claims.email);
  const existing = await getUserFromDb(claims.sub);

  if (existing) {
    const updateData: Record<string, any> = {
      email: claims.email || existing.email,
      firstName: claims.first_name || existing.firstName,
      lastName: claims.last_name || existing.lastName,
      profileImageUrl: claims.profile_image_url || existing.profileImageUrl,
    };

    if (existing.role !== designatedRole && designatedRole === "admin") {
      updateData.role = "admin";
      console.log(`[AUTH] Upgrading user ${claims.sub} (${claims.email}) from ${existing.role} to admin`);
    }

    await db.update(users).set(updateData).where(eq(users.id, claims.sub));
    return getUserFromDb(claims.sub);
  }

  await db.insert(users).values({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
    role: designatedRole,
  });

  console.log(`[AUTH] Created new user ${claims.sub} (${claims.email}) with role: ${designatedRole}`);
  return getUserFromDb(claims.sub);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session.userId) {
    return null;
  }

  if (session.expiresAt && session.expiresAt < Date.now() / 1000) {
    session.destroy();
    return null;
  }

  const user = await getUserFromDb(session.userId);
  return user;
}

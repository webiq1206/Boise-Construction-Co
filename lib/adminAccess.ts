/**
 * Single source of truth for who is an administrator.
 *
 * Two independent code paths assign the "admin" role: the OIDC login flow in
 * lib/auth.ts, and the user-upsert path in server/storage.ts. They previously
 * kept separate lists (a hardcoded array and a comma-separated ADMIN_EMAILS
 * env var), so the two could silently disagree about who is an admin. Both now
 * resolve through this module.
 *
 * Every /admin page and /api/admin route gates on the stored role, so changing
 * this list is what actually grants or revokes access.
 */

/**
 * Baseline allowlist, checked into source so access survives an environment
 * being reprovisioned. Entries must be lowercase; comparison is lowercased.
 */
const BASE_ADMIN_EMAILS = [
  'webiq.co@gmail.com',
  'info@webiq.co',
  // The new company email. The old one is kept alongside it so admin access
  // does not break if the owner still authenticates with the remodeling address
  // during the switchover; remove it once sign-in is confirmed on the new one.
  'hello@boiseconstruction.co',
  'hello@boiseremodeling.co',
  'hello@boisecabinet.co',
  'hello@p5homeco.com',
  'brostjared@gmail.com',
] as const;

export type UserRole = 'admin' | 'subcontractor';

/**
 * Optional comma-separated additions from the ADMIN_EMAILS env var, so an
 * administrator can be added in Replit Secrets without a code deploy. The env
 * var extends the baseline and never removes from it: a misconfigured or
 * cleared variable must not be able to lock out the checked-in administrators.
 */
function envAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** The effective allowlist: baseline plus env additions, lowercased and deduped. */
export function getAdminEmails(): string[] {
  return [...new Set([...BASE_ADMIN_EMAILS, ...envAdminEmails()])];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

/** Role an address is entitled to. Anything not on the allowlist is a subcontractor. */
export function getDesignatedRole(email: string | null | undefined): UserRole {
  return isAdminEmail(email) ? 'admin' : 'subcontractor';
}

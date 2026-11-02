/** Allowlisted diagnostics only: never serialize provider errors or SQL parameters. */
export function authFailureCode(error: unknown): 'account_conflict' | 'authentication_failed' {
  const seen = new Set<unknown>();
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === 'object' && !seen.has(current); depth++) {
    seen.add(current);
    const value = current as {code?: unknown; constraint?: unknown; cause?: unknown};
    if (value.code === '23505' && value.constraint === 'users_email_unique') return 'account_conflict';
    current = value.cause;
  }
  return 'authentication_failed';
}
export const ACCOUNT_CONFLICT_MESSAGE = 'Your sign-in could not be linked to the existing site account. Contact the site administrator; repeating Google consent will not resolve this.';
export function authFailureResponse(error: unknown) {
  const code = authFailureCode(error);
  return {status: code === 'account_conflict' ? 409 : 500,
    body: {code, message: code === 'account_conflict' ? ACCOUNT_CONFLICT_MESSAGE : 'Unable to load your site account. Please contact the site administrator.'}};
}
export function logAuthFailure(stage: 'login' | 'callback' | 'callback-user' | 'post-login' | 'post-login-user' | 'session-user', error: unknown) {
  console.error('[auth]', {stage, code: authFailureCode(error)});
}

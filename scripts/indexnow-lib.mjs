/**
 * Post-deploy IndexNow decision. CI, pull-request builds, and a repeat of a
 * SHA that was already submitted do not call api.indexnow.org.
 */

export const INDEXNOW_SETTINGS_KEY = 'indexnow_last_submitted_sha';

export function formatLog(sha, submitted, status) {
  return `[IndexNow] sha=${sha} submitted=${submitted} status=${status}`;
}

/** True only for a published deploy, never for CI or a pull-request build. */
export function deploymentAllowsSubmit(env) {
  if (env.INDEXNOW_DISABLE === '1') return false;
  if (env.CI === 'true' || env.CI === '1') return false;
  if (env.GITHUB_ACTIONS === 'true') return false;
  if (env.GITHUB_EVENT_NAME === 'pull_request') return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return false;
  if (env.REPLIT_DEPLOYMENT === '1') return true;
  if (env.INDEXNOW_POST_DEPLOY === '1') return true;
  return false;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {{ sha?: string, urls?: string[] } | null} manifest
 * @param {string} alreadySubmittedSha
 */
export function decideSubmission(env, manifest, alreadySubmittedSha) {
  const sha = manifest && manifest.sha ? String(manifest.sha) : '';
  const urls = manifest && Array.isArray(manifest.urls) ? manifest.urls.filter(Boolean) : [];
  if (!deploymentAllowsSubmit(env)) {
    return { submit: false, sha, urls, reason: 'not-post-deploy' };
  }
  if (!sha || sha === 'unknown') {
    return { submit: false, sha, urls, reason: 'no-sha' };
  }
  if (alreadySubmittedSha && alreadySubmittedSha === sha) {
    return { submit: false, sha, urls, reason: 'already-submitted' };
  }
  if (urls.length === 0) {
    return { submit: false, sha, urls, reason: 'no-urls' };
  }
  return { submit: true, sha, urls, reason: 'deploy' };
}

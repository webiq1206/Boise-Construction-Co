import assert from 'node:assert/strict';
import test from 'node:test';
import { decideSubmission, deploymentAllowsSubmit, formatLog } from '../scripts/indexnow-lib.mjs';
import { buildManifest, pathsForFile } from '../scripts/prepare-indexnow.mjs';

const manifest = {
  sha: 'abc123',
  urls: [
    'https://boiseconstruction.co/',
    'https://boiseconstruction.co/services/custom-home-builder',
    'https://boiseconstruction.co/services/custom-home-builder/boise',
  ],
};

test('CI and pull-request builds do not submit', () => {
  assert.equal(deploymentAllowsSubmit({ CI: 'true', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(deploymentAllowsSubmit({ GITHUB_ACTIONS: 'true', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(deploymentAllowsSubmit({ GITHUB_EVENT_NAME: 'pull_request', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(deploymentAllowsSubmit({}), false);
  const decision = decideSubmission({ CI: 'true' }, manifest, '');
  assert.equal(decision.submit, false);
  assert.equal(decision.reason, 'not-post-deploy');
});

test('a published deploy submits once per SHA', () => {
  const first = decideSubmission({ REPLIT_DEPLOYMENT: '1' }, manifest, '');
  assert.equal(first.submit, true);
  assert.equal(first.urls.length, 3);
  const repeat = decideSubmission({ REPLIT_DEPLOYMENT: '1' }, manifest, 'abc123');
  assert.equal(repeat.submit, false);
  assert.equal(repeat.reason, 'already-submitted');
  assert.equal(formatLog('abc123', 3, 202), '[IndexNow] sha=abc123 submitted=3 status=202');
});

test('the build manifest lists changed URLs and skips ADU paths', () => {
  assert.deepEqual(pathsForFile('shared/content/wave2/adu-cost-boise.ts'), []);
  const built = buildManifest('def456', [
    'shared/content/wave2/adu-cost-boise.ts',
    'shared/content/pillars/choose-home-builder-boise.ts',
    'lib/schema.ts',
  ]);
  assert.equal(built.sha, 'def456');
  assert.equal(built.urls.includes('https://boiseconstruction.co/blog/adu-cost-boise'), false);
  assert.equal(built.urls.includes('https://boiseconstruction.co/services/adu/boise'), false);
  assert.equal(built.urls.includes('https://boiseconstruction.co/guides/choose-home-builder-boise'), true);
  assert.equal(built.urls.includes('https://boiseconstruction.co/'), true);
});

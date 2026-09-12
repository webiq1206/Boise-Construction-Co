import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readlink, rm, symlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkContext, exclusions, packageDeployment } from '../scripts/package-deployment.mjs';

const receipt = '.local/diagnostics/publishing-packaging/backup-verification.json';
const identity = '.local/diagnostics/publishing-packaging/workspace-identity.json';
async function put(root, name, content = 'preserve') {
  await mkdir(path.dirname(path.join(root, name)), { recursive: true });
  await writeFile(path.join(root, name), content);
}
function backupRecord(prefix, name, content) {
  return {
    name, objectKey: `${prefix}/${name}`, bytes: Buffer.byteLength(content),
    sha256: createHash('sha256').update(content).digest('hex'),
    generation: '1', anonymousStatus: 403, acl: [{ entity: 'test-owner', role: 'OWNER' }],
  };
}
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'packaging-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const originalDirectory = '.local/recovery/synthetic-backup';
  const content = 'synthetic recovery bytes';
  await put(root, `${originalDirectory}/backup.tar`, content);
  await put(root, receipt, JSON.stringify({
    bucket: 'private-test-bucket', prefix: 'private-test-prefix', originalDirectory,
    totalBytes: Buffer.byteLength(content),
    files: [backupRecord('private-test-prefix', 'backup.tar', content)],
  }));
  await put(root, identity, JSON.stringify({ mountNamespace: 'mnt:[synthetic-disposable-copy]' }));
  for (const entry of exclusions.filter(e => !e.startsWith('.local/'))) await put(root, `${entry}/fixture-cache`);
  for (const entry of ['.next/standalone/server.js', '.next/standalone/.next/static/asset.js',
    '.next/standalone/public/customer.pdf', '.next/static/asset.js', 'public/customer.pdf',
    'data/customer.json', '.uploads/customer.bin', 'node_modules/runtime.js', 'start.sh',
    'scripts/submit-indexnow.mjs', '.cache/customer-kept', '.local/customer-kept']) await put(root, entry);
  return root;
}
async function compositeFixture(t) {
  const root = await fixture(t);
  const prefix = 'private-test-accuracy-prefix';
  const originalDirectory = '.local/recovery/nested-accuracy';
  const name = 'reports/accuracy.json';
  const content = '{"accuracy":true}\n';
  await put(root, `${originalDirectory}/${name}`, content);
  const first = {
    bucket: 'private-test-bucket', prefix: 'private-test-prefix',
    originalDirectory: '.local/recovery/synthetic-backup', totalBytes: Buffer.byteLength('synthetic recovery bytes'),
    files: [backupRecord('private-test-prefix', 'backup.tar', 'synthetic recovery bytes')],
  };
  const second = {
    bucket: 'private-test-bucket', prefix, originalDirectory, totalBytes: Buffer.byteLength(content),
    files: [backupRecord(prefix, name, content)],
  };
  await put(root, receipt, JSON.stringify({ version: 2, sets: [first, second] }));
  return root;
}
const apply = { apply: true, env: { PUBLISHING_BUILD_COPY: '1' }, verifyRemote: async () => {} };

test('read-only plan changes no files', async t => {
  const root = await fixture(t);
  const result = await packageDeployment(root);
  assert.equal(result.mode, 'read-only-plan');
  assert.equal(result.beforeBytes - result.removedBytes, result.projectedWorkspaceBytes);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
  await access(path.join(root, '.next/cache/fixture-cache'));
});
test('editor environment refuses cleanup', async t => {
  const root = await fixture(t);
  await assert.rejects(packageDeployment(root, { apply: true, env: {} }), /publishing-build opt-in/);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
});
test('original workspace is refused even with a deployment marker', async t => {
  const root = await fixture(t);
  await put(root, identity, JSON.stringify({ mountNamespace: await readlink('/proc/self/ns/mnt') }));
  await assert.rejects(checkContext(root, apply.env), /Original workspace/);
});
test('build guard accepts explicit opt-in without the runtime marker', async t => {
  const root = await fixture(t);
  await checkContext(root, { PUBLISHING_BUILD_COPY: '1' });
  await assert.rejects(checkContext(root, { REPLIT_DEPLOYMENT: '1' }), /publishing-build opt-in/);
});
test('configured publishing command propagates opt-in and stops on build failure', async t => {
  const root = await fixture(t);
  const configuration = await readFile(new URL('../.replit', import.meta.url), 'utf8');
  const command = JSON.parse(configuration.match(/^build = (\[.*\])$/m)[1]);
  for (const name of ['build-deployment.sh', 'package-deployment.mjs']) {
    await put(root, `scripts/${name}`, await readFile(new URL(`../scripts/${name}`, import.meta.url), 'utf8'));
  }
  // Execute the real guard and wrapper, but never build the app or prune files.
  await put(root, 'bin/node', `#!/bin/bash
if [[ "$2" == "--apply" ]]; then
  printf 'apply:%s\\n' "$PUBLISHING_BUILD_COPY" >> "$GUARD_TEST_LOG"
else
  exec ${JSON.stringify(process.execPath)} "$@"
fi
`);
  const { chmod } = await import('node:fs/promises');
  await chmod(path.join(root, 'bin/node'), 0o755);
  await put(root, 'build.sh', 'printf "build:%s\\n" "$PUBLISHING_BUILD_COPY" >> "$GUARD_TEST_LOG"\nexit "${GUARD_TEST_EXIT:-0}"\n');
  const log = path.join(root, 'command.log');
  const env = { PATH: `${root}/bin:${process.env.PATH}`, GUARD_TEST_LOG: log };
  const success = spawnSync(command[0], command.slice(1), { cwd: root, env, encoding: 'utf8' });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(await readFile(log, 'utf8'), 'build:1\napply:1\n');
  await writeFile(log, '');
  const failure = spawnSync(command[0], command.slice(1), {
    cwd: root, env: { ...env, GUARD_TEST_EXIT: '17' }, encoding: 'utf8',
  });
  assert.equal(failure.status, 17, failure.stderr);
  assert.equal(await readFile(log, 'utf8'), 'build:1\n');
  // With the original namespace, the configured command must stop before build.
  await writeFile(log, '');
  await put(root, identity, JSON.stringify({ mountNamespace: await readlink('/proc/self/ns/mnt') }));
  const original = spawnSync(command[0], command.slice(1), { cwd: root, env, encoding: 'utf8' });
  assert.equal(original.status, 1);
  assert.match(original.stderr, /Original workspace/);
  assert.equal(await readFile(log, 'utf8'), '');
});
test('verified disposable copy prunes only allowlisted paths', async t => {
  const root = await fixture(t);
  const result = await packageDeployment(root, apply);
  assert.equal(result.backup.files, 1);
  for (const entry of exclusions) await assert.rejects(access(path.join(root, entry)));
  for (const entry of ['.next/standalone/server.js', '.next/standalone/public/customer.pdf',
    '.next/static/asset.js', 'public/customer.pdf', 'data/customer.json', '.uploads/customer.bin',
    'node_modules/runtime.js', 'start.sh', 'scripts/submit-indexnow.mjs', '.cache/customer-kept',
    '.local/customer-kept']) assert.equal(await readFile(path.join(root, entry), 'utf8'), 'preserve');
});
test('composite receipt verifies two sets with a nested file', async t => {
  const root = await compositeFixture(t);
  const calls = [];
  const result = await packageDeployment(root, {
    ...apply,
    verifyRemote: async (set, serialized) => {
      calls.push([set, serialized]);
      assert.equal(serialized, `${JSON.stringify(set, null, 2)}\n`);
    },
  });
  assert.equal(result.backup.files, 2);
  assert.equal(calls.length, 2);
  for (const entry of exclusions) await assert.rejects(access(path.join(root, entry)));
});
test('nested composite inventory and checksum mismatches block cleanup', async t => {
  const cases = [
    ['missing', async root => rm(path.join(root, '.local/recovery/nested-accuracy/reports/accuracy.json')), /inventory differs/],
    ['extra', async root => put(root, '.local/recovery/nested-accuracy/reports/extra.json'), /inventory differs/],
    ['changed', async root => put(root, '.local/recovery/nested-accuracy/reports/accuracy.json', 'changed'), /checksum differs/],
  ];
  for (const [label, change, error] of cases) {
    await t.test(`nested composite ${label} file blocks cleanup`, async t => {
      const root = await compositeFixture(t);
      await change(root);
      await assert.rejects(packageDeployment(root, apply), error);
      await access(path.join(root, '.next/cache/fixture-cache'));
    });
  }
});
test('composite receipt rejects duplicate and unsafe paths', async t => {
  const root = await compositeFixture(t);
  const report = JSON.parse(await readFile(path.join(root, receipt), 'utf8'));
  report.sets[1].files.push({ ...report.sets[1].files[0] });
  await put(root, receipt, JSON.stringify(report));
  await assert.rejects(packageDeployment(root, apply), /Duplicate recovery path/);

  const traversal = await compositeFixture(t);
  const traversalReport = JSON.parse(await readFile(path.join(traversal, receipt), 'utf8'));
  traversalReport.sets[1].files[0].name = 'reports/../accuracy.json';
  traversalReport.sets[1].files[0].objectKey = `${traversalReport.sets[1].prefix}/reports/../accuracy.json`;
  await put(traversal, receipt, JSON.stringify(traversalReport));
  await assert.rejects(packageDeployment(traversal, apply), /Invalid private backup/);

  const invalidDirectory = await compositeFixture(t);
  const directoryReport = JSON.parse(await readFile(path.join(invalidDirectory, receipt), 'utf8'));
  directoryReport.sets[1].originalDirectory = '.local/recovery/../outside';
  await put(invalidDirectory, receipt, JSON.stringify(directoryReport));
  await assert.rejects(packageDeployment(invalidDirectory, apply), /Invalid private backup/);
});
test('remote failure in a later composite set prevents all cleanup', async t => {
  const root = await compositeFixture(t);
  let calls = 0;
  await assert.rejects(packageDeployment(root, {
    ...apply,
    verifyRemote: async () => {
      calls += 1;
      if (calls === 2) throw Error('Second durable backup object changed');
    },
  }), /Second durable backup object changed/);
  assert.equal(calls, 2);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
  await access(path.join(root, '.local/recovery/nested-accuracy/reports/accuracy.json'));
  await access(path.join(root, '.next/cache/fixture-cache'));
});
test('unverified extra recovery file blocks all pruning', async t => {
  const root = await fixture(t);
  await put(root, '.local/recovery/new-backup.bin');
  await assert.rejects(packageDeployment(root, apply), /inventory differs/);
  await access(path.join(root, '.next/cache/fixture-cache'));
});
test('changed original bytes block all pruning', async t => {
  const root = await fixture(t);
  await put(root, '.local/recovery/synthetic-backup/backup.tar', 'modified');
  await assert.rejects(packageDeployment(root, apply), /checksum differs/);
  await access(path.join(root, '.next/cache/fixture-cache'));
});
test('missing receipt and workspace identity each block cleanup', async t => {
  const root = await fixture(t);
  await rm(path.join(root, receipt));
  await assert.rejects(packageDeployment(root, apply), /ENOENT/);
  await rm(path.join(root, identity));
  await assert.rejects(packageDeployment(root, apply), /without an original-workspace identity/);
});
test('symlink target blocks cleanup instead of following it', async t => {
  const root = await fixture(t);
  await rm(path.join(root, '.cache/.bun'), { recursive: true });
  await symlink(path.join(root, 'data'), path.join(root, '.cache/.bun'));
  await assert.rejects(packageDeployment(root, apply), /symlink rejected/);
  await access(path.join(root, 'data/customer.json'));
});
test('missing runtime artifact blocks all cleanup', async t => {
  const root = await fixture(t);
  await rm(path.join(root, '.next/standalone/server.js'));
  await assert.rejects(packageDeployment(root, apply), /Missing runtime artifact/);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
});
test('public backup receipt is rejected', async t => {
  const root = await fixture(t);
  const report = JSON.parse(await readFile(path.join(root, receipt), 'utf8'));
  report.files[0].acl.push({ entity: 'allUsers', role: 'READER' });
  await put(root, receipt, JSON.stringify(report));
  await assert.rejects(packageDeployment(root, apply), /Invalid private backup/);
});
test('unavailable or changed durable backup blocks all cleanup', async t => {
  const root = await fixture(t);
  await assert.rejects(packageDeployment(root, { ...apply, verifyRemote: async () => {
    throw Error('Durable backup object changed');
  } }), /Durable backup object changed/);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
  await access(path.join(root, '.next/cache/fixture-cache'));
});
test('runtime symlinks and wrong types are rejected', async t => {
  const root = await fixture(t);
  const server = path.join(root, '.next/standalone/server.js');
  await rm(server);
  await symlink(path.join(root, 'data/customer.json'), server);
  await assert.rejects(packageDeployment(root, apply), /symlink rejected/);
  await rm(server);
  await mkdir(server);
  await assert.rejects(packageDeployment(root, apply), /Invalid runtime artifact type/);
});
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readlink, rm, symlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkContext, exclusions, packageDeployment } from '../scripts/package-deployment.mjs';

const receipt = '.local/diagnostics/publishing-packaging/backup-verification.json';
const identity = '.local/diagnostics/publishing-packaging/workspace-identity.json';
async function put(root, name, content = 'preserve') {
  await mkdir(path.dirname(path.join(root, name)), { recursive: true });
  await writeFile(path.join(root, name), content);
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
    files: [{ name: 'backup.tar', objectKey: 'private-test-prefix/backup.tar',
      bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex'),
      generation: '1', anonymousStatus: 403, acl: [{ entity: 'test-owner', role: 'OWNER' }] }],
  }));
  await put(root, identity, JSON.stringify({ mountNamespace: 'mnt:[synthetic-disposable-copy]' }));
  for (const entry of exclusions.filter(e => !e.startsWith('.local/'))) await put(root, `${entry}/fixture-cache`);
  for (const entry of ['.next/standalone/server.js', '.next/standalone/.next/static/asset.js',
    '.next/standalone/public/customer.pdf', '.next/static/asset.js', 'public/customer.pdf',
    'data/customer.json', '.uploads/customer.bin', 'node_modules/runtime.js', 'start.sh',
    'scripts/submit-indexnow.mjs', '.cache/customer-kept', '.local/customer-kept']) await put(root, entry);
  return root;
}
const apply = { apply: true, env: { REPLIT_DEPLOYMENT: '1' }, verifyRemote: async () => {} };

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
  await assert.rejects(packageDeployment(root, { apply: true, env: {} }), /publishing environment/);
  await access(path.join(root, '.local/recovery/synthetic-backup/backup.tar'));
});
test('original workspace is refused even with a deployment marker', async t => {
  const root = await fixture(t);
  await put(root, identity, JSON.stringify({ mountNamespace: await readlink('/proc/self/ns/mnt') }));
  await assert.rejects(checkContext(root, apply.env), /Original workspace/);
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
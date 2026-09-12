import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile, readlink, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const exclusions = [
  '.local/recovery',
  '.local/diagnostics',
  '.cache/ms-playwright',
  '.cache/.bun',
  '.cache/typescript',
  '.cache/uv',
  '.npm-cache',
  '.next/cache',
];
const receiptPath = '.local/diagnostics/publishing-packaging/backup-verification.json';
const identityPath = '.local/diagnostics/publishing-packaging/workspace-identity.json';

async function exists(file) {
  try { await lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function files(root, relative = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw Error(`Recovery symlink rejected: ${name}`);
    if (entry.isDirectory()) result.push(...await files(root, name));
    else if (entry.isFile()) result.push(name);
    else throw Error(`Unsupported recovery entry: ${name}`);
  }
  return result.sort();
}

async function hash(file) {
  const h = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(file)) { h.update(chunk); bytes += chunk.length; }
  return { bytes, sha256: h.digest('hex') };
}

async function safeTarget(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (!await exists(current)) return;
    if ((await lstat(current)).isSymbolicLink()) throw Error(`Exclusion symlink rejected: ${relative}`);
  }
}

export async function checkContext(root, env = process.env) {
  if (env.PUBLISHING_BUILD_COPY !== '1') throw Error('Cleanup requires the publishing-build opt-in; editor workspace refused.');
  await safeTarget(root, identityPath);
  const identity = path.join(root, identityPath);
  if (await exists(path.join(root, '.local/recovery')) && !await exists(identity)) {
    throw Error('Recovery exists without an original-workspace identity; refusing cleanup.');
  }
  if (await exists(identity)) {
    const saved = JSON.parse(await readFile(identity, 'utf8'));
    if (typeof saved.mountNamespace !== 'string' || !saved.mountNamespace.startsWith('mnt:[')) {
      throw Error('Invalid original-workspace identity.');
    }
    if (saved.mountNamespace === await readlink('/proc/self/ns/mnt')) {
      throw Error('Original workspace mount namespace detected; refusing cleanup.');
    }
  }
}

export async function verifyRecovery(root, verifyRemote) {
  const recovery = path.join(root, '.local/recovery');
  if (!await exists(recovery)) return { files: 0, bytes: 0 };
  await safeTarget(root, receiptPath);
  const serializedReceipt = await readFile(path.join(root, receiptPath), 'utf8');
  const receipt = JSON.parse(serializedReceipt);
  if (!receipt.bucket || !receipt.prefix || !Array.isArray(receipt.files) || !receipt.files.length) {
    throw Error('Missing verified private backup receipt.');
  }
  const expected = receipt.files.map(record => {
    const relative = path.posix.join(receipt.originalDirectory, record.name);
    if (!relative.startsWith('.local/recovery/') || relative.includes('..') ||
        record.name.includes('/') || record.name.includes('\\') ||
        record.objectKey !== `${receipt.prefix}/${record.name}` ||
        record.anonymousStatus !== 403 || !record.generation ||
        !Array.isArray(record.acl) || !record.acl.length ||
        record.acl.some(a => ['allUsers', 'allAuthenticatedUsers'].includes(a.entity))) {
      throw Error('Invalid private backup receipt entry.');
    }
    return relative.slice('.local/recovery/'.length);
  }).sort();
  const actual = await files(recovery);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw Error('Recovery inventory differs from verified durable backup.');
  let bytes = 0;
  for (const record of receipt.files) {
    const actualHash = await hash(path.join(root, receipt.originalDirectory, record.name));
    if (actualHash.sha256 !== record.sha256 || actualHash.bytes !== record.bytes) {
      throw Error(`Recovery checksum differs from verified backup: ${record.name}`);
    }
    bytes += actualHash.bytes;
  }
  if (receipt.totalBytes !== bytes) throw Error('Backup total byte count mismatch.');
  if (verifyRemote) await verifyRemote(receipt, serializedReceipt);
  return { files: actual.length, bytes };
}

async function size(file) {
  if (!await exists(file)) return 0;
  const stat = await lstat(file);
  if (!stat.isDirectory()) return stat.size;
  let bytes = 0;
  for (const entry of await readdir(file)) bytes += await size(path.join(file, entry));
  return bytes;
}

export async function packageDeployment(root, { apply = false, env = process.env, verifyRemote } = {}) {
  root = await realpath(root);
  if (apply) await checkContext(root, env);
  // Validate every target and the complete backup before removing anything.
  for (const entry of exclusions) await safeTarget(root, entry);
  if (apply && !verifyRemote) {
    verifyRemote = (await import('./verify-durable-backup.mjs')).verifyDurableBackup;
  }
  const backup = await verifyRecovery(root, verifyRemote);
  if (apply) {
    const artifacts = {
      '.next/standalone/server.js': 'file', '.next/standalone/.next/static': 'directory',
      '.next/standalone/public': 'directory', 'start.sh': 'file', 'scripts/submit-indexnow.mjs': 'file',
    };
    for (const [required, type] of Object.entries(artifacts)) {
      await safeTarget(root, required);
      if (!await exists(path.join(root, required))) throw Error(`Missing runtime artifact: ${required}`);
      const stat = await lstat(path.join(root, required));
      if (type === 'file' ? !stat.isFile() : !stat.isDirectory()) throw Error(`Invalid runtime artifact type: ${required}`);
    }
  }
  const beforeBytes = await size(root);
  const excluded = [];
  for (const entry of exclusions) excluded.push({ path: entry, bytes: await size(path.join(root, entry)) });
  const removedBytes = excluded.reduce((total, entry) => total + entry.bytes, 0);
  if (apply) for (const entry of exclusions) await rm(path.join(root, entry), { recursive: true, force: true });
  return { mode: apply ? 'publishing-copy-cleanup' : 'read-only-plan', backup, beforeBytes, removedBytes,
    projectedWorkspaceBytes: beforeBytes - removedBytes, excluded,
    note: 'Workspace bytes only; Replit platform/Nix layers are additional. No runtime/customer directories are excluded.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2] ?? '--plan';
    if (!['--plan', '--apply', '--check-context'].includes(mode)) throw Error('Expected --plan, --apply or --check-context.');
    if (mode === '--check-context') await checkContext(process.cwd());
    else console.log(JSON.stringify(await packageDeployment(process.cwd(), { apply: mode === '--apply' }), null, 2));
  } catch (error) { console.error(`Packaging refused: ${error.message}`); process.exitCode = 1; }
}
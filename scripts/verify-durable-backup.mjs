import { Client } from '@replit/object-storage';

// Metadata/generation checks bind this build to the full read-back verification
// performed when the immutable backup was created. Never mutate stored objects.
export async function verifyDurableBackup(receipt, serializedReceipt) {
  const bucket = await new Client({ bucketId: receipt.bucket }).getBucket();
  const manifest = bucket.file(`${receipt.prefix}/VERIFIED-MANIFEST.json`);
  const [remoteManifest] = await manifest.download();
  if (remoteManifest.toString('utf8') !== serializedReceipt) throw Error('Durable verification manifest differs from local receipt.');
  for (const record of receipt.files) {
    const file = bucket.file(record.objectKey);
    const [metadata] = await file.getMetadata();
    if (String(metadata.generation) !== String(record.generation) ||
        Number(metadata.size) !== record.bytes || metadata.metadata?.sha256 !== record.sha256) {
      throw Error(`Durable backup object changed: ${record.name}`);
    }
    const [acl] = await file.acl.get();
    if (!acl.length || acl.some(a => ['allUsers', 'allAuthenticatedUsers'].includes(a.entity))) {
      throw Error('Durable backup has public access permissions.');
    }
    const anonymous = await fetch(`https://storage.googleapis.com/${encodeURIComponent(receipt.bucket)}/${record.objectKey.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (anonymous.status !== 403) throw Error('Durable backup anonymous access is not forbidden.');
  }
}
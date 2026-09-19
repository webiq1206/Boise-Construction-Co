import {createHash, randomUUID} from 'node:crypto';
import {mkdir, open, readFile, readdir, rmdir, realpath, lstat} from 'node:fs/promises';
import {resolve, join, relative, isAbsolute} from 'node:path';

export const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
class GuardBlocked extends Error {
  constructor() { super('Live qualification blocked: allowance, reservation, or reconciliation required.'); }
}
const stop = () => new GuardBlocked();
export interface Allowance {
  version: 1;
  authorization: string;
  currency: 'USD';
  budgetMicrousd: number;
  perCallMicrousd: number;
  boundEvidence: string;
  coversAllTokensAndTools: true;
  expiresAt: string;
  ledgerDirectory: string;
  configurationFile: string;
  configurationSha256: string;
  sourceSha256: Record<string, string>;
  endpoints: string[];
  models: string[];
  maxRequestBytes: number;
  maxOutputTokens: number;
  // Exact serialized HTTP bodies, prepared offline and explicitly reviewed.
  // Binds every input, tool budget, service tier and future provider field.
  requestBodySha256: string[];
}
const SHA256=/^[a-f0-9]{64}$/;
const RESERVATION_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ALLOWANCE_FIELDS=[
  'authorization','boundEvidence','budgetMicrousd','configurationFile',
  'configurationSha256','coversAllTokensAndTools','currency','endpoints',
  'expiresAt','ledgerDirectory','maxOutputTokens','maxRequestBytes','models',
  'perCallMicrousd','requestBodySha256','sourceSha256','version',
] as const;
export async function canonicalSourcePath(root: string, file: string) {
  try {
    root=resolve(root);file=resolve(file);
    const child=relative(root,file);
    if (child.startsWith('..') || isAbsolute(child) ||
        await realpath(root)!==root || await realpath(file)!==file) throw stop();
    return file;
  } catch { throw stop(); }
}
export function eligibleGenerationEndpoints(env: NodeJS.ProcessEnv=process.env) {
  const endpoints=['https://api.anthropic.com/v1/messages','https://api.openai.com/v1/responses'];
  // Mirrors the production integrated-provider selection, not allowance input.
  if(env.AI_INTEGRATIONS_OPENAI_API_KEY && env.AI_INTEGRATIONS_OPENAI_BASE_URL){
    try {
      const url=new URL(env.AI_INTEGRATIONS_OPENAI_BASE_URL.replace(/\/+$/,'')+'/responses');
      if(url.protocol==='https:' && !url.username && !url.password && !url.search && !url.hash)endpoints.push(url.href);
    } catch { /* Invalid/insecure managed configuration is never eligible. */ }
  }
  return endpoints;
}
// The ledger is dedicated to this allowance, never to a document budget. Retain
// it and its exclusive lock across crashes. No stale-lock deletion or reset.
export async function openGuard(allowanceFile: string, transport: typeof fetch) {
  try { return await openGuardInternal(allowanceFile,transport); } catch { throw stop(); }
}
async function openGuardInternal(allowanceFile: string, transport: typeof fetch) {
  const raw = await readFile(allowanceFile);
  const allowance: Allowance = JSON.parse(raw.toString());
  const positive = (n: number) => Number.isSafeInteger(n) && n > 0;
  if (!allowance || typeof allowance !== 'object' || Array.isArray(allowance) ||
      Object.keys(allowance).sort().join(',') !== [...ALLOWANCE_FIELDS].sort().join(',') ||
      allowance.version !== 1 || allowance.currency !== 'USD' ||
      !allowance.authorization?.trim() || !allowance.boundEvidence?.trim() ||
      allowance.coversAllTokensAndTools !== true ||
      !positive(allowance.budgetMicrousd) || !positive(allowance.perCallMicrousd) ||
      allowance.perCallMicrousd > allowance.budgetMicrousd ||
      !positive(allowance.maxRequestBytes) || !positive(allowance.maxOutputTokens) ||
      !allowance.models?.length || !allowance.models.every(model=>typeof model==='string'&&model.trim()) ||
      !allowance.endpoints?.length || !allowance.configurationFile ||
      !SHA256.test(allowance.configurationSha256) ||
      !allowance.sourceSha256 || typeof allowance.sourceSha256 !== 'object' ||
      Array.isArray(allowance.sourceSha256) ||
      !Object.entries(allowance.sourceSha256).length ||
      !Object.entries(allowance.sourceSha256).every(([file,hash])=>file.trim()&&SHA256.test(hash)) ||
      !Array.isArray(allowance.requestBodySha256) || !allowance.requestBodySha256.length ||
      !allowance.requestBodySha256.every(hash=>SHA256.test(hash)) ||
      !allowance.ledgerDirectory || !(Date.parse(allowance.expiresAt) > Date.now())) throw stop();
  for (const endpoint of allowance.endpoints) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        !eligibleGenerationEndpoints().includes(endpoint)) throw stop();
  }
  const root = resolve(allowance.ledgerDirectory);
  await mkdir(root, {recursive: true, mode: 0o700});
  if(await realpath(root)!==root || (await lstat(root)).mode & 0o077)throw stop();
  const readLedger = async (name:string) => {
    const file=join(root,name),stat=await lstat(file);
    if(!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)throw stop();
    return readFile(file,'utf8');
  };
  const syncDirectory = async () => { const fd = await open(root, 'r'); try { await fd.sync(); } finally { await fd.close(); } };
  const immutable = async (name: string, value: unknown) => {
    const fd = await open(join(root, name), 'wx', 0o600);
    try { await fd.writeFile(JSON.stringify(value)); await fd.sync(); } finally { await fd.close(); }
    await syncDirectory();
  };
  const locked = async <T>(work: () => Promise<T>): Promise<T> => {
    try { await mkdir(join(root, 'LOCK'), {mode: 0o700}); } catch { throw stop(); }
    // A failed transaction deliberately retains LOCK for operator investigation.
    try {
      const result = await work();
      await rmdir(join(root, 'LOCK')); await syncDirectory();
      return result;
    } catch (error) {
      // Logical denials did not mutate a transaction. Actual IO failure/crash
      // retains LOCK; never infer a stale lock from elapsed time or a PID.
      if (error instanceof GuardBlocked) { await rmdir(join(root, 'LOCK')); await syncDirectory(); }
      throw error;
    }
  };
  await locked(async () => {
    const names = await readdir(root);
    if (!names.includes('allowance.json')) {
      if (names.some(n => n !== 'LOCK')) throw stop();
      await immutable('allowance.json', {sha256: digest(raw)});
    } else if (JSON.parse(await readLedger('allowance.json')).sha256 !== digest(raw)) throw stop();
  });
  const guardedFetch: typeof fetch = async (input, init) => {
    // Only this exact audited fetch shape is supported; unknown network routes,
    // including CRM/email and metadata, are blocked before transport, without spend.
    if (typeof input !== 'string' || init?.method !== 'POST' ||
        !allowance.endpoints.includes(input) || typeof init.body !== 'string' ||
        init.redirect && init.redirect !== 'error' ||
        Buffer.byteLength(init.body) > allowance.maxRequestBytes ||
        !(Date.parse(allowance.expiresAt) > Date.now())) throw stop();
    const body = JSON.parse(init.body);
    // Canonical JSON rejects duplicate keys, including duplicate token fields.
    if(JSON.stringify(body)!==init.body || !allowance.requestBodySha256.includes(digest(init.body)))throw stop();
    const field=input==='https://api.anthropic.com/v1/messages'?'max_tokens':'max_output_tokens';
    if(['max_tokens','max_output_tokens','max_completion_tokens'].some(key=>key!==field && Object.hasOwn(body,key)))throw stop();
    const output = body[field];
    if (!allowance.models.includes(body.model) || !positive(output) ||
        output > allowance.maxOutputTokens || body.stream) throw stop();
    // Only the production pricing client's ordinary authentication and JSON
    // headers are accepted. Provider beta/service-tier headers can change tool
    // availability or billing and therefore require a new reviewed body/guard
    // contract rather than slipping through an otherwise pinned request.
    const headers=new Headers(init.headers);
    const names=[...headers.keys()].sort();
    const anthropic=input==='https://api.anthropic.com/v1/messages';
    const expected=anthropic?['anthropic-version','content-type','x-api-key']:['authorization','content-type'];
    if(names.join(',')!==expected.join(',') ||
       headers.get('content-type')!=='application/json' ||
       (anthropic
         ? headers.get('anthropic-version')!=='2023-06-01'||!headers.get('x-api-key')?.trim()
         : !/^Bearer \S+$/.test(headers.get('authorization')||'')))throw stop();
    const id = randomUUID();
    await locked(async () => {
      const names = await readdir(root);
      for(const name of names){
        if(name==='LOCK')continue;
        if(name==='allowance.json'){
          if(JSON.parse(await readLedger(name)).sha256!==digest(raw))throw stop();
          continue;
        }
        const entryId=name.slice(0,36);
        if(!RESERVATION_ID.test(entryId) ||
            !/^\.(?:reservation\.json|response\.json|reconciled\.json|billing-evidence)$/.test(name.slice(36)))throw stop();
        const content=await readLedger(name);
        if(name.endsWith('.json'))JSON.parse(content);
        if(!name.endsWith('.reservation.json') &&
            !names.includes(name.slice(0,36)+'.reservation.json'))throw stop();
      }
      let reserved = 0;
      for (const name of names.filter(n => n.endsWith('.reservation.json'))) {
        const entry = JSON.parse(await readLedger(name));
        if (!positive(entry.amount) || entry.amount!==allowance.perCallMicrousd ||
            entry.allowanceSha256!==digest(raw) || name!==`${entry.id}.reservation.json` ||
             !RESERVATION_ID.test(entry.id)) throw stop();
        reserved += entry.amount;
        // Even successful HTTP is not billing evidence. Every call remains
        // unresolved until an operator supplies immutable reconciliation.
        const evidenceName = name.replace('.reservation.json', '.reconciled.json');
        if (!names.includes(evidenceName)) throw stop();
        const evidence = JSON.parse(await readLedger(evidenceName));
        if (evidence.reservationId !== entry.id || evidence.allowanceSha256 !== digest(raw) ||
            evidence.chargedAtMostMicrousd !== entry.amount || !evidence.reviewedBy ||
            !evidence.providerEvidenceSha256 || !SHA256.test(evidence.providerEvidenceSha256)) throw stop();
        const proof = await readLedger(`${entry.id}.billing-evidence`);
        if (digest(proof) !== evidence.providerEvidenceSha256) throw stop();
      }
      if (!Number.isSafeInteger(reserved) || reserved + allowance.perCallMicrousd > allowance.budgetMicrousd) throw stop();
      await immutable(`${id}.reservation.json`, {id, amount: allowance.perCallMicrousd,
        allowanceSha256: digest(raw), requestSha256: digest(init.body as string), createdAt: new Date().toISOString()});
    });
    // This is the ONLY call to the actual transport. No retries or redirects.
    // Errors deliberately leave the durable reservation unresolved.
    try {
      const response = await transport(input, {...init, redirect: 'error'});
      const bytes = new Uint8Array(await response.arrayBuffer());
      await immutable(`${id}.response.json`, {status: response.status, bodySha256: digest(bytes)});
      return new Response(bytes, {status: response.status, headers: response.headers});
    } catch { throw stop(); }
  };
  const controlledFetch:typeof fetch=async(input,init)=>{
    try{return await guardedFetch(input,init);}catch{throw stop();}
  };
  return {allowance, fetch: controlledFetch, ledgerDirectory: root};
}
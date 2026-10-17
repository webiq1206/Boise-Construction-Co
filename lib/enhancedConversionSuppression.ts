import { createHash } from "node:crypto";
import { googleAdsPhoneNumber } from "./googleAdsConversion.ts";
import { query } from "./p5/database.ts";

export type SuppressionKind = "email" | "phone";

export interface SuppressionHash {
  kind: SuppressionKind;
  valueHash: string;
}

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS enhanced_conversion_suppressions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kind text NOT NULL,
  value_hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
)`;
const CREATE_INDEX = `CREATE UNIQUE INDEX IF NOT EXISTS enhanced_conversion_suppressions_value_hash_unique
  ON enhanced_conversion_suppressions (value_hash)`;

let tableReady: Promise<void> | undefined;

/** Trimmed and lowercased. Empty input is omitted. */
export function normalizedSuppressionEmail(email?: string): string | undefined {
  const value = email?.trim().toLowerCase();
  return value || undefined;
}

export function suppressionHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Hashes only the normalized email and the E.164 phone. Raw values are not returned. */
export function suppressionHashes(input: { email?: string; phone?: string }): SuppressionHash[] {
  const rows: SuppressionHash[] = [];
  const email = normalizedSuppressionEmail(input.email);
  if (email) rows.push({ kind: "email", valueHash: suppressionHash(email) });
  const phone = googleAdsPhoneNumber(input.phone);
  if (phone) rows.push({ kind: "phone", valueHash: suppressionHash(phone) });
  return rows;
}

async function ensureSuppressionTable(): Promise<void> {
  tableReady ??= (async () => {
    await query(CREATE_TABLE);
    await query(CREATE_INDEX);
  })();
  return tableReady;
}

async function hashesMatchStored(hashes: string[]): Promise<boolean> {
  await ensureSuppressionTable();
  const rows = await query(
    `SELECT value_hash FROM enhanced_conversion_suppressions WHERE value_hash IN (${hashes.map((_, index) => `$${index + 1}`).join(", ")}) LIMIT 1`,
    hashes,
  );
  return rows.length > 0;
}

/**
 * True when neither the normalized email nor the E.164 phone is on the list.
 * A lookup failure fails closed so user_data is skipped and the lead is unchanged.
 */
export async function enhancedConversionsAllowed(
  input: { email?: string; phone?: string },
  lookup: (hashes: string[]) => Promise<boolean> = hashesMatchStored,
): Promise<boolean> {
  const hashes = suppressionHashes(input).map((row) => row.valueHash);
  if (!hashes.length) return true;
  return !(await lookup(hashes));
}

export async function allowEnhancedConversionsFlag(input: { email?: string; phone?: string }): Promise<boolean> {
  try {
    return await enhancedConversionsAllowed(input);
  } catch {
    return false;
  }
}

/** Hashes the raw value and inserts only the hash. */
export async function addEnhancedConversionSuppression(kind: SuppressionKind, raw: string): Promise<SuppressionHash> {
  const [row] = suppressionHashes(kind === "email" ? { email: raw } : { phone: raw });
  if (!row || row.kind !== kind) {
    throw new Error(kind === "phone" ? "phone-not-10-digits" : "email-empty");
  }
  await ensureSuppressionTable();
  await query(
    `INSERT INTO enhanced_conversion_suppressions (id, kind, value_hash) VALUES (gen_random_uuid()::text, $1, $2) ON CONFLICT (value_hash) DO NOTHING`,
    [row.kind, row.valueHash],
  );
  return row;
}

export async function withAllowEnhancedConversions<T extends object>(
  payload: T,
  contact: { email?: string; phone?: string },
  lookup?: (hashes: string[]) => Promise<boolean>,
): Promise<T & { allowEnhancedConversions: boolean }> {
  const allowEnhancedConversions = lookup
    ? await enhancedConversionsAllowed(contact, lookup).catch(() => false)
    : await allowEnhancedConversionsFlag(contact);
  return { ...payload, allowEnhancedConversions };
}

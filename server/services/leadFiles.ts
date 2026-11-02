import { randomUUID } from "crypto";
import { like, sql } from "drizzle-orm";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  LEAD_FILE_TYPES,
  MAX_LEAD_FILE_BYTES,
  MAX_LEAD_FILES,
  leadFileExtension,
  type LeadFileLink,
} from "@/shared/leadFiles";

/**
 * Files attached to a quote request, stored the way this repo and Remodeling
 * already store lead documents: one row per file in `stored_files` (Postgres,
 * base64 text; see the comment on that table in shared/schema.ts), served by
 * /api/documents/local/<key>. Never a public bucket: the key carries a random
 * UUID, so a link is unguessable, and there is no listing route.
 *
 * Written straight to the table rather than through lib/storage/blob.ts
 * uploadFile, which would switch to a PUBLIC Vercel Blob the day someone sets
 * BLOB_READ_WRITE_TOKEN. A visitor's photos of their house stay private.
 *
 * Keys are `leads/<inquiryKey>/<uuid>-<safe name>`, so the files of one request
 * are found by prefix without a schema change, and the per-request cap is a
 * count of those rows.
 */

export const LEAD_FILE_KEY_PREFIX = "leads/";

export function leadFilePrefix(inquiryKey: string): string {
  return `${LEAD_FILE_KEY_PREFIX}${inquiryKey}/`;
}

/** Recognise the file by its first bytes. A renamed .exe is not a photo. */
export function sniffLeadFile(bytes: Uint8Array): string | null {
  const at = (offset: number, ...values: number[]) => values.every((v, i) => bytes[offset + i] === v);
  const ascii = (offset: number, text: string) => [...text].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  if (bytes.length < 12) return null;
  if (ascii(0, "%PDF")) return "pdf";
  if (at(0, 0xff, 0xd8, 0xff)) return "jpg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["heic", "heix", "hevc", "hevx", "heim", "heis"].includes(brand)) return "heic";
    if (["mif1", "msf1", "heif"].includes(brand)) return "heif";
  }
  return null;
}

/** File name kept for the team, reduced to characters that are safe in a URL and a header. */
export function safeLeadFileName(name: string, ext: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    // No leading dots or dashes: "../../x" must not survive as a path-like name.
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);
  return `${base || "file"}.${ext}`;
}

export function leadFileUrl(key: string, siteUrl = SITE_CONFIG.siteUrl): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${siteUrl.replace(/\/$/, "")}/api/documents/local/${path}`;
}

export type LeadFileRejection = "type" | "size" | "empty" | "count";

export type LeadFileValidation =
  | { ok: true; ext: string; contentType: string }
  | { ok: false; reason: LeadFileRejection };

/**
 * Server-side control. The declared name or type must be an accepted kind, the
 * content must actually BE an accepted kind, and the two must agree on PDF
 * versus image (a browser often reports HEIC as an empty type, so image kinds
 * may differ from the name: the bytes decide which image it is).
 */
export function validateLeadFile(
  input: { name: string; type?: string; size: number; head: Uint8Array },
  existingCount: number,
): LeadFileValidation {
  if (existingCount >= MAX_LEAD_FILES) return { ok: false, reason: "count" };
  if (!input.size) return { ok: false, reason: "empty" };
  if (input.size > MAX_LEAD_FILE_BYTES) return { ok: false, reason: "size" };
  const declared = leadFileExtension(input.name, input.type);
  const actual = sniffLeadFile(input.head);
  if (!declared || !actual) return { ok: false, reason: "type" };
  if ((declared === "pdf") !== (actual === "pdf")) return { ok: false, reason: "type" };
  return { ok: true, ext: actual, contentType: LEAD_FILE_TYPES[actual] };
}

export interface StoredLeadFile {
  key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface LeadFileStore {
  count(inquiryKey: string): Promise<number>;
  insert(row: StoredLeadFile & { data: string }): Promise<void>;
  list(inquiryKey: string): Promise<StoredLeadFile[]>;
}

/** The file id the browser holds: the random part of the key, never the inquiry key. */
export function leadFileId(key: string): string {
  return key.split("/").pop()?.split("-").slice(0, 5).join("-") ?? "";
}

export function toLeadFileLink(row: StoredLeadFile): LeadFileLink {
  return {
    id: leadFileId(row.key),
    name: row.fileName,
    url: leadFileUrl(row.key),
    contentType: row.mimeType,
    size: row.fileSize,
  };
}

export async function storeLeadFile(
  store: LeadFileStore,
  inquiryKey: string,
  file: { name: string; buffer: Buffer; ext: string; contentType: string },
): Promise<LeadFileLink> {
  const fileName = safeLeadFileName(file.name, file.ext);
  const key = `${leadFilePrefix(inquiryKey)}${randomUUID()}-${fileName}`;
  const row = { key, fileName, mimeType: file.contentType, fileSize: file.buffer.byteLength };
  await store.insert({ ...row, data: file.buffer.toString("base64") });
  return toLeadFileLink(row);
}

/** Drizzle implementation. Selects never read the `data` column. */
export async function createDrizzleLeadFileStore(): Promise<LeadFileStore> {
  const { db } = await import("@/lib/db");
  if (!db) throw new Error("File storage is unavailable");
  const { storedFiles } = await import("@/shared/schema");
  const database = db;
  // Escape LIKE wildcards: inquiry keys contain underscores.
  const prefixed = (inquiryKey: string) =>
    like(storedFiles.key, `${leadFilePrefix(inquiryKey).replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  return {
    async count(inquiryKey) {
      const rows = await database
        .select({ n: sql<number>`count(*)::int` })
        .from(storedFiles)
        .where(prefixed(inquiryKey));
      return Number(rows[0]?.n ?? 0);
    },
    async insert(row) {
      await database.insert(storedFiles).values(row);
    },
    async list(inquiryKey) {
      return database
        .select({
          key: storedFiles.key,
          fileName: storedFiles.fileName,
          mimeType: storedFiles.mimeType,
          fileSize: storedFiles.fileSize,
        })
        .from(storedFiles)
        .where(prefixed(inquiryKey))
        .orderBy(storedFiles.createdAt);
    },
  };
}

import { put, del } from "@vercel/blob";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

function useLocalStorage(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * The database is a better fallback than the container filesystem.
 *
 * Without a blob token this used to write to disk on an ephemeral container,
 * so every uploaded document died at the next deploy - an RE-10 uploaded half
 * an hour earlier returned 404, and the document link on the lead went with
 * it. Postgres is already provisioned, already backed up, and unlike a public
 * blob it is not readable by anyone holding a URL.
 *
 * Order of preference: a real blob store if one is configured, then the
 * database, then disk. Disk remains only so a checkout with no database at all
 * still runs.
 */
async function dbStore(): Promise<typeof import("@/lib/db")["db"] | null> {
  try {
    const { db } = await import("@/lib/db");
    return db ?? null;
  } catch {
    return null;
  }
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (useLocalStorage()) {
    const db = await dbStore();
    if (db) {
      const { storedFiles } = await import("@/shared/schema");
      await db
        .insert(storedFiles)
        .values({
          key,
          fileName: key.split("/").pop() ?? key,
          mimeType,
          fileSize: buffer.byteLength,
          data: buffer.toString("base64"),
        })
        .onConflictDoNothing();
      return `/api/documents/local/${encodeURIComponent(key)}`;
    }
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return `/api/documents/local/${encodeURIComponent(key)}`;
  }

  const blob = await put(key, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteFile(urlOrKey: string): Promise<void> {
  if (useLocalStorage()) {
    const key = urlOrKey.replace(/^\/api\/documents\/local\//, "");
    const filePath = path.join(LOCAL_UPLOAD_DIR, decodeURIComponent(key));
    try {
      const { unlink } = await import("fs/promises");
      await unlink(filePath);
    } catch {
      // ignore missing files
    }
    return;
  }

  if (urlOrKey.startsWith("http")) {
    await del(urlOrKey);
  }
}

/**
 * Read back a stored file. Database first, then disk.
 *
 * Disk is checked second rather than not at all so that documents written
 * before the database became the store are still readable until their
 * container goes away.
 */
export async function readLocalFile(key: string): Promise<Buffer | null> {
  const db = await dbStore();
  if (db) {
    try {
      const { storedFiles } = await import("@/shared/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(storedFiles).where(eq(storedFiles.key, key)).limit(1);
      if (row) return Buffer.from(row.data, "base64");
    } catch (err) {
      console.error("[storage] database read failed, falling back to disk:", err);
    }
  }
  try {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export function isLocalUrl(url: string): boolean {
  return url.startsWith("/api/documents/local/");
}

export function extractLocalKey(url: string): string {
  return decodeURIComponent(url.replace(/^\/api\/documents\/local\//, ""));
}

/**
 * Optional plans and photos on the short project note.
 * Files stay off the multi-step intake. The lead API only accepts URLs this
 * uploader would mint, so a note cannot point at some other stored document.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The short homepage note is a finished lead: name, phone, email, and a project note. Files stay optional. */
export function projectNoteFieldError(input: {
  name: string;
  phone: string;
  email: string;
  note: string;
}): string | null {
  if (input.name.trim().length < 2) return "Add your name.";
  if (input.phone.replace(/\D/g, "").length < 10) return "Add a phone number we can call.";
  if (!EMAIL_RE.test(input.email.trim())) return "Add an email address.";
  if (input.note.trim().length < 2) return "Add a short project note.";
  return null;
}

export function projectNoteBody(note: string): string {
  return `Homepage project note. ${note.trim()}`;
}

export const PROJECT_FILE_LIMITS = {
  maxFiles: 4,
  maxBytes: 10 * 1024 * 1024,
  maxTotalBytes: 25 * 1024 * 1024,
} as const;

const KEY_RE =
  /^consultation\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9][a-z0-9._-]{0,120}$/i;

export function safeProjectLeaf(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const stem = base
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return stem || "file";
}

export function sniffProjectFile(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return { ext: "pdf", mime: "application/pdf" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "heic" || brand === "heix" || brand === "heif" || brand === "mif1") {
      return { ext: "heic", mime: "image/heic" };
    }
  }
  return null;
}

export function isProjectFileUrl(url: string): boolean {
  if (url.startsWith("/api/documents/local/")) {
    try {
      const key = decodeURIComponent(url.slice("/api/documents/local/".length));
      return KEY_RE.test(key);
    } catch {
      return false;
    }
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com") && !parsed.hostname.endsWith(".blob.vercel-storage.com")) {
      return false;
    }
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return KEY_RE.test(path);
  } catch {
    return false;
  }
}

export function absoluteProjectFileUrl(url: string, siteUrl: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const root = siteUrl.replace(/\/$/, "");
  return `${root}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Staff-readable file list. The visitor note is kept separate so a long note cannot cut the links. */
export function projectFileNote(
  files: { filename: string; url: string }[] | undefined,
  siteUrl: string,
): string {
  if (!files?.length) return "";
  const lines = files.map((file) => `- ${file.filename}: ${absoluteProjectFileUrl(file.url, siteUrl)}`);
  return ["Plans and photos:", ...lines].join("\n");
}

export function joinProjectNote(note: string | undefined, files: string): string | undefined {
  const fileBlock = files.trim();
  const room = 5_000 - (fileBlock ? fileBlock.length + 2 : 0);
  const text = (note ?? "").trim().slice(0, Math.max(0, room));
  const parts = [text, fileBlock].filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

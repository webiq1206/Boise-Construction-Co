/**
 * Files a visitor may attach to a quote request: photos, plans, drawings.
 *
 * Shared by the browser (a fast, specific message before anything is sent) and
 * the server (the actual control, which also checks the file's first bytes).
 * The form states these numbers to the visitor, so they live in one place.
 */

/** Files on one request, across the request screen and "Help us prepare". */
export const MAX_LEAD_FILES = 10;

/** Bytes for one file. A phone photo is 2 to 6 MB; a scanned plan set can be more. */
export const MAX_LEAD_FILE_BYTES = 20 * 1024 * 1024;

export const MAX_LEAD_FILE_MB = MAX_LEAD_FILE_BYTES / (1024 * 1024);

/** The native picker filter. On phones this offers the camera, photo library and files. */
export const LEAD_FILE_ACCEPT = "image/*,application/pdf,.heic,.heif";

/** Accepted content types, by the extension they are stored under. */
export const LEAD_FILE_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

const EXTENSION_ALIASES: Readonly<Record<string, string>> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  heic: "heic",
  heif: "heif",
  pdf: "pdf",
};

const TYPE_TO_EXTENSION: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/heic-sequence": "heic",
  "image/heif-sequence": "heif",
  "application/pdf": "pdf",
};

export type LeadFileCheck =
  | { ok: true; ext: string; contentType: string }
  | { ok: false; reason: "type" | "size" | "empty" };

/**
 * The browser-side check: declared type first, then the extension, because
 * phones often hand over HEIC photos with an empty type.
 */
export function checkLeadFile(file: { name: string; type?: string; size: number }): LeadFileCheck {
  if (!file.size) return { ok: false, reason: "empty" };
  const ext = leadFileExtension(file.name, file.type);
  if (!ext) return { ok: false, reason: "type" };
  if (file.size > MAX_LEAD_FILE_BYTES) return { ok: false, reason: "size" };
  return { ok: true, ext, contentType: LEAD_FILE_TYPES[ext] };
}

export function leadFileExtension(name: string, type?: string): string | null {
  const fromType = type ? TYPE_TO_EXTENSION[type.toLowerCase()] : undefined;
  if (fromType) return fromType;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return name.includes(".") ? EXTENSION_ALIASES[ext] ?? null : null;
}

/** Plain words for the visitor. Never blocks the form: the file is simply not added. */
export function leadFileProblem(name: string, reason: "type" | "size" | "empty" | "count"): string {
  switch (reason) {
    case "size":
      return `${name} is over ${MAX_LEAD_FILE_MB} MB, so it was not added.`;
    case "type":
      return `${name} is not a photo or PDF, so it was not added.`;
    case "empty":
      return `${name} is empty, so it was not added.`;
    case "count":
      return `You can add up to ${MAX_LEAD_FILES} files, so ${name} was not added.`;
  }
}

/** "2.4 MB", "830 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** What the internal email, CRM notes and the P5 intake carry for each stored file. */
export interface LeadFileLink {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

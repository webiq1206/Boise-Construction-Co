import { createHash, createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { propertyProfileSchema } from "@/server/services/consultationRequest";
import { MAX_LEAD_FILES, formatFileSize, type LeadFileLink } from "@/shared/leadFiles";
import { PROJECT_LABEL_LOOKUP, TIMING_CHOICES } from "@/shared/quoteFormChoices";

/**
 * "Help us prepare (optional)": the second step on the quote form's success
 * screen. It adds details and files to the SAME request instead of creating a
 * new one.
 *
 * Who may add details: whoever just sent the request. /api/consultation issues
 * a short-lived token bound to the request's inquiry key (HMAC-SHA256 with the
 * existing SESSION_SECRET, which the durable intake already requires). The
 * inquiry key alone is not enough: it travels in browser storage and analytics
 * claims, so it is an identifier, not a credential.
 *
 * How details merge: a column is filled only when it is empty (or the project
 * type is still "other"), so a Step 1 answer is never overwritten, and never
 * with a blank. Everything the visitor added is appended to the notes as one
 * "DETAILS ADDED" block, and the append is conditional on that exact block not
 * being there already, which makes a repeated post a no-op that sends nothing.
 */

export const DETAILS_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
export const DETAILS_MARKER = "DETAILS ADDED";

const TOKEN_PURPOSE = "consultation-details";

function sign(inquiryKey: string, expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`${TOKEN_PURPOSE}:${inquiryKey}:${expiresAt}`).digest("base64url");
}

/** `<expiry ms>.<signature>`. Nothing in it is secret except the signature. */
export function issueDetailsToken(inquiryKey: string, secret: string, now = Date.now()): string {
  if (!secret) throw new Error("Details token requires SESSION_SECRET");
  const expiresAt = now + DETAILS_TOKEN_TTL_MS;
  return `${expiresAt}.${sign(inquiryKey, expiresAt, secret)}`;
}

export type DetailsTokenCheck = "ok" | "expired" | "invalid";

export function verifyDetailsToken(
  inquiryKey: string,
  token: string,
  secret: string,
  now = Date.now(),
): DetailsTokenCheck {
  if (!secret) return "invalid";
  const match = /^(\d{10,16})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return "invalid";
  const expiresAt = Number(match[1]);
  const expected = Buffer.from(sign(inquiryKey, expiresAt, secret));
  const given = Buffer.from(match[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  // A token can never be issued for longer than the TTL, so a far-future
  // expiry means it was not issued by this server.
  if (expiresAt > now + DETAILS_TOKEN_TTL_MS) return "invalid";
  return now > expiresAt ? "expired" : "ok";
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => value?.trim() || undefined);

export const detailsBodySchema = z.object({
  inquiryKey: z.string().max(124).regex(/^inq_[A-Za-z0-9_-]{16,120}$/),
  token: z.string().max(200),
  projectType: optionalText(100),
  address: optionalText(300),
  zip: optionalText(20),
  propertyProfile: propertyProfileSchema,
  timing: z.enum(TIMING_CHOICES).optional(),
  bestTime: optionalText(60),
  email: optionalText(254).refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Valid email required",
  }),
  /** Ids returned by /api/consultation/files for this same request. */
  fileIds: z
    .array(z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
    .max(MAX_LEAD_FILES)
    .optional()
    .default([]),
  website: z.string().max(200).optional().default(""),
});

export type DetailsBody = z.infer<typeof detailsBodySchema>;

/** The stored request, as far as details care. */
export interface StoredLead {
  inquiryKey: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  address: string | null;
  city: string | null;
  projectType: string;
  message: string | null;
  propertyProfile: Record<string, unknown> | null;
  createdAt?: Date | null;
}

export type LeadColumnUpdates = Partial<
  Pick<StoredLead, "email" | "zip" | "address" | "city" | "projectType" | "propertyProfile">
>;

export interface DetailsMerge {
  /** Columns that were empty and now get a value. */
  columns: LeadColumnUpdates;
  /** One line per detail the visitor added, as printed in the notes. */
  lines: string[];
  /** Files new to this request's notes. */
  files: LeadFileLink[];
  /** The block appended to the notes, or null when nothing new was sent. */
  block: string | null;
}

const blank = (value: string | null | undefined) => !value || !value.trim();

export function projectLabel(value: string): string {
  return PROJECT_LABEL_LOOKUP[value] ?? value;
}

/**
 * Pure merge: what to fill and what to append. Never overwrites a Step 1
 * answer; never writes a blank.
 */
export function mergeDetails(lead: StoredLead, details: DetailsBody, files: LeadFileLink[]): DetailsMerge {
  const columns: LeadColumnUpdates = {};
  const lines: string[] = [];
  const profile = details.propertyProfile ?? null;
  const city = typeof profile?.city === "string" ? profile.city.trim() : "";
  const zip = details.zip || (typeof profile?.zip === "string" ? profile.zip.trim().slice(0, 10) : "");

  if (details.projectType) {
    lines.push(`Project type: ${projectLabel(details.projectType)}`);
    if (blank(lead.projectType) || lead.projectType === "other") columns.projectType = details.projectType;
  }
  if (details.address) {
    lines.push(`Build site: ${details.address}`);
    if (blank(lead.address)) columns.address = details.address;
  }
  if (zip) {
    if (!details.address?.includes(zip)) lines.push(`ZIP: ${zip}`);
    if (blank(lead.zip)) columns.zip = zip;
  }
  if (city && blank(lead.city)) columns.city = city;
  if (profile && !lead.propertyProfile) columns.propertyProfile = profile as Record<string, unknown>;
  if (details.timing) lines.push(`Timing: ${details.timing}`);
  if (details.bestTime) lines.push(`Best time to call: ${details.bestTime}`);
  if (details.email) {
    if (blank(lead.email)) {
      columns.email = details.email;
      lines.push(`Email: ${details.email}`);
    } else if (details.email.toLowerCase() !== lead.email.trim().toLowerCase()) {
      lines.push(`Other email: ${details.email}`);
    }
  }

  // A file already linked in the notes was forwarded before; list only new ones.
  const notes = lead.message ?? "";
  const newFiles = files.filter((file) => !notes.includes(file.url));
  if (newFiles.length) {
    lines.push(`Files (${newFiles.length}):`);
    for (const file of newFiles) lines.push(`- ${file.name} (${formatFileSize(file.size)}): ${file.url}`);
  }

  return {
    columns,
    lines,
    files: newFiles,
    block: lines.length ? `${DETAILS_MARKER}\n${lines.join("\n")}` : null,
  };
}

/** The stored notes after the append. */
export function appendDetailsBlock(message: string | null, block: string): string {
  return message?.trim() ? `${message}\n\n${block}` : block;
}

/** Stable per block, so a retried CRM forward of the same details is one request. */
export function detailsFingerprint(inquiryKey: string, block: string): string {
  return createHash("sha256").update(`${inquiryKey}\n${block}`).digest("hex").slice(0, 32);
}

export interface DetailsRepository {
  load(inquiryKey: string): Promise<StoredLead | null>;
  /**
   * Fill the empty columns and append the block, atomically and only if the
   * notes do not already contain this exact block. Returns false when another
   * request already applied it.
   */
  apply(inquiryKey: string, columns: LeadColumnUpdates, block: string): Promise<boolean>;
}

export interface DetailsDestinations {
  /** Internal email "Details added: {name}". */
  email(lead: StoredLead, merge: DetailsMerge): Promise<void>;
  /** Lead dashboard (CRM) update. */
  crm(lead: StoredLead, merge: DetailsMerge): Promise<void>;
  /** P5 intake (HubSpot), submission_kind "details". Never throws. */
  p5(lead: StoredLead, merge: DetailsMerge, details: DetailsBody): Promise<void>;
}

export type DetailsOutcome =
  | { status: "saved"; lead: StoredLead; merge: DetailsMerge; delivery: Array<{ channel: string; delivered: boolean }> }
  | { status: "unchanged" }
  | { status: "not-found" };

/**
 * Apply details to a request that the caller has already authorised (token
 * checked). The P5 forward is returned as a promise for the route to keep
 * alive with after(), so the visitor never waits on it.
 */
export async function applyConsultationDetails(
  details: DetailsBody,
  files: LeadFileLink[],
  deps: { repository: DetailsRepository; destinations: DetailsDestinations },
): Promise<{ outcome: DetailsOutcome; background?: Promise<void> }> {
  const lead = await deps.repository.load(details.inquiryKey);
  if (!lead) return { outcome: { status: "not-found" } };
  const merge = mergeDetails(lead, details, files);
  if (!merge.block) return { outcome: { status: "unchanged" } };
  const applied = await deps.repository.apply(details.inquiryKey, merge.columns, merge.block);
  if (!applied) return { outcome: { status: "unchanged" } };

  const merged: StoredLead = {
    ...lead,
    ...merge.columns,
    message: appendDetailsBlock(lead.message, merge.block),
  };
  const run = async (channel: string, send: () => Promise<void>) => {
    try {
      await send();
      return { channel, delivered: true };
    } catch (error) {
      console.error(`[consultation-details] ${channel} delivery failed:`, error instanceof Error ? error.message : error);
      return { channel, delivered: false };
    }
  };
  const delivery = await Promise.all([
    run("adminEmail", () => deps.destinations.email(merged, merge)),
    run("crm", () => deps.destinations.crm(merged, merge)),
  ]);
  const background = deps.destinations.p5(merged, merge, details).catch(() => undefined);
  return { outcome: { status: "saved", lead: merged, merge, delivery }, background };
}

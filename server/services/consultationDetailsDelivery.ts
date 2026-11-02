import { and, eq, sql } from "drizzle-orm";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { consultationRequests } from "@/shared/schema";
import {
  EMAIL_BRAND,
  escapeHtml,
  formatFromAddress,
  getAdminRecipientEmails,
  htmlToPlainText,
  wrapEmailHtml,
} from "@/server/services/emailLayout";
import { formatLeadReplyTo } from "@/server/services/consultationEmail";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { forwardConsultationToP5Intake } from "@/server/services/p5IntakeBridge";
import { buildLeadPropertyRecord } from "@/server/services/leadRecord";
import type { PropertyEnrichment } from "@/server/services/consultationEmail";
import { formatFileSize } from "@/shared/leadFiles";
import {
  DETAILS_MARKER,
  detailsFingerprint,
  projectLabel,
  type DetailsDestinations,
  type DetailsMerge,
  type DetailsRepository,
  type StoredLead,
} from "@/server/services/consultationDetails";

/**
 * The real destinations for "Help us prepare" details: the same three places
 * the request itself went (internal email, lead dashboard, P5 intake for
 * HubSpot), each told plainly that this is an addition to an existing request.
 */

function affectedRowCount(result: unknown): number {
  const count = (result as { rowCount?: unknown } | null)?.rowCount;
  return typeof count === "number" ? count : 0;
}

export async function createDrizzleDetailsRepository(): Promise<DetailsRepository> {
  const { db } = await import("@/lib/db");
  if (!db) throw new Error("Inquiry database is unavailable");
  const database = db;
  return {
    async load(inquiryKey) {
      const rows = await database
        .select({
          inquiryKey: consultationRequests.inquiryKey,
          name: consultationRequests.name,
          phone: consultationRequests.phone,
          email: consultationRequests.email,
          zip: consultationRequests.zip,
          address: consultationRequests.address,
          city: consultationRequests.city,
          projectType: consultationRequests.projectType,
          message: consultationRequests.message,
          propertyProfile: consultationRequests.propertyProfile,
          createdAt: consultationRequests.createdAt,
        })
        .from(consultationRequests)
        .where(eq(consultationRequests.inquiryKey, inquiryKey))
        .limit(1);
      const row = rows[0];
      if (!row?.inquiryKey) return null;
      return { ...row, inquiryKey: row.inquiryKey, propertyProfile: (row.propertyProfile as Record<string, unknown> | null) ?? null };
    },
    async apply(inquiryKey, columns, block) {
      const message = consultationRequests.message;
      const result = await database
        .update(consultationRequests)
        .set({
          ...columns,
          message: sql`CASE WHEN btrim(coalesce(${message}, '')) = '' THEN ${block} ELSE ${message} || ${`\n\n${block}`} END`,
          updatedAt: new Date(),
        } as never)
        .where(and(eq(consultationRequests.inquiryKey, inquiryKey), sql`strpos(coalesce(${message}, ''), ${block}) = 0`));
      return affectedRowCount(result) === 1;
    },
  };
}

export function buildDetailsSubject(lead: StoredLead): string {
  return `Details added: ${lead.name}`;
}

export function buildDetailsEmailHtml(lead: StoredLead, merge: DetailsMerge): string {
  const cell = `padding:8px 0;border-bottom:1px solid ${EMAIL_BRAND.hairline};font-size:14px;vertical-align:top;`;
  const label = `${cell}color:${EMAIL_BRAND.textMuted};width:150px;`;
  const rows = merge.lines
    .filter((line) => !line.startsWith("- ") && !line.startsWith("Files ("))
    .map((line) => {
      const at = line.indexOf(": ");
      return `<tr><td style="${label}">${escapeHtml(line.slice(0, at))}</td><td style="${cell}">${escapeHtml(line.slice(at + 2))}</td></tr>`;
    })
    .join("");
  const files = merge.files
    .map(
      (file) =>
        `<li style="margin:0 0 6px;"><a href="${escapeHtml(file.url)}" style="color:${EMAIL_BRAND.accent};">${escapeHtml(file.name)}</a> <span style="color:${EMAIL_BRAND.textMuted};">(${escapeHtml(formatFileSize(file.size))})</span></li>`,
    )
    .join("");
  const tel = `tel:${lead.phone.replace(/[^\d+]/g, "")}`;
  return wrapEmailHtml({
    title: "Details added",
    subtitle: lead.name,
    content: `
      <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.text};line-height:1.6;">
        ${escapeHtml(lead.name)} added details to the request they already sent. This is the same lead, not a new one.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-collapse:collapse;">
        <tr><td style="${label}">Name</td><td style="${cell}">${escapeHtml(lead.name)}</td></tr>
        <tr><td style="${label}">Phone</td><td style="${cell}"><a href="${escapeHtml(tel)}" style="color:${EMAIL_BRAND.accent};">${escapeHtml(lead.phone)}</a></td></tr>
        ${rows}
      </table>
      ${files ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">Files</p><ul style="margin:0 0 20px;padding-left:18px;font-size:14px;">${files}</ul>` : ""}
      <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.textMuted};">Request id ${escapeHtml(lead.inquiryKey)}. File links open the stored copy on ${escapeHtml(SITE_CONFIG.siteUrl.replace(/^https?:\/\//, ""))}.</p>
    `,
  });
}

export function buildDetailsCrmPayload(lead: StoredLead, merge: DetailsMerge) {
  const block = merge.block ?? DETAILS_MARKER;
  return {
    fullName: lead.name,
    email: lead.email,
    phone: lead.phone || undefined,
    propertyAddress: lead.address || undefined,
    city: lead.city || undefined,
    zip: lead.zip || undefined,
    projectTypes: lead.projectType ? [projectLabel(lead.projectType)] : [],
    // The dashboard keeps the visitor's words in finalNotes; the details block
    // is the news, and the full notes (request plus every block) ride in the
    // larger estimateSummary field.
    finalNotes: block,
    estimateSummary: `${DETAILS_MARKER} for request ${lead.inquiryKey}\n\n${lead.message ?? ""}`.trim(),
    property: lead.propertyProfile
      ? buildLeadPropertyRecord(lead.propertyProfile as unknown as PropertyEnrichment)
      : undefined,
    source: "boiseconstruction.co",
  };
}

export const detailsDestinations: DetailsDestinations = {
  async email(lead, merge) {
    const { client } = await getUncachableEmailClient();
    const html = buildDetailsEmailHtml(lead, merge);
    for (const to of await getAdminRecipientEmails(SITE_CONFIG.email)) {
      const result = await client.emails.send(
        {
          from: formatFromAddress(),
          replyTo: lead.email ? formatLeadReplyTo(lead.name, lead.email) : undefined,
          to,
          subject: buildDetailsSubject(lead),
          html,
          text: htmlToPlainText(html),
        },
        { idempotencyKey: `consultation-details-${detailsFingerprint(lead.inquiryKey, merge.block ?? "")}-${to}` },
      );
      if (result?.error) throw new Error(`Details email failed: ${result.error.message}`);
    }
  },
  async crm(lead, merge) {
    const result = await forwardToLeadDashboard(buildDetailsCrmPayload(lead, merge), {
      idempotencyKey: `crm-details:${lead.inquiryKey}:${detailsFingerprint(lead.inquiryKey, merge.block ?? "")}`,
    });
    if (!result.delivered) throw new Error(result.error || "CRM delivery failed");
  },
  async p5(lead, merge, details) {
    await forwardConsultationToP5Intake({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: details.address ?? null,
      city: lead.city,
      zip: details.zip ?? null,
      projectType: details.projectType ?? null,
      message: merge.block,
      inquiryKey: lead.inquiryKey,
      submissionKind: "details",
      bestTime: details.bestTime ?? null,
      timeline: details.timing ?? null,
      files: merge.files,
    });
  },
};

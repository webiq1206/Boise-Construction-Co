import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  escapeHtml,
  wrapEmailHtml,
  htmlToPlainText,
  getAdminRecipientEmails,
  formatFromAddress,
  getReplyToAddress,
} from "@/server/services/emailLayout";
import type { PropertyProfile } from "@/shared/propertyProfile";

const propertyProfileSchema = z
  .object({
    formattedAddress: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  })
  .passthrough()
  .optional()
  .nullable();

const bodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().min(5),
  zip: z.string().optional(),
  projectType: z.string().min(1),
  message: z.string().optional(),
  propertyProfile: propertyProfileSchema,
  estimate: z
    .object({
      project: z.string(),
      finish: z.string(),
      priceLow: z.number(),
      priceHigh: z.number(),
      roi: z.number(),
    })
    .optional()
    .nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (db) {
      try {
        const profile = data.propertyProfile as Record<string, unknown> | null | undefined;
        await db.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          address: data.address,
          city: (profile?.city as string) || null,
          propertyProfile: (data.propertyProfile as PropertyProfile | null) ?? null,
          projectType: data.projectType,
          message: data.message || null,
          estimateProject: data.estimate?.project || null,
          estimateFinish: data.estimate?.finish || null,
          estimateLow: data.estimate?.priceLow?.toString() || null,
          estimateHigh: data.estimate?.priceHigh?.toString() || null,
        });
      } catch (dbErr) {
        console.error("[consultation] DB insert failed:", dbErr);
      }
    }

    try {
      const { client, fromEmail } = await getUncachableEmailClient();
      const from = formatFromAddress(fromEmail);

      const estimateBlock = data.estimate
        ? `<p><strong>Calculator estimate:</strong> ${escapeHtml(data.estimate.project)} (${escapeHtml(data.estimate.finish)}): $${Math.round(data.estimate.priceLow / 1000)}k to $${Math.round(data.estimate.priceHigh / 1000)}k</p>`
        : "";

      const profile = data.propertyProfile as {
        parcelId?: string;
        squareFootage?: number;
        lotSizeSqFt?: number;
        permittingAuthority?: string;
        jurisdiction?: string;
      } | null | undefined;
      const propertyBlock = profile
        ? `<div class="highlight-box" style="margin-top:12px;">
            <p><strong>Property (auto-enriched):</strong></p>
            <p style="margin-top:6px;">${escapeHtml(data.address)}</p>
            ${profile.parcelId ? `<p>Parcel: ${escapeHtml(profile.parcelId)}</p>` : ""}
            ${profile.squareFootage ? `<p>~${profile.squareFootage.toLocaleString()} sq ft</p>` : ""}
            ${profile.lotSizeSqFt ? `<p>Lot: ${profile.lotSizeSqFt.toLocaleString()} sq ft</p>` : ""}
            ${profile.permittingAuthority ? `<p>Permits: ${escapeHtml(profile.permittingAuthority)}</p>` : ""}
          </div>`
        : `<p><strong>Address:</strong> ${escapeHtml(data.address)}</p>`;

      const adminHtml = wrapEmailHtml({
        title: "New Consultation Request",
        subtitle: escapeHtml(data.name),
        content: `
          <table class="info-table">
            <tr><td class="label">Name:</td><td class="value">${escapeHtml(data.name)}</td></tr>
            <tr><td class="label">Phone:</td><td class="value"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></td></tr>
            <tr><td class="label">Email:</td><td class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
            <tr><td class="label">ZIP:</td><td class="value">${escapeHtml(data.zip || "")}</td></tr>
            <tr><td class="label">Project:</td><td class="value">${escapeHtml(data.projectType)}</td></tr>
          </table>
          ${propertyBlock}
          ${estimateBlock}
          <div class="highlight-box">
            <p><strong>Message:</strong></p>
            <p style="margin-top:8px;">${escapeHtml(data.message || "(none)")}</p>
          </div>
          <p style="font-size:12px;color:#888;margin-top:16px;">Submitted via ${escapeHtml(SITE_CONFIG.siteUrl)}</p>
        `,
      });

      const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
      for (const adminEmail of adminEmails) {
        const adminResult = await client.emails.send({
          from,
          replyTo: getReplyToAddress(),
          to: adminEmail,
          subject: `New consultation request: ${data.name}`,
          html: adminHtml,
          text: htmlToPlainText(adminHtml),
        });
        if (adminResult?.error) {
          console.error(
            `[consultation] Admin email to ${adminEmail} failed:`,
            JSON.stringify(adminResult.error)
          );
        }
      }

      const customerHtml = wrapEmailHtml({
        title: `Thanks, ${escapeHtml(data.name)}!`,
        subtitle: "We received your consultation request",
        content: `
          <p class="greeting">We received your consultation request and will reach out within one business day to schedule your free in-home visit.</p>
          <p>In the meantime, feel free to call us at <a href="${SITE_CONFIG.phoneHref}">${escapeHtml(SITE_CONFIG.phone)}</a>, <a href="${SITE_CONFIG.phoneSmsHref}">send us a text</a>, or reply to this email with any questions.</p>
          <p style="margin-top:24px;">The Boise Remodeling Co team</p>
        `,
      });

      const customerResult = await client.emails.send({
        from,
        replyTo: getReplyToAddress(),
        to: data.email,
        subject: "We received your request | Boise Remodeling Co",
        html: customerHtml,
        text: htmlToPlainText(customerHtml),
      });
      if (customerResult?.error) {
        console.error(
          `[consultation] Customer email to ${data.email} failed:`,
          JSON.stringify(customerResult.error)
        );
      }
    } catch (emailErr) {
      console.error("[consultation] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[consultation] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

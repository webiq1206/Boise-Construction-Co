import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  htmlToPlainText,
  getAdminRecipientEmails,
  formatFromAddress,
  getReplyToAddress,
} from "@/server/services/emailLayout";
import {
  buildAdminEmailHtml,
  buildCustomerEmailHtml,
  buildAdminSubject,
  buildCustomerSubject,
  formatLeadReplyTo,
  type VerifiedEstimate,
  type PropertyEnrichment,
} from "@/server/services/consultationEmail";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getProjectSizeConfig,
  getSetRefinementKeys,
  type EstimateRefinements,
} from "@/shared/estimateEngine";

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

const refinementsSchema = z
  .object({
    layoutChanges: z.enum(["none", "moderate", "major"]).nullable().optional(),
    plumbingElectrical: z.enum(["cosmetic", "partial", "full"]).nullable().optional(),
    cabinetTier: z.enum(["standard", "semi-custom", "custom"]).nullable().optional(),
    fixtureCount: z.number().int().min(1).max(8).nullable().optional(),
    stories: z.number().int().min(1).max(2).nullable().optional(),
    roomCount: z.number().int().min(1).max(12).nullable().optional(),
    aduConfig: z.enum(["detached", "attached"]).nullable().optional(),
  })
  .optional()
  .nullable();

const estimateSchema = z
  .object({
    project: z.enum(["kitchen", "bathroom", "whole-home", "addition", "adu", "basement"]),
    finish: z.enum(["refresh", "mid-range", "high-end", "luxury"]),
    sqft: z.number().int().positive(),
    priceLow: z.number().nonnegative(),
    priceHigh: z.number().nonnegative(),
    roi: z.number(),
    confidence: z.string().max(80).optional(),
    refinements: refinementsSchema,
  })
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
  estimate: estimateSchema,
});

/**
 * Recomputes the planning range server-side from the submitted inputs so a
 * stored lead never carries client-tampered or stale numbers. Returns null
 * (estimate rejected) if the inputs themselves are out of bounds.
 */
function verifyEstimate(
  estimate: NonNullable<z.infer<typeof estimateSchema>>
): VerifiedEstimate | null {
  const sizeConfig = getProjectSizeConfig(estimate.project);
  if (estimate.sqft < sizeConfig.min || estimate.sqft > sizeConfig.max) {
    return null;
  }

  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(estimate.refinements ?? {}),
  } as EstimateRefinements;

  const recomputed = calculateEstimate(
    {
      project: estimate.project,
      finish: estimate.finish,
      sqft: estimate.sqft,
      refinements,
    },
    countVisibleUserRefinements(estimate.project, getSetRefinementKeys(refinements))
  );

  if (
    estimate.priceLow !== recomputed.priceLow ||
    estimate.priceHigh !== recomputed.priceHigh
  ) {
    console.warn(
      `[consultation] Estimate mismatch (client ${estimate.priceLow}-${estimate.priceHigh}, server ${recomputed.priceLow}-${recomputed.priceHigh}); using server values`
    );
  }

  return {
    project: estimate.project,
    finish: estimate.finish,
    sqft: estimate.sqft,
    priceLow: recomputed.priceLow,
    priceHigh: recomputed.priceHigh,
    roi: recomputed.roi,
    confidence: estimate.confidence || recomputed.confidenceLabel,
    refinements,
    included: recomputed.included,
  };
}

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

    // Server-side verification: never trust client-supplied dollar amounts.
    const estimate = data.estimate ? verifyEstimate(data.estimate) : null;

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
          estimateProject: estimate?.project || null,
          estimateFinish: estimate?.finish || null,
          estimateLow: estimate?.priceLow?.toString() || null,
          estimateHigh: estimate?.priceHigh?.toString() || null,
          estimateSqft: estimate?.sqft ?? null,
          estimateConfidence: estimate?.confidence || null,
        });
      } catch (dbErr) {
        console.error("[consultation] DB insert failed:", dbErr);
      }
    }

    try {
      const { client, fromEmail } = await getUncachableEmailClient();
      const from = formatFromAddress(fromEmail);

      const lead = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        zip: data.zip,
        projectType: data.projectType,
        message: data.message,
      };
      const enrichment = (data.propertyProfile as PropertyEnrichment | null) ?? null;

      // ---- Admin / internal-team email --------------------------------------
      // Reply-To is the LEAD, so hitting Reply in any mail client goes straight
      // to the customer.
      const adminHtml = buildAdminEmailHtml(lead, estimate, enrichment);
      const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
      for (const adminEmail of adminEmails) {
        const adminResult = await client.emails.send({
          from,
          replyTo: formatLeadReplyTo(data.name, data.email),
          to: adminEmail,
          subject: buildAdminSubject(lead, estimate),
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

      // ---- Customer / lead email --------------------------------------------
      // Includes the full estimate + every selection so the lead has it in
      // writing without ever logging in.
      const customerHtml = buildCustomerEmailHtml(lead, estimate);
      const customerResult = await client.emails.send({
        from,
        replyTo: getReplyToAddress(),
        to: data.email,
        subject: buildCustomerSubject(lead, estimate),
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

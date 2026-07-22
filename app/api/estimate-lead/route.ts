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
} from "@/server/services/consultationEmail";
import {
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getProjectSizeConfig,
  getSetRefinementKeys,
  PROJECT_LABELS,
  type EstimateRefinements,
} from "@/shared/estimateEngine";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import type { PropertyProfile } from "@/shared/propertyProfile";
import { buildLeadEstimateRecord, buildLeadNotes } from "@/server/services/leadRecord";
import { formatUsd, type PropertyEnrichment } from "@/server/services/consultationEmail";

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

const estimateSchema = z.object({
  project: z.enum(["kitchen", "bathroom", "whole-home", "addition", "adu", "basement"]),
  finish: z.enum(["refresh", "mid-range", "high-end", "luxury"]),
  sqft: z.number().int().positive(),
  priceLow: z.number().nonnegative(),
  priceHigh: z.number().nonnegative(),
  roi: z.number(),
  refinements: refinementsSchema,
  // The visitor-facing labels for the layout card and upgrade chips they chose.
  // Length-capped and escaped at render so the emails can restate every
  // selection verbatim without trusting the client.
  layoutLabel: z.string().max(60).optional(),
  upgradeLabels: z.array(z.string().max(40)).max(12).optional(),
});

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  budget: z.string().min(1).optional(),
  projectType: z.string().min(1),
  // Property address. Optional in the schema so an older client that predates
  // this field still submits successfully rather than 400ing, but the gate now
  // requires it, and the team needs it to confirm service area.
  address: z.string().max(300).optional(),
  zip: z.string().max(10).optional(),
  propertyProfile: z
    .object({ formattedAddress: z.string(), city: z.string(), state: z.string(), zip: z.string() })
    .passthrough()
    .optional()
    .nullable(),
  estimate: estimateSchema,
});

function verifyEstimate(
  estimate: z.infer<typeof estimateSchema>
): VerifiedEstimate | null {
  const sizeConfig = getProjectSizeConfig(estimate.project);
  if (estimate.sqft < sizeConfig.min || estimate.sqft > sizeConfig.max) return null;

  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(estimate.refinements ?? {}),
  } as EstimateRefinements;

  const recomputed = calculateEstimate(
    { project: estimate.project, finish: estimate.finish, sqft: estimate.sqft, refinements },
    countVisibleUserRefinements(estimate.project, getSetRefinementKeys(refinements))
  );

  if (
    estimate.priceLow !== recomputed.priceLow ||
    estimate.priceHigh !== recomputed.priceHigh
  ) {
    console.warn(
      `[estimate-lead] Estimate mismatch (client ${estimate.priceLow}-${estimate.priceHigh}, server ${recomputed.priceLow}-${recomputed.priceHigh}); using server values`
    );
  }

  return {
    project: estimate.project,
    finish: estimate.finish,
    sqft: estimate.sqft,
    priceLow: recomputed.priceLow,
    priceHigh: recomputed.priceHigh,
    roi: recomputed.roi,
    confidence: recomputed.confidenceLabel,
    refinements,
    included: recomputed.included,
    layoutLabel: estimate.layoutLabel,
    upgradeLabels: estimate.upgradeLabels,
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
    const estimate = verifyEstimate(data.estimate);

    if (db) {
      try {
        await db.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          address: data.address || "",
          city: (data.propertyProfile as { city?: string } | null)?.city || null,
          propertyProfile: (data.propertyProfile as PropertyProfile | null) ?? null,
          projectType: data.projectType,
          message: data.budget
            ? `Submitted via estimate gate | Budget: ${data.budget}`
            : "Submitted via estimate gate",
          estimateProject: estimate?.project || null,
          estimateFinish: estimate?.finish || null,
          estimateLow: estimate?.priceLow?.toString() || null,
          estimateHigh: estimate?.priceHigh?.toString() || null,
          estimateSqft: estimate?.sqft ?? null,
          estimateConfidence: estimate?.confidence || null,
        });
      } catch (dbErr) {
        console.error("[estimate-lead] DB insert failed:", dbErr);
      }
    }

    // The CRM gets exactly what the homeowner saw: every selection, the range,
    // the scope, the assumptions and the disclaimers, both as structured fields
    // and as readable notes. Built from the same helpers the emails render from,
    // so the two records cannot drift apart.
    const crmLead = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address || "",
      zip: data.zip,
      projectType: data.projectType,
      budget: data.budget,
    };
    const crmProfile = (data.propertyProfile as PropertyEnrichment | null) ?? null;

    forwardToLeadDashboard({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      // Field names must match the dashboard's externalLeadSchema exactly; it
      // strips anything it does not recognise rather than erroring.
      propertyAddress: data.address || undefined,
      city: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.city || undefined,
      state: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.state || undefined,
      zip: data.zip || (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.zip || undefined,
      projectTypes: data.projectType ? [data.projectType] : [],
      budgetRange: data.budget || undefined,
      projectScope: estimate
        ? `${PROJECT_LABELS[estimate.project].label} - ${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)} (${estimate.confidence})`
        : undefined,
      // The homeowner's own words stay in finalNotes; the estimate record goes
      // to estimateSummary, which the dashboard sizes for it (20k vs 2k).
      finalNotes: undefined,
      estimate: estimate ? buildLeadEstimateRecord(estimate) : undefined,
      estimateSummary: buildLeadNotes(crmLead, estimate, crmProfile),
      estimateLow: estimate?.priceLow,
      estimateHigh: estimate?.priceHigh,
      estimateRange: estimate
        ? `${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)}`
        : undefined,
      source: "boiseremodeling.co",
    });

    try {
      const { client, fromEmail } = await getUncachableEmailClient();
      const from = formatFromAddress(fromEmail);

      const lead = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address || "",
        zip: data.zip,
        projectType: data.projectType,
        budget: data.budget,
      };

      const adminHtml = buildAdminEmailHtml(lead, estimate);
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
            `[estimate-lead] Admin email to ${adminEmail} failed:`,
            JSON.stringify(adminResult.error)
          );
        }
      }

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
          `[estimate-lead] Customer email to ${data.email} failed:`,
          JSON.stringify(customerResult.error)
        );
      }
    } catch (emailErr) {
      console.error("[estimate-lead] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[estimate-lead] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
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
  formatUsd,
} from "@/server/services/consultationEmail";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getProjectSizeConfig,
  getSetRefinementKeys,
  PROJECT_LABELS,
  type EstimateRefinements,
} from "@/shared/estimateEngine";
import { estimateSchema } from "@/shared/estimatePayload";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { readUnitCostOverrides } from "@/server/services/unitCostOverrides";
import { createDrizzleInquiryIntake } from "@/server/services/inquiryIntake";
import { deliverInquiryChannel, type InquiryDeliveryResult } from "@/server/services/inquiryDelivery";
import { inspectLeadTrap, LeadRequestError, readBoundedJson } from "@/server/services/leadRequestGuard";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import {
  buildCrmIntakeFields,
  buildLeadPropertyRecord,
  buildLeadEstimateRecord,
  buildLeadNotes,
  resolveBudgetRange,
  buildProjectGoals,
} from "@/server/services/leadRecord";

const propertyProfileSchema = z
  .object({
    formattedAddress: z.string().max(300),
    city: z.string().max(120),
    state: z.string().max(60),
    zip: z.string().max(20),
  })
  .passthrough()
  .optional()
  .nullable();

// The consultation form may arrive with no estimate at all (someone who came
// straight to the contact page), so the shared object is wrapped as optional.
const optionalEstimateSchema = estimateSchema.optional().nullable();

const bodySchema = z
  .object({
    name: z.string().min(2).max(120),
    /**
     * Only the visitor's chosen contact method is required (see superRefine
     * below) - matches the same preferred-contact pattern already shipped in
     * the RE-10 wizard. Defaults to "email" so older cached client bundles
     * that never send this field behave exactly as before (email required).
     */
    preferredContact: z.enum(["email", "phone", "text"]).optional().default("email"),
    phone: z.string().max(50).optional().default(""),
    email: z.string().max(254).optional().default(""),
    /**
     * Optional because a new-build enquiry from someone who has not bought land
     * yet has no site to name. The client requires a locatable site for every
     * other project type; see LAND_SEARCH_PROJECT_TYPE in ConsultationForm.
     */
    address: z.string().max(300).optional().default(""),
    zip: z.string().max(20).optional(),
    projectType: z.string().min(1).max(100),
    message: z.string().max(5_000).optional(),
    propertyProfile: propertyProfileSchema,
    estimate: optionalEstimateSchema,
    inquiryKey: z.string().max(124).regex(/^inq_[A-Za-z0-9_-]{16,120}$/).optional(),
    submissionKind: z.enum(["initial", "followup"]).optional().default("initial"),
    formStartedAt: z.number().finite().int(),
    website: z.string().max(200).optional().default(""),
    /* Set by the client when the visitor already submitted the estimate gate,
       which already sent admin + customer emails via /api/estimate-lead.
       Prevents duplicate email sends when the same person submits both forms. */
    skipEmail: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.preferredContact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Valid email required" });
      }
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Valid phone required" });
    }
  });

function deliveryRevisionKey(
  data: z.infer<typeof bodySchema>,
  estimate: VerifiedEstimate | null,
): string {
  // This deliberately excludes contact fields and message text. It identifies
  // the server-priced scope, plus only the shape of the visitor's note.
  const message = data.message?.trim() ?? "";
  const shape = {
    projectType: data.projectType,
    message: { length: message.length, lines: message ? message.split(/\r?\n/).length : 0 },
    estimate: estimate
      ? {
        project: estimate.project,
        finish: estimate.finish,
        sqft: estimate.sqft,
        priceLow: estimate.priceLow,
        priceHigh: estimate.priceHigh,
        roi: estimate.roi,
        confidence: estimate.confidence,
        statedBudget: estimate.statedBudget,
        refinements: estimate.refinements,
        included: estimate.included,
        layoutLabel: estimate.layoutLabel,
        upgradeLabels: estimate.upgradeLabels,
      }
      : null,
  };
  return createHash("sha256").update(JSON.stringify(shape)).digest("hex");
}

function resendIdempotencyKey(
  inquiryKey: string,
  revisionKey: string,
  channel: string,
  recipient: string,
): string {
  return `consultation-${createHash("sha256")
    .update(`${inquiryKey}:${revisionKey}:${channel}:${recipient}`)
    .digest("hex")}`;
}

/**
 * Recomputes the planning range server-side from the submitted inputs so a
 * stored lead never carries client-tampered or stale numbers. Returns null
 * (estimate rejected) if the inputs themselves are out of bounds.
 */
function verifyEstimate(
  estimate: NonNullable<z.infer<typeof optionalEstimateSchema>>
): VerifiedEstimate | null {
  const sizeConfig = getProjectSizeConfig(estimate.project);
  if (estimate.sqft < sizeConfig.min || estimate.sqft > sizeConfig.max) {
    return null;
  }

  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(estimate.refinements ?? {}),
  } as EstimateRefinements;

  const detailCount = countVisibleUserRefinements(estimate.project, getSetRefinementKeys(refinements));
  const guide = calculateEstimate(
    {
      project: estimate.project,
      finish: estimate.finish,
      sqft: estimate.sqft,
      refinements,
    },
    detailCount
  );
  // The quoted range comes from the line-item cost engine, via the same shared
  // resolver the calculator uses, so the page and the email can never disagree.
  const maxFields = getMaxRefinementFields(estimate.project);
  const lineItemRange = resolveQuotedRange(
    estimate.project,
    estimate.finish,
    estimate.sqft,
    refinements,
    maxFields > 0 ? detailCount / maxFields : 0,
  );
  const recomputed = { ...guide, ...(lineItemRange ?? {}) };

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
    statedBudget: estimate.statedBudget ?? null,
    refinements,
    included: recomputed.included,
    layoutLabel: estimate.layoutLabel,
    upgradeLabels: estimate.upgradeLabels,
  };
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKeyFrom(request.headers, "consultation"), 6, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const raw = await readBoundedJson(request);
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const trap = inspectLeadTrap(data);
    if (trap === "honeypot") {
      // Pretend success so bots do not get feedback, while avoiding all work.
      return NextResponse.json({ success: true, accepted: false });
    }
    if (trap === "too-fast") {
      return NextResponse.json({ message: "Please wait before submitting" }, { status: 429 });
    }

    // Server-side verification: never trust client-supplied dollar amounts.
    const estimate = data.estimate ? verifyEstimate(data.estimate) : null;
    const revisionKey = deliveryRevisionKey(data, estimate);
    const profile = data.propertyProfile as Record<string, unknown> | null | undefined;

    // Persistence is the admission control: no provider is contacted until the
    // inquiry and its channel state have been durably recorded.
    let intakeResult;
    let intake;
    try {
      intake = createDrizzleInquiryIntake();
      intakeResult = await intake.intake({
        inquiryKey: data.inquiryKey,
        flow: "consultation",
        submissionKind: data.submissionKind,
        deliveryRevisionKey: revisionKey,
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          address: data.address,
          city: (profile?.city as string) || null,
          ...(data.propertyProfile
            ? { propertyProfile: data.propertyProfile as unknown as PropertyProfile }
            : {}),
          projectType: data.projectType,
          message: data.message || null,
          ...(estimate
            ? {
                estimateProject: estimate.project,
                estimateFinish: estimate.finish,
                estimateLow: estimate.priceLow.toString(),
                estimateHigh: estimate.priceHigh.toString(),
                estimateSqft: estimate.sqft,
                estimateConfidence: estimate.confidence,
              }
            : {}),
        },
      });
    } catch (dbErr) {
      console.error("[consultation] Durable intake failed:", dbErr);
      return NextResponse.json({ message: "Inquiry service is temporarily unavailable" }, { status: 503 });
    }

    // Followups update the existing inquiry without changing its delivery state.
    if (data.submissionKind === "followup" && !intakeResult.inserted) {
      return NextResponse.json({
        success: true,
        accepted: true,
        inquiryKey: intakeResult.inquiryKey,
        conversionId: intakeResult.conversionId,
        newInquiry: intakeResult.inserted,
        conversionEligible: intakeResult.conversionEligible,
        delivery: [],
      });
    }

    // Same complete record as the estimate-gate path, so a lead looks identical
    // in the CRM regardless of which form produced it. Address may be empty when
    // the enquiry is from someone still shopping for a lot.
    const crmLead = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      zip: data.zip,
      projectType: data.projectType,
      message: data.message,
    };
    const crmProfile = (data.propertyProfile as PropertyEnrichment | null) ?? null;
    // Share this between the claimed channels so every destination uses the
    // same current pricing. A failure is persisted on each claimed channel.
    const unitCostOverrides = readUnitCostOverrides();
    const lead = {
      name: data.name, phone: data.phone, email: data.email, address: data.address,
      zip: data.zip, projectType: data.projectType, message: data.message,
    };
    const claimedRevisionKey =
      data.submissionKind === "followup" ? null : revisionKey;
    const delivery: InquiryDeliveryResult[] = await Promise.all([
      deliverInquiryChannel(intake, {
        inquiryKey: intakeResult.inquiryKey, revisionKey: claimedRevisionKey, channel: "crm",
        deliver: async () => {
          const costs = await unitCostOverrides;
          const result = await forwardToLeadDashboard({
      fullName: data.name, email: data.email, phone: data.phone,
      // Field names must match the dashboard's externalLeadSchema exactly; it
      // strips anything it does not recognise rather than erroring.
      propertyAddress: data.address || undefined,
      city: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.city || undefined,
      state: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.state || undefined,
      zip: data.zip || (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.zip || undefined,
      projectTypes: data.projectType ? [data.projectType] : [],
      budgetRange: resolveBudgetRange(undefined, estimate),
      projectScope: estimate
        ? `${PROJECT_LABELS[estimate.project].label} - ${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)} (${estimate.confidence})`
        : undefined,
      projectGoals: buildProjectGoals(estimate),
      // The homeowner's own words stay in finalNotes; the estimate record goes
      // to estimateSummary, which the dashboard sizes for it (20k vs 2k).
      finalNotes: data.message || undefined,
      estimate: estimate ? buildLeadEstimateRecord(estimate, costs) : undefined,
      // Zoning, lot size, assessed value, owner and occupancy as structured
      // fields, alongside the same rows the admin email renders.
      property: buildLeadPropertyRecord(crmProfile),
      // Structured intake fields the estimator can answer. See
      // buildCrmIntakeFields for why the rest stay deliberately empty.
      ...buildCrmIntakeFields(estimate),
      estimateSummary: buildLeadNotes(crmLead, estimate, crmProfile, costs),
      estimateLow: estimate?.priceLow,
      estimateHigh: estimate?.priceHigh,
      estimateRange: estimate
        ? `${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)}`
        : undefined,
      source: "boiseconstruction.co",
          }, {
            idempotencyKey: `crm:${intakeResult.inquiryKey}:${revisionKey}`,
          });
          if (!result.delivered) throw new Error(result.error || "CRM delivery failed");
        },
      }),
      deliverInquiryChannel(intake, {
        inquiryKey: intakeResult.inquiryKey, revisionKey: claimedRevisionKey, channel: "adminEmail",
        deliver: async () => {
          const costs = await unitCostOverrides;
        const { client, fromEmail } = await getUncachableEmailClient();
        const from = formatFromAddress(fromEmail);
        const enrichment = (data.propertyProfile as PropertyEnrichment | null) ?? null;
        const adminHtml = buildAdminEmailHtml(lead, estimate, enrichment, costs);
        const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
        for (const adminEmail of adminEmails) {
          const adminResult = await client.emails.send({
            from,
            // No reply-to-the-lead shortcut when they didn't leave an email -
            // the admin email body still shows their preferred contact method.
            replyTo: data.email ? formatLeadReplyTo(data.name, data.email) : undefined,
            to: adminEmail,
            subject: buildAdminSubject(lead, estimate),
            html: adminHtml,
            text: htmlToPlainText(adminHtml),
          }, { idempotencyKey: resendIdempotencyKey(intakeResult.inquiryKey, revisionKey, "admin", adminEmail) });
          if (adminResult?.error) {
            throw new Error(`Admin email failed: ${adminResult.error.message}`);
          }
        }
        },
      }),
      ...(data.email ? [deliverInquiryChannel(intake, {
        inquiryKey: intakeResult.inquiryKey, revisionKey: claimedRevisionKey, channel: "customerEmail",
        deliver: async () => {
          const costs = await unitCostOverrides;
          const { client, fromEmail } = await getUncachableEmailClient();
          const customerHtml = buildCustomerEmailHtml(lead, estimate, costs);
          const customerResult = await client.emails.send({
            from: formatFromAddress(fromEmail),
            replyTo: getReplyToAddress(),
            to: data.email,
            subject: buildCustomerSubject(lead, estimate),
            html: customerHtml,
            text: htmlToPlainText(customerHtml),
          }, { idempotencyKey: resendIdempotencyKey(intakeResult.inquiryKey, revisionKey, "customer", data.email) });
          if (customerResult?.error) {
            throw new Error(`Customer email failed: ${customerResult.error.message}`);
          }
        },
      })] : []),
    ]);

    return NextResponse.json({
      success: true,
      accepted: true,
      inquiryKey: intakeResult.inquiryKey,
      conversionId: intakeResult.conversionId,
      newInquiry: intakeResult.inserted,
      conversionEligible: intakeResult.conversionEligible,
      delivery: delivery.map(({ channel, attempted, delivered }) => ({ channel, attempted, delivered })),
    });
  } catch (err) {
    if (err instanceof LeadRequestError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    console.error("[consultation] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

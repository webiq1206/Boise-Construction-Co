import { NextRequest, NextResponse, after } from "next/server";
import {appendAttributionEvidence} from '@/lib/leadAttribution';
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
  buildCustomerEmailText,
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
import {
  consultationBodySchema,
  optionalEstimateSchema,
} from "@/server/services/consultationRequest";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { readUnitCostOverrides } from "@/server/services/unitCostOverrides";
import { createDrizzleInquiryIntake } from "@/server/services/inquiryIntake";
import { deliverInquiryChannel, type InquiryDeliveryResult } from "@/server/services/inquiryDelivery";
import { forwardConsultationToP5Intake, type P5BridgeResult } from "@/server/services/p5IntakeBridge";
import { buildConsultationInternalNotes, buildConsultationTeamNotes } from "@/server/services/consultationTeamNotes";
import { sendSiteTeamEmail } from "@/server/services/siteTeamEmail";
import { issueDetailsToken } from "@/server/services/consultationDetails";
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

// The body schema lives in server/services/consultationRequest.ts so the full
// request and the "have us call you" callback shape are tested without a database.
const bodySchema = consultationBodySchema;

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

function detailsTokenFor(inquiryKey: string): string | undefined {
  try {
    return issueDetailsToken(inquiryKey, process.env.SESSION_SECRET ?? "");
  } catch {
    return undefined;
  }
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
          ...(data.propertyProfile || data.attribution
            ? { propertyProfile: {...data.propertyProfile,_leadAttribution:data.attribution} as unknown as PropertyProfile }
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
        detailsToken: detailsTokenFor(intakeResult.inquiryKey),
        delivery: [],
      });
    }

    const crmProfile = (data.propertyProfile as PropertyEnrichment | null) ?? null;

    // HubSpot contact, mapped deal, and the P5 team email live on p5 intake.
    // Only a newly inserted consultation reaches this block. Honeypot,
    // too-fast, intake failure, and the followup-only return above do not.
    let bridge: Promise<P5BridgeResult> | null = null;
    if (intakeResult.inserted) {
      // Started before the deliveries so it overlaps them, and kept alive with
      // after(). The visitor response, the local save, the customer email and
      // the lead-dashboard forward never wait on it and cannot be changed by
      // it. Only this site's own team email waits for its result, further
      // down, and that wait is inside after() too.
      const location = (data.propertyProfile as { city?: string; zip?: string } | null) ?? null;
      // What this site's team email shows and the fields below do not, in two
      // lists (see consultationTeamNotes.ts). teamNotes is printed under "From
      // the website" and never carries a cost, margin or other internal
      // figure: a "New lead" email is copied into HubSpot. teamInternalNotes
      // is the internal breakdown for a request with a planning range,
      // printed under "Internal pricing" in an email P5 does not copy there.
      let teamNotes: string[] = [];
      let teamInternalNotes: string[] = [];
      try {
        teamNotes = buildConsultationTeamNotes({ estimate, profile: crmProfile, attribution: data.attribution });
        teamInternalNotes = buildConsultationInternalNotes({ estimate });
      } catch (notesErr) {
        console.error("[p5-intake] Team notes could not be built:", notesErr);
      }
      const forwarding = forwardConsultationToP5Intake({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: location?.city,
        zip: data.zip || location?.zip,
        projectType: data.projectType,
        message: data.message,
        inquiryKey: intakeResult.inquiryKey,
        submissionKind: "initial",
        requestKind: data.requestKind,
        preferredContact: data.preferredContact,
        bestTime: data.requestKind === "callback" ? data.bestTimeToCall : undefined,
        teamNotes,
        teamInternalNotes,
      });
      bridge = forwarding;
      try {
        after(() => forwarding);
      } catch (bridgeErr) {
        console.error("[p5-intake] Could not schedule HubSpot bridge:", bridgeErr);
      }
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
      preferredContact: data.preferredContact,
      requestKind: data.requestKind,
    };
    // Share this between the claimed channels so every destination uses the
    // same current pricing. A failure is persisted on each claimed channel.
    const unitCostOverrides = readUnitCostOverrides();
    const lead = {
      name: data.name, phone: data.phone, email: data.email, address: data.address,
      zip: data.zip, projectType: data.projectType, message: data.message,
      preferredContact: data.preferredContact, requestKind: data.requestKind,
    };
    const claimedRevisionKey =
      data.submissionKind === "followup" ? null : revisionKey;

    // One team email per request (owner decision, 17 November 2026). The P5
    // team email is the one that stays; this site's own team email is the
    // fallback. Its channel is claimed here, so a repeated submission cannot
    // send a second copy, but nothing is sent until the bridge result is known:
    // sendSiteTeamEmail waits for it, and that wait is kept alive with after()
    // so the visitor response never waits on P5. "sent" leaves the shared
    // family inbox to the P5 email; anything else, or no bridge at all, sends
    // this email to every recipient exactly as before.
    const teamEmail: Promise<InquiryDeliveryResult | null> = deliverInquiryChannel(intake, {
      inquiryKey: intakeResult.inquiryKey, revisionKey: claimedRevisionKey, channel: "adminEmail",
      deliver: async () => {
        const costs = await unitCostOverrides;
        const { client, fromEmail } = await getUncachableEmailClient();
        const from = formatFromAddress(fromEmail);
        const enrichment = (data.propertyProfile as PropertyEnrichment | null) ?? null;
        const adminHtml = buildAdminEmailHtml(lead, estimate, enrichment, costs);
        await sendSiteTeamEmail({
          bridge,
          label: "consultation",
          recipients: () => getAdminRecipientEmails(SITE_CONFIG.email),
          send: async (adminEmail) => {
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
          },
        });
      },
    }).catch((teamEmailErr) => {
      console.error("[consultation] Team email channel failed:", teamEmailErr);
      return null;
    });
    try {
      after(() => teamEmail);
    } catch (teamEmailErr) {
      console.error("[consultation] Could not schedule the team email:", teamEmailErr);
    }

    // The visitor waits for these only: the lead dashboard forward and the
    // customer's confirmation. Neither depends on the bridge.
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
      estimateSummary: appendAttributionEvidence(buildLeadNotes(crmLead, estimate, crmProfile, costs),data.attribution),
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
            text: buildCustomerEmailText(lead, estimate, costs),
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
      // Lets this visitor add details and files to the same request
      // (/api/consultation/details, /api/consultation/files) for two hours.
      detailsToken: detailsTokenFor(intakeResult.inquiryKey),
      // The team email is decided after this response (see teamEmail above), so
      // it is reported as deferred, not as delivered or failed.
      delivery: [
        ...delivery.map(({ channel, attempted, delivered }) => ({ channel, attempted, delivered })),
        { channel: "adminEmail" as const, attempted: false, delivered: false, deferred: true },
      ],
    });
  } catch (err) {
    if (err instanceof LeadRequestError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    console.error("[consultation] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

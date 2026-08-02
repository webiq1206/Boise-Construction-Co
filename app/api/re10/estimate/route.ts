import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  estimateRe10,
  RECIPES,
  TRADE_LABELS,
  type RepairItemInput,
  type RepairKind,
  type ReviewReason,
} from "@/shared/costs/re10Repairs";
import { EXTRACTABLE_KINDS, EXTRACTION_REVIEW_REASONS } from "@/shared/re10/extraction";
import { deliverRe10Lead } from "@/server/services/re10Lead";
import type { Re10Contact } from "@/server/services/re10Email";

/**
 * The gated step: contact details in, planning range out.
 *
 * THE RANGE IS COMPUTED HERE, NOT TRUSTED FROM THE CLIENT. The wizard sends
 * the confirmed repair list and the property context; the price is derived
 * server-side from the same engine the emails and the internal estimate use.
 * A client that posts its own number gets it ignored - there is nowhere in the
 * request body to put one.
 *
 * The customer response deliberately carries no cost, margin, or line item.
 * Those exist on the server result and go to the team, never over this wire.
 */

export const runtime = "nodejs";

const repairSchema = z.object({
  id: z.string().min(1).max(64),
  description: z.string().min(1).max(2000),
  kind: z.enum(EXTRACTABLE_KINDS as [RepairKind, ...RepairKind[]]),
  location: z.string().max(200).optional(),
  quantity: z.number().positive().max(100_000).nullable().optional(),
  sourceRef: z.string().max(200).optional(),
  needsReview: z.enum(EXTRACTION_REVIEW_REASONS as [ReviewReason, ...ReviewReason[]]).optional(),
  hasPhoto: z.boolean().optional(),
});

/**
 * Contact validation is conditional on the preferred method, per the brief:
 * asking for a phone number from someone who chose email is friction with no
 * purpose, and accepting neither makes the lead unusable.
 */
const bodySchema = z
  .object({
    repairs: z.array(repairSchema).min(1).max(80),
    name: z.string().min(2).max(120),
    email: z.string().email().max(200).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
    preferredContact: z.enum(["email", "phone", "text"]),
    role: z.enum(["buyer-agent", "seller-agent", "buyer", "seller", "coordinator", "other"]),
    brokerage: z.string().max(160).optional(),
    propertyAddress: z.string().min(4).max(300),
    closingDate: z.string().max(40).optional(),
    repairDeadline: z.string().max(40).optional(),
    occupancy: z.enum(["occupied", "vacant", "unknown"]).optional(),
    access: z.enum(["standard", "limited", "difficult"]).optional(),
    hasInspectionReport: z.boolean().optional(),
    notes: z.string().max(4000).optional(),
    // Uploaded originals from the analyze step, so the lead carries the actual RE-10.
    documents: z
      .array(z.object({ filename: z.string().max(300), url: z.string().url().max(2000) }))
      .max(12)
      .optional(),
    /**
     * Repairs the extractor could not map to a priceable category.
     *
     * THESE USED TO STOP AT THE REVIEW SCREEN. They were shown once, then never
     * sent here - so they were absent from the range, from the customer's copy,
     * from the internal estimate and from the CRM. On a real Idaho RE-10 that
     * was seven of twenty requests, including a chimney, a crawlspace vapor
     * barrier and floor insulation. The agent got a range that looked like the
     * whole job and quietly was not, and nobody on our side ever saw the
     * missing items. They travel now.
     */
    unmapped: z
      .array(z.object({ verbatim: z.string().max(2000), reason: z.string().max(1000).optional() }))
      .max(40)
      .optional(),
    /** Extractor observations worth putting in front of the estimator. */
    documentNotes: z.array(z.string().max(1000)).max(20).optional(),
  })
  .refine((b) => (b.preferredContact === "email" ? Boolean(b.email) : true), {
    message: "An email address is required when email is the preferred contact method.",
    path: ["email"],
  })
  .refine((b) => (b.preferredContact !== "email" ? Boolean(b.phone) : true), {
    message: "A phone number is required when phone or text is the preferred contact method.",
    path: ["phone"],
  });

/** Days from today to the deadline, which drives the expedite uplift. */
function daysUntil(date: string | undefined): number | null {
  if (!date) return null;
  const target = Date.parse(date);
  if (Number.isNaN(target)) return null;
  const days = Math.round((target - Date.now()) / 86_400_000);
  return Number.isFinite(days) ? days : null;
}

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const items: RepairItemInput[] = body.repairs.map((r) => ({
    id: r.id,
    description: r.description,
    kind: r.kind,
    location: r.location,
    quantity: r.quantity ?? null,
    sourceRef: r.sourceRef,
    needsReview: r.needsReview,
    hasPhoto: r.hasPhoto,
  }));

  const estimate = estimateRe10(items, {
    occupancy: body.occupancy ?? "unknown",
    access: body.access ?? "standard",
    daysToDeadline: daysUntil(body.repairDeadline),
    hasInspectionReport: body.hasInspectionReport ?? false,
  });

  // CUSTOMER-FACING SHAPE. Range, categories, scope, caveats. No cost, no
  // margin, no line item, no mention of what anything cost us.
  const customerView = {
    low: estimate.low,
    high: estimate.high,
    categories: estimate.trades.map((t) => ({
      trade: t.trade,
      label: TRADE_LABELS[t.trade],
      itemCount: t.repairs.length,
      items: t.repairs.map((p) => ({
        description: p.input.description,
        label: p.recipe.label,
        location: p.input.location ?? null,
        quantityAssumed: p.quantityAssumed,
      })),
    })),
    // Unpriced items are listed alongside the ones that need an onsite visit,
    // because from the customer's side they are the same fact: this is in your
    // document, it is NOT in this number, and here is why. Splitting them into
    // two lists would only make one of them easier to miss.
    needsOnsite: [
      ...estimate.review.map((r) => ({
        description: r.input.description,
        why: r.text,
      })),
      ...(body.unmapped ?? []).map((u) => ({
        description: u.verbatim,
        why:
          u.reason ??
          "This one does not fit the categories we price automatically, so we price it after seeing it.",
      })),
    ],
    uncertainty: estimate.uncertainty,
    assumptions: estimate.assumptions,
  };

  const contact: Re10Contact = {
    name: body.name,
    email: body.email || undefined,
    phone: body.phone || undefined,
    preferredContact: body.preferredContact,
    role: body.role,
    brokerage: body.brokerage,
    propertyAddress: body.propertyAddress,
    closingDate: body.closingDate,
    repairDeadline: body.repairDeadline,
    occupancy: body.occupancy,
    notes: body.notes,
  };

  // Awaited so the response can report honestly whether the copy was sent -
  // the wizard says "we have emailed you a copy" and should only say it when
  // that is true. Delivery never throws; a failure is logged and reported as
  // false rather than surfaced as an error on a request that already succeeded.
  const delivery = await deliverRe10Lead({
    contact,
    estimate,
    customerView,
    documents: body.documents ?? [],
    unmapped: body.unmapped ?? [],
    documentNotes: body.documentNotes ?? [],
  });

  return NextResponse.json({
    range: { low: estimate.low, high: estimate.high },
    confidence: estimate.confidence,
    propertyAddress: body.propertyAddress,
    closingDate: body.closingDate ?? null,
    repairDeadline: body.repairDeadline ?? null,
    categories: customerView.categories,
    needsOnsite: customerView.needsOnsite,
    uncertainty: estimate.uncertainty,
    assumptions: estimate.assumptions,
    priced: estimate.priced.length,
    unpriced: customerView.needsOnsite.length,
    emailed: delivery.customerEmailed,
  });
}

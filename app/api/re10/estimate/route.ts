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
  return NextResponse.json({
    range: { low: estimate.low, high: estimate.high },
    confidence: estimate.confidence,
    propertyAddress: body.propertyAddress,
    closingDate: body.closingDate ?? null,
    repairDeadline: body.repairDeadline ?? null,
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
    needsOnsite: estimate.review.map((r) => ({
      description: r.input.description,
      why: r.text,
    })),
    uncertainty: estimate.uncertainty,
    assumptions: estimate.assumptions,
    priced: estimate.priced.length,
    unpriced: estimate.review.length,
  });
}

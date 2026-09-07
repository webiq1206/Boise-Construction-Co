import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import {
  createDrizzleInquiryIntake,
} from "@/server/services/inquiryIntake";
import {
  LeadRequestError,
  readBoundedJson,
} from "@/server/services/leadRequestGuard";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const inquiryKeySchema = z
  .string()
  .max(124)
  .regex(/^inq_[A-Za-z0-9_-]{16,120}$/);

const claimKeySchema = z
  .string()
  .max(126)
  .regex(/^claim_[A-Za-z0-9_-]{16,120}$/);

const conversionIdSchema = z
  .string()
  .max(125)
  .regex(/^conv_[A-Za-z0-9_-]{16,120}$/);

const bodySchema = z
  .object({
    inquiryKey: inquiryKeySchema,
    claimKey: claimKeySchema,
    conversionId: conversionIdSchema,
    acknowledge: z.boolean().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const limit = rateLimit(
    clientKeyFrom(request.headers, "inquiry-conversion"),
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const parsed = bodySchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    let intake;
    try {
      intake = createDrizzleInquiryIntake();
    } catch {
      return NextResponse.json(
        { message: "Conversion service unavailable" },
        { status: 503 },
      );
    }

    const { inquiryKey, claimKey, conversionId, acknowledge } = parsed.data;
    if (acknowledge) {
      const acknowledged = await intake.acknowledgeConversion(
        inquiryKey,
        claimKey,
        conversionId,
      );
      return NextResponse.json({ acknowledged });
    }

    const eligible = await intake.claimConversion(
      inquiryKey,
      claimKey,
      conversionId,
    );
    return NextResponse.json({ eligible, conversionId });
  } catch (error) {
    if (error instanceof LeadRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
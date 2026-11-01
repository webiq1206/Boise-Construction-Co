import { z } from "zod";
import { sanitizeAttribution } from "@/lib/leadAttribution";
import { estimateSchema } from "@/shared/estimatePayload";

/**
 * Request body for POST /api/consultation, kept outside the route file so the
 * accepted shapes (full quote request and "have us call you") are testable
 * without a database (tests/p5-consultation-callback.test.ts).
 */

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
export const optionalEstimateSchema = estimateSchema.optional().nullable();

/**
 * Project type sent when the visitor did not pick one. The one-screen form
 * keeps project type as optional detail, and a callback request asks only for
 * a name and a number. "other" is the value the form already sent for
 * "Other / Not sure yet", so the CRM and the p5 intake bridge treat it exactly
 * as before (UNMAPPED_P5_PROJECT_TYPES in p5IntakeBridge).
 */
export const UNSPECIFIED_PROJECT_TYPE = "other";

export const CALLBACK_MARKER = "CALLBACK REQUEST";

export const consultationBodySchema = z
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
     * yet has no site to name, and the one-screen form keeps the site address
     * under "Add more detail (optional)".
     */
    address: z.string().max(300).optional().default(""),
    zip: z.string().max(20).optional(),
    /** Optional detail on the one-screen form; absent or blank becomes "other". */
    projectType: z
      .string()
      .max(100)
      .optional()
      .transform((value) => value?.trim() || UNSPECIFIED_PROJECT_TYPE),
    message: z.string().max(5_000).optional(),
    /**
     * "callback" is the form's "Have us call you" switch: name and phone only,
     * through this same pipeline. The route writes CALLBACK_MARKER into the
     * notes so every destination (database row, CRM, internal email) shows it.
     */
    requestKind: z.enum(["quote", "callback"]).optional().default("quote"),
    bestTimeToCall: z.string().trim().max(60).optional(),
    propertyProfile: propertyProfileSchema,
    attribution: z.unknown().optional().transform(sanitizeAttribution),
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
    // A callback is a phone call by definition, whatever the radio said.
    const contact = data.requestKind === "callback" ? "phone" : data.preferredContact;
    if (contact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Valid email required" });
      }
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Valid phone required" });
    }
  })
  .transform((data) => ({
    ...data,
    preferredContact: data.requestKind === "callback" ? ("phone" as const) : data.preferredContact,
    message: composeConsultationMessage(data),
  }));

export type ConsultationBody = z.infer<typeof consultationBodySchema>;

const CONTACT_LABELS = { phone: "Call", text: "Text", email: "Email" } as const;

export function preferredContactLabel(value: "email" | "phone" | "text"): string {
  return CONTACT_LABELS[value];
}

/**
 * The notes every destination stores. A callback request leads with one plain
 * line the team cannot miss; the visitor's own words follow unchanged. A
 * normal request keeps the visitor's message exactly as typed.
 */
export function composeConsultationMessage(input: {
  requestKind?: "quote" | "callback";
  bestTimeToCall?: string;
  phone?: string;
  message?: string;
}): string | undefined {
  const typed = input.message?.trim() ? input.message : undefined;
  if (input.requestKind !== "callback") return typed;
  const best = input.bestTimeToCall?.trim();
  const header = `${CALLBACK_MARKER}: please call ${input.phone?.trim() || "the number above"}${
    best ? `. Best time: ${best}` : ""
  }.`;
  return typed ? `${header}\n\n${typed}` : header;
}

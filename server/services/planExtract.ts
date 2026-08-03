import Anthropic from "@anthropic-ai/sdk";
import {
  PLAN_EXTRACTION_SCHEMA,
  PLAN_EXTRACTION_SYSTEM_PROMPT,
  type ExtractedPlan,
} from "@/shared/plans/extraction";
import { MAX_TOTAL_UPLOAD_BYTES } from "@/shared/re10/uploads";

/**
 * Reading an architectural plan set with Claude.
 *
 * Deliberately the same shape as re10Extract.ts, down to the error taxonomy.
 * These are two instances of one job - read a document, return a typed result,
 * never guess - and giving them different structures would mean two sets of
 * failure handling to keep correct instead of one pattern to recognise.
 *
 * WHY A PORT AND NOT A DIRECT CALL. Everything downstream depends on an
 * ExtractedPlan, not on Anthropic. This is the only file that knows a model
 * exists, so the estimator stays testable without a key and without a network.
 *
 * WHAT IT DOES NOT DO. It does not price and it does not fill in blanks. A plan
 * set that does not state its square footage comes back with null square
 * footage, and the estimator keeps whatever the visitor set by hand. That is the
 * whole discipline of this file: the single most expensive failure would be a
 * confident area the drawings never stated, because every other number in the
 * budget scales from it.
 */

export interface PlanExtractionInput {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export type PlanExtractionOutcome =
  | { ok: true; result: ExtractedPlan; usage: { inputTokens: number; outputTokens: number } }
  | { ok: false; reason: PlanExtractionFailure; message: string };

export type PlanExtractionFailure =
  /** No ANTHROPIC_API_KEY. The feature is unconfigured, not broken. */
  | "not-configured"
  /** Claude's safety classifiers declined. */
  | "refused"
  /** Rate limited or overloaded. Worth retrying. */
  | "busy"
  /** Anything else: bad file, network, malformed response. */
  | "failed";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PDF_TYPE = "application/pdf";

export { MAX_TOTAL_UPLOAD_BYTES };

export function isPlanExtractionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function buildContent(files: PlanExtractionInput[]): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const file of files) {
    blocks.push({ type: "text", text: `--- ${file.filename} ---` });
    const data = file.data.toString("base64");

    if (file.mimeType === PDF_TYPE) {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else if (IMAGE_TYPES.has(file.mimeType)) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data,
        },
      });
    }
  }

  blocks.push({
    type: "text",
    text: "Read these drawings and report the facts a builder needs to budget them. Check the cover sheet first: most sets state the areas outright. Decide whether this is a ground-up new home or a remodel before anything else, and never report an area the drawings do not state.",
  });

  return blocks;
}

export async function extractPlan(files: PlanExtractionInput[]): Promise<PlanExtractionOutcome> {
  if (!isPlanExtractionConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Plan review is not configured on this environment.",
    };
  }

  const usable = files.filter((f) => f.mimeType === PDF_TYPE || IMAGE_TYPES.has(f.mimeType));
  if (usable.length === 0) {
    return { ok: false, reason: "failed", message: "No readable PDF or image files were supplied." };
  }

  const total = usable.reduce((sum, f) => sum + f.data.byteLength, 0);
  /*
   * TWO CEILINGS, and the tighter one is the one that matters here.
   *
   * MAX_TOTAL_UPLOAD_BYTES (24 MB) is the shared upload cap. But these bytes are
   * base64-encoded into the request body, which inflates them by a third, and
   * the Anthropic PDF request limit is 32 MB. A 24 MB set therefore encodes to
   * ~32 MB and can fail the API call with an opaque size error AFTER the visitor
   * has waited through the upload. So the effective ceiling for a set we are
   * about to send the model is lower, and crossing it returns the same friendly
   * "send the cover sheet and floor plans" guidance rather than a raw failure.
   *
   * A permit set that large is almost always mostly structural and detail
   * sheets, which carry no scope the budget needs; the cover sheet, site plan
   * and floor plans do, and they are a small fraction of the page count.
   */
  const API_SAFE_BYTES = 22 * 1024 * 1024; // ~29 MB base64, comfortably under 32
  if (total > Math.min(MAX_TOTAL_UPLOAD_BYTES, API_SAFE_BYTES)) {
    return {
      ok: false,
      reason: "failed",
      message:
        "That plan set is too large to read in one go. Send the cover sheet, site plan and floor plans - they carry everything a budget needs. The structural and detail sheets, which are most of a large set, do not.",
    };
  }

  const client = new Anthropic();

  try {
    // Streaming: a full permit set runs to dozens of large sheets and reading it
    // comfortably outlasts a plain HTTP timeout.
    const stream = client.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: PLAN_EXTRACTION_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: PLAN_EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      messages: [{ role: "user", content: buildContent(usable) }],
    } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

    const message = await stream.finalMessage();

    // Checked before reading content: on a refusal the content array is empty
    // or partial, and indexing it blindly crashes on exactly the uploads most
    // worth handling gracefully.
    if (message.stop_reason === "refusal") {
      return {
        ok: false,
        reason: "refused",
        message:
          "We could not review that file automatically. Send it over and we will read it by hand.",
      };
    }

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return { ok: false, reason: "failed", message: "The plan review came back empty." };
    }

    return {
      ok: true,
      result: JSON.parse(text.text) as ExtractedPlan,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, reason: "busy", message: "Plan review is busy. Try again in a moment." };
    }
    if (
      err instanceof Anthropic.AuthenticationError ||
      err instanceof Anthropic.PermissionDeniedError
    ) {
      return { ok: false, reason: "not-configured", message: "Plan review is not configured correctly." };
    }
    if (err instanceof Anthropic.InternalServerError) {
      return { ok: false, reason: "busy", message: "Plan review is temporarily unavailable. Try again shortly." };
    }
    // Before APIError: APIConnectionError is a SUBCLASS of APIError in this SDK,
    // so checking the base first would swallow every network fault.
    if (err instanceof Anthropic.APIConnectionError) {
      return { ok: false, reason: "busy", message: "Could not reach the plan review service. Try again shortly." };
    }
    console.error("[planExtract] extraction failed:", err);
    return {
      ok: false,
      reason: "failed",
      message: "We could not read that plan set. A PDF of the cover sheet and floor plans usually works best.",
    };
  }
}

import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACTION_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  type ExtractionResult,
} from "@/shared/re10/extraction";

/**
 * Reading an RE-10 with Claude.
 *
 * WHY A PORT AND NOT A DIRECT CALL. Everything downstream - the wizard, the
 * contact gate, the estimator, the emails - depends on an ExtractionResult, not
 * on Anthropic. `extractRepairs` is the only place that knows a model exists.
 * That keeps the rest of the feature testable without a key and without a
 * network, and it means the day this is swapped or a second provider is added,
 * one file changes.
 *
 * WHAT IT DOES NOT DO. It does not price, it does not decide what is worth
 * reviewing beyond what the document says, and it does not fill in blanks. A
 * missing measurement stays missing; the estimator has a documented assumption
 * for that and the homeowner is told. An extractor that guesses quantities
 * would produce confident prices for work nobody requested, which is the
 * single most expensive way this feature could fail.
 */

/** A file the homeowner uploaded, ready to send. */
export interface ExtractionInput {
  /** Original filename, used only for the model's context and error messages. */
  filename: string;
  mimeType: string;
  data: Buffer;
}

export type ExtractionOutcome =
  | { ok: true; result: ExtractionResult; usage: { inputTokens: number; outputTokens: number } }
  | { ok: false; reason: ExtractionFailure; message: string };

export type ExtractionFailure =
  /** No ANTHROPIC_API_KEY. The feature is unconfigured, not broken. */
  | "not-configured"
  /** Claude's safety classifiers declined. Rare here, but must be handled. */
  | "refused"
  /** Rate limited or overloaded. Worth retrying. */
  | "busy"
  /** Anything else: bad file, network, malformed response. */
  | "failed";

/** Claude accepts PDFs as documents and these three as images. */
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PDF_TYPE = "application/pdf";

/** Per-request ceiling. The API's own limit is 32MB; stay well inside it. */
export const MAX_TOTAL_UPLOAD_BYTES = 24 * 1024 * 1024;

export function isExtractionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Build the content blocks for one request.
 *
 * PDFs go in as `document` blocks and images as `image`, because the block type
 * has to match the file's MIME type. Each file is preceded by a text block
 * naming it, so the model can refer to "the inspection report" rather than
 * "the second attachment" in its notes.
 */
function buildContent(files: ExtractionInput[]): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const file of files) {
    blocks.push({ type: "text", text: `--- ${file.filename} ---` });
    // Base64 must carry no newlines; Buffer.toString("base64") already complies.
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
    text: "Extract every repair the buyer has requested from these documents. Follow the rules exactly: copy requests verbatim, never invent a measurement, and flag anything that needs an onsite evaluation.",
  });

  return blocks;
}

/**
 * Extract the repair list from uploaded documents.
 *
 * Returns an outcome rather than throwing, because every failure here has a
 * different thing to tell the homeowner: an unconfigured key is our problem, a
 * rate limit is worth retrying, and a file we could not read is theirs to fix.
 * Collapsing them into one exception would lose that.
 */
export async function extractRepairs(files: ExtractionInput[]): Promise<ExtractionOutcome> {
  if (!isExtractionConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Document analysis is not configured on this environment.",
    };
  }

  const usable = files.filter((f) => f.mimeType === PDF_TYPE || IMAGE_TYPES.has(f.mimeType));
  if (usable.length === 0) {
    return { ok: false, reason: "failed", message: "No readable PDF or image files were supplied." };
  }

  const total = usable.reduce((sum, f) => sum + f.data.byteLength, 0);
  if (total > MAX_TOTAL_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: "failed",
      message: "Those files are too large to analyze together. Try sending the RE-10 and the relevant inspection pages rather than the full report.",
    };
  }

  const client = new Anthropic();

  try {
    // Streaming, because a long inspection report with several photos can take
    // well past a plain HTTP timeout. get_final_message gives us the whole
    // response without handling individual events.
    const stream = client.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 16000,
      // Anthropic's recommended fallback, routed by refusal category, so a
      // classifier decline on a benign inspection report still returns an
      // answer rather than an empty hand.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: "user", content: buildContent(usable) }],
    } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

    const message = await stream.finalMessage();

    // Check stop_reason BEFORE reading content: on a refusal the content array
    // is empty or partial, and indexing it blindly is how this would crash on
    // exactly the documents most worth handling gracefully.
    if (message.stop_reason === "refusal") {
      return {
        ok: false,
        reason: "refused",
        message: "We could not analyze that document automatically. Send it to us directly and we will review it by hand.",
      };
    }

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return { ok: false, reason: "failed", message: "The analysis came back empty." };
    }

    const result = JSON.parse(text.text) as ExtractionResult;
    return {
      ok: true,
      result,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (err) {
    // Most specific first: a rate limit is worth retrying and a bad request is
    // not, and the caller needs to be able to tell them apart.
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, reason: "busy", message: "Document analysis is busy. Try again in a moment." };
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return { ok: false, reason: "not-configured", message: "Document analysis is not configured correctly." };
    }
    if (err instanceof Anthropic.InternalServerError) {
      return { ok: false, reason: "busy", message: "Document analysis is temporarily unavailable. Try again shortly." };
    }
    // Before APIError: in the TypeScript SDK, APIConnectionError is a SUBCLASS
    // of APIError, so checking the base first would swallow every network fault
    // into the generic branch.
    if (err instanceof Anthropic.APIConnectionError) {
      return { ok: false, reason: "busy", message: "Could not reach the analysis service. Try again shortly." };
    }
    console.error("[re10Extract] extraction failed:", err);
    return {
      ok: false,
      reason: "failed",
      message: "We could not read those documents. A clearer scan or a photo of each page usually fixes it.",
    };
  }
}

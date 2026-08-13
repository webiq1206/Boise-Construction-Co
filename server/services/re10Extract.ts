import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACTION_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  type ExtractionResult,
} from "@/shared/re10/extraction";
import { MAX_TOTAL_UPLOAD_BYTES } from "@/shared/re10/uploads";
import { mergeRe10Chunks, type Re10ChunkContribution, type DuplicateFlag, type QuantityConflict } from "@/shared/re10/mergeChunks";
import { buildPageManifest, type PageChunk, type SourceFile } from "./documents/pageInventory";
import { runChunkedExtraction, type ChunkOutcome } from "./documents/chunkedExtract";
import type { CoverageLedger } from "./documents/coverage";

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

export interface ExtractionSuccess {
  ok: true;
  result: ExtractionResult;
  /** Per-page proof of what was and was not read. */
  coverage: CoverageLedger;
  /** Identical repairs collapsed silently. */
  duplicatesRemoved: DuplicateFlag[];
  /** Similar repairs KEPT in the list and flagged for a human to confirm. */
  possibleDuplicates: DuplicateFlag[];
  /** One repair carrying different counts on different pages. Never summed. */
  quantityConflicts: QuantityConflict[];
  usage: { inputTokens: number; outputTokens: number };
}

export type ExtractionOutcome =
  | ExtractionSuccess
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

/**
 * Per-request ceiling. The API's own limit is 32MB; stay well inside it.
 *
 * Re-exported from the shared upload rules rather than declared here, so the
 * wizard can warn about an oversized batch before spending the upload on it and
 * cannot warn at a different number than the one actually enforced.
 */
export { MAX_TOTAL_UPLOAD_BYTES };

export function isExtractionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** "inspection-report.pdf p.14" - what a human can actually go look at. */
function pageLabel(filename: string, pageNumber: number): string {
  return `${filename} p.${pageNumber}`;
}

/**
 * Per-chunk schema: the extraction fields plus the page accounting that makes
 * coverage checkable. pagesRead is REQUIRED so a pass cannot omit it and leave
 * coverage ambiguous.
 */
function buildChunkSchema(): Record<string, unknown> {
  const base = EXTRACTION_SCHEMA as unknown as {
    properties: Record<string, unknown>;
    required: string[];
  };
  return {
    type: "object",
    properties: {
      ...base.properties,
      pagesRead: {
        type: "array",
        items: { type: "string" },
        description: "The exact page ids from this batch that you actually examined.",
      },
      pagesUnreadable: {
        type: "array",
        items: {
          type: "object",
          properties: { id: { type: "string" }, reason: { type: "string" } },
          required: ["id", "reason"],
          additionalProperties: false,
        },
        description: "Pages in this batch you could see were present but could not read.",
      },
    },
    required: [...base.required, "pagesRead", "pagesUnreadable"],
    additionalProperties: false,
  };
}

const CHUNK_SYSTEM_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

BATCH READING RULES

You are reading ONE BATCH of pages from a larger submission, not the whole thing.

- Report ONLY repairs stated on these pages. Another batch covers the rest.
- Each page is introduced by a line reading "PAGE ID: <id>". List every id you genuinely examined in pagesRead, using the id exactly as given.
- If a page will not render, is blank, or is too degraded to read, put it in pagesUnreadable with a short reason. A page nobody reports on becomes a hole in the estimate, so saying "I could not read this" is far more useful than saying nothing.
- Scanned pages, faxed addenda and HANDWRITTEN annotations are normal on an RE-10. Read handwriting, initials, strikethroughs and margin notes as carefully as printed text, and say in the item's wording when a request is handwritten rather than typed.
- A repair struck through or marked "removed"/"withdrawn" is NOT a requested repair. Do not list it.
- Do NOT deduplicate across batches. If this page restates a repair you would expect elsewhere, still report it - the merge step reconciles repeats and needs to see both.`;

function buildChunkContent(chunk: PageChunk): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const page of chunk.pages) {
    blocks.push({
      type: "text",
      text: `PAGE ID: ${page.id}\nPage: ${pageLabel(page.filename, page.pageNumber)}`,
    });
    const data = page.data.toString("base64");

    if (page.mimeType === PDF_TYPE) {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else if (IMAGE_TYPES.has(page.mimeType)) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: page.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data,
        },
      });
    }
  }

  blocks.push({
    type: "text",
    text: `Extract every repair requested on these ${chunk.pages.length} page(s). Copy requests verbatim, never invent a measurement, flag anything needing an onsite evaluation, and list every page id you examined in pagesRead.`,
  });

  return blocks;
}

interface Re10ChunkPayload {
  result: Partial<ExtractionResult>;
  pageIds: string[];
  pageLabels: string[];
}

function classifyError(err: unknown): { reason: ExtractionFailure; message: string } {
  // Most specific first: a rate limit is worth retrying and a bad request is
  // not, and the caller needs to be able to tell them apart.
  if (err instanceof Anthropic.RateLimitError) {
    return { reason: "busy", message: "Document analysis is busy." };
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { reason: "not-configured", message: "Document analysis is not configured correctly." };
  }
  if (err instanceof Anthropic.InternalServerError) {
    return { reason: "busy", message: "Document analysis is temporarily unavailable." };
  }
  // Before APIError: in the TypeScript SDK, APIConnectionError is a SUBCLASS
  // of APIError, so checking the base first would swallow every network fault.
  if (err instanceof Anthropic.APIConnectionError) {
    return { reason: "busy", message: "Could not reach the analysis service." };
  }
  return { reason: "failed", message: "That batch of pages could not be read." };
}

/**
 * Extract the repair list from uploaded documents.
 *
 * WHAT CHANGED. This used to send every uploaded byte in ONE request, capped at
 * the API's 32MB, so a thick inspection report was refused with "send the RE-10
 * and the relevant pages instead" - which asks the person least able to judge
 * relevance to decide what we get to read. It now reads page by page, so the
 * whole report is fair game and coverage is provable.
 *
 * Returns an outcome rather than throwing, because every failure here has a
 * different thing to tell the homeowner: an unconfigured key is our problem, a
 * rate limit is worth retrying, and a file we could not read is theirs to fix.
 */
export async function extractRepairs(files: ExtractionInput[]): Promise<ExtractionOutcome> {
  if (!isExtractionConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Document analysis is not configured on this environment.",
    };
  }

  const usable: SourceFile[] = files.filter(
    (f) => f.mimeType === PDF_TYPE || IMAGE_TYPES.has(f.mimeType),
  );
  if (usable.length === 0) {
    return { ok: false, reason: "failed", message: "No readable PDF or image files were supplied." };
  }

  const manifest = await buildPageManifest(usable);

  if (manifest.chunks.length === 0) {
    return {
      ok: false,
      reason: "failed",
      message:
        manifest.unreadablePages.length > 0
          ? "None of those pages could be opened. They may be corrupt or password protected."
          : "No readable pages were found in that upload.",
    };
  }

  const client = new Anthropic();
  const chunkSchema = buildChunkSchema();
  let inputTokens = 0;
  let outputTokens = 0;
  let sawRefusal = false;

  const extraction = await runChunkedExtraction<Re10ChunkPayload>(
    manifest,
    async (chunk): Promise<ChunkOutcome<Re10ChunkPayload>> => {
      try {
        // Streaming, because a long inspection report with several photos can
        // take well past a plain HTTP timeout.
        const stream = client.beta.messages.stream({
          model: "claude-opus-5",
          max_tokens: 16000,
          // Anthropic's recommended fallback, routed by refusal category, so a
          // classifier decline on a benign inspection report still returns an
          // answer rather than an empty hand.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: CHUNK_SYSTEM_PROMPT,
          output_config: { format: { type: "json_schema", schema: chunkSchema } },
          messages: [{ role: "user", content: buildChunkContent(chunk) }],
        } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

        const message = await stream.finalMessage();
        inputTokens += message.usage.input_tokens;
        outputTokens += message.usage.output_tokens;

        // Check stop_reason BEFORE reading content: on a refusal the content
        // array is empty or partial, and indexing it blindly is how this would
        // crash on exactly the documents most worth handling gracefully.
        if (message.stop_reason === "refusal") {
          sawRefusal = true;
          return { ok: false, reason: "refused", message: "Declined to read these pages." };
        }

        const text = message.content.find((b) => b.type === "text");
        if (!text || text.type !== "text") {
          return { ok: false, reason: "failed", message: "That batch came back empty." };
        }

        const parsed = JSON.parse(text.text) as Partial<ExtractionResult> & {
          pagesRead?: string[];
          pagesUnreadable?: { id: string; reason: string }[];
        };

        const readIds = parsed.pagesRead ?? [];
        const byId = new Map(chunk.pages.map((p) => [p.id, p]));

        return {
          ok: true,
          report: {
            pagesRead: readIds,
            pagesUnreadable: parsed.pagesUnreadable ?? [],
            data: {
              result: parsed,
              pageIds: readIds,
              pageLabels: readIds
                .map((id) => byId.get(id))
                .filter((pg): pg is NonNullable<typeof pg> => Boolean(pg))
                .map((pg) => pageLabel(pg.filename, pg.pageNumber)),
            },
          },
        };
      } catch (err) {
        const { reason, message } = classifyError(err);
        if (reason === "refused") sawRefusal = true;
        return { ok: false, reason, message };
      }
    },
    { concurrency: 3, deadlineMs: 240_000, retries: 1 },
  );

  if (extraction.results.length === 0) {
    if (sawRefusal) {
      return {
        ok: false,
        reason: "refused",
        message: "We could not analyze that document automatically. Send it to us directly and we will review it by hand.",
      };
    }
    return {
      ok: false,
      reason: "failed",
      message: "We could not read those documents. A clearer scan or a photo of each page usually fixes it.",
    };
  }

  const contributions: Re10ChunkContribution[] = extraction.results.map((r) => ({
    result: r.result,
    pageIds: r.pageIds,
    pageLabels: r.pageLabels,
  }));

  const merged = mergeRe10Chunks(contributions);

  return {
    ok: true,
    result: merged.result,
    coverage: extraction.ledger,
    duplicatesRemoved: merged.duplicatesRemoved,
    possibleDuplicates: merged.possibleDuplicates,
    quantityConflicts: merged.quantityConflicts,
    usage: { inputTokens, outputTokens },
  };
}

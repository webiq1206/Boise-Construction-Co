import Anthropic from "@anthropic-ai/sdk";
import {
  PLAN_EXTRACTION_SCHEMA,
  PLAN_EXTRACTION_SYSTEM_PROMPT,
  type ExtractedPlan,
} from "@/shared/plans/extraction";
import {
  mergePlanChunks,
  type PlanChunkContribution,
  type PlanConflict,
  type ProvenanceEntry,
} from "@/shared/plans/mergeChunks";
import { buildPageManifest, type PageChunk, type SourceFile } from "./documents/pageInventory";
import { runChunkedExtraction, type ChunkOutcome } from "./documents/chunkedExtract";
import type { CoverageLedger } from "./documents/coverage";
import { MAX_TOTAL_UPLOAD_BYTES } from "@/shared/re10/uploads";

/**
 * Reading an architectural plan set with Claude.
 *
 * WHAT CHANGED. This used to base64 an entire upload into ONE request, which
 * capped a readable set at ~22MB and made a 100+ sheet permit set something the
 * tool REFUSED ("send the cover sheet and floor plans instead") rather than
 * something it read. One answer covered every sheet, so a pass that quietly
 * ignored half the set was indistinguishable from one that read all of it.
 *
 * Now the upload is split into an addressable page manifest, read in bounded
 * passes, and reconciled. Three consequences worth stating plainly:
 *
 *  1. Page count, not byte count, is the unit. A 300MB set is fine; it is just
 *     more passes.
 *  2. Coverage is arithmetic. Each pass reports which page ids it actually
 *     read, and the ledger is manifest-minus-reported. "Every page processed"
 *     is now checkable rather than assumed.
 *  3. Contradictions between sheets are surfaced, never silently resolved.
 *     Whichever area wins scales the whole budget, so a cover sheet saying
 *     3,240 SF and an elevation saying 4,100 SF is a question for a human.
 *
 * WHAT IT STILL DOES NOT DO. It does not price and it does not fill in blanks.
 * A set that never states its area comes back with null area. That discipline
 * is unchanged and is the reason this file is worth trusting: the single most
 * expensive failure available here is a confident number the drawings never
 * stated, because every other figure in the budget scales from it.
 */

export interface PlanExtractionInput {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface PlanExtractionSuccess {
  ok: true;
  result: ExtractedPlan;
  /** Per-page proof of what was and was not read. */
  coverage: CoverageLedger;
  /** Sheets that disagree with each other. Never auto-resolved. */
  conflicts: PlanConflict[];
  /** Where each figure came from, for the internal audit trail. */
  provenance: ProvenanceEntry[];
  usage: { inputTokens: number; outputTokens: number };
}

export type PlanExtractionOutcome =
  | PlanExtractionSuccess
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

/** "permit-set.pdf p.14" - what a human can actually go look at. */
function pageLabel(filename: string, pageNumber: number): string {
  return `${filename} p.${pageNumber}`;
}

/**
 * The per-chunk schema: the plan fields, plus the page accounting that makes
 * coverage checkable. pagesRead is REQUIRED so a pass cannot omit it and leave
 * coverage ambiguous; a pass that read nothing must say so with an empty array.
 */
function buildChunkSchema(): Record<string, unknown> {
  const base = PLAN_EXTRACTION_SCHEMA as unknown as {
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
        description:
          "The exact page ids from this batch that you actually examined. Omit any you could not render or read.",
      },
      pagesUnreadable: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            reason: { type: "string" },
          },
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

const CHUNK_SYSTEM_PROMPT = `${PLAN_EXTRACTION_SYSTEM_PROMPT}

BATCH READING RULES

You are reading ONE BATCH of sheets from a larger plan set, not the whole set.

- Report ONLY what these sheets state. Leave every other field null. Another batch covers the sheets you were not given, and a value you inferred rather than read will collide with the sheet that actually states it.
- Each sheet is introduced by a line reading "PAGE ID: <id>". List every id you genuinely examined in pagesRead, using the id exactly as given.
- If a sheet will not render, is blank, or is too degraded to read, put it in pagesUnreadable with a short reason instead of silently ignoring it. A sheet nobody reports on becomes a hole in the estimate, so saying "I could not read this" is far more useful than saying nothing.
- Scanned, photographed, and hand-annotated sheets are normal. Read handwriting, redlines, and stamps as carefully as printed text, and say so in notes when a figure is handwritten rather than printed.
- Do not carry a figure over from a previous batch. You have not seen one.`;

function buildChunkContent(chunk: PageChunk): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const page of chunk.pages) {
    blocks.push({
      type: "text",
      text: `PAGE ID: ${page.id}\nSheet: ${pageLabel(page.filename, page.pageNumber)}`,
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
    text: `Read these ${chunk.pages.length} sheet(s) and report only what they state. List every page id you examined in pagesRead.`,
  });

  return blocks;
}

interface ChunkPayload {
  plan: Partial<ExtractedPlan>;
  pageIds: string[];
  pageLabels: string[];
}

function classifyError(err: unknown): { reason: PlanExtractionFailure; message: string } {
  if (err instanceof Anthropic.RateLimitError) {
    return { reason: "busy", message: "Plan review is busy." };
  }
  if (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return { reason: "not-configured", message: "Plan review is not configured correctly." };
  }
  if (err instanceof Anthropic.InternalServerError) {
    return { reason: "busy", message: "Plan review is temporarily unavailable." };
  }
  // Before APIError: APIConnectionError is a SUBCLASS of APIError in this SDK,
  // so checking the base first would swallow every network fault.
  if (err instanceof Anthropic.APIConnectionError) {
    return { reason: "busy", message: "Could not reach the plan review service." };
  }
  return { reason: "failed", message: "That batch of sheets could not be read." };
}

export async function extractPlan(files: PlanExtractionInput[]): Promise<PlanExtractionOutcome> {
  if (!isPlanExtractionConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Plan review is not configured on this environment.",
    };
  }

  const usable: SourceFile[] = files.filter(
    (f) => f.mimeType === PDF_TYPE || IMAGE_TYPES.has(f.mimeType),
  );
  if (usable.length === 0) {
    return { ok: false, reason: "failed", message: "No readable PDF or image files were supplied." };
  }

  const manifest = await buildPageManifest(usable);

  /* Every page failed to parse. There is nothing to send, and returning a
     cheerful empty extraction here would be the worst possible answer. */
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
  /* A refusal is about the CONTENT, so it will recur on every pass and is worth
     surfacing as a whole-upload failure rather than as 40 dead chunks. */
  let sawRefusal = false;

  const extraction = await runChunkedExtraction<ChunkPayload>(
    manifest,
    async (chunk): Promise<ChunkOutcome<ChunkPayload>> => {
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5",
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: CHUNK_SYSTEM_PROMPT,
          output_config: { format: { type: "json_schema", schema: chunkSchema } },
          messages: [{ role: "user", content: buildChunkContent(chunk) }],
        } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

        const message = await stream.finalMessage();
        inputTokens += message.usage.input_tokens;
        outputTokens += message.usage.output_tokens;

        // Checked before reading content: on a refusal the content array is
        // empty or partial, and indexing it blindly crashes on exactly the
        // uploads most worth handling gracefully.
        if (message.stop_reason === "refusal") {
          sawRefusal = true;
          return { ok: false, reason: "refused", message: "Declined to read these sheets." };
        }

        const text = message.content.find((b) => b.type === "text");
        if (!text || text.type !== "text") {
          return { ok: false, reason: "failed", message: "That batch came back empty." };
        }

        const parsed = JSON.parse(text.text) as Partial<ExtractedPlan> & {
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
              plan: parsed,
              pageIds: readIds,
              pageLabels: readIds
                .map((id) => byId.get(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
                .map((p) => pageLabel(p.filename, p.pageNumber)),
            },
          },
        };
      } catch (err) {
        const { reason, message } = classifyError(err);
        if (reason === "refused") sawRefusal = true;
        return { ok: false, reason, message };
      }
    },
    /* 240s against the route's 300s ceiling. The gap is deliberate: passes
       already in flight when the budget expires are allowed to finish, and the
       response still has to be assembled and serialised afterwards. */
    { concurrency: 3, deadlineMs: 240_000, retries: 1 },
  );

  /* Nothing at all came back. Distinguish "declined" from "broke", because the
     first is about the documents and the second is about us. */
  if (extraction.results.length === 0) {
    if (sawRefusal) {
      return {
        ok: false,
        reason: "refused",
        message: "We could not review that file automatically. Send it over and we will read it by hand.",
      };
    }
    return {
      ok: false,
      reason: "failed",
      message: "We could not read that plan set. A PDF of the cover sheet and floor plans usually works best.",
    };
  }

  const contributions: PlanChunkContribution[] = extraction.results.map((r) => ({
    plan: r.plan,
    pageIds: r.pageIds,
    pageLabels: r.pageLabels,
  }));

  const merged = mergePlanChunks(contributions);

  /* Coverage shortfalls and cross-sheet contradictions belong in the notes the
     builder reads before trusting any number, not only in a structured field
     some caller might forget to render. */
  const notes = [...merged.plan.notes];
  if (!extraction.ledger.complete) {
    const bits: string[] = [];
    if (extraction.ledger.missing > 0) bits.push(`${extraction.ledger.missing} page(s) could not be reviewed`);
    if (extraction.ledger.unreadable > 0) bits.push(`${extraction.ledger.unreadable} page(s) were unreadable`);
    if (bits.length > 0) {
      notes.unshift(
        `Incomplete review: ${bits.join(" and ")} out of ${extraction.ledger.totalPages}. Scope on those sheets is not reflected here.`,
      );
    }
  }
  for (const c of merged.conflicts) {
    notes.push(
      `Sheets disagree on ${c.field}: ${c.readings
        .map((r) => `${r.value} (${r.pageLabels.join(", ") || "unknown sheet"})`)
        .join(" vs ")}. Confirm before pricing.`,
    );
  }

  return {
    ok: true,
    result: { ...merged.plan, notes },
    coverage: extraction.ledger,
    conflicts: merged.conflicts,
    provenance: merged.provenance,
    usage: { inputTokens, outputTokens },
  };
}

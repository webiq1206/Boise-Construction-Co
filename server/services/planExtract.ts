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
 *
 * DELIVERED AS A TOOL, NOT AS output_config.format.
 *
 * This used to go out as `output_config: { format: { type: "json_schema" } }`
 * and the API rejected it outright: 400 invalid_request_error, "Schema is too
 * complex." Every plan upload therefore failed - not slowly, not partially, but
 * every single one, and the failure surfaced to the visitor as the generic "We
 * could not read that plan set", which reads like a problem with their
 * drawings. Measured, not guessed: the base schema alone was refused, and even
 * the trimmed variants that were accepted took 30-60 SECONDS just to compile,
 * which is unusable when a 200-sheet set makes ~50 of these calls.
 *
 * The same schema passed as a tool's input_schema is accepted and returns in
 * ~6 seconds. `additionalProperties: false` is dropped because the tool
 * compiler does not need it and it was part of what made the constraint
 * expensive; unknown keys are harmless here since every field is read by name.
 */
export const PLAN_TOOL_NAME = "report_sheets";

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
  };
}


/** The tool call every pass is forced to make, so a pass cannot answer in prose. */
function planTool(schema: Record<string, unknown>): Anthropic.Messages.ToolUnion[] {
  return [
    {
      name: PLAN_TOOL_NAME,
      description:
        "Report exactly what the supplied sheets state about the project. Leave anything the sheets do not state unset.",
      input_schema: schema as Anthropic.Messages.Tool.InputSchema,
    },
  ];
}

const CHUNK_SYSTEM_PROMPT = `${PLAN_EXTRACTION_SYSTEM_PROMPT}

BATCH READING RULES

You are reading ONE BATCH of sheets from a larger plan set, not the whole set.

- Report ONLY what these sheets state. Leave every other field null. Another batch covers the sheets you were not given, and a value you inferred rather than read will collide with the sheet that actually states it.
- Each sheet is introduced by a line reading "PAGE ID: <id>". List every id you genuinely examined in pagesRead, using the id exactly as given.
- If a sheet will not render, is blank, or is too degraded to read, put it in pagesUnreadable with a short reason instead of silently ignoring it. A sheet nobody reports on becomes a hole in the estimate, so saying "I could not read this" is far more useful than saying nothing.
- Scanned, photographed, and hand-annotated sheets are normal. Read handwriting, redlines, and stamps as carefully as printed text, and say so in notes when a figure is handwritten rather than printed.
- Do not carry a figure over from a previous batch. You have not seen one.

READING SCANNED SHEETS ACCURATELY

Most large sets arrive as scans, not vector PDFs. Read them the way a takeoff estimator does, not the way a search engine does:

- Start at the TITLE BLOCK. Sheet number, sheet name, discipline, scale and revision date are the sheet's identity; quote the sheet number in notes when a figure comes from a drawing rather than a schedule.
- SCHEDULES ARE THE HIGHEST-VALUE CONTENT on a set. Door, window, finish, fixture, equipment and casework schedules state quantities and sizes explicitly. When a schedule spans two sheets, read both halves before reporting a count.
- Read DIMENSION STRINGS and the numbers on them, not just the shapes. A dimension you cannot resolve is a null, never a guess from the apparent geometry.
- Note the SCALE and never infer a measurement by eye from a scaled drawing. Report what is written.
- KEYNOTES AND LEGENDS carry material and assembly information that the plan view only references by symbol. Resolve the symbol before reporting the material.
- Handwriting, redlines, clouds and stamps are real content. Read them as carefully as printed text and say in notes when a figure is handwritten or clouded as revised.
- If a sheet is skewed, low-contrast, or cut off, say so in pagesUnreadable rather than reporting a half-read figure. A named gap is useful; a confident wrong number is not.`;

/**
 * Fold the customer's own instruction into the pass.
 *
 * WHY IT GOES IN THE SYSTEM PROMPT AND NOT A USER TURN. The instruction has to
 * survive every one of a 200-sheet set's passes identically, and a user-turn
 * instruction competes with the sheets for attention in a way a standing rule
 * does not. It is quoted rather than paraphrased so the model is steered by
 * what the customer actually wrote.
 *
 * IT STEERS, IT DOES NOT OVERRIDE. "Millwork only" should make the pass report
 * casework thoroughly and skip the roof assembly - it must not license
 * inventing a millwork figure the sheets never stated, and it must not stop the
 * page accounting. Those two rules are restated here because a scope
 * instruction is exactly the kind of prompt that quietly erodes them.
 */
function buildChunkSystemPrompt(instructions?: string | null): string {
  const trimmed = (instructions ?? "").trim();
  if (!trimmed) return CHUNK_SYSTEM_PROMPT;
  return `${CHUNK_SYSTEM_PROMPT}

WHAT THE CUSTOMER ASKED FOR

The customer sent these drawings with a specific request:

"""
${trimmed}
"""

Let that request decide WHERE YOU SPEND YOUR ATTENTION on these sheets - which schedules you read closely, which details matter, and what belongs in notes. Record what they asked about in the notes field so the team sees it against the sheets it came from.

Three things it does NOT change:
- Never state a figure the sheets do not state. A narrower scope is not permission to estimate; it is permission to ignore what is out of scope.
- Still report pagesRead and pagesUnreadable for every sheet in this batch. Scope narrows what you EXTRACT, never what you ACCOUNT FOR.
- Still record any figure that scales the whole project (overall area, storeys, unit count) if a sheet states it, even when it sits outside the request. Those numbers are how the rest of the estimate stays sane.`;
}


/**
 * Coerce a pass's answer into the shapes the merge actually expects.
 *
 * WHY THIS IS NOT PARANOIA. A tool's input_schema is a strong hint, not a
 * validator: on a real 4-sheet batch the model returned `notes` as ONE STRING
 * where the schema declares string[]. Downstream that is not a cosmetic
 * problem - mergeChunks does `[...plan.notes]`, and spreading a string yields
 * an array of single CHARACTERS, so a builder's estimate would have carried a
 * few hundred one-letter notes.
 *
 * Everything here is shape-only. A string becomes a one-item array; a number
 * that arrived as "11,326" becomes 11326; anything genuinely absent stays
 * absent. Nothing is invented, because a field the sheets never stated must
 * still come back null - that discipline is the whole reason this extractor is
 * worth trusting.
 */
function normalizeChunkPlan<T extends Record<string, unknown>>(parsed: T): T {
  const out: Record<string, unknown> = { ...parsed };

  const asArray = (v: unknown): unknown[] | undefined => {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v)) return v;
    return [v];
  };

  for (const key of ["rooms", "specialFeatures", "notes"]) {
    const arr = asArray(out[key]);
    if (arr) out[key] = arr.filter((x) => typeof x === "string" && x.trim().length > 0);
  }

  for (const key of ["floorAreas"]) {
    const arr = asArray(out[key]);
    if (arr) {
      out[key] = arr
        .map((x) => (typeof x === "number" ? x : Number(String(x).replace(/[^0-9.]/g, ""))))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
  }

  const structures = asArray(out.accessoryStructures);
  if (structures) {
    out.accessoryStructures = structures.filter((x) => x !== null && typeof x === "object");
  }

  for (const key of ["pagesRead"]) {
    const arr = asArray(out[key]);
    out[key] = (arr ?? []).filter((x) => typeof x === "string");
  }

  const unreadable = asArray(out.pagesUnreadable);
  out.pagesUnreadable = (unreadable ?? []).filter(
    (x): x is { id: string; reason: string } =>
      Boolean(x) && typeof x === "object" && typeof (x as { id?: unknown }).id === "string",
  );

  return out as T;
}

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

export async function extractPlan(
  files: PlanExtractionInput[],
  instructions?: string | null,
): Promise<PlanExtractionOutcome> {
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
          system: buildChunkSystemPrompt(instructions),
          tools: planTool(chunkSchema),
          tool_choice: { type: "tool", name: PLAN_TOOL_NAME },
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

        const call = message.content.find((b) => b.type === "tool_use");
        if (!call || call.type !== "tool_use") {
          return { ok: false, reason: "failed", message: "That batch came back empty." };
        }

        const parsed = normalizeChunkPlan(
          call.input as Partial<ExtractedPlan> & {
            pagesRead?: string[];
            pagesUnreadable?: { id: string; reason: string }[];
          },
        );

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

/**
 * Read ONE batch of sheets. The unit the stepped, resumable path is built from.
 *
 * extractPlan() above still exists for the small single-request uploads that
 * genuinely finish in one go. This is the same read, exposed so a large set can
 * be worked through across many short requests instead of one long one that a
 * proxy would kill halfway. Both share the schema, the prompt and the error
 * classification, because two copies of a plan-reading prompt is how the small
 * path and the large path start disagreeing about what a sheet said.
 */
export interface ReadableChunkPage {
  id: string;
  filename: string;
  pageNumber: number;
  mimeType: string;
  data: Buffer;
}

export type ReadChunkOutcome =
  | { ok: true; contribution: PlanChunkContribution; unreadable: { id: string; reason: string }[]; usage: { inputTokens: number; outputTokens: number } }
  | { ok: false; reason: PlanExtractionFailure; message: string };

export async function readPlanChunk(
  pages: ReadableChunkPage[],
  instructions?: string | null,
): Promise<ReadChunkOutcome> {
  if (!isPlanExtractionConfigured()) {
    return { ok: false, reason: "not-configured", message: "Plan review is not configured." };
  }
  if (pages.length === 0) {
    return { ok: false, reason: "failed", message: "No sheets in this batch." };
  }

  const client = new Anthropic();
  const chunk: PageChunk = {
    index: 0,
    pages: pages.map((p) => ({
      id: p.id,
      filename: p.filename,
      pageNumber: p.pageNumber,
      mimeType: p.mimeType,
      data: p.data,
      byteLength: p.data.byteLength,
    })),
    byteLength: pages.reduce((n, p) => n + p.data.byteLength, 0),
  };

  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: buildChunkSystemPrompt(instructions),
      tools: planTool(buildChunkSchema()),
      tool_choice: { type: "tool", name: PLAN_TOOL_NAME },
      messages: [{ role: "user", content: buildChunkContent(chunk) }],
    } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return { ok: false, reason: "refused", message: "Declined to read these sheets." };
    }
    const call = message.content.find((b) => b.type === "tool_use");
    if (!call || call.type !== "tool_use") {
      return { ok: false, reason: "failed", message: "That batch came back empty." };
    }

    const parsed = normalizeChunkPlan(
      call.input as Partial<ExtractedPlan> & {
        pagesRead?: string[];
        pagesUnreadable?: { id: string; reason: string }[];
      },
    );

    /* Only ids this batch actually owns are credited. A pass that names a sheet
       from another batch must not be able to mark it read - coverage is the one
       number nobody should be able to inflate. */
    const owned = new Set(pages.map((p) => p.id));
    const readIds = (parsed.pagesRead ?? []).filter((id) => owned.has(id));
    const byId = new Map(pages.map((p) => [p.id, p]));

    return {
      ok: true,
      contribution: {
        plan: parsed,
        pageIds: readIds,
        pageLabels: readIds
          .map((id) => byId.get(id))
          .filter((p): p is ReadableChunkPage => Boolean(p))
          .map((p) => pageLabel(p.filename, p.pageNumber)),
      },
      unreadable: (parsed.pagesUnreadable ?? []).filter((u) => owned.has(u.id)),
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (err) {
    return { ok: false, ...classifyError(err) };
  }
}

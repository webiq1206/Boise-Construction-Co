import Anthropic from "@anthropic-ai/sdk";
import {
  MILLWORK_EXTRACTION_SCHEMA,
  MILLWORK_SYSTEM_PROMPT,
  type MillworkItem,
  type MillworkQuestion,
  type MillworkTakeoff,
} from "@/shared/plans/millwork/extraction";
import type { QuestionAnswer } from "@/shared/plans/millwork/dialogue";
import type { ReadableChunkPage } from "@/server/services/planExtract";

/**
 * Reading a plan set for millwork, and re-reading it as answers arrive.
 *
 * Deliberately a sibling of planExtract rather than a branch inside it. The two
 * answer different questions - "how big is this house" and "what joinery is on
 * these sheets" - and every attempt to express both through one schema ends
 * with a shape that serves neither. What they DO share is the page manifest,
 * the chunking, the coverage ledger and the stepping, all of which live
 * upstream and are indifferent to what a pass is looking for.
 */

const MODEL = "claude-opus-5";
const TOOL_NAME = "report_millwork";

function client(): Anthropic {
  return new Anthropic();
}

export type MillworkFailure = "not-configured" | "refused" | "busy" | "failed";

export interface MillworkChunkResult {
  takeoff: MillworkTakeoff;
  pagesRead: string[];
  pagesUnreadable: { id: string; reason: string }[];
}

export type MillworkOutcome =
  | { ok: true; result: MillworkChunkResult }
  | { ok: false; reason: MillworkFailure; message: string };

function classify(err: unknown): { reason: MillworkFailure; message: string } {
  if (err instanceof Anthropic.RateLimitError) return { reason: "busy", message: "Plan review is busy." };
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { reason: "not-configured", message: "Plan review is not configured correctly." };
  }
  if (err instanceof Anthropic.InternalServerError) return { reason: "busy", message: "Plan review is temporarily unavailable." };
  if (err instanceof Anthropic.APIConnectionError) return { reason: "busy", message: "Could not reach the plan review service." };
  return { reason: "failed", message: "That batch of sheets could not be read." };
}

/** Page accounting bolted onto the takeoff schema, same contract as the residential path. */
function chunkSchema(): Record<string, unknown> {
  const base = MILLWORK_EXTRACTION_SCHEMA as unknown as {
    properties: Record<string, unknown>;
    required: string[];
  };
  return {
    type: "object",
    properties: {
      ...base.properties,
      pagesRead: { type: "array", items: { type: "string" } },
      pagesUnreadable: {
        type: "array",
        items: {
          type: "object",
          properties: { id: { type: "string" }, reason: { type: "string" } },
          required: ["id", "reason"],
        },
      },
    },
    required: [...base.required, "pagesRead"],
  };
}

function tools(schema: Record<string, unknown>): Anthropic.Messages.ToolUnion[] {
  return [
    {
      name: TOOL_NAME,
      description: "Report the millwork these sheets state, and what you need answered to price it.",
      input_schema: schema as Anthropic.Messages.Tool.InputSchema,
    },
  ];
}

/** Shape-only coercion. A tool input_schema is a strong hint, not a validator. */
function normalize(raw: Record<string, unknown>): MillworkChunkResult {
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === null || v === undefined ? [] : [v]);

  const items = arr(raw.items)
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x): MillworkItem => ({
      label: String(x.label ?? "Unnamed item"),
      category: (x.category as MillworkItem["category"]) ?? "specialty",
      location: typeof x.location === "string" ? x.location : null,
      sheetRef: typeof x.sheetRef === "string" ? x.sheetRef : null,
      quantity: typeof x.quantity === "number" && Number.isFinite(x.quantity) ? x.quantity : null,
      unit: (x.unit as MillworkItem["unit"]) ?? null,
      quantityBasis: (x.quantityBasis as MillworkItem["quantityBasis"]) ?? "unknown",
      material: typeof x.material === "string" ? x.material : null,
      finish: typeof x.finish === "string" ? x.finish : null,
      notes: typeof x.notes === "string" ? x.notes : null,
    }));

  const questions = arr(raw.questions)
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x, i): MillworkQuestion => ({
      id: String(x.id ?? `q${i}`),
      question: String(x.question ?? ""),
      whyItMatters: String(x.whyItMatters ?? ""),
      affects: arr(x.affects).filter((a): a is string => typeof a === "string"),
      impact: (x.impact as MillworkQuestion["impact"]) ?? "medium",
      options: Array.isArray(x.options) ? x.options.filter((o): o is string => typeof o === "string") : null,
    }))
    .filter((q) => q.question.length > 0);

  return {
    takeoff: {
      isCommercial: Boolean(raw.isCommercial),
      projectDescription: typeof raw.projectDescription === "string" ? raw.projectDescription : null,
      items,
      questions,
      confidence: (raw.confidence as MillworkTakeoff["confidence"]) ?? "medium",
      notes: arr(raw.notes).filter((n): n is string => typeof n === "string" && n.trim().length > 0),
    },
    pagesRead: arr(raw.pagesRead).filter((p): p is string => typeof p === "string"),
    pagesUnreadable: arr(raw.pagesUnreadable)
      .filter((x): x is { id: string; reason: string } =>
        Boolean(x) && typeof x === "object" && typeof (x as { id?: unknown }).id === "string")
      .map((x) => ({ id: x.id, reason: String(x.reason ?? "Unreadable.") })),
  };
}

function systemPrompt(instructions: string | null, answers: QuestionAnswer[]): string {
  let prompt = MILLWORK_SYSTEM_PROMPT;

  if (instructions?.trim()) {
    prompt += `

WHAT THE CUSTOMER ASKED FOR

"""
${instructions.trim()}
"""

Let that decide where you spend your attention. It does not license stating a quantity the sheets do not state, and it does not narrow the page accounting.`;
  }

  if (answers.length > 0) {
    prompt += `

WHAT THE CUSTOMER HAS ALREADY TOLD US

These are answers to questions we put to them. Treat them as specification - they override what you would otherwise have assumed, and you must NOT ask them again.

${answers.map((a) => `- ${a.questionId}: ${a.answer}`).join("\n")}

Apply them to the takeoff: resolve materials and grades they settle, include or exclude scope they settle, and drop any question they have answered.`;
  }

  return prompt;
}

export async function readMillworkChunk(
  pages: ReadableChunkPage[],
  instructions: string | null,
  answers: QuestionAnswer[] = [],
): Promise<MillworkOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "not-configured", message: "Plan review is not configured." };
  }
  if (pages.length === 0) return { ok: false, reason: "failed", message: "No sheets in this batch." };

  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const p of pages) {
    blocks.push({ type: "text", text: `PAGE ID: ${p.id}\nSheet: ${p.filename} p.${p.pageNumber}` });
    const data = p.data.toString("base64");
    if (p.mimeType === "application/pdf") {
      blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    } else {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: p.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data,
        },
      });
    }
  }
  blocks.push({
    type: "text",
    text: `Read these ${pages.length} sheet(s) for millwork. Report every page id you examined in pagesRead, including sheets with no millwork on them.`,
  });

  try {
    const stream = client().beta.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemPrompt(instructions, answers),
      tools: tools(chunkSchema()),
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: blocks }],
    } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);

    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      return { ok: false, reason: "refused", message: "Declined to read these sheets." };
    }
    const call = message.content.find((b) => b.type === "tool_use");
    if (!call || call.type !== "tool_use") {
      return { ok: false, reason: "failed", message: "That batch came back empty." };
    }

    const owned = new Set(pages.map((p) => p.id));
    const result = normalize(call.input as Record<string, unknown>);
    result.pagesRead = result.pagesRead.filter((id) => owned.has(id));
    result.pagesUnreadable = result.pagesUnreadable.filter((u) => owned.has(u.id));
    return { ok: true, result };
  } catch (err) {
    return { ok: false, ...classify(err) };
  }
}

/**
 * Combine per-batch takeoffs into one.
 *
 * Simpler than the residential merge and for a structural reason: millwork rows
 * are ADDITIVE. Two batches reporting cabinetry are reporting different runs on
 * different sheets, not two opinions about one number, so there is nothing to
 * reconcile and no conflict to raise. The residential merge exists because a
 * cover sheet and an elevation can disagree about the same square footage.
 *
 * Questions ARE deduplicated by id, because every batch that sees casework will
 * independently want to know the construction grade, and asking six times is
 * how a conversation stops feeling like one.
 */
export function mergeMillworkChunks(chunks: MillworkChunkResult[]): MillworkTakeoff {
  const items: MillworkItem[] = [];
  const questionById = new Map<string, MillworkQuestion>();
  const notes: string[] = [];
  let isCommercial = false;
  let projectDescription: string | null = null;
  let worst: MillworkTakeoff["confidence"] = "high";

  const rank = { high: 0, medium: 1, low: 2 } as const;

  for (const c of chunks) {
    items.push(...c.takeoff.items);
    for (const q of c.takeoff.questions) if (!questionById.has(q.id)) questionById.set(q.id, q);
    for (const n of c.takeoff.notes) if (!notes.includes(n)) notes.push(n);
    if (c.takeoff.isCommercial) isCommercial = true;
    if (!projectDescription && c.takeoff.projectDescription) projectDescription = c.takeoff.projectDescription;
    if (rank[c.takeoff.confidence] > rank[worst]) worst = c.takeoff.confidence;
  }

  return {
    isCommercial,
    projectDescription,
    items,
    questions: [...questionById.values()],
    confidence: worst,
    notes,
  };
}

/**
 * Apply the customer's answers to an existing takeoff.
 *
 * WHY THIS DOES NOT RE-READ THE SHEETS. Re-running 26 passes over 103 drawings
 * every time someone answers a question would cost minutes and dollars per
 * answer, and the drawings have not changed - only what we know about them has.
 * The answer resolves ambiguity that was already recorded in the takeoff, so
 * the takeoff is the right thing to revise.
 *
 * WHAT AN ANSWER IS ALLOWED TO DO. Resolve a material or grade, include or
 * exclude scope, and settle a quantity the customer actually knows. What it is
 * NOT allowed to do is conjure a quantity out of an answer that did not contain
 * one: "premium grade" tells us how to price a run, not how long the run is. A
 * customer answering questions makes the estimate better informed, never more
 * fictional, and that line is where a helpful conversation turns into a made-up
 * number.
 */
export async function refineMillworkTakeoff(
  takeoff: MillworkTakeoff,
  answers: QuestionAnswer[],
  instructions: string | null,
): Promise<MillworkOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "not-configured", message: "Plan review is not configured." };
  }
  if (answers.length === 0) {
    return { ok: true, result: { takeoff, pagesRead: [], pagesUnreadable: [] } };
  }

  const base = MILLWORK_EXTRACTION_SCHEMA as unknown as {
    properties: Record<string, unknown>;
    required: string[];
  };

  const system = `${MILLWORK_SYSTEM_PROMPT}

REVISING AN EXISTING TAKEOFF

You are NOT reading drawings now. You are revising a takeoff you already produced, using answers the customer has since given.

Apply each answer: resolve the material, grade or finish it settles; include or exclude the scope it settles; and drop every question it answers.

Hard limits:
- Do not invent a quantity. An answer about grade or material tells you how something is built, not how much of it there is. An item whose quantity was unknown stays unknown unless the customer's answer literally contains the number.
- Do not drop items the answers did not touch. Carry them through unchanged.
- Do not re-ask an answered question. You may add a NEW question only if an answer genuinely opened one.
- Keep every sheetRef exactly as it was. They are how a human checks this against the drawings.`;

  const user = `Current takeoff:

${JSON.stringify(takeoff, null, 1).slice(0, 60_000)}

Answers the customer has given:

${answers.map((a) => `- [${a.questionId}] ${a.answer}`).join("\n")}
${instructions?.trim() ? `\nTheir original request: "${instructions.trim()}"` : ""}

Return the revised takeoff.`;

  try {
    const message = await client().messages.create({
      model: MODEL,
      max_tokens: 8000,
      system,
      tools: tools({
        type: "object",
        properties: base.properties,
        required: base.required,
      }),
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: user }],
    });

    if (message.stop_reason === "refusal") {
      return { ok: false, reason: "refused", message: "Could not apply that answer." };
    }
    const call = message.content.find((b) => b.type === "tool_use");
    if (!call || call.type !== "tool_use") {
      return { ok: false, reason: "failed", message: "Could not apply that answer." };
    }
    return { ok: true, result: normalize(call.input as Record<string, unknown>) };
  } catch (err) {
    return { ok: false, ...classify(err) };
  }
}

import {createEstimatorModelClient,estimatorConnection} from "@/lib/p5/estimatorModelClient";
import {assistantReplyWithoutPrice} from "@/lib/p5/legacyContinuation";
/**
 * Conversational estimating assistant.
 *
 * POST { messages, page?, draft? } -> { reply }
 *
 * Architecture rules this route enforces:
 *  - One pricing engine. The model is given tools that call the same shared
 *    resolvers as the estimator and the lead emails, and the system prompt
 *    forbids stating any figure that did not come back from a tool. See
 *    server/services/assistant/tools.ts.
 *  - Session-only. Nothing is persisted here; the transcript lives in the
 *    visitor's sessionStorage and arrives with every request.
 *  - Bounded cost. Hard caps on transcript length, message size, tool
 *    rounds, output tokens and per-IP request rate keep a conversation
 *    comfortably under $1: worst case ~25 assistant turns x ~3 engine calls
 *    x (cached system prompt + trimmed history) on claude-sonnet-5.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { LRUCache } from "lru-cache";
import { ASSISTANT_TOOLS, executeAssistantTool } from "@/server/services/assistant/tools";
import { SERVICES } from "@/shared/contentData";
import { SITE_CONFIG } from "@/shared/siteConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "gpt-4.1";
const MAX_OUTPUT_TOKENS = 600;
const MAX_TOOL_ROUNDS = 5;
/** Assistant replies per conversation before we hand off to a human channel. */
const MAX_USER_TURNS = 25;
/** Messages actually sent to the model (older ones are dropped client-visibly-losslessly: the visitor still sees them; the model just stops re-reading them). */
const HISTORY_WINDOW = 20;
const MAX_MESSAGE_CHARS = 2_000;

const FALLBACK_REPLY = `I'm having trouble connecting right now. You can continue your project with the estimator at /estimate, or call us at ${SITE_CONFIG.phone} - happy to help either way.`;

const HANDOFF_REPLY = `We've covered a lot of ground - at this point the most useful next step is a real conversation with the team. Call ${SITE_CONFIG.phone} or book a free consultation at /consultation and they'll pick up right where we left off.`;

/* Em/en dash (U+2014/U+2013), built from char codes because verify:no-em-dash
   bans both the literal and its escape forms from source. */
const MODEL_DASHES = new RegExp(`\\s*[${String.fromCharCode(0x2014, 0x2013)}]\\s*`, "g");

/* ────────────────────────────────────────────────────────── rate limiting */

const rateLimiter = new LRUCache<string, number>({ max: 5_000, ttl: 5 * 60 * 1000 });
const RATE_LIMIT = 30; // requests per IP per 5 minutes

function isRateLimited(ip: string): boolean {
  const count = (rateLimiter.get(ip) ?? 0) + 1;
  rateLimiter.set(ip, count);
  return count > RATE_LIMIT;
}

/* ─────────────────────────────────────────────────────────── request body */

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_MESSAGE_CHARS),
      }),
    )
    .min(1)
    .max(2 * MAX_USER_TURNS + 4),
  page: z.string().max(200).optional(),
  draft: z.string().max(2_000).optional(),
});

/* ─────────────────────────────────────────────────────────── system prompt */

const SERVICES_SUMMARY = SERVICES.map(
  (s) => `- ${s.name}: ${s.shortDescription}`,
).join("\n");

/**
 * Static and therefore prompt-cacheable. Anything per-request (current page,
 * estimator draft) goes in a second, uncached system block below.
 */
const SYSTEM_PROMPT = `You are the virtual project assistant for Boise Construction Co, serving Idaho's Treasure Valley.
Help the visitor describe the work and answer business questions in short, plain sentences. Be clear that you are a virtual assistant when asked. Never invent credentials, availability, dimensions, quantities, or technical advice.

PRICING AND CONTINUATION
All estimates and estimate follow-up use the project estimator at /estimate. Do not quote a price, rate, starting floor, or a number from an earlier assistant message. You may acknowledge a budget the customer stated, clearly as their budget. The legacy pricing tools now return a continuation instruction, not an estimate. Do not ask a separate sequence of size or finish questions before continuing. Tell the customer to choose Continue project in this chat to preserve their notes, then review the scope in the estimator. Do not claim that an estimate, lead or email has been saved or sent by this chat. Contact details and consent are confirmed in the estimator.

BUSINESS FACTS
${SERVICES_SUMMARY}
Phone: ${SITE_CONFIG.phone}. Email: ${SITE_CONFIG.email}.
Location: ${SITE_CONFIG.address.cityState}. Service area: ${SITE_CONFIG.address.serviceArea}.
Use get_business_info for other company information. A free consultation is available at /consultation. Never expose internal costs or financial policy. Never promise a firm contract or guaranteed processing time.`;

/* ────────────────────────────────────────────────────────────── handler */

export async function POST(request: NextRequest) {
  const apiKey = estimatorConnection().key;
  if (!apiKey) {
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { reply: "You're sending messages faster than I can keep up - give it a minute and try again." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const userTurns = body.messages.filter((m) => m.role === "user").length;
  if (userTurns > MAX_USER_TURNS) {
    return NextResponse.json({ reply: HANDOFF_REPLY });
  }
  if (body.messages[body.messages.length - 1]?.role !== "user") {
    return NextResponse.json({ message: "Last message must be from the user" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const client = (createEstimatorModelClient() as unknown as Anthropic);

  /* Per-request context the static prompt can't carry. Kept in its own
     system block so the big block above still prompt-caches. */
  const contextBlock = [
    body.page ? `The visitor is currently on the page: ${body.page}` : null,
    body.draft
      ? `The visitor has a partially completed estimator draft (answers so far, JSON): ${body.draft}\nIf relevant, acknowledge what they've already told the estimator instead of re-asking it.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const history: Anthropic.Messages.MessageParam[] = body.messages
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
  // The trim window can land on an assistant message; the API requires the
  // transcript to open with the user.
  while (history[0]?.role === "assistant") history.shift();

  try {
    let totalIn = 0;
    let totalOut = 0;
    let totalCacheRead = 0;
    let totalCacheWrite = 0;
    const tally = (u: Anthropic.Messages.Usage) => {
      totalIn += u.input_tokens;
      totalOut += u.output_tokens;
      totalCacheRead += u.cache_read_input_tokens ?? 0;
      totalCacheWrite += u.cache_creation_input_tokens ?? 0;
    };

    let response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
      ],
      tools: ASSISTANT_TOOLS,
      messages: history,
    });
    tally(response.usage);

    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeAssistantTool(block.name, block.input, origin);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      history.push({ role: "assistant", content: response.content });
      history.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
        ],
        tools: ASSISTANT_TOOLS,
        messages: history,
      });
      tally(response.usage);
    }

    /* Site-wide brand rule (enforced on source by verify:no-em-dash): no em
       dashes. The model can't be trusted to follow a style note 100% of the
       time, so normalize the output instead. */
    const reply = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(MODEL_DASHES, " - ")
      .trim();

    /* Cost monitoring: one line per request with real token counts. Sonnet 5
       list price: $3/M input, $15/M output, $3.75/M cache write, $0.30/M
       cache read. */
    const estCost =
      (totalIn * 3 + totalCacheWrite * 3.75 + totalCacheRead * 0.3 + totalOut * 15) / 1_000_000;
    console.log(
      `[assistant] ip=${ip} turns=${userTurns} rounds=${rounds} in=${totalIn} cacheW=${totalCacheWrite} cacheR=${totalCacheRead} out=${totalOut} est=$${estCost.toFixed(4)}`,
    );

    return NextResponse.json({
      reply: assistantReplyWithoutPrice(reply) || "Sorry, I lost my train of thought - could you say that again?",
    });
  } catch (err) {
    console.error("[assistant] API error:", err);
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 502 });
  }
}

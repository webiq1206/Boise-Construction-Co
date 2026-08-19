import Anthropic from "@anthropic-ai/sdk";
import { SCOPE_CLASSIFIER_PROMPT, obviousScope, type PlanScope } from "@/shared/plans/scope";

/**
 * Classify the customer's request into an extraction target.
 *
 * Runs ONCE per job, at creation, on a short string. Failure is not fatal and
 * must not be: a classifier that cannot be reached should drop the job into the
 * ordinary residential estimator rather than refuse the upload, because the
 * worst outcome here is a slightly wrong reading and the best outcome of failing
 * loudly is nothing at all.
 */
export async function detectPlanScope(instructions: string | null): Promise<PlanScope> {
  const obvious = obviousScope(instructions);
  if (obvious) return obvious;
  if (!process.env.ANTHROPIC_API_KEY) return "residential";

  try {
    const client = new Anthropic({ maxRetries: 1, timeout: 20_000 });
    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 200,
      system: SCOPE_CLASSIFIER_PROMPT,
      tools: [
        {
          name: "choose_scope",
          description: "Choose which reading the customer wants.",
          input_schema: {
            type: "object",
            properties: { scope: { type: "string", enum: ["residential", "millwork"] } },
            required: ["scope"],
          } as Anthropic.Messages.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "choose_scope" },
      messages: [{ role: "user", content: (instructions ?? "").slice(0, 2000) }],
    });

    const call = message.content.find((b) => b.type === "tool_use");
    if (call && call.type === "tool_use") {
      const scope = (call.input as { scope?: string }).scope;
      if (scope === "millwork") return "millwork";
    }
  } catch (err) {
    console.error("[plans/scopeDetect] falling back to residential:", err);
  }
  return "residential";
}

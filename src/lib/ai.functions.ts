import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.7-flash";

const SYSTEM_BASE =
  "You are WorkBuddy, an AI workplace productivity assistant embedded in a company dashboard. Be concise, professional, and practical.";

async function callGateway(system: string, prompt: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const { generateText } = await import("ai");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return text;
}

export const polishEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        draft: z.string().min(1),
        tone: z.string().optional(),
        recipient: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const tone = data.tone || "professional and friendly";
    const recipientLine = data.recipient
      ? `The email is addressed to: ${data.recipient}.`
      : "";
    const text = await callGateway(
      `${SYSTEM_BASE} You rewrite rough employee notes into polished, professional business emails. Keep the sender's intent and facts exactly; improve structure, clarity, tone, and grammar. Output ONLY the finished email text (with a subject line as "Subject: ..." on the first line), no commentary.`,
      `Rewrite the following rough draft into a ${tone} business email. ${recipientLine}\n\nRough draft:\n${data.draft}`,
    );
    return { email: text };
  });

export const summarizeDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string(),
        content: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const text = await callGateway(
      `${SYSTEM_BASE} You summarize workplace documents. Produce a short summary in this exact markdown structure: a 2-3 sentence **Overview** paragraph, then **Key Points** as 3-6 bullets, then **Action Items** as bullets (or "None identified"). Keep it brief and skimmable.`,
      `Summarize this document titled "${data.title}":\n\n${data.content.slice(0, 30000)}`,
    );
    return { summary: text };
  });

export const processMeetingNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ notes: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const breakdown = await callGateway(
      `${SYSTEM_BASE} You turn raw meeting notes into a clear structured breakdown. Use this exact markdown structure: **Summary** (2-3 sentences), **Decisions Made** (bullets), **Action Items** (bullets, each with an owner name if mentioned), **Open Questions** (bullets, or "None").`,
      `Break down these meeting notes:\n\n${data.notes}`,
    );
    const spoken = await callGateway(
      `You write short spoken-word briefings. Write a natural, conversational 60-90 word audio briefing of the meeting that a text-to-speech voice will read aloud to a busy executive. No markdown, no bullets, no headers — plain spoken sentences only.`,
      `Write the audio briefing for these meeting notes:\n\n${data.notes}`,
    );
    return { breakdown, spoken };
  });

const PrioritizedTask = z.object({
  task: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  suggestedOrder: z.number(),
});

export const prioritizeTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ tasks: z.array(z.string().min(1)).min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText, Output, NoObjectGeneratedError } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway(MODEL),
        system: `${SYSTEM_BASE} You are a task prioritization engine. Given a list of tasks, rank them by urgency and importance (Eisenhower-style). Return each task with a priority and a one-sentence reason.`,
        prompt: `Prioritize these tasks:\n${data.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
        output: Output.object({
          schema: z.object({ tasks: z.array(PrioritizedTask) }),
        }),
      });
      const sorted = [...output.tasks].sort((a, b) => a.suggestedOrder - b.suggestedOrder);
      return { tasks: sorted };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        // Graceful fallback: keep original order, medium priority
        return {
          tasks: data.tasks.map((t, i) => ({
            task: t,
            priority: "medium" as const,
            reason: "Could not analyze — kept in original order.",
            suggestedOrder: i + 1,
          })),
        };
      }
      throw error;
    }
  });

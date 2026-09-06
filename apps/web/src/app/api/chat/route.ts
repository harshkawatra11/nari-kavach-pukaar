import { FAQ } from "@/lib/faq";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; // verified working in WEB-DEV-PROJECTS/fintech

// The system prompt is built entirely from FAQ.ts's own answer text, not
// invented here: every fact the model can draw on has already been checked
// against packages/core figures and the deck's evidence base by the same
// process that wrote the deterministic FAQ. This keeps the live model
// grounded rather than free to invent numbers.
function systemPrompt(): string {
  const facts = FAQ.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  return [
    "You are the assistant embedded in Pukaar's own product page, answering a judge or visitor's question about what Pukaar is and how it works.",
    "Answer only from the facts below. If asked something these facts do not cover, say so plainly rather than guessing or inventing a number.",
    "Two to four sentences. No markdown, no bullet points, no em dashes. Plain, direct, human.",
    "",
    facts,
  ].join("\n");
}

// The deterministic FAQ (packages: apps/web/src/lib/faq.ts) is the primary
// path on the client and answers instantly with zero network cost and zero
// risk of hallucination. This route is the fallback for everything outside
// those six questions, so the chat can hold a real conversation about the
// product without ever inventing a fact that is not already true of it.
export async function POST(req: Request) {
  const { question } = (await req.json()) as { question?: string };
  if (!question?.trim()) {
    return Response.json({ ok: false, error: "question is required" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: question },
        ],
        temperature: 0.4,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      const body = await res.text();
      return Response.json({ ok: false, error: `groq ${res.status}: ${body.slice(0, 200)}` }, { status: 502 });
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return Response.json({ ok: false, error: "empty response" }, { status: 502 });
    return Response.json({ ok: true, answer });
  } catch (err) {
    return Response.json({ ok: false, error: String(err instanceof Error ? err.message : err) }, { status: 502 });
  }
}

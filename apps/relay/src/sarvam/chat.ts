import type { ChatMessage, ToolCall } from "@pukaar/core";
import { RAISE_ALARM_TOOL } from "@pukaar/core";

export interface ChatResult {
  content: string | null;
  toolCalls: ToolCall[] | null;
  finishReason: string;
}

/** Sarvam chat completions, non-streaming, with the raise_alarm tool always
 *  available. reasoning_effort is explicitly disabled: Sarvam's reasoning is
 *  ON by default, and leaving it on adds seconds to every reply, which
 *  destroys the deck's 1.2s time-to-first-word claim. Tool calling and
 *  streaming are not documented together for this provider, so this path is
 *  always non-streaming; the filler line covers the latency instead. */
export async function chatCompletion(opts: {
  apiKey: string;
  messages: ChatMessage[];
  toolResultRound?: boolean;
}): Promise<ChatResult> {
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "api-subscription-key": opts.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "sarvam-105b-conversations",
      messages: opts.messages,
      temperature: 0.7,
      max_tokens: 120,
      reasoning_effort: null,
      tools: [RAISE_ALARM_TOOL],
      tool_choice: "auto",
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sarvam chat completion failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{
      finish_reason: string;
      message: { role: string; content: string | null; tool_calls?: ToolCall[] };
    }>;
  };

  const choice = data.choices[0];
  return {
    content: choice.message.content,
    toolCalls: choice.message.tool_calls ?? null,
    finishReason: choice.finish_reason,
  };
}

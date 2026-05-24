import Anthropic from "@anthropic-ai/sdk";

/**
 * Engine query functions — each takes a prompt + API key, returns raw response text.
 * No brand detection here; that's a downstream concern in scan.ts.
 *
 * These are the seams to mock in unit tests. In integration tests, hit them live.
 */

export async function queryGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status} — ${JSON.stringify(data)}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function queryClaude(prompt: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0]?.type === "text" ? message.content[0].text : "";
}

export async function queryOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error: ${res.status} — ${body}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function queryPerplexity(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Perplexity error: ${res.status} — ${body}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Engine surface used by scan.ts. Tests can inject fakes that match this shape. */
export interface EngineAdapters {
  gemini?: (prompt: string) => Promise<string>;
  claude?: (prompt: string) => Promise<string>;
  chatgpt?: (prompt: string) => Promise<string>;
  perplexity?: (prompt: string) => Promise<string>;
}

export function buildEngineAdaptersFromEnv(env: NodeJS.ProcessEnv = process.env): EngineAdapters {
  const adapters: EngineAdapters = {};
  if (env.GEMINI_API_KEY) adapters.gemini = (p) => queryGemini(p, env.GEMINI_API_KEY!);
  if (env.ANTHROPIC_API_KEY) adapters.claude = (p) => queryClaude(p, env.ANTHROPIC_API_KEY!);
  if (env.OPENAI_API_KEY) adapters.chatgpt = (p) => queryOpenAI(p, env.OPENAI_API_KEY!);
  if (env.PERPLEXITY_API_KEY) adapters.perplexity = (p) => queryPerplexity(p, env.PERPLEXITY_API_KEY!);
  return adapters;
}

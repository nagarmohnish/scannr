import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryGemini, queryOpenAI, queryPerplexity } from "@/lib/scanner/engines";

// Note: queryClaude uses the Anthropic SDK which we mock in a sibling test file.
// These three engines use plain fetch, so we stub global.fetch.

describe("queryGemini", () => {
  const originalFetch = global.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the text field from a successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "hello from gemini" }] } }],
      }),
    }) as unknown as typeof fetch;

    const text = await queryGemini("ping", "test-key");
    expect(text).toBe("hello from gemini");
  });

  it("passes the prompt in the request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "" }] } }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await queryGemini("what is the best CRM", "k");
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.contents[0].parts[0].text).toBe("what is the best CRM");
  });

  it("throws on non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "rate limited" }),
    }) as unknown as typeof fetch;

    await expect(queryGemini("x", "k")).rejects.toThrow(/Gemini error: 429/);
  });

  it("returns empty string when candidates is missing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    expect(await queryGemini("x", "k")).toBe("");
  });
});

describe("queryOpenAI", () => {
  const originalFetch = global.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the message content from a successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "hi from gpt" } }],
      }),
    }) as unknown as typeof fetch;

    expect(await queryOpenAI("hello", "sk-test")).toBe("hi from gpt");
  });

  it("sends Authorization header with the key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "" } }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await queryOpenAI("hello", "sk-my-key");
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-my-key");
  });

  it("throws on non-OK response with body text", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Invalid API key",
    }) as unknown as typeof fetch;

    await expect(queryOpenAI("x", "k")).rejects.toThrow(/OpenAI error: 401/);
  });
});

describe("queryPerplexity", () => {
  const originalFetch = global.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the message content from a successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "answer" } }] }),
    }) as unknown as typeof fetch;

    expect(await queryPerplexity("q", "pk-test")).toBe("answer");
  });

  it("throws on non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "internal error",
    }) as unknown as typeof fetch;

    await expect(queryPerplexity("q", "k")).rejects.toThrow(/Perplexity error: 500/);
  });
});

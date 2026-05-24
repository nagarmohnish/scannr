import { describe, expect, it } from "vitest";
import { queryOpenAI } from "@/lib/scanner/engines";
import { skipReason } from "../helpers/skip-if-no-key";

const reason = skipReason("OPENAI_API_KEY");

describe.skipIf(reason)("LIVE: OpenAI (ChatGPT)", () => {
  it("answers a simple question with text", async () => {
    const text = await queryOpenAI(
      "Reply with exactly the word 'pong' and nothing else.",
      process.env.OPENAI_API_KEY!
    );
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain("pong");
  }, 30_000);

  it("rejects with a clear error on invalid key", async () => {
    await expect(queryOpenAI("hi", "sk-invalid-deadbeef")).rejects.toThrow(/OpenAI error/);
  }, 30_000);
});

if (reason) {
  // eslint-disable-next-line no-console
  console.warn(`[openai.live] suite skipped — ${reason}`);
}

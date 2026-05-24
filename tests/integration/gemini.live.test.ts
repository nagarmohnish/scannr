import { describe, expect, it } from "vitest";
import { queryGemini } from "@/lib/scanner/engines";
import { skipReason } from "../helpers/skip-if-no-key";

const reason = skipReason("GEMINI_API_KEY");

describe.skipIf(reason)("LIVE: Gemini", () => {
  it("answers a simple question with text", async () => {
    const text = await queryGemini(
      "Reply with exactly the word 'pong' and nothing else.",
      process.env.GEMINI_API_KEY!
    );
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain("pong");
  }, 30_000);

  it("rejects with a clear error on invalid key", async () => {
    await expect(queryGemini("hi", "invalid-key-deadbeef")).rejects.toThrow(/Gemini error/);
  }, 30_000);
});

if (reason) {
  // eslint-disable-next-line no-console
  console.warn(`[gemini.live] suite skipped — ${reason}`);
}

import { describe, expect, it } from "vitest";
import { queryClaude } from "@/lib/scanner/engines";
import { skipReason } from "../helpers/skip-if-no-key";

const reason = skipReason("ANTHROPIC_API_KEY");

describe.skipIf(reason)("LIVE: Claude (Anthropic)", () => {
  it("answers a simple question with text", async () => {
    const text = await queryClaude(
      "Reply with exactly the word 'pong' and nothing else.",
      process.env.ANTHROPIC_API_KEY!
    );
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain("pong");
  }, 30_000);

  it("rejects with a clear error on invalid key", async () => {
    await expect(queryClaude("hi", "sk-invalid-deadbeef")).rejects.toBeDefined();
  }, 30_000);
});

if (reason) {
  // Surface skip reason in test output so it's clear *why* the suite ran nothing.
  // eslint-disable-next-line no-console
  console.warn(`[claude.live] suite skipped — ${reason}`);
}

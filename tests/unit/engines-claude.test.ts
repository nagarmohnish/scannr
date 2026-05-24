import { beforeEach, describe, expect, it, vi } from "vitest";

const messagesCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: messagesCreate },
    })),
  };
});

// Import AFTER vi.mock so the mocked constructor is used.
import { queryClaude } from "@/lib/scanner/engines";

describe("queryClaude (Anthropic SDK mocked)", () => {
  beforeEach(() => {
    messagesCreate.mockReset();
  });

  it("returns the text content block", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "hello from claude" }],
    });

    expect(await queryClaude("hi", "key")).toBe("hello from claude");
  });

  it("returns empty string when content is not text", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "tool_use" }],
    });

    expect(await queryClaude("hi", "key")).toBe("");
  });

  it("propagates SDK errors", async () => {
    messagesCreate.mockRejectedValue(new Error("Anthropic boom"));
    await expect(queryClaude("hi", "key")).rejects.toThrow("Anthropic boom");
  });
});

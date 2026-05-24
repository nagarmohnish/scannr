import { describe, expect, it, vi } from "vitest";
import { flattenPrompts, runScan, scoreResults } from "@/lib/scanner/scan";
import type { EngineAdapters } from "@/lib/scanner/engines";
import type { Category, PromptResult } from "@/lib/scanner/types";

const samplePrompts: Record<Category, string[]> = {
  informational: ["p1", "p2"],
  discovery: ["p3"],
  commercial: ["p4"],
  transactional: ["p5"],
};

describe("flattenPrompts", () => {
  it("flattens in category order with category attached", () => {
    const flat = flattenPrompts(samplePrompts);
    expect(flat).toHaveLength(5);
    expect(flat[0]).toEqual({ text: "p1", category: "informational" });
    expect(flat[2]).toEqual({ text: "p3", category: "discovery" });
    expect(flat[4]).toEqual({ text: "p5", category: "transactional" });
  });

  it("skips missing categories without throwing", () => {
    const flat = flattenPrompts({ informational: ["a"] } as Record<Category, string[]>);
    expect(flat).toHaveLength(1);
  });
});

describe("runScan (with mock adapters)", () => {
  it("returns appeared=true when adapter response contains the brand", async () => {
    const adapters: EngineAdapters = {
      claude: vi.fn().mockResolvedValue("I recommend CleverTap for analytics"),
      gemini: vi.fn().mockResolvedValue("Try Mixpanel"),
    };

    const result = await runScan({
      flatPrompts: [{ text: "best analytics tool", category: "discovery" }],
      brandVariations: ["CleverTap"],
      adapters,
      staggerMs: { gemini: 0, claude: 0, chatgpt: 0, perplexity: 0 },
    });

    expect(result.results[0].claude.appeared).toBe(true);
    expect(result.results[0].gemini.appeared).toBe(false);
    expect(result.results[0].chatgpt.appeared).toBe(false);
    expect(result.results[0].perplexity.appeared).toBe(false);
  });

  it("treats unavailable engines as appeared=false", async () => {
    const adapters: EngineAdapters = {}; // no engines configured
    const result = await runScan({
      flatPrompts: [{ text: "x", category: "informational" }],
      brandVariations: ["Acme"],
      adapters,
    });

    expect(result.engines.gemini.available).toBe(false);
    expect(result.engines.claude.available).toBe(false);
    expect(result.engines.chatgpt.available).toBe(false);
    expect(result.engines.perplexity.available).toBe(false);
  });

  it("swallows individual prompt failures and reports appeared=false", async () => {
    const adapters: EngineAdapters = {
      claude: vi
        .fn()
        .mockResolvedValueOnce("Acme is great")
        .mockRejectedValueOnce(new Error("rate limited")),
    };

    const result = await runScan({
      flatPrompts: [
        { text: "q1", category: "discovery" },
        { text: "q2", category: "discovery" },
      ],
      brandVariations: ["Acme"],
      adapters,
      staggerMs: { claude: 0, gemini: 0, chatgpt: 0, perplexity: 0 },
    });

    expect(result.results[0].claude.appeared).toBe(true);
    expect(result.results[1].claude.appeared).toBe(false);
    expect(result.results[1].claude.snippet).toBe("");
  });

  it("calls each adapter once per flat prompt", async () => {
    const claudeMock = vi.fn().mockResolvedValue("");
    const adapters: EngineAdapters = { claude: claudeMock };

    await runScan({
      flatPrompts: [
        { text: "q1", category: "informational" },
        { text: "q2", category: "informational" },
        { text: "q3", category: "informational" },
      ],
      brandVariations: ["X"],
      adapters,
      staggerMs: { claude: 0, gemini: 0, chatgpt: 0, perplexity: 0 },
    });

    expect(claudeMock).toHaveBeenCalledTimes(3);
  });
});

describe("scoreResults", () => {
  function mkResult(appeared: Record<string, boolean>): PromptResult {
    return {
      prompt: "x",
      category: "discovery",
      gemini: { appeared: appeared.gemini ?? false, snippet: "" },
      claude: { appeared: appeared.claude ?? false, snippet: "" },
      chatgpt: { appeared: appeared.chatgpt ?? false, snippet: "" },
      perplexity: { appeared: appeared.perplexity ?? false, snippet: "" },
    };
  }

  it("scores 100% when every available engine appears on every prompt", () => {
    const adapters: EngineAdapters = {
      claude: vi.fn(),
      gemini: vi.fn(),
    };
    const score = scoreResults(
      [
        mkResult({ claude: true, gemini: true }),
        mkResult({ claude: true, gemini: true }),
      ],
      adapters
    );
    expect(score.overallScore).toBe(100);
    expect(score.engines.claude.score).toBe(100);
    expect(score.engines.gemini.score).toBe(100);
  });

  it("scores 0% when nothing appears", () => {
    const adapters: EngineAdapters = { claude: vi.fn() };
    const score = scoreResults([mkResult({}), mkResult({})], adapters);
    expect(score.overallScore).toBe(0);
  });

  it("rolls up per-category appearances", () => {
    const adapters: EngineAdapters = { claude: vi.fn() };
    const results: PromptResult[] = [
      { ...mkResult({ claude: true }), category: "informational" },
      { ...mkResult({ claude: false }), category: "informational" },
      { ...mkResult({ claude: true }), category: "discovery" },
    ];
    const score = scoreResults(results, adapters);
    expect(score.categoryScores.informational.appeared).toBe(1);
    expect(score.categoryScores.informational.total).toBe(2);
    expect(score.categoryScores.discovery.appeared).toBe(1);
    expect(score.categoryScores.discovery.total).toBe(1);
    expect(score.categoryScores.commercial.total).toBe(0);
  });
});

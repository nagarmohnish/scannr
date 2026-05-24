import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  generateIcpForDomain,
  parseGeneratePromptsResponse,
  type ResearchData,
} from "@/lib/scanner/generate";
import type { WebsiteData } from "@/lib/scanner/types";

const sampleIcpResponse = readFileSync(
  join(__dirname, "..", "fixtures", "claude-icp-response.json"),
  "utf8"
);

const fakeWebsiteData: WebsiteData = {
  url: "https://acmecompost.com",
  title: "Acme Compost — Compostable packaging",
  metaDescription: "Bulk compostable packaging for restaurants",
  h1s: ["Acme Compost"],
  bodyText: "We sell compostable bags and cutlery.",
  brandVariations: ["Acme Compost", "AcmeCompost", "acmecompost"],
};

const emptyResearch: ResearchData = {
  peopleAlsoAsk: [],
  redditTitles: [],
  youtubeTitles: [],
  quoraTitles: [],
};

describe("parseGeneratePromptsResponse", () => {
  it("parses a clean JSON response", () => {
    const result = parseGeneratePromptsResponse(sampleIcpResponse, "acmecompost.com", fakeWebsiteData);
    expect(result.businessProfile.companyName).toBe("Acme Compost");
    expect(result.icp.primaryBuyer).toMatch(/procurement/i);
    expect(result.prompts.informational).toHaveLength(6);
    expect(result.prompts.discovery).toHaveLength(6);
    expect(result.prompts.commercial).toHaveLength(6);
    expect(result.prompts.transactional).toHaveLength(6);
  });

  it("strips markdown code fences", () => {
    const wrapped = "```json\n" + sampleIcpResponse + "\n```";
    const result = parseGeneratePromptsResponse(wrapped, "acmecompost.com", fakeWebsiteData);
    expect(result.businessProfile.companyName).toBe("Acme Compost");
  });

  it("uses websiteData brandVariations when present", () => {
    const result = parseGeneratePromptsResponse(sampleIcpResponse, "acmecompost.com", fakeWebsiteData);
    expect(result.brandVariations).toEqual(fakeWebsiteData.brandVariations);
  });

  it("falls back to domain-derived brandVariations when websiteData is null", () => {
    const result = parseGeneratePromptsResponse(sampleIcpResponse, "acmecompost.com", null);
    expect(result.brandVariations).toEqual(expect.arrayContaining(["acmecompost"]));
  });

  it("cleans 'by Person Name' from companyName", () => {
    const raw = JSON.stringify({
      ...JSON.parse(sampleIcpResponse),
      businessProfile: {
        ...JSON.parse(sampleIcpResponse).businessProfile,
        companyName: "SuperYou by Ranveer Singh",
      },
    });
    const result = parseGeneratePromptsResponse(raw, "superyou.com", fakeWebsiteData);
    expect(result.businessProfile.companyName).toBe("SuperYou");
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() =>
      parseGeneratePromptsResponse("this is not json", "acmecompost.com", null)
    ).toThrow(SyntaxError);
  });
});

describe("generateIcpForDomain (mocked Anthropic)", () => {
  it("calls Claude with website + research context and returns parsed result", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: sampleIcpResponse }],
    });

    const result = await generateIcpForDomain("acmecompost.com", {
      anthropic: { messages: { create } } as never,
      fetchWebsite: async () => fakeWebsiteData,
      fetchResearch: async () => emptyResearch,
    });

    expect(create).toHaveBeenCalledOnce();
    const prompt = create.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("acmecompost.com");
    expect(prompt).toContain("Acme Compost");
    expect(result.businessProfile.companyName).toBe("Acme Compost");
    expect(result.prompts.discovery).toHaveLength(6);
  });

  it("includes research data in the Claude prompt when present", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: sampleIcpResponse }],
    });

    await generateIcpForDomain("acmecompost.com", {
      anthropic: { messages: { create } } as never,
      fetchWebsite: async () => fakeWebsiteData,
      fetchResearch: async () => ({
        peopleAlsoAsk: ["where to buy compostable bags"],
        redditTitles: ["compostable cutlery for restaurants"],
        youtubeTitles: [],
        quoraTitles: [],
      }),
    });

    const prompt = create.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("REAL DATA from the internet");
    expect(prompt).toContain("where to buy compostable bags");
  });

  it("works when website fetch returns null (uses domain-only prompt)", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: sampleIcpResponse }],
    });

    const result = await generateIcpForDomain("unknown-domain.example", {
      anthropic: { messages: { create } } as never,
      fetchWebsite: async () => null,
      fetchResearch: async () => emptyResearch,
    });

    const prompt = create.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("unknown-domain.example");
    expect(result.brandVariations).toEqual(expect.arrayContaining(["unknown-domain"]));
  });

  it("throws when Claude returns non-text content", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "tool_use" }],
    });

    await expect(
      generateIcpForDomain("acmecompost.com", {
        anthropic: { messages: { create } } as never,
        fetchWebsite: async () => fakeWebsiteData,
        fetchResearch: async () => emptyResearch,
      })
    ).rejects.toThrow(/Unexpected response type/);
  });
});

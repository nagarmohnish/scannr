import Anthropic from "@anthropic-ai/sdk";
import { extractBrandVariations } from "./brand";
import { getWebsiteData } from "./domain";
import { cleanCompanyName, stripCodeFences } from "./parse";
import type { GeneratePromptsResult, WebsiteData } from "./types";

export interface ResearchData {
  peopleAlsoAsk: string[];
  redditTitles: string[];
  youtubeTitles: string[];
  quoraTitles: string[];
}

function buildClaudePrompt(opts: {
  domain: string;
  websiteData: WebsiteData | null;
  research: ResearchData;
}): string {
  const { domain, websiteData, research } = opts;

  const hasResearch =
    research.redditTitles.length > 0 ||
    research.peopleAlsoAsk.length > 0 ||
    research.youtubeTitles.length > 0 ||
    research.quoraTitles.length > 0;

  const researchBlock = hasResearch
    ? `
REAL DATA from the internet about this industry:

Reddit discussions (real buyer questions):
${research.redditTitles.slice(0, 5).join("\n")}

Google People Also Ask (real searches):
${research.peopleAlsoAsk.slice(0, 5).join("\n")}

YouTube searches (real queries):
${research.youtubeTitles.slice(0, 5).join("\n")}

Quora questions (real buyer questions):
${research.quoraTitles.slice(0, 5).join("\n")}

Use the REAL DATA above as inspiration for how real buyers actually talk and search. Make the prompts sound exactly like real people — not marketing language.
`
    : "";

  if (websiteData) {
    return `You are generating search prompts for an AI visibility scanner.
${researchBlock}
Analyze this website and return a detailed JSON object. Read every field carefully — use the actual website content, not guesses.

Website title: ${websiteData.title || "(not found)"}
Meta description: ${websiteData.metaDescription || "(not found)"}
H1 tags: ${websiteData.h1s.length > 0 ? websiteData.h1s.join(" | ") : "(not found)"}
Content: ${websiteData.bodyText}
Domain: ${domain}

Return ONLY this JSON structure, no markdown, no explanation:

{
  "businessProfile": {
    "companyName": "exact company name from the website",
    "whatTheySell": "specific products/services in 1 sentence",
    "industry": "specific industry (not generic)",
    "geography": "where they operate or sell (city, country, or global)",
    "businessModel": "B2B or B2C or both"
  },
  "icp": {
    "primaryBuyer": "job title or type of person who buys this",
    "buyerLocation": "city/country/region where buyers are",
    "buyerCompanySize": "individual or SMB or enterprise",
    "buyerPainPoint": "the specific problem buyers are solving",
    "buyerContext": "what situation or trigger makes them search for this"
  },
  "prompts": {
    "informational": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "discovery": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "commercial": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "transactional": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"]
  }
}

Rules for prompts:
- informational: 6 prompts where the ICP is learning about the category/problem (not looking for vendors yet).
- discovery: 6 prompts where the ICP is actively looking for solutions or vendors.
- commercial: 6 prompts where the ICP is comparing options before buying.
- transactional: 6 prompts where the ICP is ready to buy right now.

For ALL prompts:
- Write them exactly how a real person types into ChatGPT or Gemini — long, conversational, specific
- Include geography when relevant to this business
- Make every prompt specific to THIS business category, not generic filler
- Do NOT use the company name in any prompt
- Do NOT include any year (2024, 2025, 2026) — write timeless prompts
- Each array must have exactly 6 prompts
- For DISCOVERY and TRANSACTIONAL: at least 3 of the 6 must be hyper-specific to THIS company's exact products. Include 2-3 branded/navigational queries where someone is specifically searching for this brand by name, product line, or founder.`;
  }

  return `You are generating search prompts for an AI visibility scanner.
${researchBlock}
Given the domain "${domain}", infer what this company does and return this JSON structure.

Return ONLY this JSON, no markdown, no explanation:

{
  "businessProfile": {
    "companyName": "likely company name from the domain",
    "whatTheySell": "inferred products/services",
    "industry": "inferred industry",
    "geography": "unknown",
    "businessModel": "B2B or B2C"
  },
  "icp": {
    "primaryBuyer": "likely buyer persona",
    "buyerLocation": "unknown",
    "buyerCompanySize": "unknown",
    "buyerPainPoint": "likely pain point",
    "buyerContext": "likely buying context"
  },
  "prompts": {
    "informational": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "discovery": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "commercial": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"],
    "transactional": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"]
  }
}

Write all 24 prompts as long, conversational questions a real person would type into ChatGPT. Do NOT use the company name in generic category prompts, but DO include 2-3 branded/navigational queries in discovery and transactional.`;
}

export function parseGeneratePromptsResponse(
  rawClaudeText: string,
  domain: string,
  websiteData: WebsiteData | null
): GeneratePromptsResult {
  const cleaned = stripCodeFences(rawClaudeText);
  const parsed = JSON.parse(cleaned) as GeneratePromptsResult;

  if (parsed?.businessProfile?.companyName) {
    parsed.businessProfile.companyName = cleanCompanyName(parsed.businessProfile.companyName);
  }

  parsed.brandVariations = websiteData?.brandVariations?.length
    ? websiteData.brandVariations
    : extractBrandVariations("", domain);

  return parsed;
}

export interface GenerateIcpDeps {
  /** Anthropic client. Tests can inject a fake. */
  anthropic: Pick<Anthropic, "messages">;
  /** Fetch website HTML for the domain. Defaults to live `getWebsiteData`. */
  fetchWebsite?: (domain: string) => Promise<WebsiteData | null>;
  /** Fetch research data. Default returns empty. Production wires this to research/route. */
  fetchResearch?: (industry: string, company: string) => Promise<ResearchData>;
}

const EMPTY_RESEARCH: ResearchData = {
  peopleAlsoAsk: [],
  redditTitles: [],
  youtubeTitles: [],
  quoraTitles: [],
};

/**
 * Generates ICP + 24 prompts for a domain.
 *
 * Pure dependency-injected wrapper around the Claude prompt-generation agent.
 * Inject fakes in `deps` to unit-test the flow without hitting the network.
 */
export async function generateIcpForDomain(
  domain: string,
  deps: GenerateIcpDeps
): Promise<GeneratePromptsResult> {
  const fetchWebsite = deps.fetchWebsite ?? getWebsiteData;
  const fetchResearch = deps.fetchResearch ?? (async () => EMPTY_RESEARCH);

  const websiteData = await fetchWebsite(domain);

  const industryHint = websiteData
    ? websiteData.title.split(/[|\-–]/).slice(1).join(" ").trim() ||
      websiteData.metaDescription.slice(0, 60)
    : domain;
  const companyHint = websiteData?.brandVariations[0] ?? domain.split(".")[0];

  const research = await fetchResearch(industryHint, companyHint);

  const claudePrompt = buildClaudePrompt({ domain, websiteData, research });

  const message = await deps.anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: claudePrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error(`Unexpected response type from Claude: ${content.type}`);
  }

  return parseGeneratePromptsResponse(content.text, domain, websiteData);
}

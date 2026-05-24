import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/scanner/domain";
import { generateIcpForDomain } from "@/lib/scanner/generate";
import { createRateLimiter } from "@/lib/scanner/rate-limit";
import type { GeneratePromptsResult } from "@/lib/scanner/types";
import { fetchResearchData } from "../research/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rateLimiter = createRateLimiter({
  max: 3,
  windowMs: 24 * 60 * 60 * 1000,
});

// 24-hour in-memory prompt cache + per-domain dedup lock.
interface CachedResult {
  data: GeneratePromptsResult;
  timestamp: number;
}
const promptCache = new Map<string, CachedResult>();
const pendingRequests = new Map<string, Promise<GeneratePromptsResult>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  console.log("[generate-prompts] Route hit");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimiter.check(ip)) {
    console.log(`[generate-prompts] Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      {
        error: "rate_limit",
        message: "You have used your 3 free scans for today. Upgrade to scan unlimited domains.",
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const normalizedDomain = normalizeDomain(domain);
    console.log(`[generate-prompts] Domain: "${normalizedDomain}"`);

    if (request.nextUrl.searchParams.get("nocache") === "true") {
      promptCache.delete(normalizedDomain);
    }

    const cached = promptCache.get(normalizedDomain);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    if (pendingRequests.has(normalizedDomain)) {
      const result = await pendingRequests.get(normalizedDomain);
      return NextResponse.json(result);
    }

    const fetchPromise = generateIcpForDomain(normalizedDomain, {
      anthropic: client,
      fetchResearch: fetchResearchData,
    });
    pendingRequests.set(normalizedDomain, fetchPromise);

    try {
      const result = await fetchPromise;
      promptCache.set(normalizedDomain, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    } finally {
      pendingRequests.delete(normalizedDomain);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("[generate-prompts] JSON.parse failed:", error.message);
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON" },
        { status: 500 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error(
        `[generate-prompts] Anthropic API error — status=${error.status} message=${error.message}`
      );
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: error.status ?? 500 }
      );
    }
    console.error("[generate-prompts] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

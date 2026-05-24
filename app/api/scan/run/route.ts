import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/scanner/domain";
import { buildEngineAdaptersFromEnv } from "@/lib/scanner/engines";
import { createRateLimiter } from "@/lib/scanner/rate-limit";
import { flattenPrompts, runScan } from "@/lib/scanner/scan";
import type { BusinessProfile, Category } from "@/lib/scanner/types";

const runRateLimiter = createRateLimiter({
  max: 3,
  windowMs: 24 * 60 * 60 * 1000,
});

export async function POST(request: NextRequest) {
  console.log("[scan/run] Route hit");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!runRateLimiter.check(ip)) {
    return NextResponse.json(
      { error: "rate_limit", message: "Too many scans. Try again in 24 hours." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const {
      domain: rawDomain,
      businessProfile,
      prompts: promptsByCategory,
      brandVariations: rawBrandVariations,
    }: {
      domain: string;
      businessProfile: BusinessProfile;
      prompts: Record<Category, string[]>;
      brandVariations?: string[];
    } = body;

    if (!rawDomain || typeof rawDomain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }
    if (!promptsByCategory || typeof promptsByCategory !== "object") {
      return NextResponse.json({ error: "prompts object is required" }, { status: 400 });
    }

    const domain = normalizeDomain(rawDomain);
    const companyName = businessProfile?.companyName?.trim() || domain.split(".")[0];

    const domainRoot = domain.split(".")[0];
    const brandVariations: string[] =
      Array.isArray(rawBrandVariations) && rawBrandVariations.length > 0
        ? rawBrandVariations
        : [
            domainRoot,
            domainRoot.replace(/-/g, ""),
            companyName.toLowerCase(),
            companyName.toLowerCase().replace(/\s+/g, ""),
          ].filter((v) => v.length >= 3);

    console.log(`[scan/run] domain="${domain}" company="${companyName}"`);
    console.log(`[scan/run] brandVariations: ${JSON.stringify(brandVariations)}`);

    const flatPrompts = flattenPrompts(promptsByCategory);
    if (flatPrompts.length === 0) {
      return NextResponse.json({ error: "prompts must be a non-empty object" }, { status: 400 });
    }

    const adapters = buildEngineAdaptersFromEnv();
    console.log(
      `[scan/run] Engines — gemini=${!!adapters.gemini} claude=${!!adapters.claude} chatgpt=${!!adapters.chatgpt} perplexity=${!!adapters.perplexity}`
    );
    console.log(`[scan/run] Running ${flatPrompts.length} prompts across engines in parallel...`);

    const scan = await runScan({ flatPrompts, brandVariations, adapters });
    console.log(`[scan/run] Done. overallScore=${scan.overallScore}`);

    return NextResponse.json(scan);
  } catch (error) {
    console.error(
      "[scan/run] Unexpected top-level error:",
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : error
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

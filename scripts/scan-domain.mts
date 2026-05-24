// Run a full ICP + scan against a domain, using lib/scanner directly.
// Usage: npx tsx scripts/scan-domain.mts <domain>
//
// Loads .env.local. Runs against whatever engines have keys present.

import Anthropic from "@anthropic-ai/sdk";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const { buildEngineAdaptersFromEnv } = await import("../lib/scanner/engines.ts");
const { generateIcpForDomain } = await import("../lib/scanner/generate.ts");
const { flattenPrompts, runScan } = await import("../lib/scanner/scan.ts");
const { normalizeDomain } = await import("../lib/scanner/domain.ts");

const domain = process.argv[2];
if (!domain) {
  console.error("Usage: npx tsx scripts/scan-domain.mts <domain>");
  process.exit(1);
}

const normalized = normalizeDomain(domain);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required to generate prompts. Add it to .env.local.");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const adapters = buildEngineAdaptersFromEnv();
const availableEngines = Object.keys(adapters).filter((k) => adapters[k as keyof typeof adapters]);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`scannr — full scan: ${normalized}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Available engines: ${availableEngines.join(", ") || "(none — only ICP will be generated)"}`);
console.log();

console.log("[1/2] Generating ICP + 24 prompts via Claude…");
const startGen = Date.now();
const icp = await generateIcpForDomain(normalized, { anthropic });
const genMs = Date.now() - startGen;
console.log(`      done in ${(genMs / 1000).toFixed(1)}s`);
console.log();

console.log("Business profile:");
console.log(`  Company:     ${icp.businessProfile.companyName}`);
console.log(`  What:        ${icp.businessProfile.whatTheySell}`);
console.log(`  Industry:    ${icp.businessProfile.industry}`);
console.log(`  Geography:   ${icp.businessProfile.geography}`);
console.log(`  Model:       ${icp.businessProfile.businessModel}`);
console.log();
console.log("ICP:");
console.log(`  Buyer:       ${icp.icp.primaryBuyer}`);
console.log(`  Location:    ${icp.icp.buyerLocation}`);
console.log(`  Co. size:    ${icp.icp.buyerCompanySize}`);
console.log(`  Pain:        ${icp.icp.buyerPainPoint}`);
console.log(`  Context:     ${icp.icp.buyerContext}`);
console.log();
console.log(`Brand variations (${icp.brandVariations.length}): ${icp.brandVariations.slice(0, 8).join(", ")}${icp.brandVariations.length > 8 ? ", …" : ""}`);
console.log();

const flat = flattenPrompts(icp.prompts);
console.log(`[2/2] Running ${flat.length} prompts × ${availableEngines.length} engines in parallel…`);
const startScan = Date.now();
const scan = await runScan({
  flatPrompts: flat,
  brandVariations: icp.brandVariations,
  adapters,
});
const scanMs = Date.now() - startScan;
console.log(`      done in ${(scanMs / 1000).toFixed(1)}s`);
console.log();

const bar = (pct: number) => "█".repeat(Math.round(pct / 5)).padEnd(20, "·");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`OVERALL SCORE: ${scan.overallScore}%`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log();
console.log("Per engine:");
for (const [name, e] of Object.entries(scan.engines)) {
  const status = e.available ? `${bar(e.score)} ${e.score}%` : "(no key — skipped)";
  console.log(`  ${name.padEnd(12)} ${status}`);
}
console.log();
console.log("Per intent category (appeared / total possible):");
for (const [cat, c] of Object.entries(scan.categoryScores)) {
  const pct = c.total > 0 ? Math.round((c.appeared / c.total) * 100) : 0;
  console.log(`  ${cat.padEnd(14)} ${bar(pct)} ${c.appeared}/${c.total}  (${pct}%)`);
}
console.log();

console.log("Prompts where the brand appeared:");
const hits = scan.results.flatMap((r) =>
  (["gemini", "claude", "chatgpt", "perplexity"] as const)
    .filter((eng) => r[eng].appeared)
    .map((eng) => ({ engine: eng, category: r.category, prompt: r.prompt, snippet: r[eng].snippet }))
);
if (hits.length === 0) {
  console.log("  (none)");
} else {
  for (const h of hits) {
    console.log(`  [${h.engine}/${h.category}] "${h.prompt.slice(0, 90)}${h.prompt.length > 90 ? "…" : ""}"`);
    console.log(`      ↳ ${h.snippet.slice(0, 200).replace(/\s+/g, " ")}`);
  }
}
console.log();
console.log(`Total time: ${((genMs + scanMs) / 1000).toFixed(1)}s`);

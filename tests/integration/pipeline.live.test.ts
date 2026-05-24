import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { buildEngineAdaptersFromEnv } from "@/lib/scanner/engines";
import { generateIcpForDomain } from "@/lib/scanner/generate";
import { flattenPrompts, runScan } from "@/lib/scanner/scan";
import { liveEnabled, hasKey } from "../helpers/skip-if-no-key";

const TEST_DOMAIN = process.env.TEST_DOMAIN ?? "vercel.com";

const reason = !liveEnabled()
  ? "RUN_LIVE_TESTS is not true"
  : !hasKey("ANTHROPIC_API_KEY")
    ? "ANTHROPIC_API_KEY is missing (required to generate prompts)"
    : null;

describe.skipIf(reason)("LIVE: end-to-end pipeline", () => {
  it(
    `generates ICP + scores ${TEST_DOMAIN} across available engines`,
    async () => {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const adapters = buildEngineAdaptersFromEnv();

      const availableEngines = Object.keys(adapters).filter((k) => adapters[k as keyof typeof adapters]);
      console.log(`[pipeline.live] testing against domain="${TEST_DOMAIN}" engines=${availableEngines.join(",")}`);

      // Use only 1 prompt per category to keep the live test fast and cheap.
      const icp = await generateIcpForDomain(TEST_DOMAIN, { anthropic });
      const trimmedPrompts = {
        informational: icp.prompts.informational.slice(0, 1),
        discovery: icp.prompts.discovery.slice(0, 1),
        commercial: icp.prompts.commercial.slice(0, 1),
        transactional: icp.prompts.transactional.slice(0, 1),
      };

      expect(icp.businessProfile.companyName.length).toBeGreaterThan(0);
      expect(icp.prompts.informational.length).toBe(6);
      expect(icp.brandVariations.length).toBeGreaterThan(0);

      const flat = flattenPrompts(trimmedPrompts);
      expect(flat).toHaveLength(4);

      const scan = await runScan({
        flatPrompts: flat,
        brandVariations: icp.brandVariations,
        adapters,
      });

      expect(scan.results).toHaveLength(4);
      expect(scan.overallScore).toBeGreaterThanOrEqual(0);
      expect(scan.overallScore).toBeLessThanOrEqual(100);
      console.log(`[pipeline.live] overallScore=${scan.overallScore} engineScores=${JSON.stringify(scan.engines)}`);
    },
    180_000
  );
});

if (reason) {
  // eslint-disable-next-line no-console
  console.warn(`[pipeline.live] suite skipped — ${reason}`);
}
